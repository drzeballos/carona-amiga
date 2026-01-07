console.log("🔥 Form v2 carregado");

// === CÓDIGO DO FORMULÁRIO (EXISTENTE) ===

document.getElementById("year").textContent = new Date().getFullYear();

const CIDADES = [
  "Brasília", "Goiânia", "Anápolis", "Formosa", "Cavalcante",
  "Teresina de Goiás", "Vila de São Jorge", "São Gabriel da Cachoeira",
  "Aeroporto de Brasília", "Rodoviária Interestadual de Brasília",
  "Rodoviária do Plano Piloto", "Alto Paraíso", "São João da Aliança",
  "Bar do Jacaré - Km 12 GO-239",
  "Colinas do Sul"
];

const origemEl = document.getElementById("origem");
const destinoEl = document.getElementById("destino");

CIDADES.sort().forEach(c => {
  origemEl.appendChild(new Option(c, c));
  destinoEl.appendChild(new Option(c, c));
});

const params = new URLSearchParams(window.location.search);
const tipoURL = params.get("type") === "request" ? "request" : "offer";
document.getElementById("formTitle").textContent = tipoURL === "offer" ? "Oferecer Carona" : "Solicitar Carona";

const rideForm = document.getElementById("rideForm");
const successMsg = document.getElementById("successMsg");

function limparErro() {
    origemEl.classList.remove("border-red-500", "bg-red-50");
    destinoEl.classList.remove("border-red-500", "bg-red-50");
}
origemEl.addEventListener("change", limparErro);
destinoEl.addEventListener("change", limparErro);

rideForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const origin = origemEl.value;
  const destination = destinoEl.value;

  if (origin === destination) {
      alert("⚠️ Erro: Você não pode selecionar a mesma cidade para Origem e Destino!");
      origemEl.classList.add("border-red-500", "bg-red-50");
      destinoEl.classList.add("border-red-500", "bg-red-50");
      return;
  }

  const payload = {
    type: tipoURL,
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    origin: origin,
    destination: destination,
    date: document.getElementById("data").value,
    time: document.getElementById("hora").value,
    price: document.getElementById("valor").value,
    seats: document.getElementById("vagas").value,
    pet: document.getElementById("pet").checked,
    package: document.getElementById("encomenda").checked,
    baggage: document.getElementById("mala_g").checked
  };

  try {
    const res = await fetch("/rides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Erro na API");

    successMsg.classList.remove("hidden");
    rideForm.reset();
    successMsg.scrollIntoView({ behavior: 'smooth' });

    setTimeout(() => window.location.href = "/", 2000);

  } catch (err) {
    console.error(err);
    alert("Erro ao enviar carona. Verifique sua conexão.");
  }
});

// Initialize ads after DOM is ready
iniciarAnuncios();