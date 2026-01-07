console.log("🔥 Form v2 carregado");

// === SISTEMA DE ANÚNCIOS (MONETIZAÇÃO) ===
const LINK_WHATSAPP = "https://wa.me/5561998668276?text=Cliquei%20no%20banner%20do%20site%20Conex%C3%A3o%20Chapada!";

const ANUNCIOS = [
    { img: 'ads/banner1.jpg', link: LINK_WHATSAPP },
    { img: 'ads/banner2.jpg', link: LINK_WHATSAPP },
    { img: 'ads/banner3.jpg', link: LINK_WHATSAPP }
];

const TEMPO_ROTACAO = 15000; // 15 segundos

function iniciarAnuncios() {
    const container = document.getElementById("adContainer");
    if (!container || ANUNCIOS.length === 0) return; 

    let indexAtual = 0;

    function exibirAnuncio() {
        const ad = ANUNCIOS[indexAtual];
        
        container.innerHTML = `
            <a href="${ad.link}" target="_blank" class="block w-full h-full relative group">
                <img src="${ad.img}" alt="Publicidade" class="w-full h-auto rounded-xl shadow-sm transition transform group-hover:scale-[1.01]">
                <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">Patrocinado</div>
            </a>
        `;
        
        container.classList.remove("p-6", "text-center", "border", "bg-white");
        container.classList.add("p-0", "bg-transparent", "border-none", "shadow-none");

        indexAtual = (indexAtual + 1) % ANUNCIOS.length;
    }

    exibirAnuncio();
    setInterval(exibirAnuncio, TEMPO_ROTACAO);
}

// Inicia os anúncios
iniciarAnuncios();

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