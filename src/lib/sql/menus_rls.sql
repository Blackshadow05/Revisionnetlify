-- Configurar RLS (Row Level Security) para la tabla menus
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados
CREATE POLICY "Permitir lectura de menus a usuarios autenticados" 
ON public.menus FOR SELECT 
TO authenticated 
USING (true);

-- Política para permitir inserción solo a usuarios autenticados
CREATE POLICY "Permitir inserción de menus a usuarios autenticados" 
ON public.menus FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para permitir actualización solo a usuarios autenticados
CREATE POLICY "Permitir actualización de menus a usuarios autenticados" 
ON public.menus FOR UPDATE 
TO authenticated 
USING (true);

-- Política para permitir eliminación solo a usuarios autenticados
CREATE POLICY "Permitir eliminación de menus a usuarios autenticados" 
ON public.menus FOR DELETE 
TO authenticated 
USING (true);
