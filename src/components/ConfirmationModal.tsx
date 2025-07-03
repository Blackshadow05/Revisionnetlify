'use client';

import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
}

export default function ConfirmationModal({
  isOpen,
  message,
  onConfirm,
  onCancel,
  title = 'Confirmar Acción'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-800 rounded-xl border border-gray-700 p-6 shadow-xl">
        <div className="text-center">
          {/* Icono de advertencia */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <svg 
              className="h-6 w-6 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth="1.5" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" 
              />
            </svg>
          </div>
          
          {/* Título */}
          <h3 className="text-lg font-medium text-white mb-2">
            {title}
          </h3>
          
          {/* Mensaje */}
          <p className="text-gray-300 text-sm mb-6">
            {message}
          </p>
          
          {/* Botones */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 