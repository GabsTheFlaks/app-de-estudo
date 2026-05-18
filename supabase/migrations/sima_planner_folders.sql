-- 1. Tabela para pastas criadas pelos estudantes
CREATE TABLE IF NOT EXISTS public.student_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.student_folders ENABLE ROW LEVEL SECURITY;

-- Evita erro se a política já existir em execuções repetidas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'student_folders' AND policyname = 'Permite estudantes gerenciar suas próprias pastas'
    ) THEN
        CREATE POLICY "Permite estudantes gerenciar suas próprias pastas"
          ON public.student_folders
          FOR ALL
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- 2. Tabela pivot associando lições às pastas
CREATE TABLE IF NOT EXISTS public.folder_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES public.student_folders(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(folder_id, lesson_id)
);

ALTER TABLE public.folder_lessons ENABLE ROW LEVEL SECURITY;

-- Policies separadas por operação para evitar ambiguidade no optimizer do Supabase

DO $$
BEGIN
    -- SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'folder_lessons' AND policyname = 'Permite estudantes ler aulas de suas pastas'
    ) THEN
        CREATE POLICY "Permite estudantes ler aulas de suas pastas"
          ON public.folder_lessons
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.student_folders
              WHERE id = folder_id AND user_id = auth.uid()
            )
          );
    END IF;

    -- INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'folder_lessons' AND policyname = 'Permite estudantes inserir aulas em suas pastas'
    ) THEN
        CREATE POLICY "Permite estudantes inserir aulas em suas pastas"
          ON public.folder_lessons
          FOR INSERT
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.student_folders
              WHERE id = folder_id AND user_id = auth.uid()
            )
          );
    END IF;

    -- DELETE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'folder_lessons' AND policyname = 'Permite estudantes remover aulas de suas pastas'
    ) THEN
        CREATE POLICY "Permite estudantes remover aulas de suas pastas"
          ON public.folder_lessons
          FOR DELETE
          USING (
            EXISTS (
              SELECT 1 FROM public.student_folders
              WHERE id = folder_id AND user_id = auth.uid()
            )
          );
    END IF;
END
$$;

-- 3. Tabela de cronograma semanal sincronizado na nuvem
CREATE TABLE IF NOT EXISTS public.student_planner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  week_day text NOT NULL CHECK (week_day IN ('seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom')),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, week_day, course_id)
);

ALTER TABLE public.student_planner ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'student_planner' AND policyname = 'Permite estudantes ler seu cronograma'
    ) THEN
        CREATE POLICY "Permite estudantes ler seu cronograma"
          ON public.student_planner
          FOR SELECT
          USING (auth.uid() = user_id);
    END IF;

    -- INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'student_planner' AND policyname = 'Permite estudantes inserir no cronograma'
    ) THEN
        CREATE POLICY "Permite estudantes inserir no cronograma"
          ON public.student_planner
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
    END IF;

    -- DELETE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'student_planner' AND policyname = 'Permite estudantes remover do cronograma'
    ) THEN
        CREATE POLICY "Permite estudantes remover do cronograma"
          ON public.student_planner
          FOR DELETE
          USING (auth.uid() = user_id);
    END IF;
END
$$;
