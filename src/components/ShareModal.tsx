'use client';

import { useState, useEffect } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (message: string) => Promise<void>;
  images: File[];
  casita: string;
  cajaFuerte: string;
  initialMessage: string;
  isLoading?: boolean;
}

export default function ShareModal({
  isOpen,
  onClose,
  images,
  casita,
  cajaFuerte,
  initialMessage,
  onShare,
  isLoading = false,
}: ShareModalProps) {
  const [customMessage, setCustomMessage] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialMessage) {
      setCustomMessage(initialMessage);
    } else if (casita && cajaFuerte) {
      setCustomMessage(`${cajaFuerte} ${casita}`);
    }
  }, [isOpen, initialMessage, casita, cajaFuerte]);

  const handleShare = () => {
    const messageWithDate = `${customMessage.trim()}\n\n📅 ${new Date(checkInDate).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })}`;
    onShare(messageWithDate);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-lg">
        <div className="space-y-4 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">📸 Compartir evidencia</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Casita identifier */}
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-center text-lg font-bold text-blue-900">
              {cajaFuerte} {casita}
            </p>
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <label htmlFor="checkin-date" className="block text-sm font-medium text-gray-700">
              📅 Fecha de check in:
            </label>
            <div className="relative">
              <input
                id="checkin-date"
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Custom message */}
          <div>
            <label htmlFor="custom-message" className="mb-2 block text-sm font-medium text-gray-700">
              Mensaje adicional:
            </label>
            <textarea
              id="custom-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="min-h-[80px] w-full resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Agrega un mensaje personalizado..."
              maxLength={500}
            />
            <div className="mt-1 text-xs text-gray-500">
              {customMessage.length}/500 caracteres
            </div>
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Imágenes a compartir ({images.length}):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Evidencia ${index + 1}`}
                      className="h-full w-full object-cover"
                      onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={isLoading || images.length === 0}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Compartiendo...' : 'Compartir en WhatsApp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
