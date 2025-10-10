'use client';
import { useToast } from '@/context/ToastContext';
import { useEffect } from 'react';

export default function UpdateNotifier() {
  const { showToast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Verificar actualización al cargar la página
      navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) return;
        
        // Obtener versión actual de localStorage
        const currentVersion = localStorage.getItem('sw_version') || '0';
        
        // Si hay un service worker esperando, y es una nueva versión
        if (reg.waiting && reg.waiting.scriptURL.includes(currentVersion) === false) {
          // Extraer versión del scriptURL (ej: sw-unified.js?v=2024.10.10.002)
          const versionMatch = reg.waiting.scriptURL.match(/v=([^&]+)/);
          const newVersion = versionMatch ? versionMatch[1] : 'nueva';
          
          // Auto-actualización sin mensaje de confirmación
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          // Actualizar versión en localStorage
          localStorage.setItem('sw_version', newVersion);
          showToast('Actualizando a nueva versión...', 'info');
        }
        
        // Escuchar futuras actualizaciones
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Extraer versión del nuevo worker
                const versionMatch = newWorker.scriptURL.match(/v=([^&]+)/);
                const newVersion = versionMatch ? versionMatch[1] : 'nueva';
                
                // Solo mostrar si es una versión nueva
                if (newVersion !== localStorage.getItem('sw_version')) {
                  // Auto-actualización sin mensaje de confirmación
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  localStorage.setItem('sw_version', newVersion);
                  showToast('Actualizando a nueva versión...', 'info');
                }
              }
            });
          }
        });
      });
    }
  }, [showToast]);

  return null;
}