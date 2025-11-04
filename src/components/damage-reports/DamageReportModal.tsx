'use client';

import { useState } from 'react';
import { DamageReport } from '@/types/damage-report';
import { useAuth } from '@/context/AuthContext';

interface DamageReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated: (report: DamageReport) => void;
}

export default function DamageReportModal({ isOpen, onClose, onReportCreated }: DamageReportModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    assignedTo: '',
    tags: ''
  });

  const categories = [
    'Equipamiento',
    'Infraestructura',
    'HVAC',
    'Eléctrico',
    'Plomería',
    'Seguridad',
    'Otros'
  ];

  const priorities = [
    { value: 'Low', label: 'Baja', color: 'text-green-400' },
    { value: 'Medium', label: 'Media', color: 'text-yellow-400' },
    { value: 'High', label: 'Alta', color: 'text-orange-400' },
    { value: 'Critical', label: 'Crítica', color: 'text-red-400' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.category || !formData.location) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const newReport: DamageReport = {
        id: Date.now().toString(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim(),
        priority: formData.priority,
        status: 'Open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reporter: user || 'Usuario Anónimo',
        assignedTo: formData.assignedTo.trim() || undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };

      onReportCreated(newReport);
      setFormData({
        title: '',
        description: '',
        category: '',
        location: '',
        priority: 'Medium',
        assignedTo: '',
        tags: ''
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Nuevo Reporte de Daño</h2>
                <p className="text-sm text-gray-400">Crear un nuevo reporte de incidencia</p>
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
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Título del Reporte *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Describe brevemente el daño..."
                className="w-full px-4 py-3 bg-[#4a5367]/50 border border-[#c9a45c]/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-transparent transition-all duration-200 text-base min-h-[48px]"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción Detallada *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe en detalle el daño, cuándo ocurrió, qué lo causó..."
                rows={4}
                className="w-full px-4 py-3 bg-[#4a5367]/50 border border-[#c9a45c]/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-transparent transition-all duration-200 resize-none text-base min-h-[120px]"
                required
              />
            </div>

            {/* Category and Location - Stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-[#4a5367]/50 border border-[#c9a45c]/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-transparent transition-all duration-200 text-base min-h-[48px]"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ubicación *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Ej: Línea de Producción 2"
                  className="w-full px-4 py-3 bg-[#4a5367]/50 border border-[#c9a45c]/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-transparent transition-all duration-200 text-base min-h-[48px]"
                  required
                />
              </div>
            </div>

            {/* Priority and Assigned To - Stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prioridad
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {priorities.map(priority => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => handleChange('priority', priority.value)}
                      className={`px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-[48px] ${
                        formData.priority === priority.value
                          ? 'bg-[#c9a45c] text-white'
                          : 'bg-[#4a5367]/50 text-gray-300 hover:bg-[#4a5367]'
                      }`}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Asignar a (opcional)
                </label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) => handleChange('assignedTo', e.target.value)}
                  placeholder="Nombre del responsable"
                  className="w-full px-4 py-3 bg-[#4a5367]/50 border border-[#c9a45c]/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-transparent transition-all duration-200 text-base min-h-[48px]"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Etiquetas (opcional)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                placeholder="ej: urgente, producción, línea2 (separadas por comas)"
                className="w-full px-4 py-3 bg-[#4a5367]/50 border border-[#c9a45c]/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-transparent transition-all duration-200 text-base min-h-[48px]"
              />
              <p className="text-xs text-gray-400 mt-1">
                Separa las etiquetas con comas para facilitar la búsqueda
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
                disabled={isSubmitting || !formData.title.trim() || !formData.description.trim() || !formData.category || !formData.location}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-[#c9a45c] text-white font-semibold rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.1)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Crear Reporte</span>
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