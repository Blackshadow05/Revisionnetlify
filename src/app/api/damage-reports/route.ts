import { NextRequest, NextResponse } from 'next/server';
import { DamageReport, CreateDamageReportRequest } from '@/types/damage-report';

// Mock data storage - in a real app, this would be a database
let damageReports: DamageReport[] = [
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let filteredReports = [...damageReports];

    // Filter by status
    if (status && status !== 'all') {
      filteredReports = filteredReports.filter(report => report.status === status);
    }

    // Filter by category
    if (category && category !== 'all') {
      filteredReports = filteredReports.filter(report => report.category === category);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReports = filteredReports.filter(report =>
        report.title.toLowerCase().includes(searchLower) ||
        report.description.toLowerCase().includes(searchLower) ||
        report.location.toLowerCase().includes(searchLower) ||
        report.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort by created date (newest first)
    filteredReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: filteredReports,
      total: filteredReports.length
    });

  } catch (error) {
    console.error('Error fetching damage reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateDamageReportRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.description || !body.category || !body.location) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new report
    const newReport: DamageReport = {
      id: Date.now().toString(),
      title: body.title,
      description: body.description,
      category: body.category,
      location: body.location,
      priority: body.priority || 'Medium',
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reporter: 'Usuario Actual', // In a real app, get from auth context
      assignedTo: body.assignedTo,
      tags: body.tags || []
    };

    // Add to storage
    damageReports.unshift(newReport);

    return NextResponse.json({
      success: true,
      data: newReport,
      message: 'Damage report created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating damage report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}