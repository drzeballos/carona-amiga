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

// 🤝 ROTA PARCEIROS (Ordenada por DURAÇÃO)
app.get("/partners", async (_, res) => {
    try {
        const { data } = await nocoClient.get(`/${NOCODB_ADS_TABLE}/records`, {
            // MUDANÇA AQUI:
            // '-duration' = Ordenar por duração decrescente (Maior tempo primeiro)
            // '-Id' = Critério de desempate (Mais novo primeiro)
            params: { limit: 20, sort: '-duration,-Id' }
        });

        const list = data.list || [];

        const ads = list.map(item => {
            let finalUrl = '';
            
            // 1. Lógica para Uploads
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
            // 2. Lógica para Links de Texto
            else if (typeof item.image === 'string') {
                finalUrl = item.image;
            }

            return {
                link: item.link || '#',
                img: finalUrl,
                duration: parseInt(item.duration) || 15000
            };
        }).filter(ad => ad.img !== '');

        res.json(ads);

    } catch (err) {
        console.error("ERRO GET /partners:", err.message);
        res.json([]);
    }
});

// 📄 ROTA: Listar caronas
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

app.get("*", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`🚀 Conexão Chapada rodando na porta ${PORT}`));