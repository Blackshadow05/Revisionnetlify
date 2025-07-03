'use client';

import { useEffect } from 'react';
import { detectChrome, applyChromeCompatibilityFixes, debugChromeCompatibility } from '@/utils/chromeDetection';

/**
 * 🌐 CHROME COMPATIBILITY FIX
 * Soluciona problemas específicos de Chrome con hydratación
 * Maneja extensiones, timing y DOM mutations
 */
export default function ChromeCompatibilityFix() {
  useEffect(() => {
    // 🔍 Detectar Chrome y obtener información detallada
    const chromeInfo = detectChrome();
    
    if (!chromeInfo.isChrome) return;

    console.log('🌐 Chrome detectado - Aplicando fixes de compatibilidad');
    
    // Aplicar todos los fixes de compatibilidad
    applyChromeCompatibilityFixes(chromeInfo);
    
    // Debug en desarrollo
    if (process.env.NODE_ENV === 'development') {
      debugChromeCompatibility();
    }

    // Los fixes se aplican automáticamente en applyChromeCompatibilityFixes
    // No necesitamos duplicar la lógica aquí
  }, []);

  return null; // Este componente no renderiza nada
}

/**
 * 🎯 HOOK PARA DETECTAR CHROME Y APLICAR FIXES
 */
export function useChromeCompatibility() {
  useEffect(() => {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    
    if (isChrome) {
      // Aplicar estilos específicos para Chrome
      document.documentElement.classList.add('chrome-browser');
      
      // Fix para problemas de rendering en Chrome
      document.documentElement.style.setProperty('--chrome-fix', '1');
    }
    
    return () => {
      if (isChrome) {
        document.documentElement.classList.remove('chrome-browser');
        document.documentElement.style.removeProperty('--chrome-fix');
      }
    };
  }, []);
} 