import { NextRequest, NextResponse } from 'next/server';
import { DamageReport, CreateDamageReportRequest } from '@/types/damage-report';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('Reporte_danos')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by status (Estado in Spanish)
    if (status && status !== 'all') {
      query = query.eq('Estado', status);
    }

    // Search filter
    if (search) {
      query = query.or(`detalle.ilike.%${search}%,Quien_reporta.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching damage reports:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener reportes de daños' },
        { status: 500 }
      );
    }

    // Convert Supabase data to DamageReport instances
    const reports = data?.map(item => ({
      id: item.id,
      createdAt: item.created_at,
      detalle: item.detalle,
      Quien_reporta: item.Quien_reporta,
      Estado: item.Estado,
      Prioridad: item.Prioridad,
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
    } as DamageReport)) || [];

    return NextResponse.json({
      success: true,
      data: reports,
      total: reports.length
    });

  } catch (error) {
    console.error('Error fetching damage reports:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields for Supabase
    if (!body.detalle || !body.Quien_reporta) {
      return NextResponse.json(
        { success: false, error: 'Los campos detalle y Quien_reporta son requeridos' },
        { status: 400 }
      );
    }

    // Prepare data for Supabase
    const newReport = {
      detalle: body.detalle,
      Quien_reporta: body.Quien_reporta,
      Estado: body.Estado || 'Abierto',
      Prioridad: body.Prioridad || 'Medio'
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('Reporte_danos')
      .insert([newReport])
      .select()
      .single();

    if (error) {
      console.error('Error creating damage report:', error);
      return NextResponse.json(
        { success: false, error: 'Error al crear el reporte de daño' },
        { status: 500 }
      );
    }

    // Convert to DamageReport instance
    const damageReportData: DamageReport = {
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
      data: damageReportData,
      message: 'Reporte de daño creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating damage report:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}