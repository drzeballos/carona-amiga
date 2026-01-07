console.log("🔥 Frontend v2 carregado");

document.getElementById("year").textContent = new Date().getFullYear();

// === SISTEMA DE DESTAQUES (SEM CAIXA BRANCA + TRANSIÇÃO) ===
async function iniciarDestaques() {
    const container = document.getElementById("highlightContainer"); 
    if (!container) return;

    // Adiciona transição base
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
                // Nota: w-full e h-auto garantem que a imagem NUNCA seja cortada
                container.innerHTML = `
                    <a href="${item.link}" target="_blank" class="block w-full h-full relative group">
                        <img src="${item.img}" alt="Destaque" class="w-full h-auto rounded-xl shadow-sm transition transform group-hover:scale-[1.01]">
                        <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">Parceiro</div>
                    </a>
                `;

                // 3. LIMPEZA TOTAL DA CAIXA BRANCA
                // Aqui redefinimos as classes do container para remover TUDO (borda, fundo branco, padding, sombra)
                // Mantemos apenas o espaçamento (mb-6) e as classes de transição
                container.className = "mb-6 relative transition-all duration-500 ease-in-out transform";

                // 4. Efeito de Entrada
                // Removemos opacity-0 e scale-95 para a imagem aparecer
                // Pequeno delay para o navegador processar a troca de classe
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
const CIDADES = [
  "Brasília", "Goiânia", "Anápolis", "Formosa", "Cavalcante",
  "Teresina de Goiás", "Vila de São Jorge", "São Gabriel da Cachoeira",
  "Aeroporto de Brasília", "Rodoviária Interestadual de Brasília",
  "Rodoviária do Plano Piloto", "Alto Paraíso", "São João da Aliança",
  "Bar do Jacaré - Km 12 GO-239",
  "Colinas do Sul"
];

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

    rideCount.textContent = visibleCount === 0 ? "0 encontradas" : `${visibleCount} encontradas`;
}

filterOrigin.addEventListener("change", applyFilters);
filterDestination.addEventListener("change", applyFilters);

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
      const tipoTermo = ride.type === 'offer' ? 'OFEREÇO' : 'PROCURO';
      const valorFormatado = parseFloat(ride.price).toFixed(2).replace('.', ',');
      
      let opcionais = [];
      if (ride.only_woman) opcionais.push("*Só Mulheres*"); 
      if (ride.pet) opcionais.push("Aceita Pet");
      if (ride.package) opcionais.push("Leva Encomenda");
      if (ride.baggage) opcionais.push("Mala Grande");
      
      const textoOpcionais = opcionais.length > 0 ? opcionais.join(', ') : "Nenhum opcional";

      const whatsappMsg = `Olá *${ride.name}*! Vi seu anúncio de *${tipoTermo}* no Conexão Chapada!
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
      const badgeText = isOffer ? "OFEREÇO" : "PROCURO";

      container.innerHTML += `
        <div class="ride-card bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition relative overflow-hidden" data-origin="${ride.origin}" data-dest="${ride.destination}">
          <div class="absolute left-0 top-0 bottom-0 w-1 ${isOffer ? 'bg-green-500' : 'bg-blue-500'}"></div>
          <div class="flex justify-between items-start mb-3 pl-2">
            <div>
                <h3 class="font-bold text-gray-800 text-lg flex items-center gap-2">${ride.name || "Viajante"} ${ride.only_woman ? '<span title="Exclusivo para Mulheres">👩</span>' : ''}</h3>
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
            ${ride.only_woman ? `<span class="bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded border border-pink-200 font-bold">👩 Só Mulheres</span>` : ''}
            ${ride.seats ? `<span class="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200">💺 ${ride.seats} vagas</span>` : ''}
            ${ride.pet ? `<span class="bg-orange-50 text-orange-600 text-xs px-2 py-1 rounded border border-orange-100">🐶 Pet</span>` : ''}
            ${ride.package ? `<span class="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded border border-blue-100">📦 Enc.</span>` : ''}
            ${ride.baggage ? `<span class="bg-purple-50 text-purple-600 text-xs px-2 py-1 rounded border border-purple-100">🎒 Mala</span>` : ''}
          </div>
          <a href="${whatsappUrl}" target="_blank" class="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 font-bold transition shadow-green-100 shadow-lg">WhatsApp</a>
        </div>`;
    });
    rideCount.textContent = `${rides.length} caronas`;
  } catch (err) {
    console.error("Erro ao buscar caronas", err);
    container.classList.remove('opacity-0', 'scale-95');
  }
}

loadRides();