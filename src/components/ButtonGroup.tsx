'use client';

import React from 'react';
import { getCustomIconForLabel } from './CustomIcons';
import { getIconTypeForField } from '../config/iconConfig';

interface ButtonGroupProps {
  label: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  required?: boolean;
  highlight?: boolean;
  iconType?: 'emoji' | 'custom'; // Opcional - si no se especifica, usa la configuración global
}

// Función para obtener el emoji apropiado según el label
const getEmojiForLabel = (label: string) => {
  const labelLower = label.toLowerCase();
  
  if (labelLower.includes('caja fuerte') || labelLower.includes('guardado')) {
    return <span className="text-lg">🔒</span>; // Candado
  }
  
  if (labelLower.includes('chromecast') || labelLower.includes('controles tv')) {
    return <span className="text-lg">📺</span>; // TV
  }
  
  if (labelLower.includes('binoculares')) {
    return <span className="text-lg">🔭</span>; // Telescopio/Binoculares
  }
  
  if (labelLower.includes('trapo')) {
    return <span className="text-lg">🧽</span>; // Esponja/Trapo
  }
  
  // USB Speaker - Rayo para conexión USB
  if (labelLower.includes('usb speaker')) {
    return <span className="text-lg">⚡</span>; // Rayo/Conexión USB
  }
  
  if (labelLower.includes('speaker') && !labelLower.includes('usb')) {
    return <span className="text-lg">🔊</span>; // Altavoz
  }
  
  // Secadora - icono anterior
  if (labelLower.includes('secadora')) {
    return <span className="text-lg">🌀</span>; // Remolino/Secadora
  }
  
  if (labelLower.includes('steamer') || labelLower.includes('plancha')) {
    return <span className="text-lg">🔥</span>; // Fuego/Vapor
  }
  
  if (labelLower.includes('bolsa vapor')) {
    return <span className="text-lg">💨</span>; // Vapor
  }
  
  if (labelLower.includes('plancha cabello')) {
    return <span className="text-lg">💇‍♀️</span>; // Peluquería
  }
  
  if (labelLower.includes('cama') || labelLower.includes('ordenada')) {
    return <span className="text-lg">🛏️</span>; // Cama
  }
  
  if (labelLower.includes('bolsa') || labelLower.includes('bolso')) {
    return <span className="text-lg">👜</span>; // Bolso
  }
  
  if (labelLower.includes('bulto')) {
    return <span className="text-lg">🎒</span>; // Mochila
  }
  
  if (labelLower.includes('sombrero')) {
    return <span className="text-lg">👒</span>; // Sombrero
  }
  
  if (labelLower.includes('cola') || labelLower.includes('cabello')) {
    return <span className="text-lg">✨</span>; // Brillo/Estrella
  }
  
  if (labelLower.includes('bolso yute')) {
    return <span className="text-lg">🛍️</span>; // Bolsa de compras
  }
  
  // Icono por defecto
  return <span className="text-lg">✅</span>; // Check verde
};

export default function ButtonGroup({ 
  label, 
  options, 
  selectedValue, 
  onSelect, 
  required = false, 
  highlight = false,
  iconType // Ya no tiene valor por defecto
}: ButtonGroupProps) {
  
  // Función para obtener el icono según el tipo seleccionado
  const getIcon = () => {
    // Si no se especifica iconType, usa la configuración global
    const finalIconType = iconType || getIconTypeForField(label);
    
    if (finalIconType === 'custom') {
      return getCustomIconForLabel(label);
    }
    return getEmojiForLabel(label);
  };

  return (
    <div className="space-y-3">
      <label className="block text-base font-semibold text-[#ff8c42] flex items-center gap-2">
        {getIcon()}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className={`flex flex-wrap gap-3 ${highlight ? 'animate-pulse border-2 border-[#00ff00] shadow-green-500/50 shadow-lg p-3 rounded-xl backdrop-blur-sm' : ''}`}>
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`
              px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.02] min-w-[60px]
              ${selectedValue === option
                ? 'bg-gradient-to-br from-pink-500 to-orange-400 text-white border-pink-300/40 shadow-orange-500/25 shadow-lg'
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#ff8c42]/50 hover:text-[#ff8c42] hover:bg-[#ff8c42]/5 shadow-gray-100'
              }
            `}
          >
            <span className="flex items-center justify-center gap-1.5">
              {/* Icono de check para opción seleccionada */}
              {selectedValue === option && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {option}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
} 