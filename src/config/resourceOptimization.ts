// 🚀 CONFIGURACIÓN DE OPTIMIZACIÓN DE RECURSOS
// Siguiendo las reglas de performance-first

export const FONT_CONFIG = {
  // Solo las variantes esenciales de Inter
  weights: ['400', '500', '600'] as const,
  display: 'swap' as const,
  preload: ['400', '500'] as const, // Solo precargar las más usadas
} as const;

export const RESOURCE_HINTS = {
  // Preconnect para recursos críticos
  preconnect: [
    'https://fonts.gstatic.com',
  ],
  // DNS prefetch para recursos menos críticos
  dnsPrefetch: [
    'https://fonts.googleapis.com',
  ],
} as const;

export const PERFORMANCE_CONFIG = {
  // Service Worker update intervals
  SW_UPDATE_INTERVAL: 600000, // 10 minutos (optimizado desde 5 min)
  
  // Font loading strategy
  FONT_LOADING_STRATEGY: 'swap' as const,
  
  // Reduce animation complexity in low-performance devices
  REDUCE_ANIMATIONS_ON_LOW_END: true,
  
  // Lazy load images beyond viewport
  IMAGE_LAZY_LOADING_MARGIN: '50px',
  
  // Critical resource priorities
  CRITICAL_RESOURCES: [
    'fonts',
    'main-css',
    'critical-js'
  ] as const,
} as const;

// Utility function to check if device is low-end
export const isLowEndDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Check for slow connection
  const connection = (navigator as any).connection;
  const isSlowConnection = connection && (
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' ||
    connection.saveData
  );
  
  // Check for low memory (if available)
  const isLowMemory = (navigator as any).deviceMemory && 
    (navigator as any).deviceMemory < 4; // Less than 4GB RAM
  
  return prefersReducedMotion || isSlowConnection || isLowMemory;
};

// Optimize font loading based on device capabilities
export const getOptimizedFontConfig = () => {
  const isLowEnd = isLowEndDevice();
  
  return {
    weights: isLowEnd ? ['400', '500'] : FONT_CONFIG.weights,
    display: FONT_CONFIG.display,
    preload: isLowEnd ? ['400'] : FONT_CONFIG.preload,
  };
}; 