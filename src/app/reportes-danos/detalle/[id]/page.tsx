'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DamageReport, DamageReportTracking } from '@/types/damage-report';
import AddTrackingModal from '@/components/damage-reports/AddTrackingModal';

export default function DamageReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [report, setReport] = useState<DamageReport | null>(null);
  const [tracking, setTracking] = useState<DamageReportTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddTrackingModalOpen, setIsAddTrackingModalOpen] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const reportId = params.id as string;
    
    // Mock report data
    const mockReport: DamageReport = {
      id: reportId,
      title: 'Daño en línea de producción',
      description: 'Se detectó un daño en la cinta transportadora de la línea 2 durante la inspección matutina. La cinta presenta desgaste irregular y hace ruido excesivo.',
      category: 'Equipamiento',
      location: 'Línea de Producción 2',
      priority: 'High',
      status: 'In Progress',
      createdAt: '2025-10-27T10:00:00Z',
      updatedAt: '2025-10-28T08:30:00Z',
      reporter: 'Juan Pérez',
      assignedTo: 'María González',
      tags: ['urgente', 'producción', 'línea2']
    };

    // Mock tracking data
    const mockTracking: DamageReportTracking[] = [
      {
        id: '1',
        reportId: reportId,
        status: 'Open',
        comment: 'Reporte inicial - daño detectado en inspección rutinaria',
        createdBy: 'Juan Pérez',
        createdAt: '2025-10-27T10:00:00Z'
      },
      {
        id: '2',
        reportId: reportId,
        status: 'In Progress',
        comment: 'Asignado a técnico especializado. Se programó inspección detallada para hoy.',
        createdBy: 'María González',
        createdAt: '2025-10-27T14:30:00Z'
      },
      {
        id: '3',
        reportId: reportId,
        status: 'In Progress',
        comment: 'Inspección completada. Se requiere reemplazo de la cinta transportadora. Repuestos en pedido.',
        createdBy: 'María González',
        createdAt: '2025-10-28T08:30:00Z'
      }
    ];

    setTimeout(() => {
      setReport(mockReport);
      setTracking(mockTracking);
      setLoading(false);
    }, 500);
  }, [params.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'In Progress':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Resolved':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Closed':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-600/20 text-red-300 border-red-600/30';
      case 'High':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Low':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Open':
        return 'Abierto';
      case 'In Progress':
        return 'En Progreso';
      case 'Resolved':
        return 'Resuelto';
      case 'Closed':
        return 'Cerrado';
      default:
        return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'Crítico';
      case 'High':
        return 'Alto';
      case 'Medium':
        return 'Medio';
      case 'Low':
        return 'Bajo';
      default:
        return priority;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTrackingAdded = (newTracking: DamageReportTracking) => {
    setTracking(prev => [newTracking, ...prev]);
    if (report) {
      setReport(prev => prev ? {
        ...prev,
        status: newTracking.status,
        updatedAt: newTracking.createdAt
      } : null);
    }
    setIsAddTrackingModalOpen(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e2538] via-[#2a3347] to-[#1a1f35] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Acceso Requerido</h1>
          <p className="text-gray-400 mb-6">Debes iniciar sesión para ver los detalles del reporte</p>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e2538] via-[#2a3347] to-[#1a1f35] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#c9a45c]/30 border-t-[#c9a45c] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1e2538] via-[#2a3347] to-[#1a1f35] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-[#3a4357]/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Reporte no encontrado</h3>
          <p className="text-gray-400 mb-6">El reporte que buscas no existe o ha sido eliminado.</p>
          <button
            onClick={() => router.push('/reportes-danos')}
            className="px-6 py-3 bg-[#c9a45c] text-white font-semibold rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.1)] transition-all duration-200"
          >
            Volver a Reportes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e2538] via-[#2a3347] to-[#1a1f35]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3a4357]/50 to-[#4a5367]/50 backdrop-blur-xl border-b border-[#c9a45c]/20">
        <div className="max-w-4xl xl:max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Mobile-first header layout */}
          <div className="flex flex-col gap-4">
            {/* Top row: Back button, title, and mobile menu button */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <button
                  onClick={() => router.back()}
                  className="w-10 h-10 bg-[#4a5367] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200 min-w-[44px] touch-manipulation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h15" />
                  </svg>
                </button>
                
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#c9a45c] rounded-xl flex items-center justify-center shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.75m-16.5 0h.008v.008H3v-.008z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl xl:text-3xl font-bold text-white truncate">{report.title}</h1>
                    <p className="text-sm sm:text-base text-gray-400">#{report.id}</p>
                  </div>
                </div>
              </div>
              
              {/* Mobile-first action button */}
              <button
                onClick={() => setIsAddTrackingModalOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-[#c9a45c] text-white font-semibold rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.1)] transition-all duration-200 hover:scale-105 min-h-[44px] touch-manipulation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline text-sm sm:text-base">Agregar Seguimiento</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl xl:max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="space-y-6 lg:space-y-8">
          {/* Main Content */}
          <div className="space-y-6 lg:space-y-8">
            {/* Report Details */}
            <div className="bg-[#3a4357]/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-[#c9a45c]/10 shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Detalles del Reporte</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Descripción</h3>
                  <p className="text-white leading-relaxed">{report.description}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Categoría</h3>
                    <p className="text-white">{report.category}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Ubicación</h3>
                    <p className="text-white">{report.location}</p>
                  </div>
                </div>

                {report.tags && report.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Etiquetas</h3>
                    <div className="flex flex-wrap gap-2">
                      {report.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-[#c9a45c]/20 text-[#c9a45c] text-xs sm:text-sm rounded-lg border border-[#c9a45c]/30"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile-first Quick Info Card */}
            <div className="lg:hidden bg-[#3a4357]/50 backdrop-blur-xl rounded-2xl p-4 border border-[#c9a45c]/10 shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]">
              <h3 className="text-base font-semibold text-white mb-4">Información Rápida</h3>
              
              {/* Mobile status and priority - horizontal layout */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-400 block">Estado</label>
                  <span className={`px-3 py-2 rounded-lg text-xs font-medium border inline-block mt-1 ${getStatusColor(report.status)}`}>
                    {getStatusText(report.status)}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block">Prioridad</label>
                  <span className={`px-3 py-2 rounded-lg text-xs font-medium border inline-block mt-1 ${getPriorityColor(report.priority)}`}>
                    {getPriorityText(report.priority)}
                  </span>
                </div>
              </div>

              {/* Mobile people info - stacked */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block">Reportado por</label>
                  <p className="text-white text-sm">{report.reporter}</p>
                </div>
                
                {report.assignedTo && (
                  <div>
                    <label className="text-xs text-gray-400 block">Asignado a</label>
                    <p className="text-white text-sm">{report.assignedTo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tracking Timeline - Optimized for mobile */}
            <div className="bg-[#3a4357]/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-[#c9a45c]/10 shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Historial de Seguimiento</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {tracking.map((trackingItem, index) => (
                  <div key={trackingItem.id} className="flex gap-3 sm:gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 ${getStatusColor(trackingItem.status)} flex-shrink-0`}></div>
                      {index < tracking.length - 1 && (
                        <div className="w-px h-8 sm:h-12 bg-[#c9a45c]/20 mt-2"></div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-4 sm:pb-6 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium border w-fit ${getStatusColor(trackingItem.status)}`}>
                          {getStatusText(trackingItem.status)}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">{formatDate(trackingItem.createdAt)}</span>
                      </div>
                      
                      <p className="text-white text-sm sm:text-base mb-2 leading-relaxed">{trackingItem.comment}</p>
                      
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <span className="truncate">{trackingItem.createdBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block space-y-6">
            {/* Status and Priority */}
            <div className="bg-[#3a4357]/50 backdrop-blur-xl rounded-2xl p-6 border border-[#c9a45c]/10 shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]">
              <h3 className="text-lg font-semibold text-white mb-4">Estado y Prioridad</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Estado Actual</label>
                  <div className="mt-1">
                    <span className={`px-3 py-2 rounded-lg text-sm font-medium border ${getStatusColor(report.status)}`}>
                      {getStatusText(report.status)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Prioridad</label>
                  <div className="mt-1">
                    <span className={`px-3 py-2 rounded-lg text-sm font-medium border ${getPriorityColor(report.priority)}`}>
                      {getPriorityText(report.priority)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* People */}
            <div className="bg-[#3a4357]/50 backdrop-blur-xl rounded-2xl p-6 border border-[#c9a45c]/10 shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]">
              <h3 className="text-lg font-semibold text-white mb-4">Personas</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Reportado por</label>
                  <p className="text-white mt-1">{report.reporter}</p>
                </div>
                
                {report.assignedTo && (
                  <div>
                    <label className="text-sm text-gray-400">Asignado a</label>
                    <p className="text-white mt-1">{report.assignedTo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-[#3a4357]/50 backdrop-blur-xl rounded-2xl p-6 border border-[#c9a45c]/10 shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]">
              <h3 className="text-lg font-semibold text-white mb-4">Fechas</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Creado</label>
                  <p className="text-white mt-1 text-sm">{formatDate(report.createdAt)}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Última actualización</label>
                  <p className="text-white mt-1 text-sm">{formatDate(report.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Tracking Modal */}
      <AddTrackingModal
        isOpen={isAddTrackingModalOpen}
        onClose={() => setIsAddTrackingModalOpen(false)}
        onTrackingAdded={handleTrackingAdded}
        currentStatus={report.status}
      />
    </div>
  );
}