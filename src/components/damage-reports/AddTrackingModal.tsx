'use client';

import { useState } from 'react';
import { DamageReportTracking } from '@/types/damage-report';
import { useAuth } from '@/context/AuthContext';

interface AddTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackingAdded: (tracking: DamageReportTracking) => void;
  currentStatus: string;
}

export default function AddTrackingModal({ isOpen, onClose, onTrackingAdded, currentStatus }: AddTrackingModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    status: currentStatus,
    comment: ''
  });

  const statuses = [
    { value: 'Open', label: 'Abierto', color: 'text-red-300' },
    { value: 'In Progress', label: 'En Progreso', color: 'text-yellow-300' },
    { value: 'Resolved', label: 'Resuelto', color: 'text-green-300' },
    { value: 'Closed', label: 'Cerrado', color: 'text-gray-300' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.comment.trim()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const newTracking: DamageReportTracking = {
        id: Date.now().toString(),
        reportId: '', // This would be provided by the parent component
        status: formData.status as any,
        comment: formData.comment.trim(),
        createdBy: user || 'Usuario Anónimo',
        createdAt: new Date().toISOString()
      };

      onTrackingAdded(newTracking);
      setFormData({
        status: currentStatus,
        comment: ''
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-auto bg-gradient-to-br from-[#2a3347]/95 via-[#3a4357]/90 to-[#1a1f35]/95 backdrop-blur-xl rounded-2xl border border-[#c9a45c]/20 shadow-[0_0_40px_rgba(201,164,92,0.3)] max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#c9a45c]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#c9a45c] rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Agregar Seguimiento</h2>
                <p className="text-sm text-gray-400">Añadir nueva actualización al reporte</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 bg-[#4a5367] rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200 min-w-[44px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Estado del Reporte *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {statuses.map(status => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleChange('status', status.value)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border min-h-[48px] ${
                      formData.status === status.value
                        ? 'bg-[#c9a45c] text-white border-[#c9a45c]'
                        : 'bg-[#4a5367]/50 text-gray-300 border-[#c9a45c]/20 hover:bg-[#4a5367] hover:border-[#c9a45c]/40'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comentario de Seguimiento *
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => handleChange('comment', e.target.value)}
                placeholder="Describe las acciones realizadas, el progreso actual, o cualquier información relevante..."
                rows={6}
                className="w-full px-4 py-3 bg-[#4a5367]/50 border border-[#c9a45c]/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-transparent transition-all duration-200 resize-none text-base min-h-[120px]"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Proporciona detalles específicos sobre el progreso, problemas encontrados, o próximos pasos
              </p>
            </div>

            {/* Current Status Info */}
            <div className="bg-[#4a5367]/30 rounded-xl p-4 border border-[#c9a45c]/10">
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#c9a45c]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <span className="text-sm font-medium text-gray-300">Estado Actual</span>
              </div>
              <p className="text-sm text-gray-400">
                El reporte actualmente está en estado "<strong className="text-white">{statuses.find(s => s.value === currentStatus)?.label}</strong>".
                {formData.status !== currentStatus && (
                  <span className="text-[#c9a45c] ml-1">
                    Al guardar, cambiará a "{statuses.find(s => s.value === formData.status)?.label}".
                  </span>
                )}
              </p>
            </div>

            {/* Form Actions - Mobile optimized */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end pt-6 border-t border-[#c9a45c]/20">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 text-gray-400 hover:text-white transition-colors duration-200 min-h-[48px] sm:min-h-0"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !formData.comment.trim()}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-[#c9a45c] text-white font-semibold rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.1)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Agregar Seguimiento</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}