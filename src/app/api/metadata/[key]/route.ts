import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Configura cliente con fallback seguro
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas correctamente');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tipado específico para Next.js 15.4.1
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  if (!key) {
    return NextResponse.json({ error: 'La clave (key) es requerida' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('app_metadata')
      .select('value, updated_at')
      .eq('key', key)
      .single();

    if (error) {
      // Si el error es "PGRST116", significa que no se encontró la fila.
      // Esto no es un error fatal, simplemente no hay datos para esa clave todavía.
      if (error.code === 'PGRST116') {
        return NextResponse.json(null, { status: 200 }); // Devolver null para indicar que no hay valor
      }
      throw error;
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error(`Error al obtener metadata para la clave ${key}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Tipado específico para Next.js 15.4.1
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const { value } = await request.json();

  if (!key) {
    return NextResponse.json({ error: 'La clave (key) es requerida' }, { status: 400 });
  }

  if (value === undefined) {
    return NextResponse.json({ error: 'El valor (value) es requerido' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('app_metadata')
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error(`Error al actualizar metadata para la clave ${key}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 