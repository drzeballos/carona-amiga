document.getElementById("year").textContent = new Date().getFullYear();

function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const cleanDate = dateStr.split(" ")[0]; 
  const parts = cleanDate.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

async function loadSingleRide() {
    const container = document.getElementById("singleRideContainer");
    
    // 1. Pega o ID da URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        container.innerHTML = `<div class="text-center py-8 bg-red-50 text-red-600 rounded-xl border border-red-200">⚠️ Link inválido. Nenhuma carona especificada.</div>`;
        return;
    }

    try {
        // 2. Busca no Backend
        const res = await fetch(`/rides/${id}`);
        
        if (!res.ok) {
            throw new Error("Carona não encontrada");
        }

        const ride = await res.json();

        // 3. Renderiza o Card
        const valorFormatado = parseFloat(ride.price).toFixed(2).replace('.', ',');
        
        let opcionais = [];
        if (ride.only_woman) opcionais.push("*Só Mulheres*"); 
        if (ride.pet) opcionais.push("Aceita Pet");
        if (ride.package) opcionais.push("Leva Encomenda");
        if (ride.baggage) opcionais.push("Mala Grande");
        const textoOpcionais = opcionais.length > 0 ? opcionais.join(', ') : "Nenhum opcional";

        // 💬 MENSAGEM WHATSAPP SIMPLIFICADA
        const whatsappMsg = `Olá *${ride.name}*! Vi seu anúncio no Conexão Chapada.
De: ${ride.origin}
Para: ${ride.destination}
Data: ${formatDateBR(ride.date)} às ${ride.time}
Valor: R$ ${valorFormatado}
Detalhes: ${textoOpcionais}

---
https://conexaochapada.bots.at.eu.org/carona.html?id=${ride.Id}
\`\`\`Zeballos Tecnologia\`\`\``;

        const whatsappUrl = `https://wa.me/55${ride.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`;
        const isOffer = ride.type === 'offer';
        const badgeColor = isOffer ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800";
        const badgeText = isOffer ? "OFEREÇO" : "PROCURO";

        container.innerHTML = `
        <div class="ride-card bg-white rounded-2xl shadow-xl border border-gray-200 p-6 relative overflow-hidden">
          <div class="absolute left-0 top-0 bottom-0 w-2 ${isOffer ? 'bg-green-500' : 'bg-blue-500'}"></div>
          
          <div class="flex justify-between items-start mb-4 pl-3">
            <div>
                <h3 class="font-bold text-gray-800 text-xl flex items-center gap-2">${ride.name || "Viajante"} ${ride.only_woman ? '<span title="Exclusivo para Mulheres">👩</span>' : ''}</h3>
                <span class="${badgeColor} text-xs px-2 py-1 rounded font-bold uppercase tracking-wide">${badgeText}</span>
            </div>
            <div class="text-right">
                <span class="block text-2xl font-bold text-green-600">R$ ${valorFormatado}</span>
                <span class="text-sm text-gray-500 font-medium">${formatDateBR(ride.date)} • ${ride.time}</span>
            </div>
          </div>

          <div class="mb-6 text-base text-gray-700 space-y-2 pl-3 border-l-2 border-gray-100 ml-1">
            <p class="flex items-center gap-2"><span class="text-gray-400">Origem:</span> <strong class="text-gray-800 text-lg">${ride.origin}</strong></p>
            <p class="flex items-center gap-2"><span class="text-gray-400">Destino:</span> <strong class="text-gray-800 text-lg">${ride.destination}</strong></p>
          </div>

          <div class="flex gap-2 flex-wrap mb-6 pl-3">
            ${ride.only_woman ? `<span class="bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded border border-pink-200 font-bold">👩 Só Mulheres</span>` : ''}
            ${ride.seats ? `<span class="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded border border-gray-200">💺 ${ride.seats} vagas</span>` : ''}
            ${ride.pet ? `<span class="bg-orange-50 text-orange-600 text-xs px-2 py-1 rounded border border-orange-100">🐶 Pet</span>` : ''}
            ${ride.package ? `<span class="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded border border-blue-100">📦 Enc.</span>` : ''}
            ${ride.baggage ? `<span class="bg-purple-50 text-purple-600 text-xs px-2 py-1 rounded border border-purple-100">🎒 Mala</span>` : ''}
          </div>

          <a href="${whatsappUrl}" target="_blank" class="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 font-bold transition shadow-green-100 shadow-lg text-lg">
            Chamar no WhatsApp
          </a>

          <div class="mt-6 pt-4 border-t border-gray-100 text-center">
             <button onclick="deletarCarona('${ride.Id}')" class="text-red-400 text-sm font-medium hover:text-red-600 underline transition cursor-pointer flex items-center justify-center gap-1 mx-auto">
                 🗑️ Apagar este anúncio
             </button>
          </div>

        </div>
        
        <div class="mt-4 text-center text-xs text-gray-400">
            ID da Carona: #${ride.Id}
        </div>
        `;

    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <div class="text-center py-12 bg-white rounded-2xl shadow border border-gray-200">
                <div class="text-4xl mb-2">👻</div>
                <h3 class="text-lg font-bold text-gray-700">Esta carona já partiu...</h3>
                <p class="text-gray-400 text-sm mt-1">O link pode estar expirado ou foi removido.</p>
                <a href="/" class="mt-4 inline-block px-6 py-2 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition">Ver caronas disponíveis</a>
            </div>`;
    }
}

// === FUNÇÃO DE DELETAR INTELIGENTE ===
async function deletarCarona(id) {
    if (!confirm("Tem certeza que deseja apagar este anúncio?")) return;

    // 1. TENTATIVA MÁGICA (Sem PIN, confiando no IP)
    try {
        const res = await fetch(`/rides/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}) // Manda corpo vazio (sem PIN)
        });

        const data = await res.json();

        // Se funcionou de primeira (IP bateu!)
        if (res.ok) {
            alert("✨ Reconhecemos seu dispositivo! Anúncio removido com sucesso!");
            window.location.href = "/";
            return;
        }

        // Se o servidor pediu PIN (Erro 401 - Unauthorized)
        if (res.status === 401) {
            // 2. TENTATIVA MANUAL (Pede o PIN)
            const pin = prompt("🔒 Dispositivo diferente detectado. Digite sua senha (PIN):");
            if (!pin) return; // Cancelou

            const res2 = await fetch(`/rides/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: pin }) // Agora manda o PIN
            });

            const data2 = await res2.json();

            if (res2.ok) {
                alert("✅ Anúncio removido com sucesso!");
                window.location.href = "/";
            } else {
                alert("❌ Erro: " + (data2.error || "Senha incorreta"));
            }
            return;
        }

        // Outros erros
        alert("❌ Erro: " + (data.error || "Falha desconhecida"));

    } catch (err) {
        console.error(err);
        alert("Erro de conexão ao tentar excluir.");
    }
}

window.deletarCarona = deletarCarona;

loadSingleRide();