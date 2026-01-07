# 🚗 App de Caronas Solidárias (Open Source)

Este é um projeto de código aberto para criar uma plataforma de caronas solidárias focada em **comunidades locais**. Foi desenvolvido pensando em simplicidade, performance e utilidade pública.

## ✨ Diferenciais

* **Zero Burocracia:** Não exige login ou senha. O foco é conectar pessoas rapidamente.
* **Integração com WhatsApp:** Ao clicar na carona, o app gera uma mensagem pronta com todos os detalhes.
* **Leve e Rápido:** Feito com HTML, JS Vanilla e Tailwind CSS. Roda bem até em conexões 3G.
* **Gestão Automática:** Caronas antigas são removidas automaticamente do sistema ("Lazy Expiration").
* **Monetização Pronta:** Sistema de banners rotativos para apoiar o comércio local.

## 🛠️ Tecnologias Usadas

* **Frontend:** HTML5, Tailwind CSS, JavaScript Puro.
* **Backend:** Node.js com Express.
* **Banco de Dados:** NocoDB (Low-code/No-code).
* **Infraestrutura:** Docker & Docker Compose.

## 🚀 Como Rodar (Em 3 Passos)

Você precisará ter o [Docker](https://www.docker.com/) instalado.

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/SEU-USUARIO/nome-do-repo.git](https://github.com/SEU-USUARIO/nome-do-repo.git)
    cd nome-do-repo
    ```

2.  **Configure o NocoDB:**
    * Rode `docker compose up -d` pela primeira vez.
    * Acesse `http://localhost:8080` e crie sua conta.
    * Crie uma tabela chamada `Rides` com as colunas: `type`, `name`, `phone`, `origin`, `destination`, `date`, `time`, `price`, `seats`, `pet` (bool), `package` (bool), `baggage` (bool), `status`.
    * Pegue seu Token de API e coloque no arquivo `server.js`.

3.  **Personalize:**
    * Abra `public/app.js` e `public/form.js`.
    * Edite a lista `CIDADES` com os locais da sua região.
    * Adicione imagens na pasta `public/ads` para os banners.

4.  **Inicie o Projeto:**
    ```bash
    docker compose up --build -d
    ```
    Acesse: `http://localhost:3000`

## 🤝 Como Contribuir

Sinta-se à vontade para fazer um "Fork" deste projeto, melhorar o código e enviar um Pull Request. Vamos conectar comunidades!

---
Desenvolvido com ❤️ e IA.
