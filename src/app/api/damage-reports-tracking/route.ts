import { NextRequest, NextResponse } from 'next/server';
import { DamageReportTracking, AddTrackingRequest } from '@/types/damage-report';

// Mock tracking data storage
let damageReportTracking: DamageReportTracking[] = [
  {
    id: '1',
    reportId: '1',
    status: 'Open',
    comment: 'Reporte inicial - daño detectado en inspección rutinaria',
    createdBy: 'Juan Pérez',
    createdAt: '2025-10-27T10:00:00Z'
  },
  {
    id: '2',
    reportId: '1',
    status: 'In Progress',
    comment: 'Asignado a técnico especializado. Se programó inspección detallada para hoy.',
    createdBy: 'María González',
    createdAt: '2025-10-27T14:30:00Z'
  },
  {
    id: '3',
    reportId: '1',
    status: 'In Progress',
    comment: 'Inspección completada. Se requiere reemplazo de la cinta transportadora. Repuestos en pedido.',
    createdBy: 'María González',
    createdAt: '2025-10-28T08:30:00Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Filter tracking by report ID
    const reportTracking = damageReportTracking
      .filter(tracking => tracking.reportId === reportId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: reportTracking,
      total: reportTracking.length
    });

  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AddTrackingRequest = await request.json();

    // Validate required fields
    if (!body.reportId || !body.status || !body.comment) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: reportId, status, comment' },
        { status: 400 }
      );
    }

    // Create new tracking entry
    const newTracking: DamageReportTracking = {
      id: Date.now().toString(),
      reportId: body.reportId,
      status: body.status,
      comment: body.comment,
      createdBy: 'Usuario Actual', // In a real app, get from auth context
      createdAt: new Date().toISOString(),
      attachments: body.attachments?.map(file => file.name) || [],
      images: [] // In a real app, handle file uploads
    };

    // Add to storage
    damageReportTracking.unshift(newTracking);

    return NextResponse.json({
      success: true,
      data: newTracking,
      message: 'Tracking entry added successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding tracking entry:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}