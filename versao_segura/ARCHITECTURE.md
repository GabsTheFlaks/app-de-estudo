# 🏛️ Documento de Arquitetura de Software (SIMA)

Este documento descreve as principais decisões de design, padrões e tecnologias escolhidas para a construção do projeto. Seu objetivo é facilitar o entendimento do código-fonte para novos desenvolvedores, acadêmicos e recrutadores.

## 1. Stack Tecnológica Principal

A aplicação foi construída visando um ecossistema moderno (SPA - Single Page Application) suportado por um robusto BaaS (Backend-as-a-Service):

- **Front-end:** Angular v21 (TypeScript)
- **Estilização:** Tailwind CSS v4
- **Modais e Comportamento Avançado:** Angular CDK (Component Dev Kit)
- **Back-end & Banco de Dados:** Supabase (PostgreSQL)

---

## 2. Paradigmas e Padrões de Projeto (Angular)

O projeto abandona as práticas antigas do Angular (NgModules) e abraça integralmente a nova API reativa do framework.

### 2.1. Standalone Components
O projeto não possui arquivos `app.module.ts`. Todos os componentes (`.component.ts` e `.page.ts`) são **Standalone**, significando que eles gerenciam as próprias dependências. Isso favorece a modularidade, facilidade de teste e permite o uso irrestrito de *Lazy Loading*.

### 2.2. Reatividade com "Signals" (`@angular/core`)
A gerência de estado local dos componentes abdicou parcialmente de RxJS (BehaviorSubjects e Observables) para focar na API de **Signals**.
- *Signals* (`signal()`, `computed()`, `effect()`) oferecem uma forma mais legível, síncrona e livre de falhas (glitch-free) de gerir estado UI.
- No `DashboardPage`, por exemplo, a busca/filtro local não engatilha requests desnecessários, utilizando apenas um `computed()` sobre os dados já carregados no array principal de cursos.

### 2.3. Gestão de Estado / Cache (`CourseService`)
Para evitar picos de acessos na API (evitando custos com banco de dados), a aplicação possui um "Cache-Busting" manual:
- As turmas e lições ficam guardadas em propriedades privadas na memória (`cachedCourses` e `Map<string, Lesson[]>`).
- Toda ação de edição/remoção (`deleteLesson`, `updateCourseTitle`) realiza uma **Mutação Imutável** na memória, aplicando métodos padrão de Arrays (`filter`, `map`) diretamente no estado do Signal, em vez de invalidar todo o cache e puxar do servidor novamente.

---

## 3. Segurança e Infraestrutura de Dados (Supabase)

### 3.1. Row Level Security (RLS)
Não existe um "Back-end tradicional" em Node/Python validando requests. Toda a segurança de acesso aos dados é controlada nativamente no banco de dados (PostgreSQL) através do RLS.
- O Front-end bate direto nas tabelas via `SupabaseClient`.
- As RLS Policies escritas em `SUPABASE_SETUP.md` garantem que o banco recuse a query (mesmo que o Front-end tente buscar) se o `auth.uid()` logado não possuir privilégios suficientes para aquela ação.

### 3.2. Proteção contra Escalada de Privilégios (Privilege Escalation)
A aplicação adota medidas em duas camadas para impedir que um usuário se transforme em 'Admin':
1. **No Client:** A classe `SupabaseService` sanitiza o objeto do usuário na hora de fazer atualizações (updates do perfil), deletando ativamente campos sensíveis (como `role`) antes do payload subir para o banco.
2. **No DB:** Um *SQL Trigger* (`protect_user_role`) é ativado `BEFORE UPDATE` na tabela de usuários. Ele trava e ignora silenciosamente qualquer modificação na coluna `role` caso o usuário tente burlar as checagens do frontend via scripts no Console do Navegador.

### 3.3. Prevenção de XSS e Sanitização de Links
A visualização de arquivos via iframes confia apenas em URLs pré-aprovadas (YouTube, Google Drive). Na refatoração principal, implementamos whitelists (listas brancas) que validam ativamente a URL antes do uso do `DomSanitizer.bypassSecurityTrustResourceUrl()`.

---

## 4. UX e Organização

- **Double-Click Protection:** Prevenção de *Race Conditions*. Botões de "Login" e "Cadastro" interceptam os cliques caso a flag `isLoading()` seja verdadeira.
- **Enums em vez de "Magic Strings":** Regras duras de negócio (ex: roles de `'admin'` ou `'student'`, ou tipos de arquivos `'pdf'`, `'video'`) são geridas em um arquivo estrito `enums.ts`.
- **GlobalErrorHandler:** Utilização do padrão `ErrorHandler` global do Angular para capturar e silenciar erros indesejados e centralizar lógicas de monitoramento no Console de forma previsível.
