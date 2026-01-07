console.log("🔥 Frontend v2 carregado");

// === CONFIGURAÇÕES ===
document.getElementById("year").textContent = new Date().getFullYear();

// === SISTEMA DE ANÚNCIOS (MONETIZAÇÃO) ===
// Link único para todos os banners
const LINK_WHATSAPP = "https://wa.me/5561998668276?text=Cliquei%20no%20banner%20do%20site%20Conex%C3%A3o%20Chapada!";

const ANUNCIOS = [
    { img: 'ads/banner1.jpg', link: LINK_WHATSAPP },
    { img: 'ads/banner2.jpg', link: LINK_WHATSAPP },
    { img: 'ads/banner3.jpg', link: LINK_WHATSAPP }
];

const TEMPO_ROTACAO = 15000; // 15 segundos

function iniciarAnuncios() {
    const container = document.getElementById("adContainer");
    
    // Se não tiver container ou a lista estiver vazia, não faz nada (mantém o padrão)
    if (!container || ANUNCIOS.length === 0) return; 

    let indexAtual = 0;

    function exibirAnuncio() {
        const ad = ANUNCIOS[indexAtual];
        
        // Estrutura do Banner
        // h-auto: Altura automática (não corta a imagem)
        // w-full: Largura total
        container.innerHTML = `
            <a href="${ad.link}" target="_blank" class="block w-full h-full relative group">
                <img src="${ad.img}" alt="Publicidade" class="w-full h-auto rounded-xl shadow-sm transition transform group-hover:scale-[1.01]">
                <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">Patrocinado</div>
            </a>
        `;
        
        // Remove padding do container original para a imagem ficar bonita e cheia
        container.classList.remove("p-6", "text-center", "border", "bg-white");
        container.classList.add("p-0", "bg-transparent", "border-none", "shadow-none");

        // Passa para o próximo
        indexAtual = (indexAtual + 1) % ANUNCIOS.length;
    }

    // Exibe o primeiro e inicia o loop
    exibirAnuncio();
    setInterval(exibirAnuncio, TEMPO_ROTACAO);
}

iniciarAnuncios();


// === RESTO DO CÓDIGO (CIDADES, FILTROS, ETC...) ===

const CIDADES = [
  "Brasília", "Goiânia", "Anápolis", "Formosa", "Cavalcante",
  "Teresina de Goiás", "Vila de São Jorge", "São Gabriel da Cachoeira",
  "Aeroporto de Brasília", "Rodoviária Interestadual de Brasília",
  "Rodoviária do Plano Piloto", "Alto Paraíso", "São João da Aliança",
  "Bar do Jacaré - Km 12 GO-239",
  "Colinas do Sul"
];

// Preencher Filtros
const filterOrigin = document.getElementById("filterOrigin");
const filterDestination = document.getElementById("filterDestination");
const rideCount = document.getElementById("rideCount");

CIDADES.sort().forEach(c => {
    filterOrigin.appendChild(new Option(c, c));
    filterDestination.appendChild(new Option(c, c));
});

function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const cleanDate = dateStr.split(" ")[0]; 
  const parts = cleanDate.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function applyFilters() {
    const originVal = filterOrigin.value;
    const destVal = filterDestination.value;
    
    let visibleCount = 0;
    const container = document.getElementById("ridesContainer");
    const cards = container.getElementsByClassName("ride-card");

    Array.from(cards).forEach(card => {
        const cardOrigin = card.getAttribute("data-origin");
        const cardDest = card.getAttribute("data-dest");

        const matchOrigin = originVal === "" || cardOrigin === originVal;
        const matchDest = destVal === "" || cardDest === destVal;

        if (matchOrigin && matchDest) {
            card.style.display = "block";
            visibleCount++;
        } else {
            card.style.display = "none";
        }
    });

    if (visibleCount === 0) {
        rideCount.textContent = "0 encontradas";
    } else {
        rideCount.textContent = `${visibleCount} encontradas`;
    }
}

filterOrigin.addEventListener("change", applyFilters);
filterDestination.addEventListener("change", applyFilters);

