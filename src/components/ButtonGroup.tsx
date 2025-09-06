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
  persistSelection?: boolean; // Mantiene el estado seleccionado hasta reset
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
  iconType, // Ya no tiene valor por defecto
  persistSelection = false // Mantiene el estado seleccionado
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
      <label className="block text-sm font-bold text-[#ff8c42]">
        {getIcon()}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex flex-wrap gap-3 p-4 rounded-xl" style={{
        background: 'linear-gradient(to left, #334d50, #2a3347)',
        border: '1px solid rgba(201, 164, 92, 0.2)',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        {options.map(option => {
          const isSelected = selectedValue === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`
                px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-300
                transform hover:scale-105 active:scale-95
                ${
                  isSelected 
                    ? 'bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1e2538] shadow-lg' 
                    : 'bg-[#2a3347]/50 text-white/90 hover:bg-[#334d50]/70 border border-[#c9a45c]/20'
                }
                min-w-[60px] focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50
              `}
              aria-pressed={isSelected}
            >
              <span className="flex items-center justify-center gap-2">
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}