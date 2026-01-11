# 📘 Manual Técnico - Conexão Chapada (v1.0)

> **Descrição:** Aplicação Web Progressiva (PWA) de caronas solidárias focada na região da Chapada dos Veadeiros.
> **Stack:** Node.js, Express, SQLite, HTML5, TailwindCSS (via CDN), Vanilla JS.

---

## 1. 🧠 O Cérebro (Backend)

O backend roda em Node.js e serve tanto a API (dados) quanto os arquivos estáticos (o site em si).

### 📄 `server.js` (O Servidor Principal)

É o ponto de entrada da aplicação.

* **Servidor Web:** Inicia um servidor Express na porta 3000 (ou definida pelo ambiente).
* **Arquivos Estáticos:** A linha `app.use(express.static('public'))` diz que tudo na pasta `/public` é acessível pelo navegador.
* **Rotas da API:**
* `GET /rides`: Busca todas as caronas ativas (não deletadas).
* `GET /rides/:id`: Busca detalhes de uma carona específica.
* `POST /rides`: Cria uma nova carona. Captura o IP do usuário (`req.ip`) para segurança.
* `DELETE /rides/:id`: Oculta uma carona (Soft Delete). Verifica se o IP é o mesmo de quem criou ou pede PIN.
* `GET /partners`: Retorna a lista de parceiros/anúncios para o carrossel.



### 📄 `database.js` (Gerenciador de Dados)

Responsável pela conexão com o banco SQLite (`caronas.db`).

* **Inicialização:** Cria automaticamente as tabelas `rides` (caronas) e `partners` (parceiros) se não existirem.
* **Soft Delete:** A função `softDeleteRide` não apaga o registro, apenas marca o campo `deleted_at` com a data atual. Isso mantém o histórico seguro.
* **Sanitização:** Usa `db.prepare` e `run(?)` para evitar ataques de SQL Injection.

---

## 2. 🎨 O Rosto (Frontend - HTML)

As páginas ficam na pasta `/public`. Elas usam TailwindCSS via CDN para estilização rápida.

* **`index.html` (Home):**
* Lista as caronas.
* Contém os filtros (Origem, Destino, Tipo).
* Exibe o carrossel de destaques/parceiros.
* Chama `app.js`.


* **`form.html` (Cadastro):**
* Formulário inteligente que muda dependendo da escolha (Oferecer/Pedir).
* Campos com máscaras (Telefone, Data).
* Chama `form.js`.


* **`carona.html` (Detalhes):**
* Página única para ver uma carona específica (via parâmetro `?id=123`).
* Botões de Ação: WhatsApp e Compartilhamento Nativo.
* Botão de Excluir (com lógica de segurança).
* Chama `carona.js`.


* **`ajuda.html` / `termos.html`:** Páginas estáticas informativas.

---

## 3. ⚙️ A Lógica (Frontend - Scripts)

Aqui está a mágica do Javascript puro (Vanilla JS).

### 📄 `public/app.js` (Lógica da Home)

* **`loadRides()`:** Busca os dados em `/rides`, gera os cartões HTML dinamicamente e injeta na tela.
* **Filtros:** Escuta mudanças nos selects e botões "Ofereço/Procuro" para esconder/mostrar cards sem recarregar a página.
* **Destaques:** Controla a rotação automática dos banners de parceiros.
* **Cache Busting:** As chamadas no HTML usam `?v=...` para garantir atualização.

### 📄 `public/form.js` (Lógica de Cadastro)

* **Máscaras:** Formata automaticamente o telefone `(XX) XXXXX-XXXX` e data enquanto o usuário digita.
* **Validação:** Impede envio se faltar campos obrigatórios.
* **Envio:** Manda um JSON via `POST` para o servidor. Se der sucesso, redireciona para a Home.

### 📄 `public/carona.js` (Lógica de Detalhes)

* **Recuperação:** Lê o ID da URL (`window.location.search`), busca na API e preenche a tela.
* **Compartilhamento:**
* Usa `navigator.share` para abrir o menu nativo do celular (Instagram, Telegram, etc).
* Fallback: Se não suportado, copia o link para a área de transferência.


* **Deleção Inteligente (`deletarCarona`):**
1. Tenta deletar direto (o backend checa o IP).
2. Se o backend recusar (Erro 401 - IP diferente/Trocou de rede), o JS abre um `prompt` pedindo o PIN.
3. Reenvia o pedido de delete junto com o PIN.



---

## 4. 🚀 O Motor PWA (Mobile Experience)

Arquivos que transformam o site em um aplicativo instalável.

### 📄 `public/manifest.json`

* Define o nome "Conexão Chapada", cor do tema (`#15803d`), ícones e modo de exibição (`standalone`, sem barra de navegador).
* É o que permite aparecer o botão "Adicionar à Tela Inicial".

### 📄 `public/sw.js` (Service Worker)

* **Offline:** Cacheia arquivos essenciais (`index.html`, `app.js`, imagens) para o app abrir mesmo sem internet.
* **Estratégia de Cache:** "Stale-While-Revalidate". Mostra a versão salva (rápida) enquanto baixa a nova em segundo plano para a próxima visita.
* **Atualização:** Configurado com `skipWaiting` e `clients.claim` para garantir que novas versões entrem em vigor rapidamente, limpando caches antigos.

---

## 5. 📂 Estrutura de Pastas

```text
/
├── database.js          # Lógica do Banco
├── server.js            # Servidor Express
├── caronas.db           # Arquivo do Banco de Dados (Gerado auto)
├── package.json         # Dependências (Express, SQLite3, etc)
└── public/              # O Site (Frontend)
    ├── img/             # Ícones e Imagens do PWA
    ├── index.html       # Página Principal
    ├── form.html        # Página de Formulário
    ├── carona.html      # Página de Detalhe
    ├── app.js           # Script da Principal
    ├── form.js          # Script do Formulário
    ├── carona.js        # Script do Detalhe
    ├── styles.css       # CSS Global (se houver extra)
    ├── sw.js            # Service Worker (PWA)
    └── manifest.json    # Configuração de Instalação

```

---