async function loadRides() {
  const container = document.getElementById("ridesContainer");
  
  container.innerHTML = `
    <div class="animate-pulse space-y-4">
      <div class="h-24 bg-gray-200 rounded-2xl"></div>
      <div class="h-24 bg-gray-200 rounded-2xl"></div>
      <div class="h-24 bg-gray-200 rounded-2xl"></div>
    </div>
  `;
  
  try {
    const res = await fetch("/rides");
    const rides = await res.json();
    
    if (!rides || rides.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p>Nenhuma carona encontrada no momento.</p>
            <a href="form.html?type=request" class="text-green-600 font-bold hover:underline mt-2 block">Seja o primeiro a pedir!</a>
        </div>`;
      rideCount.textContent = "0";
      return;
    }

    container.innerHTML = "";
    
    rides.forEach(ride => {
      const tipo = ride.type === 'offer' ? 'Oferta' : 'Solicitação';
      const valorFormatado = parseFloat(ride.price).toFixed(2).replace('.', ',');
      
      let opcionais = [];
      if (ride.pet) opcionais.push("Aceita Pet");
      if (ride.package) opcionais.push("Leva Encomenda");
      if (ride.baggage) opcionais.push("Mala Grande");
      
      const textoOpcionais = opcionais.length > 0 ? opcionais.join(', ') : "Nenhum opcional";

      const whatsappMsg = `Olá *${ride.name}*! Vi sua *${tipo}* no Conexão Chapada!
De: ${ride.origin}
Para: ${ride.destination}
Data: ${formatDateBR(ride.date)} às ${ride.time}
Valor: R$ ${valorFormatado}
Detalhes: ${textoOpcionais}

---
https://conexaochapada.bots.at.eu.org
\`\`\`Zeballos Tecnologia\`\`\``;

      const whatsappUrl = `https://wa.me/55${ride.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`;

      const isOffer = ride.type === 'offer';
      const badgeColor = isOffer ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800";
      const badgeText = isOffer ? "Oferta" : "Pedido";

      container.innerHTML += `
        <div class="ride-card bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition relative overflow-hidden"
             data-origin="${ride.origin}" 
             data-dest="${ride.destination}">
          <div class="absolute left-0 top-0 bottom-0 w-1 ${isOffer ? 'bg-green-500' : 'bg-blue-500'}"></div>
          <div class="flex justify-between items-start mb-3 pl-2">
            <div>
                <h3 class="font-bold text-gray-800 text-lg">${ride.name || "Viajante"}</h3>
                <span class="${badgeColor} text-xs px-2 py-1 rounded font-bold uppercase tracking-wide">${badgeText}</span>
            </div>
            <div class="text-right">
                <span class="block text-lg font-bold text-green-600">R$ ${parseFloat(ride.price).toFixed(2).replace('.', ',')}</span>
                <span class="text-xs text-gray-400 font-medium">${formatDateBR(ride.date)} • ${ride.time}</span>
            </div>
          </div>
          <div class="mb-4 text-sm text-gray-600 space-y-1 pl-2 border-l-2 border-gray-100 ml-1">
            <p class="flex items-center gap-2"><span class="text-gray-400">Origem:</span> <strong class="text-gray-800">${ride.origin}</strong></p>
            <p class="flex items-center gap-2"><span class="text-gray-400">Destino:</span> <strong class="text-gray-800">${ride.destination}</strong></p>
          </div>
          <div class="flex gap-2 flex-wrap mb-4 pl-2">
            ${ride.seats ? `<span class="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200">💺 ${ride.seats} vagas</span>` : ''}
            ${ride.pet ? `<span class="bg-orange-50 text-orange-600 text-xs px-2 py-1 rounded border border-orange-100">🐶 Pet</span>` : ''}
            ${ride.package ? `<span class="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded border border-blue-100">📦 Enc.</span>` : ''}
            ${ride.baggage ? `<span class="bg-purple-50 text-purple-600 text-xs px-2 py-1 rounded border border-purple-100">🎒 Mala</span>` : ''}
          </div>
          <a href="${whatsappUrl}" target="_blank" class="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 font-bold transition shadow-green-100 shadow-lg">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
             WhatsApp
          </a>
        </div>
      `;
    });
    
    rideCount.textContent = `${rides.length} caronas`;

  } catch (err) {
    console.error("Erro ao buscar caronas", err);
    container.innerHTML = `<div class="text-center py-12 text-red-500 bg-red-50 rounded-xl p-4">Erro de conexão.</div>`;
  }
}

loadRides();