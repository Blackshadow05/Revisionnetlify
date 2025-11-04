'use client';

import { DamageReport } from '@/types/damage-report';

interface DamageReportCardProps {
  report: DamageReport;
}

export default function DamageReportCard({ report }: DamageReportCardProps) {
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

  return (
    <div className="group bg-[#3a4357]/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-[#c9a45c]/10 hover:border-[#c9a45c]/30 transition-all duration-300 shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] hover:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.15)] hover:scale-105 cursor-pointer">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-[#c9a45c]/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#c9a45c]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.75m-16.5 0h.008v.008H3v-.008z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-white truncate group-hover:text-[#c9a45c] transition-colors duration-200 leading-tight">
            {report.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 truncate mt-1">
            {report.category} • {report.location}
          </p>
        </div>
      </div>

      {/* Description - Only on desktop, save space on mobile */}
      <div className="hidden sm:block mb-4">
        <p className="text-gray-300 text-sm line-clamp-2">
          {report.description}
        </p>
      </div>

      {/* Status and Priority - Stack on mobile */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between mb-3">
        <span className={`px-3 py-2 rounded-lg text-xs font-medium border ${getStatusColor(report.status)} w-fit sm:w-auto`}>
          {getStatusText(report.status)}
        </span>
        <span className={`px-3 py-2 rounded-lg text-xs font-medium border ${getPriorityColor(report.priority)} w-fit sm:w-auto`}>
          {getPriorityText(report.priority)}
        </span>
      </div>

      {/* Tags - Horizontal scroll on mobile */}
      {report.tags && report.tags.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {report.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-[#c9a45c]/20 text-[#c9a45c] text-xs rounded-lg border border-[#c9a45c]/30 whitespace-nowrap flex-shrink-0"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer - Stack on mobile */}
      <div className="pt-3 border-t border-[#c9a45c]/10">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="truncate">{report.reporter}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="whitespace-nowrap">{formatDate(report.createdAt)}</span>
          </div>
        </div>

        {/* Assigned To - Show on mobile when available */}
        {report.assignedTo && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 sm:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V17.25m-4.5-6.75v3.375m0 0v3.375c0 .621.504 1.125 1.125 1.125h9.75a1.125 1.125 0 001.125-1.125V7.875m-13.5 4.125h16.5M16.5 13.5h16.5m-16.5 3h16.5m0 0v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V16.5" />
            </svg>
            <span>Asignado: {report.assignedTo}</span>
          </div>
        )}
      </div>
    </div>
  );
}