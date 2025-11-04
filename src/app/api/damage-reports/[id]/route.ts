import { NextRequest, NextResponse } from 'next/server';

// Mock data storage - in a real app, this would be a database
let damageReports = [
  {
    id: '1',
    title: 'Daño en línea de producción',
    description: 'Se detectó un daño en la cinta transportadora de la línea 2 durante la inspección matutina. La cinta presenta desgaste irregular y hace ruido excesivo.',
    category: 'Equipamiento',
    location: 'Línea de Producción 2',
    priority: 'High',
    status: 'Open',
    createdAt: '2025-10-27T10:00:00Z',
    updatedAt: '2025-10-27T10:00:00Z',
    reporter: 'Juan Pérez',
    assignedTo: 'María González',
    tags: ['urgente', 'producción', 'línea2']
  },
  {
    id: '2',
    title: 'Fuga de agua en almacén',
    description: 'Pequeña fuga detectada en el área de almacenamiento de materias primas durante la revisión nocturna.',
    category: 'Infraestructura',
    location: 'Almacén Principal',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: '2025-10-27T14:30:00Z',
    updatedAt: '2025-10-27T16:00:00Z',
    reporter: 'Ana López',
    assignedTo: 'Carlos Ramírez',
    tags: ['agua', 'almacén']
  },
  {
    id: '3',
    title: 'Sistema de ventilación defectuoso',
    description: 'El sistema de ventilación del área de trabajo presenta ruido inusual durante el funcionamiento.',
    category: 'HVAC',
    location: 'Área de Trabajo A',
    priority: 'Low',
    status: 'Resolved',
    createdAt: '2025-10-26T09:15:00Z',
    updatedAt: '2025-10-27T11:45:00Z',
    reporter: 'Luis Martínez',
    assignedTo: 'Pedro Sánchez',
    tags: ['ventilación', 'ruido']
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const report = damageReports.find(r => r.id === id);

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Damage report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error fetching damage report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const reportIndex = damageReports.findIndex(r => r.id === id);

    if (reportIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Damage report not found' },
        { status: 404 }
      );
    }

    // Update the report
    damageReports[reportIndex] = {
      ...damageReports[reportIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: damageReports[reportIndex],
      message: 'Damage report updated successfully'
    });

  } catch (error) {
    console.error('Error updating damage report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const reportIndex = damageReports.findIndex(r => r.id === id);

    if (reportIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Damage report not found' },
        { status: 404 }
      );
    }

    // Remove the report
    damageReports.splice(reportIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Damage report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting damage report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}