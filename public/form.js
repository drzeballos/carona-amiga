console.log("🔥 Form v2 carregado");

// === SISTEMA DE DESTAQUES (CORRIGIDO: LIMPEZA TOTAL + IMAGEM FULL) ===
async function iniciarDestaques() {
    const container = document.getElementById("highlightContainer");
    if (!container) return;

    // Transição base
    container.classList.add("transition-all", "duration-500", "ease-in-out");

    try {
        const res = await fetch('/partners');
        const destaques = await res.json();

        if (!destaques || destaques.length === 0) return;

        let indexAtual = 0;
        let timer = null;

        function exibirDestaque() {
            // 1. Efeito de Saída
            container.classList.add('opacity-0', 'scale-95');

            setTimeout(() => {
                const item = destaques[indexAtual];
                
                // 2. Troca o HTML
                // w-full h-auto: Imagem se ajusta à largura e define sua própria altura (não corta)
                container.innerHTML = `
                    <a href="${item.link}" target="_blank" class="block w-full h-full relative group">
                        <img src="${item.img}" alt="Destaque" class="w-full h-auto rounded-xl shadow-sm transition transform group-hover:scale-[1.01]">
                        <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">Parceiro</div>
                    </a>
                `;
                
                // 3. LIMPEZA RADICAL
                // Substitui todas as classes do container para remover estilos de "caixa branca"
                // mt-8: margem superior necessária no form
                container.className = "mt-8 relative transition-all duration-500 ease-in-out transform";

                // 4. Efeito de Entrada
                requestAnimationFrame(() => {
                    container.classList.remove('opacity-0', 'scale-95');
                });

                const tempo = item.duration || 15000;
                indexAtual = (indexAtual + 1) % destaques.length;

                if (timer) clearTimeout(timer);
                timer = setTimeout(exibirDestaque, tempo + 600);
            }, 500);
        }

        exibirDestaque();

    } catch (err) {
        console.error("Erro ao carregar destaques:", err);
        container.classList.remove('opacity-0', 'scale-95');
    }
}

iniciarDestaques();

// === RESTO DO CÓDIGO (MANTENHA IGUAL) ===

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
      alert("⚠️ Erro: Origem e Destino iguais!");
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
    baggage: document.getElementById("mala_g").checked,
    only_woman: document.getElementById("only_woman").checked
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
    alert("Erro ao enviar carona.");
  }
});