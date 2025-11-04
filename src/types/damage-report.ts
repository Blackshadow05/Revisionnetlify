export interface DamageReport {
  id: string;
  // Campos de Supabase - Reporte_danos
  createdAt: string;
  detalle: string;
  Quien_reporta: string;
  Estado: 'Abierto' | 'En Progreso' | 'Resuelto' | 'Cerrado';
  Prioridad: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  
  // Propiedades computadas para compatibilidad con el código existente
  get title(): string;
  get description(): string;
  get priority(): 'Low' | 'Medium' | 'High' | 'Critical';
  get status(): 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  get reporter(): string;
  get updatedAt(): string;
}

// Clase que implementa la interfaz DamageReport con funciones de mapeo
export class DamageReportData implements DamageReport {
  id: string;
  createdAt: string;
  detalle: string;
  Quien_reporta: string;
  Estado: 'Abierto' | 'En Progreso' | 'Resuelto' | 'Cerrado';
  Prioridad: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';

  constructor(data: {
    id: string;
    createdAt: string;
    detalle: string;
    Quien_reporta: string;
    Estado: 'Abierto' | 'En Progreso' | 'Resuelto' | 'Cerrado';
    Prioridad: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  }) {
    this.id = data.id;
    this.createdAt = data.createdAt;
    this.detalle = data.detalle;
    this.Quien_reporta = data.Quien_reporta;
    this.Estado = data.Estado;
    this.Prioridad = data.Prioridad;
  }

  // Propiedades computadas
  get title(): string {
    return this.detalle.length > 50 ? this.detalle.substring(0, 50) + '...' : this.detalle;
  }

  get description(): string {
    return this.detalle;
  }

  get priority(): 'Low' | 'Medium' | 'High' | 'Critical' {
    const priorityMap: { [key: string]: 'Low' | 'Medium' | 'High' | 'Critical' } = {
      'Bajo': 'Low',
      'Medio': 'Medium',
      'Alto': 'High',
      'Crítico': 'Critical'
    };
    return priorityMap[this.Prioridad] || 'Low';
  }

  get status(): 'Open' | 'In Progress' | 'Resolved' | 'Closed' {
    const statusMap: { [key: string]: 'Open' | 'In Progress' | 'Resolved' | 'Closed' } = {
      'Abierto': 'Open',
      'En Progreso': 'In Progress',
      'Resuelto': 'Resolved',
      'Cerrado': 'Closed'
    };
    return statusMap[this.Estado] || 'Open';
  }

  get reporter(): string {
    return this.Quien_reporta;
  }

  get updatedAt(): string {
    return this.createdAt; // Usamos createdAt como fallback
  }
}

export interface DamageReportLegacy {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  reporter: string;
  assignedTo?: string;
  tags: string[];
}

export interface DamageReportTracking {
  id: string;
  reportId: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  comment: string;
  createdBy: string;
  createdAt: string;
  attachments?: string[];
  images?: string[];
}

export interface CreateDamageReportRequest {
  title: string;
  description: string;
  category: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo?: string;
  tags: string[];
}

export interface AddTrackingRequest {
  reportId: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  comment: string;
  attachments?: File[];
}