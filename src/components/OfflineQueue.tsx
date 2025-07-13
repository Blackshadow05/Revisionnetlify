'use client';

import { useState, useEffect } from 'react';
import { useOfflineFormSubmit } from '@/hooks/useOfflineFormSubmit';

interface OfflineQueueProps {
  className?: string;
}

export function OfflineQueue({ className = '' }: OfflineQueueProps) {
  const { queueStatus, isOnline, processOfflineQueue } = useOfflineFormSubmit();
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expandir si hay formularios pendientes o errores
  useEffect(() => {
    if (queueStatus.pending.length > 0 || queueStatus.error.length > 0) {
      setIsExpanded(true);
    }
  }, [queueStatus.pending.length, queueStatus.error.length]);

  // No mostrar si no hay nada en la cola
  if (queueStatus.total === 0) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse">
            <div className="w-full h-full bg-yellow-400 rounded-full animate-ping"></div>
          </div>
        );
      case 'uploading':
        return (
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        );
      case 'completed':
        return (
          <div className="w-3 h-3 bg-green-500 rounded-full">
            <svg className="w-2 h-2 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-3 h-3 bg-red-500 rounded-full">
            <svg className="w-2 h-2 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (count: number, type: string) => {
    if (count === 0) return 'text-gray-500';
    switch (type) {
      case 'pending': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-[#2a3347] border border-[#3d4659] rounded-xl overflow-hidden ${className}`}>
      {/* Header - siempre visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-[#323959] transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          {/* Indicador de conexión */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-400">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Título */}
          <h3 className="text-[#c9a45c] font-semibold">
            Cola de Formularios
          </h3>

          {/* Contador rápido */}
          <div className="flex items-center gap-2 text-xs">
            <span className={getStatusColor(queueStatus.pending.length, 'pending')}>
              {queueStatus.pending.length} pendientes
            </span>
            {queueStatus.error.length > 0 && (
              <span className={getStatusColor(queueStatus.error.length, 'error')}>
                {queueStatus.error.length} errores
              </span>
            )}
          </div>
        </div>

        {/* Icono expandir/contraer */}
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="border-t border-[#3d4659] p-4 space-y-4">
          {/* Estadísticas detalladas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-[#1e2538] rounded-lg border border-[#3d4659]">
              <div className="text-2xl font-bold text-yellow-400">{queueStatus.pending.length}</div>
              <div className="text-xs text-gray-400">Pendientes</div>
            </div>
            <div className="text-center p-3 bg-[#1e2538] rounded-lg border border-[#3d4659]">
              <div className="text-2xl font-bold text-green-400">{queueStatus.completed.length}</div>
              <div className="text-xs text-gray-400">Completados</div>
            </div>
            <div className="text-center p-3 bg-[#1e2538] rounded-lg border border-[#3d4659]">
              <div className="text-2xl font-bold text-red-400">{queueStatus.error.length}</div>
              <div className="text-xs text-gray-400">Errores</div>
            </div>
          </div>

          {/* Botón de procesamiento manual */}
          {isOnline && queueStatus.pending.length > 0 && (
            <button
              onClick={processOfflineQueue}
              className="w-full py-2 px-4 bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1e2538] font-semibold rounded-lg hover:from-[#b8934a] hover:to-[#e1b876] transition-all duration-200 transform hover:scale-[1.02]"
            >
              Procesar Cola Manualmente
            </button>
          )}

          {/* Lista de formularios pendientes */}
          {queueStatus.pending.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-300">Formularios Pendientes:</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {queueStatus.pending.map((form) => (
                  <div key={form.id} className="flex items-center gap-3 p-2 bg-[#1e2538] rounded border border-[#3d4659]">
                    {getStatusIcon(form.status)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">
                        {form.formType === 'revision' ? 'Revisión' : 'Nota'} - {form.data.casita || 'Sin casita'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(form.timestamp).toLocaleString()}
                      </div>
                    </div>
                    {form.retryCount > 0 && (
                      <div className="text-xs text-yellow-400">
                        Reintento {form.retryCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de errores */}
          {queueStatus.error.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-400">Formularios con Error:</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {queueStatus.error.map((form) => (
                  <div key={form.id} className="flex items-center gap-3 p-2 bg-red-900/20 rounded border border-red-500/30">
                    {getStatusIcon(form.status)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">
                        {form.formType === 'revision' ? 'Revisión' : 'Nota'} - {form.data.casita || 'Sin casita'}
                      </div>
                      <div className="text-xs text-red-400 truncate">
                        {form.lastError || 'Error desconocido'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(form.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información offline */}
          {!isOnline && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Sin conexión - Los formularios se enviarán automáticamente cuando se restaure la conexión
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 