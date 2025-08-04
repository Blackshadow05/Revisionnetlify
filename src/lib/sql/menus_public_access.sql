-- Configurar RLS (Row Level Security) para la tabla menus
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios (incluso anónimos)
CREATE POLICY "Permitir lectura de menus a todos" 
ON public.menus FOR SELECT 
USING (true);

-- Política para permitir inserción a todos los usuarios (incluso anónimos)
CREATE POLICY "Permitir inserción de menus a todos" 
ON public.menus FOR INSERT 
WITH CHECK (true);

-- Política para permitir actualización a todos los usuarios (incluso anónimos)
CREATE POLICY "Permitir actualización de menus a todos" 
ON public.menus FOR UPDATE 
USING (true);

-- Política para permitir eliminación a todos los usuarios (incluso anónimos)
CREATE POLICY "Permitir eliminación de menus a todos" 
ON public.menus FOR DELETE 
USING (true);

-- Configurar RLS para la tabla menu_diario
ALTER TABLE public.menu_diario ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios (incluso anónimos)
CREATE POLICY "Permitir lectura de menu_diario a todos" 
ON public.menu_diario FOR SELECT 
USING (true);

-- Política para permitir inserción a todos los usuarios (incluso anónimos)
CREATE POLICY "Permitir inserción de menu_diario a todos" 
ON public.menu_diario FOR INSERT 
WITH CHECK (true);

-- Política para permitir actualización a todos los usuarios (incluso anónimos)
CREATE POLICY "Permitir actualización de menu_diario a todos" 
ON public.menu_diario FOR UPDATE 
USING (true);

-- Política para permitir eliminación a todos los usuarios (incluso anónimos)
CREATE POLICY "Permitir eliminación de menu_diario a todos" 
ON public.menu_diario FOR DELETE 
USING (true);
