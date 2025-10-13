import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapFromDatabase, type PuestoRecord } from '@/types/puesto';

// Evitar caché en esta ruta (si aplica)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Crear cliente de Supabase con Service Key en servidor (fallback a ANON si no está disponible)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Lanzar error claro en server logs
  console.error('Variables de entorno de Supabase faltantes: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY/ANON');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  db: { schema: 'public' },
});

// GET /api/puesto01
// Devuelve todos los registros mapeados desde la tabla 'Puesto_01'
export async function GET(_req: Request) {
  try {
    const { data, error } = await supabase
      .from('Puesto_01')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Supabase error GET /api/puesto01:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapped = (data as PuestoRecord[] | null)?.map(mapFromDatabase) ?? [];
    return NextResponse.json(mapped, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/puesto01 error inesperado:', error);
    return NextResponse.json({ error: error?.message ?? 'Error al cargar los datos' }, { status: 500 });
  }
}