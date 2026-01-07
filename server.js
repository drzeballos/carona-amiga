require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// 📦 Servir frontend
app.use(express.static(path.join(__dirname, "public")));

const {
  PORT = 3001,
  NOCODB_BASE_URL,
  NOCODB_API_TOKEN,
  NOCODB_TABLE
} = process.env;

if (!NOCODB_BASE_URL || !NOCODB_API_TOKEN || !NOCODB_TABLE) {
  console.error("❌ ERRO: Variáveis do NocoDB faltando no .env");
  process.exit(1);
}

// 🔗 Cliente NocoDB
const api = axios.create({
  baseURL: `${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_TABLE}/records`,
  headers: {
    "xc-token": NOCODB_API_TOKEN,
    "Content-Type": "application/json"
  }
});

app.get("/health", (_, res) => res.json({ status: "API Online" }));

// 📄 Listar caronas (Com filtro de REMOVIDAS e EXPIRADAS)
app.get("/rides", async (_, res) => {
  try {
    // Busca caronas que não estão marcadas como expiradas
    const { data } = await api.get("/", {
      params: { 
        limit: 100, 
        sort: 'date', 
        where: '(status,neq,expired)' 
      } 
    });
    
    const rawList = data.list || [];
    
    // Data de hoje no formato YYYY-MM-DD (Fuso horário do Brasil)
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

    const activeRides = [];
    const ridesToExpire = [];

    for (const ride of rawList) {
        // 🛑 FILTRO NOVO: Se estiver "removed", ignora imediatamente e pula para o próximo
        if (ride.status === 'removed') {
            continue; 
        }

        // 📅 Lógica de Data (já existente)
        if (ride.date && ride.date < today) {
            console.log(`🗑️ Expirando carona antiga: ${ride.date} (ID: ${ride.Id})`);
            ridesToExpire.push(ride.Id);
        } else {
            // Se não for removida E a data for válida, adiciona na lista
            activeRides.push(ride);
        }
    }

    // Batch update expired rides after collecting all IDs
    if (ridesToExpire.length > 0) {
        Promise.all(
            ridesToExpire.map(id => 
                api.patch("", { Id: id, status: "expired" })
                    .catch(e => console.error(`Erro ao expirar ID ${id}:`, e.message))
            )
        ).catch(e => console.error("Erro no batch de expirações:", e.message));
    }

    res.json(activeRides);

  } catch (err) {
    console.error("ERRO GET /rides:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro ao buscar caronas" });
  }
});

// ➕ Criar carona
app.post("/rides", async (req, res) => {
  try {
    const {
      type, name, phone, origin, destination, 
      date, time, seats, price, pet, 
      package: pkg, baggage
    } = req.body;

    const payload = {
      type, name, phone, origin, destination, date, time,
      price: parseFloat(price) || 0,
      seats: parseInt(seats) || 1,
      pet: !!pet,
      package: !!pkg,
      baggage: !!baggage,
      status: "active" // Cria sempre como ativa
    };

    const { data } = await api.post("", payload);
    res.status(201).json(data);

  } catch (err) {
    console.error("ERRO POST /rides:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro ao salvar carona" });
  }
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Conexão Chapada rodando na porta ${PORT}`);
});