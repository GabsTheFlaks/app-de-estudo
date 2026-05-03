# Configuração do Supabase

Siga os passos abaixo para configurar o banco de dados via Painel do Supabase -> SQL Editor:

## 1. Criar Tabelas e Relacionamentos

Execute o código abaixo no SQL Editor do Supabase para criar a estrutura e habilitar a segurança (RLS):

```sql
-- Criar a tabela de Usuários (Profile) estendendo o auth.users padrão
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  firstname text not null,
  lastname text not null,
  avatar_url text,
  role text default 'student'::text not null
);

-- Habilitar RLS (Row Level Security) na tabela users
alter table public.users enable row level security;

-- Política 1: Usuários podem ver seu próprio perfil
create policy "Usuários podem ver seu próprio perfil"
on public.users for select
using ( auth.uid() = id );

-- Política 2: Usuários podem atualizar seus próprios perfis
create policy "Usuários podem alterar o próprio perfil"
on public.users for update
using ( auth.uid() = id );

-- Política 3: Usuários podem inserir seus próprios perfis (caso trigger não exista)
create policy "Usuários podem inserir o próprio perfil"
on public.users for insert
with check ( auth.uid() = id );

-- Criar trigger para injetar dados na tabela public.users automaticamente após o signup
-- Quando a confirmação de email estiver ativada, o usuário não é logado imediatamente.
-- O trigger (SECURITY DEFINER) insere o perfil contornando RLS com segurança.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, firstname, lastname, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'firstname', 'Nome'),
    coalesce(new.raw_user_meta_data->>'lastname', 'Sobrenome'),
    'student'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Proteger a coluna role contra atualizações (Evitar Escalada de Privilégios)
create or replace function public.protect_user_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    new.role = old.role; -- ignora a tentativa de mudança de role
  end if;
  return new;
end;
$$;

create trigger protect_user_role_trigger
  before update on public.users
  for each row execute procedure public.protect_user_role();



-- Criar a tabela de Cursos (Turmas)
create table public.courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text,
  link_drive text not null,
  file_type text check (file_type in ('pdf', 'video', 'docs', 'pptx', 'xls')) not null,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS na tabela Courses
alter table public.courses enable row level security;

-- Política: Todos usuários autenticados podem ver cursos
create policy "Cursos visíveis para todos logados"
on public.courses for select
to authenticated
using ( true );

-- Política: Apenas admins podem criar cursos
create policy "Apenas admin pode inserir cursos"
on public.courses for insert
to authenticated
with check (
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Política: Apenas admins podem alterar ou remover cursos
create policy "Apenas admin pode editar cursos"
on public.courses for update
to authenticated
using (
  (select role from public.users where id = auth.uid()) = 'admin'
);

create policy "Apenas admin pode deletar cursos"
on public.courses for delete
to authenticated
using (
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Criar a tabela de Aulas (Lessons)
create table if not exists public.lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  file_type text not null,
  link_drive text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS na tabela Lessons
alter table public.lessons enable row level security;

-- Política: Aulas visíveis para todos
create policy "Aulas visíveis para todos"
on public.lessons for select
to authenticated
using ( true );

-- Política: Apenas admins podem inserir aulas
create policy "Apenas admin pode inserir aulas"
on public.lessons for insert
to authenticated
with check (
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Política: Apenas admins podem editar aulas
create policy "Apenas admin pode editar aulas"
on public.lessons for update
to authenticated
using (
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Política: Apenas admins podem deletar aulas
create policy "Apenas admin pode deletar aulas"
on public.lessons for delete
to authenticated
using (
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Criar a tabela de Comentários (Comments)
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  user_name text not null,
  avatar_url text,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS na tabela Comments
alter table public.comments enable row level security;

-- Política: Comentários visíveis para todos
create policy "Comentários visíveis para todos"
on public.comments for select
to authenticated
using ( true );

-- Política: Qualquer um pode inserir comentário
create policy "Qualquer um logado pode comentar"
on public.comments for insert
to authenticated
with check ( auth.uid() = user_id );

-- Política: Usuário pode alterar seu próprio comentário
create policy "Usuário altera próprio comentário"
on public.comments for update
to authenticated
using ( auth.uid() = user_id );

-- Política: Usuário ou Admin pode apagar comentário
create policy "Usuário apaga comentário"
on public.comments for delete
to authenticated
using (
  auth.uid() = user_id OR
  (select role from public.users where id = auth.uid()) = 'admin'
);

-- Habilitar Realtime
alter publication supabase_realtime add table public.lessons;
alter publication supabase_realtime add table public.comments;

-- Caso ocorra o erro PGRST204 de "avatar_url" na edição de perfil, execute o comando abaixo:
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;

```

## 2. Configurar Variáveis de Ambiente locais
Preencha no menu **Settings -> Secrets** (ou `angular.json` / ambiente local) as duas variáveis abaixo:
- `SUPABASE_URL`: sua url pública do supabase
- `SUPABASE_ANON_KEY`: sua key pública anônima do supabase
