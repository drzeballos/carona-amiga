require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();

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

// 🔗 Cliente NocoDB
const nocoClient = axios.create({
  baseURL: `${NOCODB_BASE_URL}/api/v2/tables`,
  headers: {
    "xc-token": NOCODB_API_TOKEN,
    "Content-Type": "application/json"
  }
});

app.get("/health", (_, res) => res.json({ status: "API Online" }));

// 🤝 ROTA PARCEIROS (COM ORDENAÇÃO FORÇADA NO JS)
app.get("/partners", async (_, res) => {
    try {
        // 1. Buscamos mais registros (100) para garantir que pegamos os "pagantes"
        // mesmo que eles tenham sido cadastrados há muito tempo.
        const { data } = await nocoClient.get(`/${NOCODB_ADS_TABLE}/records`, {
            params: { limit: 100, sort: '-Id' }
        });

        const list = data.list || [];

        // 2. Processamos as imagens e URLs
        let ads = list.map(item => {
            let finalUrl = '';
            
            // Lógica para Uploads
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
            } 
            // Lógica para Links de Texto
            else if (typeof item.image === 'string') {
                finalUrl = item.image;
            }

            return {
                link: item.link || '#',
                img: finalUrl,
                duration: parseInt(item.duration) || 15000,
                originalId: item.Id // Guardamos o ID original para desempate
            };
        }).filter(ad => ad.img !== '');

        // 3. A MÁGICA ACONTECE AQUI: Ordenação Manual no JavaScript
        // Ordena do MAIOR tempo para o MENOR tempo.
        ads.sort((a, b) => {
            // Primeiro critério: Quem tem maior duração ganha
            if (b.duration !== a.duration) {
                return b.duration - a.duration;
            }
            // Critério de desempate: O mais novo (maior ID) ganha
            return b.originalId - a.originalId;
        });

        // 4. Se tiver muitos, pega só os top 20
        ads = ads.slice(0, 20);

        res.json(ads);

    } catch (err) {
        console.error("ERRO GET /partners:", err.message);
        res.json([]);
    }
});

// 📄 ROTA: Listar todas as caronas ativas
app.get("/rides", async (_, res) => {
  try {
    const { data } = await nocoClient.get(`/${NOCODB_TABLE}/records`, {
      params: { limit: 100, sort: 'date', where: '(status,neq,expired)' } 
    });
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const activeRides = [];
    for (const ride of (data.list || [])) {
        if (ride.status === 'removed') continue; 
        if (ride.date && ride.date < today) {
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

// ➕ ROTA: Criar carona
app.post("/rides", async (req, res) => {
  try {
    const { only_woman, pet, package: pkg, baggage, price, seats, ...rest } = req.body;
    const payload = { ...rest, price: parseFloat(price)||0, seats: parseInt(seats)||1, pet: !!pet, package: !!pkg, baggage: !!baggage, only_woman: !!only_woman, status: "active" };
    const { data } = await nocoClient.post(`/${NOCODB_TABLE}/records`, payload);
    res.status(201).json(data);
  } catch (err) {
    console.error("ERRO POST /rides:", err.message);
    res.status(500).json({ error: "Erro ao salvar carona" });
  }
});

// 🔍 [NOVA ROTA] Buscar UMA carona específica pelo ID
app.get("/rides/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Busca direto no NocoDB pelo ID
    const { data } = await nocoClient.get(`/${NOCODB_TABLE}/records/${id}`);
    res.json(data);
  } catch (err) {
    console.error(`Erro ao buscar carona ${req.params.id}:`, err.message);
    res.status(404).json({ error: "Carona não encontrada ou removida." });
  }
});

// Rota coringa (serve o frontend)
app.get("*", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`🚀 Conexão Chapada rodando na porta ${PORT}`));