import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import UpstashCache, { createUpstashCache } from '@/lib/upstash-cache';

export const dynamic = 'force-dynamic';

// Inicializar caché Upstash si están las variables de entorno
const upstash = createUpstashCache();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID no proporcionado' },
        { status: 400 }
      );
    }

    // Intentar obtener de caché antes de consultar a Supabase
    if (upstash) {
      try {
        const cached = await upstash.get<any>(`revisiones_casitas:${id}`);
        if (cached) {
          return NextResponse.json(cached);
        }
      } catch (err) {
        console.error('Upstash cache GET error', err);
      }
    }

    if (!supabase) {
      console.error('Error: Supabase client no configurado');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('revisiones_casitas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error de Supabase:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Revisión no encontrada' },
        { status: 404 }
      );
    }

    // Almacenar en caché para futuras consultas
    if (upstash) {
      try {
        await upstash.set(`revisiones_casitas:${id}`, data, 60);
      } catch (err) {
        console.error('Upstash cache SET error', err);
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}