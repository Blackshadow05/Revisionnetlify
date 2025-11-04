'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import DamageReportModal from '@/components/damage-reports/DamageReportModal';
import DamageReportCard from '@/components/damage-reports/DamageReportCard';

interface DamageReport {
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

export default function DamageReportsPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Open' | 'In Progress' | 'Resolved' | 'Closed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    const mockReports: DamageReport[] = [
      {
        id: '1',
        title: 'Daño en línea de producción',
        description: 'Se detectó un daño en la cinta transportadora de la línea 2',
        category: 'Equipamiento',
        location: 'Línea de Producción 2',
        priority: 'High',
        status: 'Open',
        createdAt: '2025-10-27T10:00:00Z',
        updatedAt: '2025-10-27T10:00:00Z',
        reporter: 'Juan Pérez',
        assignedTo: 'María González',
        tags: ['urgente', 'producción']
      },
      {
        id: '2',
        title: 'Fuga de agua en almacén',
        description: 'Pequeña fuga detectada en el área de almacenamiento de materias primas',
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
        description: 'El sistema de ventilación del área de trabajo presenta ruido inusual',
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
    
    setTimeout(() => {
      setReports(mockReports);
      setLoading(false);
    }, 500);
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleReportCreated = (newReport: DamageReport) => {
    setReports(prev => [newReport, ...prev]);
    setIsModalOpen(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e2538] via-[#2a3347] to-[#1a1f35] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Acceso Requerido</h1>
          <p className="text-gray-400 mb-6">Debes iniciar sesión para acceder a los reportes de daños</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-[#c9a45c] text-white font-semibold rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.1)] transition-all duration-200"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e2538] via-[#2a3347] to-[#1a1f35]">
      {/* Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-[#3a4357]/50 to-[#4a5367]/50 backdrop-blur-xl border-b border-[#c9a45c]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#c9a45c] rounded-xl flex items-center justify-center shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.25 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-white">Reportes de Daños</h1>
                <p className="text-sm sm:text-base text-gray-400">Seguimiento y gestión de incidencias</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-6 py-3 bg-[#c9a45c] text-white font-semibold rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.1)] transition-all duration-200 hover:scale-105 min-h-[48px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden sm:inline">Nuevo Reporte</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search - Mobile Optimized */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="bg-[#3a4357]/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]">
          <div className="space-y-4">
            {/* Search - Full width on mobile */}
            <div className="w-full">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar reportes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#4a5367]/50 border border-[#c9a45c]/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-transparent transition-all duration-200 text-base min-h-[48px]"
                />
              </div>
            </div>
            
            {/* Status Filter - Full width on mobile */}
            <div className="w-full">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-4 py-3 bg-[#4a5367]/50 border border-[#c9a45c]/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-transparent transition-all duration-200 text-base min-h-[48px]"
              >
                <option value="all">Todos los Estados</option>
                <option value="Open">Abierto</option>
                <option value="In Progress">En Progreso</option>
                <option value="Resolved">Resuelto</option>
                <option value="Closed">Cerrado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-[#3a4357]/30 rounded-2xl p-6 shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] animate-pulse">
                <div className="h-6 bg-[#4a5367]/50 rounded mb-4"></div>
                <div className="h-4 bg-[#4a5367]/50 rounded mb-2"></div>
                <div className="h-4 bg-[#4a5367]/50 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-[#3a4357]/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.75m-16.5 0h.008v.008H3v-.008z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No hay reportes</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filter !== 'all' 
                ? 'No se encontraron reportes con los criterios de búsqueda especificados.'
                : 'Aún no se han creado reportes de daños.'
              }
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-[#c9a45c] text-white font-semibold rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.1)] transition-all duration-200"
            >
              Crear Primer Reporte
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredReports.map((report) => (
              <Link key={report.id} href={`/reportes-danos/detalle/${report.id}`}>
                <DamageReportCard report={report} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <DamageReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReportCreated={handleReportCreated}
      />
    </div>
  );
}