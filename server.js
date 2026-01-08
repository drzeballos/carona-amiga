require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();

app.set('trust proxy', true); // Confia no proxy para pegar o IP real
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const {
  PORT = 3001,
  NOCODB_BASE_URL,
  NOCODB_API_TOKEN,
  NOCODB_TABLE,
  NOCODB_ADS_TABLE
} = process.env;

if (!NOCODB_BASE_URL || !NOCODB_API_TOKEN || !NOCODB_TABLE || !NOCODB_ADS_TABLE) {
  console.error("❌ ERRO: Variáveis do NocoDB faltando no .env");
  process.exit(1);
}

const nocoClient = axios.create({
  baseURL: `${NOCODB_BASE_URL}/api/v2/tables`,
  headers: {
    "xc-token": NOCODB_API_TOKEN,
    "Content-Type": "application/json"
  }
});

// 🕵️‍♂️ Função Auxiliar: IP Seguro
function getClientIp(req) {
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.socket.remoteAddress || 
               req.ip;
    if (typeof ip === 'string') return ip.split(',')[0].trim();
    return ip;
}

app.get("/health", (_, res) => res.json({ status: "API Online" }));

// 🤝 ROTA PARCEIROS
app.get("/partners", async (_, res) => {
    try {
        const { data } = await nocoClient.get(`/${NOCODB_ADS_TABLE}/records`, {
            params: { limit: 100, sort: '-Id' }
        });
        const list = data.list || [];
        
        let ads = list.map(item => {
            let finalUrl = '';
            if (item.image && Array.isArray(item.image) && item.image.length > 0) {
                const fileData = item.image[0];
                let rawPath = fileData.signedUrl || fileData.url || fileData.path;
                if (rawPath) {
                    if (rawPath.startsWith('http')) {
                        try {
                            const parsedUrl = new URL(rawPath);
                            rawPath = parsedUrl.pathname + parsedUrl.search;
                        } catch (e) {}
                    }
                    const base = NOCODB_BASE_URL.replace(/\/$/, "");
                    const path = rawPath.replace(/^\//, "");
                    finalUrl = `${base}/${path}`;
                }
            } else if (typeof item.image === 'string') {
                finalUrl = item.image;
            }
            return {
                link: item.link || '#',
                img: finalUrl,
                duration: parseInt(item.duration) || 15000,
                originalId: item.Id 
            };
        }).filter(ad => ad.img !== '');

        ads.sort((a, b) => {
            if (b.duration !== a.duration) return b.duration - a.duration;
            return b.originalId - a.originalId;
        });

        res.json(ads.slice(0, 20));
    } catch (err) {
        console.error("ERRO GET /partners:", err.message);
        res.json([]);
    }
});

// 📄 ROTA: Listar caronas (CORRIGIDA E SEGURA)
app.get("/rides", async (_, res) => {
  try {
    // Busca apenas o que NÃO está expirado ou removido
    const { data } = await nocoClient.get(`/${NOCODB_TABLE}/records`, {
      params: { limit: 100, sort: 'date', where: '(status,neq,expired)' } 
    });
    
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const activeRides = [];
    
    // Array para guardar as promessas de atualização (não trava a resposta)
    const updates = [];

    for (const ride of (data.list || [])) {
        // Ignora removidos/expirados
        if (ride.status === 'removed' || ride.status === 'expired') continue; 
        
        if (ride.date && ride.date < today) {
            // ⚠️ FIX CRÍTICO: Atualização segura
            // Enviamos APENAS Id e Status. Nada mais.
            console.log(`[AUTO-EXPIRE] Expirando carona ID: ${ride.Id}`);
            
            updates.push(
                nocoClient.patch(`/${NOCODB_TABLE}/records`, { 
                    Id: ride.Id, 
                    status: "expired" 
                }).catch(err => console.error(`Falha ao expirar ID ${ride.Id}`, err.message))
            );
        } else {
            activeRides.push(ride);
        }
    }

    // Executa as atualizações em segundo plano (Promise.all) para não travar o cliente
    if (updates.length > 0) Promise.all(updates);

    res.json(activeRides);
  } catch (err) {
    console.error("ERRO GET /rides:", err.message);
    res.status(500).json({ error: "Erro" });
  }
});

// 🔍 ROTA: Carona Específica (SOMENTE LEITURA)
app.get("/rides/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Garante que só estamos LENDO
    const { data } = await nocoClient.get(`/${NOCODB_TABLE}/records/${id}`);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: "Carona não encontrada." });
  }
});

// ➕ ROTA: Criar carona (COM CONST E SCOPE SEGURO)
app.post("/rides", async (req, res) => {
  try {
    // O uso de CONST aqui garante que essas variáveis morram ao fim da requisição
    const { only_woman, pet, package: pkg, baggage, price, seats, secret_code, ...rest } = req.body;
    
    const userIp = getClientIp(req);
    console.log(`[NOVA CARONA] IP: ${userIp}`);

    const payload = { 
        ...rest, 
        price: parseFloat(price)||0, 
        seats: parseInt(seats)||1, 
        pet: !!pet, 
        package: !!pkg, 
        baggage: !!baggage, 
        only_woman: !!only_woman, 
        status: "active",
        secret_code: secret_code || "0000",
        ip_user: userIp // Salva IP apenas aqui
    };
    
    const { data } = await nocoClient.post(`/${NOCODB_TABLE}/records`, payload);
    res.status(201).json(data);
  } catch (err) {
    console.error("ERRO POST /rides:", err.message);
    res.status(500).json({ error: "Erro ao salvar carona" });
  }
});

// 🗑️ ROTA: Soft Delete
app.delete("/rides/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { pin } = req.body; 
        const requestIp = getClientIp(req); 

        const { data: ride } = await nocoClient.get(`/${NOCODB_TABLE}/records/${id}`);

        let authorized = false;

        // Verifica PIN ou IP
        if (pin && ride.secret_code === pin) {
            authorized = true;
            console.log(`[DELETE] Autorizado por PIN. ID: ${id}`);
        } else if (ride.ip_user && ride.ip_user === requestIp) {
            authorized = true;
            console.log(`[DELETE] Autorizado por IP. ID: ${id}`);
        }

        if (!authorized) {
            if (!pin) return res.status(401).json({ error: "PIN necessário" });
            return res.status(403).json({ error: "Senha incorreta!" });
        }

        // PATCH SEGURO: Apenas status e Id
        await nocoClient.patch(`/${NOCODB_TABLE}/records`, {
            Id: id,
            status: "expired"
        });

        res.json({ success: true });

    } catch (err) {
        console.error("Erro Delete:", err.message);
        res.status(500).json({ error: "Erro ao excluir." });
    }
});

app.get("*", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`🚀 Conexão Chapada rodando na porta ${PORT}`));