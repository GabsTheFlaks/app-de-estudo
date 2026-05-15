<div align="center">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/angularjs/angularjs-original.svg" alt="Angular Logo" width="80" height="80">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/supabase/supabase-original.svg" alt="Supabase Logo" width="80" height="80">

  <h1 align="center">SIMA</h1>

  <p align="center">
    Uma Plataforma Moderna de Cursos e Gestão de Conhecimento
    <br />
    <a href="#-sobre-o-projeto"><strong>Explore a documentação »</strong></a>
    <br />
    <br />
    <a href="#-funcionalidades">Funcionalidades</a>
    ·
    <a href="#-tecnologias">Tecnologias</a>
    ·
    <a href="#%EF%B8%8F-como-executar">Como Executar</a>
  </p>
</div>

<p align="center">
  <img alt="Angular" src="https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
</p>

> *🇬🇧 English version available below / Versão em Inglês disponível abaixo.*

## 📚 Sobre o Projeto

O **SIMA** é um projeto de Sistema de Gestão de Aprendizagem (LMS) desenvolvido para centralizar treinamentos e distribuir conhecimento de forma estruturada.

Foi idealizado inicialmente como uma prova de conceito (MVP) para disciplinas acadêmicas (ex: Engenharia de Produção), servindo como uma ferramenta real para padronização de treinamentos (Standardized Work), gestão de conhecimento corporativo ou acadêmico e melhoria contínua através do feedback de usuários e sistema *Andon* de reporte de erros.

Este projeto foca em alta performance e segurança, utilizando as ferramentas mais modernas do ecossistema front-end.

---

## 🎯 Funcionalidades

- **Autenticação Segura:** Login e registro protegidos, baseados em Supabase Auth com proteção contra exploração de privilégios.
- **Gestão de Turmas e Múltiplos Anexos:** Criação de cursos, postagem de vídeos e múltiplos materiais de apoio (PDF, Google Docs, Apresentações) através de FormArrays dinâmicos.
- **Interface Moderna (UX/UI):** Modais e diálogos customizados via Angular CDK, "Modo Cinema", navegação fluida entre aulas, notificações em Toasts não-intrusivos e "Dark Mode" inteligente e design responsivo.
- **Organização Flexível:** Funcionalidade *Drag and Drop* (Arrastar e Soltar) para que os administradores reordenem os conteúdos da turma com extrema facilidade, sincronizados em tempo real com o banco de dados.
- **Interação, Retenção e Qualidade:**
  - Sistema de comentários em tempo real (fórum).
  - Sistema de **Avaliação de Aulas** (1 a 5 estrelas) para manter o conteúdo relevante (Kaizen).
  - **Sistema Andon:** Mecanismo integrado de reporte de problemas para alertas rápidos e resolução de falhas nos materiais, garantindo máxima qualidade da operação.

---

## 🛠 Tecnologias

A aplicação foi construída com foco em escalabilidade, manutenibilidade e Custo Zero (Serverless):

