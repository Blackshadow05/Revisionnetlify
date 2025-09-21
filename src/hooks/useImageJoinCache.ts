'use client';

import { useState, useCallback } from 'react';

// Interfaces para el cache de unión de imágenes
interface ImageJoinCacheData {
  compressedImages: {
    image1: string | null;
    image2: string | null;
  };
  joinedImage: string | null;
  orientation: 'vertical' | 'horizontal';
  timestamp: number;
}

interface ImageJoinCacheConfig {
  cacheKey: string;
  expirationTime: number; // en milisegundos
}

const DEFAULT_EXPIRATION = 10 * 60 * 1000; // 10 minutos
const IMAGE_JOIN_CACHE_PREFIX = 'image_join_cache_';

// Hook personalizado para cache de unión de imágenes
export function useImageJoinCache(config: ImageJoinCacheConfig) {
  const [cacheData, setCacheData] = useState<ImageJoinCacheData | null>(null);

  const cacheKey = `${IMAGE_JOIN_CACHE_PREFIX}${config.cacheKey}`;

  // Función para obtener datos del cache
  const getCachedData = useCallback((): ImageJoinCacheData | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const parsedCache: ImageJoinCacheData = JSON.parse(cached);

      // Verificar si el cache ha expirado
      if (Date.now() > parsedCache.timestamp + config.expirationTime) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsedCache;
    } catch (error) {
      console.error('Error reading image join cache:', error);
      return null;
    }
  }, [cacheKey, config.expirationTime]);

  // Función para guardar datos en cache
  const setCachedData = useCallback((data: Partial<ImageJoinCacheData>) => {
    try {
      const existingData = getCachedData();
      const newCacheData: ImageJoinCacheData = {
        compressedImages: {
          image1: data.compressedImages?.image1 || existingData?.compressedImages.image1 || null,
          image2: data.compressedImages?.image2 || existingData?.compressedImages.image2 || null,
        },
        joinedImage: data.joinedImage || existingData?.joinedImage || null,
        orientation: data.orientation || existingData?.orientation || 'vertical',
        timestamp: Date.now()
      };

      localStorage.setItem(cacheKey, JSON.stringify(newCacheData));
      setCacheData(newCacheData);
    } catch (error) {
      console.error('Error saving to image join cache:', error);
    }
  }, [cacheKey, getCachedData]);

  // Función para limpiar cache específico
  const clearCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
    setCacheData(null);
  }, [cacheKey]);

  // Función para actualizar imágenes comprimidas
  const updateCompressedImages = useCallback((image1?: string, image2?: string) => {
    setCachedData({
      compressedImages: {
        image1: image1 || null,
        image2: image2 || null,
      }
    });
  }, [setCachedData]);

  // Función para actualizar imagen unida
  const updateJoinedImage = useCallback((joinedImage: string, orientation: 'vertical' | 'horizontal') => {
    setCachedData({
      joinedImage,
      orientation
    });
  }, [setCachedData]);

  // Función para cambiar orientación
  const updateOrientation = useCallback((orientation: 'vertical' | 'horizontal') => {
    setCachedData({ orientation });
  }, [setCachedData]);

  // Cargar datos del cache al inicializar
  const loadCache = useCallback(() => {
    const cached = getCachedData();
    if (cached) {
      setCacheData(cached);
    }
  }, [getCachedData]);

  return {
    cacheData,
    loadCache,
    updateCompressedImages,
    updateJoinedImage,
    updateOrientation,
    clearCache,
    getCachedData
  };
}

// Hook específico para la página de unir imágenes
export function useUnirImagenesCache() {
  return useImageJoinCache({
    cacheKey: 'unir_imagenes',
    expirationTime: DEFAULT_EXPIRATION
  });
}

// Utilidad para limpiar todo el cache de unión de imágenes
export function clearAllImageJoinCache() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(IMAGE_JOIN_CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}