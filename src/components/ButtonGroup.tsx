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
      <label className="block text-base font-semibold bg-black/40 text-white px-3 py-1 rounded-lg shadow-sm flex items-center gap-2">
        {getIcon()}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {/* Contenedor de botones: wrap para ajustarse a pantallas pequeñas */}
      <div
        className={`flex flex-wrap gap-2 ${
          highlight ?
            'border-2 border-[#00ff00] shadow-green-500/50 shadow-lg p-2 rounded-xl backdrop-blur-sm' : ''
        }`}
      >
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`
              px-5 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] min-w-[72px]
              ${selectedValue === option
                ? 'bg-gradient-to-br from-[#c9a45c] to-[#f0c987] text-[#1a1f35] border-[#c9a45c]/60 shadow-lg'
                : 'bg-[#1e2538]/70 text-white border-[#3d4659]/40 hover:bg-[#2a3347]/80 hover:border-[#3d4659]/60 hover:text-gray-100'
              }
            `}
            aria-pressed={selectedValue === option}
          >
            <span className="flex items-center justify-center gap-1.5">
              {/* Icono de check para opción seleccionada */}
              {selectedValue === option && (
                <svg className="w-3.5 h-3.5 text-[#1a1f35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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