*   [Angular 21](https://angular.dev/) (Framework Principal - utilizando Signals e Standalone Components, sem *NgModules*)
*   [Tailwind CSS v4](https://tailwindcss.com/) (Estilização e Design System nativo)
*   [Angular Material CDK](https://material.angular.io/) (Drag & Drop, Interações, Modais e Componentes UI robustos)
*   [Supabase](https://supabase.com/) (Banco de Dados PostgreSQL, Realtime e Autenticação)
*   [TypeScript](https://www.typescriptlang.org/) (Tipagem Forte)

💡 *Para uma leitura aprofundada sobre as decisões técnicas, testes, o conceito do "Sistema Andon", gestão de estado (Mutabilidade vs Caching) e políticas RLS de segurança utilizados neste projeto, leia o nosso documento de [Arquitetura (ARCHITECTURE.md)](./ARCHITECTURE.md).*

---

## ⚙️ Como Executar

Para clonar e rodar a aplicação no seu computador, você precisará do [Git](https://git-scm.com) e do [Node.js](https://nodejs.org/en/download/) (v20+ recomendado) instalados.

No seu terminal, digite:

```bash
# Clone este repositório
$ git clone https://github.com/GabsTheFlaks/app-de-estudo.git

# Entre na pasta
$ cd app-de-estudo

# Instale as dependências
$ npm install

# Crie seu banco de dados no Supabase e rode os scripts SQL
# Leia o arquivo SUPABASE_SETUP.md para as instruções e triggers essenciais do banco de dados.

# Configure as variáveis de ambiente (URL e KEY do Supabase)
# Copie o arquivo de exemplo para poder injetar chaves no seu sistema local.
$ cp .env.example .env

# Inicie o servidor de desenvolvimento e curta seu novo LMS
$ npm run dev
```

A aplicação abrirá no seu navegador padrão em: `http://localhost:3000`

---
---

<div align="center">
  <h1>🇬🇧 English Version</h1>
</div>

## 📚 About the Project

**SIMA** is a Learning Management System (LMS) designed to centralize training and distribute knowledge in a structured, lean way.

Initially idealized as a Proof of Concept (MVP) for academic disciplines (e.g., Production Engineering), it serves as a real tool for training standardization (Standardized Work), corporate or academic knowledge management, and continuous improvement (Kaizen) through user feedback and an integrated *Andon* error-reporting system.

This project focuses on high performance and security, using the most modern tools in the front-end ecosystem without relying on expensive infrastructure.

---

## 🎯 Features

- **Secure Authentication:** Protected login and registration based on Supabase Auth, combined with strict database triggers against privilege escalation.
- **Course and Attachments Management:** Creation of courses, posting main videos, and multiple support materials (PDFs, Spreadsheets) managed dynamically using Angular FormArrays.
- **Modern Interface (UX/UI):** Custom modals/dialogs via Angular CDK, "Cinema Mode" for distraction-free studying, fluid inter-lesson navigation, smart "Dark Mode," responsive design, and Toast notifications.
- **Flexible Organization:** Built-in *Drag and Drop* functionality allowing administrators to visually reorder lessons within a course, instantly syncing changes with the remote database.
- **Social Interaction, Retention & Quality Check:**
  - Real-time lesson discussion forum (WebSockets).
  - **Lesson Ratings System** (1 to 5 stars) encouraging Kaizen principles.
  - **Andon System:** Integrated reporting mechanism allowing students to flag broken or outdated materials straight to an admin dashboard for swift resolution.

---

## 🛠 Built With

The application was built emphasizing horizontal scalability and a Serverless footprint:

*   [Angular 21](https://angular.dev/) (Main Framework - fully utilizing Signals and Standalone Components)
*   [Tailwind CSS v4](https://tailwindcss.com/) (Styling and Design System)
*   [Angular Material CDK](https://material.angular.io/) (Drag & Drop behavior, Modals, Overlays)
*   [Supabase](https://supabase.com/) (PostgreSQL Database, Realtime, and Authentication layers)
*   [TypeScript](https://www.typescriptlang.org/) (Static Typing)

💡 *For an in-depth read on the technical decisions, state mutability handling, testing practices, and our strict RLS (Row Level Security) approaches, check out our [Architecture Document (ARCHITECTURE.md)](./ARCHITECTURE.md).*

---

## ⚙️ Getting Started

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (v20+ recommended) installed on your computer.

From your command line:

```bash
# Clone this repository
$ git clone https://github.com/GabsTheFlaks/app-de-estudo.git

# Go into the repository
$ cd app-de-estudo

# Install dependencies
$ npm install

# Set up your Supabase database and run the SQL scripts
# Read the SUPABASE_SETUP.md file for crucial database setup commands and triggers.

# Set up your environment variables (Supabase URL and KEY)
# Copy the example file
$ cp .env.example .env

# Run the app
$ npm run dev
```

The application will open in your default browser at: `http://localhost:3000`

## 📁 Estrutura do Projeto

```
src/app/
├── core/
│   ├── models/        # Interfaces TypeScript
│   ├── services/      # CourseService, EnrollmentService, ProgressService...
│   └── guards/        # AuthGuard
├── features/
│   ├── auth/          # Login e Cadastro
│   ├── dashboard/     # Listagem de turmas
│   ├── course/        # Página da turma (class.page)
│   ├── lesson/        # Player de aula (lesson-viewer)
│   ├── profile/       # Perfil do usuário
│   └── admin/         # Painel do administrador
├── layout/            # Header + Sidebar + roteamento
└── shared/            # Componentes, utilitários e serviços compartilhados
```
