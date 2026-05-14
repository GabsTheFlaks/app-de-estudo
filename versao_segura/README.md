<div align="center">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/angularjs/angularjs-original.svg" alt="Angular Logo" width="80" height="80">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/supabase/supabase-original.svg" alt="Supabase Logo" width="80" height="80">

  <h1 align="center">EducaMVP</h1>

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

O **EducaMVP** é um projeto de Sistema de Gestão de Aprendizagem (LMS) desenvolvido para centralizar treinamentos e distribuir conhecimento de forma estruturada.

Foi idealizado inicialmente como uma prova de conceito (MVP) para disciplinas acadêmicas (ex: Engenharia de Produção), servindo como uma ferramenta real para padronização de treinamentos (Standardized Work), gestão de conhecimento corporativo ou acadêmico e melhoria contínua através do feedback de usuários.

Este projeto foca em alta performance e segurança, utilizando as ferramentas mais modernas do ecossistema front-end.

---

## 🎯 Funcionalidades

- **Autenticação Segura:** Login e registro protegidos, baseados em Supabase Auth com proteção contra exploração de privilégios.
- **Gestão de Turmas e Aulas:** Criação de cursos, postagem de vídeos e materiais (PDF, Google Docs, Apresentações).
- **Interface Moderna (UX/UI):** Modais customizados, notificações (Toasts) não-intrusivas, "Dark Mode" inteligente e design responsivo.
- **Busca em Tempo Real:** Pesquisa ultrarrápida de cursos e materiais (buscando direto no cache de memória).
- **Interação Social:** Sistema de comentários em tempo real integrado às aulas.

---

## 🛠 Tecnologias

A aplicação foi construída com foco em escalabilidade e manutenção:

*   [Angular 21](https://angular.dev/) (Framework Principal - utilizando Signals e Standalone Components)
*   [Tailwind CSS v4](https://tailwindcss.com/) (Estilização e Design System)
*   [Angular Material CDK](https://material.angular.io/) (Modais e Interações Ricas)
*   [Supabase](https://supabase.com/) (Banco de Dados PostgreSQL, Realtime e Autenticação)
*   [TypeScript](https://www.typescriptlang.org/) (Tipagem Segura)

💡 *Para uma leitura aprofundada sobre as decisões técnicas, testes e padrões utilizados neste projeto, leia o nosso documento de [Arquitetura (ARCHITECTURE.md)](./ARCHITECTURE.md).*

---

## ⚙️ Como Executar

Para clonar e rodar a aplicação no seu computador, você precisará do [Git](https://git-scm.com) e do [Node.js](https://nodejs.org/en/download/) (v20+ recomendado) instalados.

No seu terminal, digite:

```bash
# Clone este repositório
$ git clone https://github.com/seu-usuario/seu-repositorio.git

# Entre na pasta
$ cd seu-repositorio

# Instale as dependências
$ npm install

# Crie seu banco de dados no Supabase e rode os scripts SQL
# Leia o arquivo SUPABASE_SETUP.md para instruções do banco.

# Configure as variáveis de ambiente (URL e KEY do Supabase)
# Copie o arquivo de exemplo
$ cp .env.example .env

# Inicie o servidor de desenvolvimento
$ npm run dev
```

A aplicação abrirá no seu navegador padrão em: `http://localhost:3000`

---
---

<div align="center">
  <h1>🇬🇧 English Version</h1>
</div>

## 📚 About the Project

**EducaMVP** is a Learning Management System (LMS) designed to centralize training and distribute knowledge in a structured way.

Initially idealized as a Proof of Concept (MVP) for academic disciplines (e.g., Production Engineering), it serves as a real tool for training standardization (Standardized Work), corporate or academic knowledge management, and continuous improvement through user feedback.

This project focuses on high performance and security, using the most modern tools in the front-end ecosystem.

---

## 🎯 Features

- **Secure Authentication:** Protected login and registration based on Supabase Auth with privilege escalation protection.
- **Course and Lesson Management:** Creation of courses, posting videos, and materials (PDF, Google Docs, Slides).
- **Modern Interface (UX/UI):** Custom modals, non-intrusive notifications (Toasts), smart "Dark Mode," and responsive design.
- **Real-time Search:** Ultra-fast search for courses and materials (searching directly in memory cache).
- **Social Interaction:** Real-time commenting system integrated into lessons.

---

## 🛠 Built With

The application was built with a focus on scalability and maintainability:

*   [Angular 21](https://angular.dev/) (Main Framework - using Signals and Standalone Components)
*   [Tailwind CSS v4](https://tailwindcss.com/) (Styling and Design System)
*   [Angular Material CDK](https://material.angular.io/) (Modals and Rich Interactions)
*   [Supabase](https://supabase.com/) (PostgreSQL Database, Realtime, and Authentication)
*   [TypeScript](https://www.typescriptlang.org/) (Static Typing)

💡 *For an in-depth read on the technical decisions, testing, and patterns used in this project, read our [Architecture Document (ARCHITECTURE.md)](./ARCHITECTURE.md).*

---

## ⚙️ Getting Started

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (v20+ recommended) installed on your computer.

From your command line:

```bash
# Clone this repository
$ git clone https://github.com/your-username/your-repository.git

# Go into the repository
$ cd your-repository

# Install dependencies
$ npm install

# Set up your Supabase database and run the SQL scripts
# Read the SUPABASE_SETUP.md file for database instructions.

# Set up your environment variables (Supabase URL and KEY)
# Copy the example file
$ cp .env.example .env

# Run the app
$ npm run dev
```

The application will open in your default browser at: `http://localhost:3000`
