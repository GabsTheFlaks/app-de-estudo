-- Adiciona coluna 'order' na tabela lessons para controlar a sequência das aulas
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS "order" integer;

-- Popula a ordem baseada na data de criação (a aula mais antiga = aula 1)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY created_at ASC) AS rn
  FROM public.lessons
)
UPDATE public.lessons
SET "order" = numbered.rn
FROM numbered
WHERE public.lessons.id = numbered.id;

-- Garante que novas aulas sem order não fiquem com null (fallback = 999)
ALTER TABLE public.lessons ALTER COLUMN "order" SET DEFAULT 999;
