require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();

// IMPORTANTE: Confia no proxy do Docker/Nginx para passar o IP real
app.set('trust proxy', true);

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

// 🕵️‍♂️ FUNÇÃO MELHORADA DE IP
function getClientIp(req) {
    // Tenta todas as variações possíveis de header que o Docker/Nginx pode mandar
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.socket.remoteAddress || 
               req.ip;
               
    if (typeof ip === 'string') {
        // Pega o primeiro IP se vier uma lista (ex: "client, proxy1, proxy2")
        return ip.split(',')[0].trim();
    }
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

// 📄 ROTA: Listar caronas (Filtra as expiradas e removidas)
app.get("/rides", async (_, res) => {
  try {
    // Importante: O frontend só vai receber o que NÃO for 'expired' nem 'removed'
    const { data } = await nocoClient.get(`/${NOCODB_TABLE}/records`, {
      params: { limit: 100, sort: 'date', where: '(status,neq,expired)' } 
    });
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const activeRides = [];
    for (const ride of (data.list || [])) {
        // Dupla checagem de status
        if (ride.status === 'removed' || ride.status === 'expired') continue; 
        
        if (ride.date && ride.date < today) {
            // Expira automaticamente caronas antigas
            nocoClient.patch(`/${NOCODB_TABLE}/records`, { Id: ride.Id, status: "expired" }).catch(console.error);
        } else {
            activeRides.push(ride);
        }
    }
    res.json(activeRides);
  } catch (err) {
    console.error("ERRO GET /rides:", err.message);
    res.status(500).json({ error: "Erro" });
  }
});

// 🔍 ROTA: Carona Específica
app.get("/rides/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await nocoClient.get(`/${NOCODB_TABLE}/records/${id}`);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: "Carona não encontrada." });
  }
});

// ➕ ROTA: Criar carona (DEBUG DE IP)
app.post("/rides", async (req, res) => {
  try {
    const { only_woman, pet, package: pkg, baggage, price, seats, secret_code, ...rest } = req.body;
    
    // Captura e LOGA o IP para a gente ver no terminal
    const userIp = getClientIp(req);
    console.log(`[NOVA CARONA] IP Detectado: ${userIp}`);

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
        ip_user: userIp // Tenta salvar. (Garanta que a coluna no NocoDB se chama exatamente 'ip_user')
    };
    
    const { data } = await nocoClient.post(`/${NOCODB_TABLE}/records`, payload);
    res.status(201).json(data);
  } catch (err) {
    console.error("ERRO POST /rides:", err.message);
    res.status(500).json({ error: "Erro ao salvar carona" });
  }
});

// 🗑️ ROTA: Soft Delete (Muda status para 'expired')
app.delete("/rides/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { pin } = req.body; 
        const requestIp = getClientIp(req); 

        const { data: ride } = await nocoClient.get(`/${NOCODB_TABLE}/records/${id}`);

        let authorized = false;

        // Validação Híbrida (PIN ou IP)
        if (pin && ride.secret_code === pin) {
            authorized = true;
            console.log(`[SOFT DELETE] Autorizado por PIN. ID: ${id}`);
        }
        else if (ride.ip_user && ride.ip_user === requestIp) {
            authorized = true;
            console.log(`[SOFT DELETE] Autorizado por IP (${requestIp}). ID: ${id}`);
        } else {
            console.log(`[SOFT DELETE FALHOU] IP Registro: ${ride.ip_user} | IP Requisição: ${requestIp}`);
        }

        if (!authorized) {
            if (!pin) return res.status(401).json({ error: "PIN necessário", requirePin: true });
            return res.status(403).json({ error: "Senha incorreta!" });
        }

        // MUDANÇA: Em vez de .delete(), usamos .patch() para mudar status
        await nocoClient.patch(`/${NOCODB_TABLE}/records`, {
            Id: id,
            status: "expired" // Marca como expirado
        });

        res.json({ success: true });

    } catch (err) {
        console.error("Erro ao processar soft delete:", err.message);
        res.status(500).json({ error: "Erro ao processar exclusão." });
    }
});

app.get("*", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`🚀 Conexão Chapada rodando na porta ${PORT}`));