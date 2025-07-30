'use client';

import { useState, useEffect } from 'react';


interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (options: string[], message: string) => void;
  images: File[];
  casita: string;
  cajaFuerte: string;
  isLoading: boolean;
}

const shareOptions = [
  'No hay bulto',
  'No hay yute',
  'No hay sombrero',
  'No hay bolsa secadora',
  'Solo hay un yute',
  'Completa',
  'Incompleta'
];

export default function ShareModal({ 
  isOpen, 
  onClose, 
  onShare, 
  images, 
  casita,
  cajaFuerte,
  isLoading 
}: ShareModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    if (isOpen && casita && cajaFuerte) {
      const defaultMessage = `${cajaFuerte} ${casita}`;
      setCustomMessage(defaultMessage);
    }
  }, [isOpen, casita, cajaFuerte]);

  const handleOptionToggle = (option: string) => {
    setSelectedOptions(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const handleShare = () => {
    onShare(selectedOptions, customMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Compartir Revisión</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de revisión:
              </label>
              <div className="space-y-2">
                {shareOptions.map((option) => (
                  <label key={option} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(option)}
                      onChange={() => handleOptionToggle(option)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje adicional:
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] resize-none"
                placeholder="Agrega un mensaje personalizado..."
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {customMessage.length}/500 caracteres
              </div>
            </div>

            {images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes a compartir ({images.length}):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Evidencia ${index + 1}`}
                        className="w-full h-full object-cover"
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleShare}
                disabled={isLoading || images.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Compartiendo...' : 'Compartir en WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
