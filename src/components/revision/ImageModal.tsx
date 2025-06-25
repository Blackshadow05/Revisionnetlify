import React, { useRef, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageModal({ isOpen, imageUrl, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management para accesibilidad
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Manejo de tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Imagen ampliada"
      ref={modalRef}
      tabIndex={-1}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Botón cerrar - SIEMPRE VISIBLE en esquina superior derecha */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 w-12 h-12 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20"
        title="Cerrar (Escape)"
        aria-label="Cerrar modal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Imagen centrada - sin controles ni texto */}
      <img
        src={imageUrl}
        alt="Imagen ampliada"
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        style={{
          maxWidth: 'calc(100vw - 2rem)',
          maxHeight: 'calc(100vh - 2rem)'
        }}
      />
    </div>
  );
} 