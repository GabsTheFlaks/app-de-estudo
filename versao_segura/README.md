# Plataforma de Cursos e Trilhas de Aprendizagem

Este é um projeto Angular desenvolvido para gerenciar cursos e postar aulas e materiais de estudo de forma estruturada. Ele utiliza Supabase para autenticação e banco de dados, e Tailwind CSS para a estilização.

## 🚀 Como executar este projeto no VS Code

Siga este passo a passo para clonar, configurar e rodar o projeto na sua máquina local utilizando o VS Code.

### 📋 Pré-requisitos

Certifique-se de ter os seguintes programas instalados em sua máquina:
- **Node.js** (versão 20 ou superior recomendada): [Download Node.js](https://nodejs.org/)
- **Visual Studio Code (VS Code)**: [Download VS Code](https://code.visualstudio.com/)

---

### ⚙️ Passo a passo da instalação

1. **Faça o Download do Projeto**
   - Baixe ou extraia o código-fonte em uma pasta no seu computador.

2. **Abra o Projeto no VS Code**
   - Abra o VS Code.
   - Vá em `File > Open Folder...` (ou `Arquivo > Abrir Pasta...`) e selecione a pasta onde você extraiu o código.

3. **Abra o Terminal**
   - No VS Code, abra o terminal integrado clicando em `Terminal > New Terminal` (ou pressionando `` Ctrl + ` ``).

4. **Instale as Dependências**
   - No terminal, execute o seguinte comando para baixar e instalar todas as bibliotecas necessárias para rodar o projeto:
     ```bash
     npm install
     ```

5. **Inicie o Servidor de Desenvolvimento**
   - Após o término da instalação (pode levar alguns minutos), execute o comando abaixo para rodar o projeto:
     ```bash
     npm run dev
     ```
   *(Você também pode usar `npm start` se preferir).*

6. **Acesse a Aplicação**
   - O terminal exibirá uma mensagem informando que a aplicação está rodando.
   - Abra seu navegador (Chrome, Edge, Firefox, etc) e acesse:
     **http://localhost:3000** (ou a porta especificada no terminal, geralmente 4200 ou 3000).

---

### 🗄️ Informações do Banco de Dados (Supabase)

O aplicativo foi previamente configurado com chaves do **Supabase**. As chaves de acesso anônimas públicas para o frontend estão definidas no arquivo `src/env.ts` (estas chaves são seguras para ficar expostas no front-end, conforme as diretrizes do Supabase). Você não precisa criar um arquivo `.env` para rodar este projeto, ele já funcionará diretamente ao executar os comandos acima!

---

### 🎨 Tecnologias utilizadas

- **Framework:** Angular 21
- **Estilos:** Tailwind CSS 4
- **Backend/DB:** Supabase
- **Ícones:** Angular Material Icons

Se você tiver algum problema de inicialização, apague a pasta `node_modules` e tente rodar `npm install` novamente.
