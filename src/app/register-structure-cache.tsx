'use client';

import { useEffect } from 'react';

export function RegisterStructureCache() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 1) Registrar/actualizar el SW de estructura
      registerStructureServiceWorker();

      // 2) Forzar toma de control inmediata cuando haya un nuevo controlador
      // Evita bucles de recarga con un flag por sesión
      let hasReloadedForSWUpdate = false;

      const onControllerChange = () => {
        if (hasReloadedForSWUpdate) return;
        hasReloadedForSWUpdate = true;

        // Solo recargar si la página está visible para evitar UX brusco en background
        if (document.visibilityState === 'visible') {
          console.log('🔄 Nuevo Service Worker controlador activo. Recargando para aplicar actualización inmediata...');
          location.reload();
        } else {
          // Si no está visible, esperar a que vuelva a estarlo
          const onVisible = () => {
            document.removeEventListener('visibilitychange', onVisible);
            console.log('🔄 Página visible. Recargando para aplicar actualización de Service Worker...');
            location.reload();
          };
          document.addEventListener('visibilitychange', onVisible);
        }
      };

      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

      // Cleanup al desmontar
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      };
    }
  }, []);

  return null;
}

async function registerStructureServiceWorker() {
  try {
    // Verificar si ya está registrado
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    
    if (existingRegistration &&
        existingRegistration.active &&
        existingRegistration.active.scriptURL.includes('sw-structure.js')) {
      console.log('📦 Service Worker de estructura ya registrado');

      // Si hay una waiting, forzar que tome control inmediatamente
      if (existingRegistration.waiting) {
        console.log('⏭️ SW en estado waiting detectado. Enviando SKIP_WAITING para activar de inmediato...');
        existingRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      return;
    }

    // Desregistrar service worker anterior si existe
    if (existingRegistration) {
      await existingRegistration.unregister();
      console.log('🗑️ Service Worker anterior desregistrado');
    }

    // Registrar nuevo service worker para caché permanente
    const registration = await navigator.serviceWorker.register('/sw-structure.js', {
      scope: '/',
      updateViaCache: 'none'
    });

    console.log('📦 Service Worker de estructura registrado exitosamente');

    // Si hay un nuevo SW en installing o waiting, adelantar su activación
    if (registration.installing) {
      registration.installing.addEventListener('statechange', () => {
        if (registration.waiting) {
          console.log('⏭️ Enviando SKIP_WAITING al SW (statechange->waiting)...');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    } else if (registration.waiting) {
      console.log('⏭️ Enviando SKIP_WAITING al SW (waiting inmediato)...');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // También intentar update y forzar skipWaiting en caso de que llegue a waiting luego
      registration.update().catch(() => {});
    }

    // Configurar almacenamiento persistente
    if ('storage' in navigator && 'persist' in navigator.storage) {
      const isPersisted = await navigator.storage.persist();
      console.log('🔒 Almacenamiento persistente:', isPersisted ? 'activado' : 'no activado');
    }

    // Limpiar caché de datos dinámicos al inicio
    await cleanupDataCache();

    // Configurar limpieza automática cada 6 horas
    setupAutoCleanup();

  } catch (error) {
    console.error('❌ Error registrando service worker de estructura:', error);
  }
}

async function cleanupDataCache() {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        // Mantener caché de estructura permanente
        if (cacheName.includes('structure-permanent') ||
            cacheName.includes('static-permanent')) {
          console.log('📦 Caché de estructura conservado:', cacheName);
          continue;
        }

        // Limpiar caché de datos dinámicos
        await caches.delete(cacheName);
        console.log('🗑️ Caché de datos eliminado:', cacheName);
      }
    }

    // Limpiar IndexedDB de datos dinámicos
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name && !db.name.includes('structure')) {
          indexedDB.deleteDatabase(db.name);
          console.log('🗑️ Base de datos eliminada:', db.name);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error limpiando caché:', error);
  }
}

function setupAutoCleanup() {
  // Limpiar cada 6 horas
  setInterval(async () => {
    await cleanupDataCache();
  }, 6 * 60 * 60 * 1000);

  // Limpiar al cambiar de página
  window.addEventListener('beforeunload', cleanupDataCache);
}

// Función para verificar estado del caché
export async function getCacheStatus() {
  try {
    const status = {
      structure: 0,
      static: 0,
      data: 0,
      total: 0,
      databases: 0
    };

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        status.total += keys.length;
        
        if (cacheName.includes('structure-permanent')) {
          status.structure += keys.length;
        } else if (cacheName.includes('static-permanent')) {
          status.static += keys.length;
        } else {
          status.data += keys.length;
        }
      }
    }

    if ('indexedDB' in window) {
      const databases = await indexedDB.databases();
      status.databases = databases.length;
    }

    return status;
  } catch (error) {
    console.error('❌ Error obteniendo estado del caché:', error);
    return { structure: 0, static: 0, data: 0, total: 0, databases: 0 };
  }
}

// Función para limpieza manual
export async function clearAllDataCache() {
  try {
    await cleanupDataCache();
    console.log('🧹 Limpieza de caché de datos completada');
  } catch (error) {
    console.error('❌ Error en limpieza manual:', error);
  }
}
