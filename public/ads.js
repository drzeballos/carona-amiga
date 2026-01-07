// === SISTEMA DE ANÚNCIOS (MONETIZAÇÃO) - MÓDULO COMPARTILHADO ===

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
