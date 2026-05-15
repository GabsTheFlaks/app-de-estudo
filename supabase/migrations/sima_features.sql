-- =======================================================
-- TABELAS E POLÍTICAS COMPLETA (SIMA)
-- Sprints 1 & 2: Avaliação, Mural e Sistema Andon
-- Execute no Supabase Studio > SQL Editor
-- =======================================================

-- =======================================================
-- PARTE 1: AVALIAÇÃO DE AULAS (Sprint 1)
-- =======================================================
CREATE TABLE IF NOT EXISTS public.lesson_ratings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id   uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  rating      integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas seguras e idempotentes para Avaliação
DROP POLICY IF EXISTS "Usuários veem suas próprias avaliações" ON public.lesson_ratings;
CREATE POLICY "Usuários veem suas próprias avaliações"
  ON public.lesson_ratings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários inserem suas próprias avaliações" ON public.lesson_ratings;
CREATE POLICY "Usuários inserem suas próprias avaliações"
  ON public.lesson_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários atualizam suas próprias avaliações" ON public.lesson_ratings;
CREATE POLICY "Usuários atualizam suas próprias avaliações"
  ON public.lesson_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =======================================================
-- PARTE 2: COMUNICAÇÃO E CONTROLE DE QUALIDADE (Sprint 2)
-- =======================================================

-- 1. MURAL DE AVISOS DA TURMA
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS announcement text;

-- 2. SISTEMA ANDON (ALERTAS DE MATERIAIS)
CREATE TABLE IF NOT EXISTS public.andon_alerts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name   text NOT NULL,
  course_id   uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id   uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  description text NOT NULL,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.andon_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas seguras e idempotentes para Andon
DROP POLICY IF EXISTS "Alertas visíveis para todos logados" ON public.andon_alerts;
CREATE POLICY "Alertas visíveis para todos logados"
  ON public.andon_alerts FOR SELECT
  TO authenticated
  USING ( true );

DROP POLICY IF EXISTS "Alunos criam seus próprios alertas" ON public.andon_alerts;
CREATE POLICY "Alunos criam seus próprios alertas"
  ON public.andon_alerts FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Apenas admins editam status de alertas" ON public.andon_alerts;
CREATE POLICY "Apenas admins editam status de alertas"
  ON public.andon_alerts FOR UPDATE
  TO authenticated
  USING ( 
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' 
  );

-- =======================================================
-- PARTE 3: MÚLTIPLOS MATERIAIS DE APOIO (Sprint 4)
-- =======================================================
CREATE TABLE IF NOT EXISTS public.lesson_attachments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title       text NOT NULL,
  file_type   text NOT NULL,
  url         text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visualização pública de anexos" ON public.lesson_attachments;
CREATE POLICY "Visualização pública de anexos"
  ON public.lesson_attachments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Apenas admins gerenciam anexos" ON public.lesson_attachments;
CREATE POLICY "Apenas admins gerenciam anexos"
  ON public.lesson_attachments FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
