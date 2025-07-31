'use client';

import { useEffect, useCallback } from 'react';

export function useStructureCache() {
  // Limpiar caché de datos dinámicos pero mantener estructura
  const clearDataCache = useCallback(async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        
        for (const cacheName of cacheNames) {
          // Mantener caché de estructura permanente
          if (cacheName.includes('structure-permanent') || 
              cacheName.includes('static-permanent')) {
            continue;
          }
          
          // Limpiar caché de datos dinámicos
          await caches.delete(cacheName);
        }
      }
      
      console.log('🗑️ Caché de datos dinámicos limpiado');
    } catch (error) {
      console.error('❌ Error limpiando caché de datos:', error);
    }
  }, []);

  // Cachear estructura de página permanentemente
  const cachePageStructure = useCallback(async (url: string) => {
    try {
      if ('caches' in window) {
        const cache = await caches.open('revision-structure-permanent-v1');
        
        // Verificar si ya está cacheada
        const cached = await cache.match(url);
        if (cached) {
          console.log('📦 Estructura ya cacheada:', url);
          return;
        }
        
        // Cachear estructura
        const response = await fetch(url);
        if (response.ok) {
          cache.put(url, response);
          console.log('📦 Estructura cacheada permanentemente:', url);
        }
      }
    } catch (error) {
      console.error('❌ Error cacheando estructura:', error);
    }
  }, []);

  // Verificar si la estructura está cacheada
  const isStructureCached = useCallback(async (url: string): Promise<boolean> => {
    try {
      if ('caches' in window) {
        const cache = await caches.open('revision-structure-permanent-v1');
        const cached = await cache.match(url);
        return !!cached;
      }
    } catch (error) {
      console.error('❌ Error verificando caché de estructura:', error);
    }
    return false;
  }, []);

  // Obtener estado del caché
  const getCacheStatus = useCallback(async () => {
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
          } else if (cacheName.includes('static-permanent')) {
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
  }, []);

  // Limpiar caché de datos periódicamente
  const scheduleDataCleanup = useCallback(() => {
    // Limpiar cada 6 horas
    const interval = setInterval(async () => {
      await clearDataCache();
    }, 6 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [clearDataCache]);

  return {
    clearDataCache,
    cachePageStructure,
    isStructureCached,
    getCacheStatus,
    scheduleDataCleanup
  };
}

// Hook específico para la página de detalles
export function useDetailsPageCache(revisionId: string) {
  const { 
    cachePageStructure, 
    isStructureCached, 
    clearDataCache,
    getCacheStatus 
  } = useStructureCache();

  const detailsUrl = `/detalles/${revisionId}`;

  // Cachear estructura al montar
  useEffect(() => {
    const cacheStructure = async () => {
      // No cachear datos dinámicos, solo estructura base
      const isCached = await isStructureCached('/detalles/[id]');
      if (!isCached) {
        await cachePageStructure('/detalles/[id]');
      }
    };

    cacheStructure();
  }, [cachePageStructure, isStructureCached]);

  // Limpiar caché de datos al desmontar
  useEffect(() => {
    return () => {
      clearDataCache();
    };
  }, [clearDataCache]);

  // Verificar estado del caché
  const checkCache = async () => {
    const status = await getCacheStatus();
    console.log('📊 Estado del caché:', status);
    return status;
  };

  return {
    checkCache,
    isStructureCached: () => isStructureCached('/detalles/[id]')
  };
}
