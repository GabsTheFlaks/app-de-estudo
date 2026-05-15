-- =============================================
-- FASE 2: Tabelas para SIMA
-- Execute no Supabase Studio > SQL Editor
-- =============================================

-- -----------------------------------------------
-- 2.1 PROGRESSO DE AULAS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id   uuid NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Usuário só vê e edita seu próprio progresso
CREATE POLICY "Usuário vê seu progresso"
  ON public.lesson_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere seu progresso"
  ON public.lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário apaga seu progresso"
  ON public.lesson_progress FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------
-- 2.2 INSCRIÇÕES EM TURMAS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id    uuid NOT NULL,
  enrolled_at  timestamptz NOT NULL DEFAULT now(),
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  UNIQUE (user_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Aluno vê suas próprias inscrições; admin vê todas
CREATE POLICY "Aluno vê suas inscrições"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Aluno se inscreve"
  ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Aluno cancela inscrição"
  ON public.enrollments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin vê todas inscrições"
  ON public.enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admin gerencia inscrições"
  ON public.enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- -----------------------------------------------
-- 2.3 TRILHAS DE APRENDIZADO
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.path_courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id     uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_id   uuid NOT NULL,
  position    int NOT NULL DEFAULT 0,
  UNIQUE (path_id, course_id)
);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.path_courses ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem ver trilhas
CREATE POLICY "Usuários veem trilhas"
  ON public.learning_paths FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin cria/edita trilhas"
  ON public.learning_paths FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Usuários veem cursos das trilhas"
  ON public.path_courses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin gerencia cursos das trilhas"
  ON public.path_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
