'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Interfaces para el cache de revisiones
interface CachedRevisionesData {
  data: any[];
  timestamp: number;
  expiresAt: number;
}

interface RevisionesCacheConfig {
  cacheKey: string;
  expirationTime: number; // en milisegundos
  backgroundRefresh: boolean;
}

const DEFAULT_EXPIRATION = 5 * 60 * 1000; // 5 minutos
const REVISIONES_CACHE_PREFIX = 'revisiones_cache_';

// Hook personalizado para cache de revisiones
export function useRevisionesCache(
  config: RevisionesCacheConfig,
  fetchFunction: () => Promise<any[]>
) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const cacheKey = `${REVISIONES_CACHE_PREFIX}${config.cacheKey}`;

  // Función para obtener datos del cache
  const getCachedData = useCallback((): CachedRevisionesData | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsedCache: CachedRevisionesData = JSON.parse(cached);

      // Verificar si el cache ha expirado
      if (Date.now() > parsedCache.expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsedCache;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }, [cacheKey]);

  // Función para guardar datos en cache
  const setCachedData = useCallback((data: any[]) => {
    try {
      const cacheData: CachedRevisionesData = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + config.expirationTime
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, [cacheKey, config.expirationTime]);

  // Función para limpiar cache específico
  const clearCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
    setData(null);
    setIsFromCache(false);
  }, [cacheKey]);

  // Función para cargar datos (con cache)
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Si no se fuerza refresh, intentar usar cache
      if (!forceRefresh) {
        const cachedData = getCachedData();
        if (cachedData) {
          setData(cachedData.data);
          setIsFromCache(true);
          setLoading(false);

          // Si está habilitado el refresh en background, actualizar datos silenciosamente
          if (config.backgroundRefresh) {
            fetchFunction()
              .then(freshData => {
                setCachedData(freshData);
                setData(freshData);
                setIsFromCache(false);
              })
              .catch(err => console.warn('Background refresh failed:', err));
          }

          return;
        }
      }

      // Obtener datos frescos
      const freshData = await fetchFunction();
      setData(freshData);
      setCachedData(freshData);
      setIsFromCache(false);

    } catch (err) {
      const errorMessage = 'Error al cargar revisiones';
      setError(errorMessage);
      console.error('Error loading revisiones:', err);

      // Intentar usar cache como fallback si hay error
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData.data);
        setIsFromCache(true);
        setError(null); // No mostrar error si hay cache disponible
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, getCachedData, setCachedData, config.backgroundRefresh]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Función para refresh manual
  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  return {
    data,
    loading,
    error,
    isFromCache,
    lastUpdated,
    refresh,
    clearCache
  };
}

// Hook específico para revisiones
export function useRevisiones() {
  const fetchRevisionesData = useCallback(async () => {
    // Cargar todos los registros en lotes para evitar límites
    let allData: any[] = [];
    let start = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from('revisiones_casitas')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, start + batchSize - 1);
      
      if (error) {
        console.error('Error fetching paginated data:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        start += batchSize;
        // Si el lote tiene menos registros que el tamaño del lote, ya no hay más datos
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    console.log(`📊 Revisiones: Obtenidos ${allData.length} registros`);
    return allData;
  }, []);

  return useRevisionesCache(
    {
      cacheKey: 'revisiones_list',
      expirationTime: DEFAULT_EXPIRATION,
      backgroundRefresh: true
    },
    fetchRevisionesData
  );
}

// Utilidad para limpiar todo el cache de revisiones
export function clearAllRevisionesCache() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(REVISIONES_CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

// Utilidad para limpiar cache específico de revisiones
export function clearRevisionesListCache() {
  localStorage.removeItem(`${REVISIONES_CACHE_PREFIX}revisiones_list`);
}
