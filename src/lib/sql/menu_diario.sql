-- Crear tabla para almacenar menús diarios
CREATE TABLE public.menu_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL, -- Fecha específica del menú (sin zona horaria)
  dia_semana VARCHAR(20) NOT NULL, -- Nombre del día (Lunes, Martes, etc.)
  comidas TEXT[] NOT NULL, -- Array de comidas para ese día
  menu_semanal_id UUID REFERENCES public.menus(id) ON DELETE CASCADE, -- Referencia al menú semanal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Añadir comentarios a la tabla
COMMENT ON TABLE public.menu_diario IS 'Tabla que almacena los menús diarios extraídos de cada menú semanal';
COMMENT ON COLUMN public.menu_diario.fecha IS 'Fecha específica del menú (formato YYYY-MM-DD)';
COMMENT ON COLUMN public.menu_diario.comidas IS 'Array con los elementos de comida para ese día';

-- Crear índice para búsquedas por fecha
CREATE INDEX idx_menu_diario_fecha ON public.menu_diario (fecha);
CREATE INDEX idx_menu_diario_menu_semanal ON public.menu_diario (menu_semanal_id);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.menu_diario ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados
CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON public.menu_diario FOR SELECT 
TO authenticated 
USING (true);

-- Política para permitir inserción solo a usuarios autenticados
CREATE POLICY "Permitir inserción a usuarios autenticados" 
ON public.menu_diario FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para permitir actualización solo a usuarios autenticados
CREATE POLICY "Permitir actualización a usuarios autenticados" 
ON public.menu_diario FOR UPDATE 
TO authenticated 
USING (true);
