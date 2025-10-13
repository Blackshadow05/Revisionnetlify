import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapFromDatabase, type PuestoRecord } from '@/types/puesto';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables de entorno de Supabase faltantes: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY/ANON');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  db: { schema: 'public' },
});

// Mapa de campos camelCase (cliente) a columnas de BD (Supabase)
// Excluir 'id' del conjunto posible para evitar conflictos de tipos
type UpdatableColumn = Exclude<keyof PuestoRecord, 'id'>;
const fieldMap: Record<string, UpdatableColumn> = {
  nombre: 'Nombre',
  casita: 'Casita',
  detalle: 'Detalle',
  tipo: 'Tipo',
  placa: 'Placa',
  horaIngreso: 'Hora_ingreso',
  horaSalida: 'Hora_salida',
  oficialIngreso: 'Oficial_ingreso',
  oficialSalida: 'Oficial_salida',
  fecha: 'Fecha',
};

const allowedTipos: PuestoRecord['Tipo'][] = ['Tour', 'Check in', 'Check out', 'Outside Guest'];
function normalizeTipo(value: unknown): PuestoRecord['Tipo'] {
  const s = String(value ?? '').trim();
  return (allowedTipos.includes(s as any) ? s : 'Check in') as PuestoRecord['Tipo'];
}

// PATCH /api/puesto01/:id
// Actualiza campos parciales de un registro
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const recordId = Number(id);
    if (!recordId || Number.isNaN(recordId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const payload = await request.json();
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Cuerpo de la petición inválido' }, { status: 400 });
    }

    // Construir objeto de actualización con nombres de columnas reales
    const updateData: Partial<PuestoRecord> = {};
    for (const [key, value] of Object.entries(payload)) {
      const column = fieldMap[key];
      if (!column) continue;

      if (column === 'Tipo') {
        updateData.Tipo = normalizeTipo(value);
      } else {
        // Forzar a string para columnas text/varchar
        updateData[column] = String(value ?? '') as unknown as PuestoRecord[typeof column];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos válidos para actualizar' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Puesto_01')
      .update(updateData)
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      console.error(`Supabase error PATCH /api/puesto01/${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapped = mapFromDatabase(data as PuestoRecord);
    return NextResponse.json(mapped, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/puesto01 error inesperado:', error);
    return NextResponse.json({ error: error?.message ?? 'Error al actualizar el registro' }, { status: 500 });
  }
}

// DELETE /api/puesto01/:id
// Elimina un registro por ID
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const recordId = Number(id);
    if (!recordId || Number.isNaN(recordId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { error } = await supabase
      .from('Puesto_01')
      .delete()
      .eq('id', recordId);

    if (error) {
      console.error(`Supabase error DELETE /api/puesto01/${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/puesto01 error inesperado:', error);
    return NextResponse.json({ error: error?.message ?? 'Error al eliminar el registro' }, { status: 500 });
  }
}