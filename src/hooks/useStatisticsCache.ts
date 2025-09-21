'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Interfaces para el cache de estadísticas
interface CachedStatisticsData {
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface StatisticsCacheConfig {
  cacheKey: string;
  expirationTime: number; // en milisegundos
  backgroundRefresh: boolean;
}

const DEFAULT_EXPIRATION = 5 * 60 * 1000; // 5 minutos
const STATISTICS_CACHE_PREFIX = 'stats_cache_';

// Hook personalizado para cache de estadísticas
export function useStatisticsCache<T>(
  config: StatisticsCacheConfig,
  fetchFunction: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const cacheKey = `${STATISTICS_CACHE_PREFIX}${config.cacheKey}`;

  // Función para obtener datos del cache
  const getCachedData = useCallback((): CachedStatisticsData | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsedCache: CachedStatisticsData = JSON.parse(cached);

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
  const setCachedData = useCallback((data: T) => {
    try {
      const cacheData: CachedStatisticsData = {
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
      const errorMessage = 'Error al cargar estadísticas';
      setError(errorMessage);
      console.error('Error loading statistics:', err);

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

// Hook específico para estadísticas de revisiones
export function useRevisionStatistics() {
  const fetchStatisticsData = useCallback(async () => {
    // Obtener total de revisiones
    const { count: totalCount } = await supabase
      .from('revisiones_casitas')
      .select('*', { count: 'exact', head: true });

    // Obtener datos del año actual usando paginación para obtener TODOS los registros
    const currentYear = new Date().getFullYear();
    const yearQuery = supabase
      .from('revisiones_casitas')
      .select('id, quien_revisa, caja_fuerte, casita, created_at')
      .gte('created_at', `${currentYear}-01-01`)
      .lte('created_at', `${currentYear}-12-31`)
      .order('created_at', { ascending: false });

    const yearData = await getAllRecords(yearQuery);
    console.log(`📊 Estadísticas: Obtenidos ${yearData.length} registros del año ${currentYear}`);

    // Obtener datos de hoy
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const todayQuery = supabase
      .from('revisiones_casitas')
      .select('id, quien_revisa, caja_fuerte, casita, created_at')
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)
      .order('created_at', { ascending: false });

    const todayData = await getAllRecords(todayQuery);
    console.log(`📅 Estadísticas: Obtenidos ${todayData.length} registros de hoy`);

    return {
      totalRevisiones: totalCount || 0,
      revisionesHoy: todayData?.length || 0,
      yearData: yearData || [],
      todayData: todayData || []
    };
  }, []);

  return useStatisticsCache(
    {
      cacheKey: 'revision_statistics',
      expirationTime: DEFAULT_EXPIRATION,
      backgroundRefresh: true
    },
    fetchStatisticsData
  );
}

// Utilidad para limpiar todo el cache de estadísticas
export function clearAllStatisticsCache() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(STATISTICS_CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

// Utilidad para limpiar cache específico de revisiones
export function clearRevisionStatisticsCache() {
  localStorage.removeItem(`${STATISTICS_CACHE_PREFIX}revision_statistics`);
}

// Función helper para obtener todos los registros usando paginación
async function getAllRecords(query: any) {
  const allData: any[] = [];
  let start = 0;
  const batchSize = 1000; // Tamaño del lote
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await query
      .range(start, start + batchSize - 1);

    if (error) {
      console.error('Error fetching paginated data:', error);
      throw error;
    }

    if (data && data.length > 0) {
      allData.push(...data);
      start += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }

  return allData;
}