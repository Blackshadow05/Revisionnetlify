'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Interfaces para el cache de detalles de revisiones
interface RevisionDetailsCacheData {
  revision: any;
  notas: any[];
  registroEdiciones: any[];
  timestamp: number;
  expiresAt: number;
}

interface RevisionDetailsCacheConfig {
  cacheKey: string;
  expirationTime: number; // en milisegundos
  backgroundRefresh: boolean;
}

const DEFAULT_EXPIRATION = 5 * 60 * 1000; // 5 minutos
const REVISION_DETAILS_CACHE_PREFIX = 'revision_details_cache_';

// Hook personalizado para cache de detalles de revisiones
export function useRevisionDetailsCache<T>(
  config: RevisionDetailsCacheConfig,
  fetchFunction: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const cacheKey = `${REVISION_DETAILS_CACHE_PREFIX}${config.cacheKey}`;

  // Función para obtener datos del cache
  const getCachedData = useCallback((): RevisionDetailsCacheData | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsedCache: RevisionDetailsCacheData = JSON.parse(cached);

      // Verificar si el cache ha expirado
      if (Date.now() > parsedCache.expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsedCache;
    } catch (error) {
      console.error('Error reading revision details cache:', error);
      return null;
    }
  }, [cacheKey]);

  // Función para guardar datos en cache
  const setCachedData = useCallback((data: T) => {
    try {
      const cacheData: RevisionDetailsCacheData = {
        revision: (data as any)?.revision || null,
        notas: (data as any)?.notas || [],
        registroEdiciones: (data as any)?.registroEdiciones || [],
        timestamp: Date.now(),
        expiresAt: Date.now() + config.expirationTime
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error saving to revision details cache:', error);
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
          setData({
            revision: cachedData.revision,
            notas: cachedData.notas,
            registroEdiciones: cachedData.registroEdiciones
          } as T);
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
      const errorMessage = 'Error al cargar detalles de revisión';
      setError(errorMessage);
      console.error('Error loading revision details:', err);

      // Intentar usar cache como fallback si hay error
      const cachedData = getCachedData();
      if (cachedData) {
        setData({
          revision: cachedData.revision,
          notas: cachedData.notas,
          registroEdiciones: cachedData.registroEdiciones
        } as T);
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

// Hook específico para detalles de revisiones
export function useRevisionDetails(revisionId: string) {
  const fetchRevisionDetails = useCallback(async () => {
    // Obtener datos de la revisión
    const { data: revision, error: revisionError } = await supabase
      .from('revisiones_casitas')
      .select('*')
      .eq('id', revisionId)
      .single();

    if (revisionError) {
      throw revisionError;
    }

    // Obtener notas asociadas
    const { data: notas, error: notasError } = await supabase
      .from('Notas')
      .select('*')
      .eq('revision_id', revisionId)
      .order('fecha', { ascending: false });

    // Obtener registro de ediciones
    const { data: registroEdiciones, error: edicionesError } = await supabase
      .from('Registro_ediciones')
      .select('*')
      .order('created_at', { ascending: false });

    return {
      revision,
      notas: notas || [],
      registroEdiciones: registroEdiciones || []
    };
  }, [revisionId]);

  return useRevisionDetailsCache(
    {
      cacheKey: `revision_${revisionId}`,
      expirationTime: DEFAULT_EXPIRATION,
      backgroundRefresh: true
    },
    fetchRevisionDetails
  );
}

// Utilidad para limpiar todo el cache de detalles de revisiones
export function clearAllRevisionDetailsCache() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(REVISION_DETAILS_CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}