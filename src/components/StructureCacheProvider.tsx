'use client';

import { useEffect } from 'react';

export default function StructureCacheProvider() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerStructureServiceWorker();
    }
  }, []);

  return null; // Componente invisible
}

async function registerStructureServiceWorker() {
  try {
    // Verificar si ya está registrado el SW de estructura
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    
    if (existingRegistration) {
      // Desregistrar service worker anterior
      await existingRegistration.unregister();
      console.log('🗑️ Service Worker anterior desregistrado');
    }
    
    // Registrar nuevo service worker para caché permanente
    const registration = await navigator.serviceWorker.register('/sw-structure.js', {
      scope: '/',
      updateViaCache: 'none' // No actualizar desde caché
    });
    
    console.log('📦 Service Worker de estructura registrado:', registration);
    
    // Configurar caché permanente
    setupPermanentCache();
    
    // Escuchar actualizaciones
    registration.addEventListener('updatefound', () => {
      console.log('🔄 Nueva versión del service worker disponible');
    });
    
  } catch (error) {
    console.error('❌ Error registrando service worker de estructura:', error);
  }
}

async function setupPermanentCache() {
  try {
    // Limpiar caché de datos dinámicos pero mantener estructura
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        // Mantener caché de estructura permanente
        if (cacheName.includes('structure-permanent')) {
          console.log('📦 Caché de estructura permanente conservado:', cacheName);
          continue;
        }
        
        // Limpiar caché de datos dinámicos
        if (cacheName.includes('data') || cacheName.includes('dynamic')) {
          await caches.delete(cacheName);
          console.log('🗑️ Caché de datos eliminado:', cacheName);
        }
      }
    }
    
    // Configurar almacenamiento persistente
    if ('storage' in navigator && 'persist' in navigator.storage) {
      const isPersisted = await navigator.storage.persist();
      console.log('🔒 Almacenamiento persistente:', isPersisted ? 'activado' : 'no activado');
    }
    
  } catch (error) {
    console.error('❌ Error configurando caché permanente:', error);
  }
}

// Función para limpiar caché de datos manualmente
export async function clearDataCache() {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        if (cacheName.includes('data') || cacheName.includes('temp')) {
          await caches.delete(cacheName);
          console.log('🗑️ Caché de datos limpiado:', cacheName);
        }
      }
    }
    
    // Limpiar también datos de IndexedDB si existen
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name && !db.name.includes('structure')) {
        indexedDB.deleteDatabase(db.name);
        console.log('🗑️ Base de datos eliminada:', db.name);
      }
    }
    
  } catch (error) {
    console.error('❌ Error limpiando caché de datos:', error);
  }
}

// Función para verificar estado del caché
export async function getCacheStatus() {
  try {
    const status = {
      structure: 0,
      static: 0,
      data: 0,
      total: 0
    };
    
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        status.total += keys.length;
        
        if (cacheName.includes('structure-permanent')) {
          status.structure += keys.length;
        } else if (cacheName.includes('static')) {
          status.static += keys.length;
        } else {
          status.data += keys.length;
        }
      }
    }
    
    return status;
  } catch (error) {
    console.error('❌ Error obteniendo estado del caché:', error);
    return { structure: 0, static: 0, data: 0, total: 0 };
  }
}

// Limpiar caché de datos periódicamente
setInterval(async () => {
  await clearDataCache();
}, 24 * 60 * 60 * 1000); // Cada 24 horas
