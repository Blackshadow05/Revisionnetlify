export interface DamageReport {
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