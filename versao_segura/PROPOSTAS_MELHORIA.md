# 🚀 Propostas de Melhoria e Evolução do Projeto

Este documento lista sugestões técnicas e de arquitetura para elevar a qualidade, performance e usabilidade da Plataforma de Cursos no futuro.

---

## 1. 🛡️ Segurança e Autenticação

### Implementar Validação de Email e "Magic Links"
Atualmente o sistema cria contas e loga diretamente com senha. Habilitar a confirmação de e-mail no Supabase aumenta muito a segurança. Você pode usar "Magic Links" (login sem senha usando link no email) que melhora muito a experiência do usuário e reduz o roubo de contas.

### Rate Limiting Avançado
Embora o Supabase proteja a API de banco, não temos proteção contra *Brute Force* no Front-end (se alguém ficar tentando chutar senhas na tela de login via bot). É recomendável adicionar um sistema básico de reCaptcha ou hCaptcha nas telas de Login/Registro.

### Políticas de RLS mais Granulares (Supabase)
Criar políticas separadas por curso. Atualmente, se um aluno faz login, ele vê *todos* os cursos (`Cursos visíveis para todos logados`). Pode-se implementar uma tabela de matriculas (`course_enrollments`) para que o RLS mostre apenas os cursos onde o `user_id` está vinculado ao `course_id`.

---

## 2. ⚡ Performance e Arquitetura Angular

### Lazy Loading em Rotas e Componentes
O projeto usa Standalone Components (ótimo!), mas no `app.routes.ts`, as páginas estão sendo importadas de forma síncrona (estática). Alterar as rotas para carregar sob demanda usando o `loadComponent` do Angular (`import()`) diminui drasticamente o tempo inicial de carregamento (Bundle Size inicial menor).

### State Management com Signals API (Arquitetura Flux)
O `CourseService` gerencia um estado mutável (`cachedCourses`, `cachedLessons`). Como a aplicação já usa *Signals* em componentes, o próximo passo evolutivo seria adotar o `@ngrx/signals` (SignalStore) ou gerenciar o estado global inteiramente via Signals nos Services. Isso facilita muito a reatividade do sistema e diminui a complexidade de mutação que implementamos agora.

### Angular Interceptors
Em vez de depender apenas do `GlobalErrorHandler`, você poderia criar um `HttpInterceptor` ou usar bibliotecas nativas de interceptação para checar se o token do Supabase inspirou e forçar um logout ou *Refresh Token* transparente para o usuário antes que uma requisição falhe.

---

## 3. 🎨 UX / UI e Funcionalidades

### Upload Nativo de Arquivos (Storage)
Atualmente a plataforma depende de Links externos (Google Drive, YouTube). O Supabase possui um módulo de "Storage" gratuito. O sistema poderia ser evoluído para que o Admin fizesse o upload de PDFs e Imagens diretamente pelo próprio app Angular, armazenando os arquivos no *Supabase Storage*, e não colando links do Drive.

### Feedback Visual com Toast/Snackbars
A maioria dos feedbacks visuais são feitos via variáveis booleanas no topo dos cards ou com modais de prompt. Evoluir para um serviço de *Toasts* usando o Angular Material Snackbar (exibir "Material salvo com sucesso" no canto inferior da tela) deixaria o layout ainda mais limpo e profissional.

### Skeleton Loaders
Melhorar a percepção de performance. Durante o `isLoading`, mostrar uma animação de tela em branco no formato das aulas e comentários (*Skeleton Screens*) fica mais elegante que apenas o ícone girando (`loop`).

### Modo Escuro Totalmente Adaptável
Você já utiliza classes como `dark:bg-slate-900`, mas a implementação de um toggle manual de modo claro/escuro com salvamento no `localStorage` no Header faria a plataforma ser bem mais acessível para os estudantes.

---

## 4. 🧪 Testes e DevOps

### Testes End-to-End (E2E) com Cypress ou Playwright
Além dos testes unitários já configurados via Jasmine/Karma/Vitest, implementar testes que clicam nas telas, tentam logar, criar curso e falhar propositalmente (E2E) garante que o fluxo completo do sistema está de pé.

### CI / CD (Integração e Entrega Contínua)
Configurar o GitHub Actions. Toda vez que você enviar um código para o GitHub, ele roda o script de testes `npm run test` sozinho e, se passar, publica automaticamente em uma hospedagem grátis (como Vercel, Netlify ou Firebase Hosting).
