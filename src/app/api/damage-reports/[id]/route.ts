import { NextRequest, NextResponse } from 'next/server';
import { DamageReport } from '@/types/damage-report';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('Reporte_danos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching damage report:', error);
      return NextResponse.json(
        { success: false, error: 'Reporte de daño no encontrado' },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Reporte de daño no encontrado' },
        { status: 404 }
      );
    }

    // Convert to DamageReport instance
    const report: DamageReport = {
      id: data.id,
      createdAt: data.created_at,
      detalle: data.detalle,
      Quien_reporta: data.Quien_reporta,
      Estado: data.Estado,
      Prioridad: data.Prioridad,
      get title() {
        return this.detalle.length > 50 ? this.detalle.substring(0, 50) + '...' : this.detalle;
      },
      get description() {
        return this.detalle;
      },
      get priority() {
        const priorityMap: { [key: string]: 'Low' | 'Medium' | 'High' | 'Critical' } = {
          'Bajo': 'Low',
          'Medio': 'Medium',
          'Alto': 'High',
          'Crítico': 'Critical'
        };
        return priorityMap[this.Prioridad] || 'Low';
      },
      get status() {
        const statusMap: { [key: string]: 'Open' | 'In Progress' | 'Resolved' | 'Closed' } = {
          'Abierto': 'Open',
          'En Progreso': 'In Progress',
          'Resuelto': 'Resolved',
          'Cerrado': 'Closed'
        };
        return statusMap[this.Estado] || 'Open';
      },
      get reporter() {
        return this.Quien_reporta;
      },
      get updatedAt() {
        return this.createdAt;
      }
    };

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error fetching damage report:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Only allow updating Estado and Prioridad fields for Supabase
    const allowedFields: any = {};
    if (body.Estado) allowedFields.Estado = body.Estado;
    if (body.Prioridad) allowedFields.Prioridad = body.Prioridad;

    const { data, error } = await supabase
      .from('Reporte_danos')
      .update(allowedFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating damage report:', error);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el reporte de daño' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Reporte de daño no encontrado' },
        { status: 404 }
      );
    }

    // Convert to DamageReport instance
    const report: DamageReport = {
      id: data.id,
      createdAt: data.created_at,
      detalle: data.detalle,
      Quien_reporta: data.Quien_reporta,
      Estado: data.Estado,
      Prioridad: data.Prioridad,
      get title() {
        return this.detalle.length > 50 ? this.detalle.substring(0, 50) + '...' : this.detalle;
      },
      get description() {
        return this.detalle;
      },
      get priority() {
        const priorityMap: { [key: string]: 'Low' | 'Medium' | 'High' | 'Critical' } = {
          'Bajo': 'Low',
          'Medio': 'Medium',
          'Alto': 'High',
          'Crítico': 'Critical'
        };
        return priorityMap[this.Prioridad] || 'Low';
      },
      get status() {
        const statusMap: { [key: string]: 'Open' | 'In Progress' | 'Resolved' | 'Closed' } = {
          'Abierto': 'Open',
          'En Progreso': 'In Progress',
          'Resuelto': 'Resolved',
          'Cerrado': 'Closed'
        };
        return statusMap[this.Estado] || 'Open';
      },
      get reporter() {
        return this.Quien_reporta;
      },
      get updatedAt() {
        return this.createdAt;
      }
    };

    return NextResponse.json({
      success: true,
      data: report,
      message: 'Reporte de daño actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error updating damage report:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('Reporte_danos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting damage report:', error);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el reporte de daño' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reporte de daño eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting damage report:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}