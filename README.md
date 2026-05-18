# SIMA — Plataforma de Cursos e Trilhas de Aprendizagem

Plataforma LMS (Learning Management System) desenvolvida em **Angular 21** para gerenciar turmas, aulas, inscrições e progresso de alunos. Utiliza **Supabase** para autenticação e banco de dados, e **Tailwind CSS 4** para estilização.

---

## 🚀 Como executar localmente

### Pré-requisitos
- **Node.js** v20 ou superior — [Download](https://nodejs.org/)
- **Visual Studio Code** — [Download](https://code.visualstudio.com/)

### Passo a passo

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
# Copie o arquivo de exemplo e preencha com suas chaves do Supabase
cp .env.example .env

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

---

## 🗄️ Banco de Dados (Supabase)

Siga o arquivo [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) para criar as tabelas e configurar as políticas de segurança (RLS).

### Migrations disponíveis

| Arquivo | Descrição |
|---------|-----------|
| `SUPABASE_SETUP.md` | Script principal — cria todas as tabelas (`users`, `courses`, `lessons`, `comments`) |
| `supabase/migrations/phase2_tables.sql` | Tabelas de Fase 2 — `lesson_progress`, `enrollments`, `learning_paths` |
| `supabase/migrations/add_lesson_order.sql` | Adiciona coluna `order` nas aulas para controle de sequência |

---

## ✨ Funcionalidades

### Para Alunos
- 🔐 **Autenticação** — Cadastro e login via Supabase Auth
- 📚 **Dashboard** — Listagem de turmas com busca e filtro por categoria
- 🎓 **Inscrições** — Auto-inscrição em turmas com status visual
- 📈 **Progresso** — Marcar aulas como concluídas com barra de progresso
- 💬 **Comentários** — Comentar nas aulas com paginação
- 🔖 **Salvos** — Salvar aulas para acessar depois
- 👤 **Perfil** — Editar nome, foto e trocar senha

### Para Administradores
- ➕ **Criar turmas** — Com categoria, tipo de arquivo e thumbnail
- 📝 **Gerenciar aulas** — Criação sequencial com ordem automática
- 🗑️ **Moderação** — Deletar comentários de qualquer aluno

### Técnico
- 🔍 **Busca global** — No header, busca em turmas e aulas simultaneamente
- 🌐 **SEO** — Metadados dinâmicos por página via `SeoService`
- ⚡ **Performance** — Cache de queries, skeleton loaders e `@defer` blocks
- 🌙 **Dark mode** — Suporte completo via Tailwind e classe `.dark`

---

## 🛠️ Tecnologias

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Angular | 21 | Framework principal |
| Tailwind CSS | 4 | Estilização |
| Supabase | 2.x | Autenticação + Banco de dados |
| Angular Material | 21 | Ícones |

---

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
