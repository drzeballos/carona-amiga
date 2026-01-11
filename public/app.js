console.log("🔥 Frontend v2.7 (City Fix & Bold Borders) carregado");

document.getElementById("year").textContent = new Date().getFullYear();

// === SISTEMA DE DESTAQUES ===
async function iniciarDestaques() {
    const container = document.getElementById("highlightContainer"); 
    if (!container) return;

    container.classList.add("transition-all", "duration-500", "ease-in-out");

    try {
        const res = await fetch('/partners');
        const destaques = await res.json();

        if (!destaques || destaques.length === 0) return;

        let indexAtual = 0;
        let timer = null;

        function exibirDestaque() {
            container.classList.add('opacity-0', 'scale-95');

            setTimeout(() => {
                const item = destaques[indexAtual];
                
                container.innerHTML = `
                    <a href="${item.link}" target="_blank" class="block w-full h-full relative group">
                        <img src="${item.img}" alt="Destaque" class="w-full h-auto rounded-xl shadow-sm transition transform group-hover:scale-[1.01]">
                        <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">Parceiro</div>
                    </a>
                `;

                container.className = "mb-6 relative transition-all duration-500 ease-in-out transform";

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

// === CIDADES E FILTROS (LISTA ATUALIZADA) ===
const CIDADES = [
  "Brasília", "Goiânia", "Anápolis", "Formosa", "Cavalcante",
  "Teresina de Goiás", "Vila de São Jorge", "São Gabriel da Cachoeira",
  "Aeroporto de Brasília", "Rodoviária Interestadual de Brasília",
  "Rodoviária do Plano Piloto", "Alto Paraíso", "São João da Aliança",
  "Budega do Jacaré - Km 12 GO-239", // <-- Corrigido
  "Colinas do Sul",
  "Sobradinho",   // <-- Novo
  "Planaltina",   // <-- Novo
  "Pirenópolis"   // <-- Novo
];

const filterOrigin = document.getElementById("filterOrigin");
const filterDestination = document.getElementById("filterDestination");
const rideCount = document.getElementById("rideCount");

CIDADES.sort().forEach(c => {
    filterOrigin.appendChild(new Option(c, c));
    filterDestination.appendChild(new Option(c, c));
});

// === LÓGICA DE FILTRO POR TIPO ===
let filtroTipoAtual = null;

function filtrarTipo(tipo) {
    if (filtroTipoAtual === tipo) {
        filtroTipoAtual = null;
    } else {
        filtroTipoAtual = tipo;
    }
    atualizarBotoesFiltro();
    applyFilters();
}

function atualizarBotoesFiltro() {
    const btnOffer = document.getElementById("btnFilterOffer");
    const btnRequest = document.getElementById("btnFilterRequest");
    const baseClass = "px-4 py-2 rounded-xl font-bold text-sm transition border border-transparent bg-gray-100 text-gray-500";
    
    btnOffer.className = baseClass + " hover:bg-green-50";
    btnRequest.className = baseClass + " hover:bg-blue-50";

    if (filtroTipoAtual === 'offer') {
        btnOffer.className = "px-4 py-2 rounded-xl font-bold text-sm transition border border-green-200 bg-green-100 text-green-800 shadow-sm ring-2 ring-green-100";
    }
    if (filtroTipoAtual === 'request') {
        btnRequest.className = "px-4 py-2 rounded-xl font-bold text-sm transition border border-blue-200 bg-blue-100 text-blue-800 shadow-sm ring-2 ring-blue-100";
    }
}
window.filtrarTipo = filtrarTipo;

function applyFilters() {
    const originVal = filterOrigin.value;
    const destVal = filterDestination.value;
    let visibleCount = 0;
    const container = document.getElementById("ridesContainer");
    const cards = container.getElementsByClassName("ride-card");

    Array.from(cards).forEach(card => {
        const cardOrigin = card.getAttribute("data-origin");
        const cardDest = card.getAttribute("data-dest");
        const cardType = card.getAttribute("data-type");

        const matchOrigin = originVal === "" || cardOrigin === originVal;
        const matchDest = destVal === "" || cardDest === destVal;
        const matchType = filtroTipoAtual === null || cardType === filtroTipoAtual;

        if (matchOrigin && matchDest && matchType) {
            card.style.display = "block";
            visibleCount++;
        } else {
            card.style.display = "none";
        }
    });

    rideCount.textContent = visibleCount === 0 ? "0 encontradas" : `${visibleCount} encontradas`;
}

filterOrigin.addEventListener("change", applyFilters);
filterDestination.addEventListener("change", applyFilters);

// === CARREGAMENTO DAS CARONAS ===
function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const cleanDate = dateStr.split(" ")[0]; 
  const parts = cleanDate.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

async function loadRides() {
  const container = document.getElementById("ridesContainer");
  container.innerHTML = `<div class="animate-pulse space-y-4"><div class="h-24 bg-gray-200 rounded-2xl"></div><div class="h-24 bg-gray-200 rounded-2xl"></div></div>`;
  
  try {
    const res = await fetch("/rides");
    const rides = await res.json();
    
    if (!rides || rides.length === 0) {
      container.innerHTML = `<div class="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100"><p>Nenhuma carona encontrada no momento.</p><a href="form.html?type=request" class="text-green-600 font-bold hover:underline mt-2 block">Seja o primeiro a pedir!</a></div>`;
      rideCount.textContent = "0";
      return;
    }

    container.innerHTML = "";
    
    rides.forEach(ride => {
      const valorFormatado = parseFloat(ride.price).toFixed(2).replace('.', ',');
      
      let opcionais = [];
      if (ride.only_woman) opcionais.push("*Só Mulheres*"); 
      if (ride.pet) opcionais.push("Aceita Pet");
      if (ride.package) opcionais.push("Leva Encomenda");
      if (ride.baggage) opcionais.push("Mala Grande");
      
      const textoOpcionais = opcionais.length > 0 ? opcionais.join(', ') : "Nenhum opcional";
      const linkCaronaRelativo = `carona.html?id=${ride.Id}`;
      
      const whatsappMsg = `Olá *${ride.name}*! Vi seu anúncio no Conexão Chapada.\nDe: ${ride.origin}\nPara: ${ride.destination}\nData: ${formatDateBR(ride.date)} às ${ride.time}\nValor: R$ ${valorFormatado}\nDetalhes: ${textoOpcionais}\n\n---\nhttps://conexaochapada.bots.at.eu.org/carona.html?id=${ride.Id}\n\`\`\`Zeballos Tecnologia\`\`\``;
      const whatsappUrl = `https://wa.me/55${ride.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`;
      
      const isOffer = ride.type === 'offer';
      const badgeColor = isOffer ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800";
      const badgeText = isOffer ? "OFEREÇO" : "PROCURO";

      container.innerHTML += `
        <div class="ride-card bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition relative overflow-hidden" 
             data-origin="${ride.origin}" 
             data-dest="${ride.destination}" 
             data-type="${ride.type}">
             
          <div class="absolute left-0 top-0 bottom-0 w-2 ${isOffer ? 'bg-green-500' : 'bg-blue-500'}"></div>
          
          <div class="flex justify-between items-start mb-3 pl-3"> <div>
                <h3 class="font-bold text-gray-800 text-lg flex items-center gap-2">${ride.name || "Viajante"} ${ride.only_woman ? '<span title="Exclusivo para Mulheres">👩</span>' : ''}</h3>
                <span class="${badgeColor} text-xs px-2 py-1 rounded font-bold uppercase tracking-wide">${badgeText}</span>
            </div>
            <div class="text-right">
                <span class="block text-lg font-bold text-green-600">R$ ${parseFloat(ride.price).toFixed(2).replace('.', ',')}</span>
                <span class="text-xs text-gray-400 font-medium">${formatDateBR(ride.date)} • ${ride.time}</span>
            </div>
          </div>

          <div class="mb-4 text-sm text-gray-600 space-y-1 pl-3 border-l-2 border-gray-100 ml-1">
            <p class="flex items-center gap-2"><span class="text-gray-400">Origem:</span> <strong class="text-gray-800">${ride.origin}</strong></p>
            <p class="flex items-center gap-2"><span class="text-gray-400">Destino:</span> <strong class="text-gray-800">${ride.destination}</strong></p>
          </div>

          <div class="flex gap-2 flex-wrap mb-4 pl-3">
            ${ride.only_woman ? `<span class="bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded border border-pink-200 font-bold">👩 Só Mulheres</span>` : ''}
            ${ride.seats ? `<span class="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200">💺 ${ride.seats} vagas</span>` : ''}
            ${ride.pet ? `<span class="bg-orange-50 text-orange-600 text-xs px-2 py-1 rounded border border-orange-100">🐶 Pet</span>` : ''}
            ${ride.package ? `<span class="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded border border-blue-100">📦 Enc.</span>` : ''}
            ${ride.baggage ? `<span class="bg-purple-50 text-purple-600 text-xs px-2 py-1 rounded border border-purple-100">🎒 Mala</span>` : ''}
          </div>

          <div class="flex gap-2">
             <a href="${whatsappUrl}" target="_blank" class="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 font-bold transition shadow-green-100 shadow-lg">WhatsApp</a>
             <a href="${linkCaronaRelativo}" 
                class="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-bold transition flex items-center justify-center border border-gray-200 gap-2">
                🔗 Ver / Compartilhar
             </a>
          </div>

        </div>`;
    });
    rideCount.textContent = `${rides.length} caronas`;
  } catch (err) {
    console.error("Erro ao buscar caronas", err);
    container.classList.remove('opacity-0', 'scale-95');
  }
}

loadRides();