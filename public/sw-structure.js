// ===== SERVICE WORKER PARA CACHE PERMANENTE DE ESTRUCTURA =====
const STRUCTURE_CACHE = 'revision-structure-permanent-v1';
const STATIC_CACHE = 'revision-static-permanent-v1';
const DATA_CACHE = 'revision-data-temp-v1';

// URLs que se cachean PERMANENTEMENTE (estructura y estilos)
const PERMANENT_STRUCTURE_URLS = [
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/estadisticas',  // Cache permanente para página de estadísticas
  '/estadisticas/offline',  // Cache permanente para página offline de estadísticas
  '/unir-imagenes',  // Cache permanente para página de unir imágenes
  '/unir-imagenes/offline',  // Cache permanente para página offline de unir imágenes
  '/detalles',  // Cache permanente para página de detalles (ruta base)
  '/detalles/offline'  // Cache permanente para página offline de detalles
];

// Cache PERMANENTE - nunca se limpia
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker instalando - Cache permanente de estructura');
  
  event.waitUntil(
    Promise.all([
      // Cache PERMANENTE de estructura y estilos
      caches.open(STRUCTURE_CACHE).then((cache) => {
        return cache.addAll(PERMANENT_STRUCTURE_URLS);
      }),
      
      // Cache de assets estáticos
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll([
          '/icons/icon-192x192.png',
          '/icons/icon-512x512.png'
        ]);
      })
    ])
  );
  
  self.skipWaiting();
});

// Activación - solo limpiar caché de datos, mantener estructura
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activando - Manteniendo estructura permanente');
  
  event.waitUntil(
    Promise.all([
      // Limpiar solo caché de datos, mantener estructura
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Mantener caché de estructura y estáticos
            if (cacheName === STRUCTURE_CACHE || cacheName === STATIC_CACHE) {
              return Promise.resolve();
            }
            // Limpiar caché de datos dinámicos
            if (cacheName === DATA_CACHE) {
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      }),
      
      self.clients.claim()
    ])
  );
});

// Estrategia de fetch optimizada para estructura permanente
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Nunca cachear datos de Supabase o APIs dinámicas
  if (url.href.includes('supabase.co') || 
      url.href.includes('realtime.supabase.co') ||
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/detalles/')) {
    event.respondWith(networkOnly(request));
    return;
  }
  
  // Cache PERMANENTE para recursos estáticos (CSS, JS)
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'font' ||
      url.pathname.includes('_next/static/') ||
      url.pathname.includes('output.css')) {
    event.respondWith(cachePermanent(request));
    return;
  }
  
  // Cache PERMANENTE para imágenes
  if (request.destination === 'image') {
    event.respondWith(cachePermanent(request));
    return;
  }
  
  // Cache para HTML de páginas (estructura)
  if (request.mode === 'navigate' || request.destination === 'document') {
    // Estrategias especiales para páginas específicas
    if (url.pathname === '/estadisticas') {
      event.respondWith(statisticsCacheStrategy(request));
      return;
    } else if (url.pathname === '/unir-imagenes') {
      event.respondWith(imageJoinCacheStrategy(request));
      return;
    } else if (url.pathname.startsWith('/detalles/')) {
      event.respondWith(revisionDetailsCacheStrategy(request));
      return;
    }
    event.respondWith(structureCacheStrategy(request));
    return;
  }
  
  // Default: network first
  event.respondWith(networkFirst(request));
});

// Cache PERMANENTE - nunca se limpia
async function cachePermanent(request) {
  const cache = await caches.open(STRUCTURE_CACHE);
  const cached = await cache.match(request);
  
  // Siempre usar caché si existe (permanente)
  if (cached) {
    return cached;
  }
  
  // Si no hay caché, descargar y cachear permanentemente
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(STRUCTURE_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fallback a caché si hay
    return cached || new Response('Recurso no disponible offline', { status: 503 });
  }
}

// Estrategia especial para estructura HTML
async function structureCacheStrategy(request) {
  const cache = await caches.open(STRUCTURE_CACHE);
  const cached = await cache.match(request);
  
  // Siempre usar caché de estructura si existe (permanente)
  if (cached) {
    return cached;
  }
  
  // Si no hay caché, descargar y cachear estructura base
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const html = await response.text();
      
      // Eliminar contenido dinámico antes de cachear estructura
      const structureOnly = html
        // Eliminar datos específicos de revisiones
        .replace(/<div[^>]*id="revision-data"[^>]*>.*?<\/div>/gs, '<div id="revision-data"></div>')
        .replace(/<div[^>]*data-revision-id[^>]*>.*?<\/div>/gs, '<div data-revision-id></div>')
        // Eliminar scripts de datos dinámicos
        .replace(/<script[^>]*data-dynamic[^>]*>.*?<\/script>/gs, '')
        // Mantener estructura base y estilos
        .replace(/<main[^>]*>.*?<\/main>/gs, '<main><div id="revision-content"></div></main>');
      
      const structureResponse = new Response(structureOnly, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
      
      cache.put(request, structureResponse);
    }
    
    return response;
  } catch (error) {
    // Páginas offline específicas para cada ruta
    if (request.url.includes('/estadisticas')) {
      const offlineResponse = await cache.match('/estadisticas/offline');
      return offlineResponse || new Response('Sin conexión', { status: 503 });
    } else if (request.url.includes('/unir-imagenes')) {
      const offlineResponse = await cache.match('/unir-imagenes/offline');
      return offlineResponse || new Response('Sin conexión', { status: 503 });
    } else if (request.url.includes('/detalles')) {
      const offlineResponse = await cache.match('/detalles/offline');
      return offlineResponse || new Response('Sin conexión', { status: 503 });
    }
    // Página offline genérica para otras páginas
    const offlineResponse = await cache.match('/offline');
    return offlineResponse || new Response('Sin conexión', { status: 503 });
  }
}

// Network only para datos dinámicos (nunca cachear)
async function networkOnly(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    return new Response('Sin conexión', { status: 503 });
  }
}

// Estrategia especial para página de estadísticas
async function statisticsCacheStrategy(request) {
  const cache = await caches.open(STRUCTURE_CACHE);
  const cached = await cache.match(request);

  // Si hay caché de estructura, usarlo como base
  if (cached) {
    try {
      // Intentar obtener datos frescos en background
      fetch(request).then(response => {
        if (response.status === 200) {
          // Actualizar caché de estructura con datos frescos
          response.text().then(html => {
            const structureOnly = html
              .replace(/<div[^>]*id="statistics-data"[^>]*>.*?<\/div>/gs, '<div id="statistics-data"></div>')
              .replace(/<script[^>]*data-dynamic[^>]*>.*?<\/script>/gs, '');

            const structureResponse = new Response(structureOnly, {
              headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'public, max-age=300' // 5 minutos
              }
            });

            cache.put(request, structureResponse);
          });
        }
      }).catch(() => {}); // Ignorar errores de background fetch

      return cached;
    } catch (error) {
      return cached;
    }
  }

  // Si no hay caché, descargar y cachear estructura base
  try {
    const response = await fetch(request);

    if (response.status === 200) {
      const html = await response.text();

      // Preparar HTML para cache (eliminar datos dinámicos)
      const structureOnly = html
        .replace(/<div[^>]*id="statistics-data"[^>]*>.*?<\/div>/gs, '<div id="statistics-data"></div>')
        .replace(/<script[^>]*data-dynamic[^>]*>.*?<\/script>/gs, '');

      const structureResponse = new Response(structureOnly, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=300'
        }
      });

      cache.put(request, structureResponse);
    }

    return response;
  } catch (error) {
    // Página offline personalizada
    const offlineResponse = await cache.match('/offline');
    return offlineResponse || new Response('Sin conexión', { status: 503 });
  }
}

// Network first con caché fallback temporal
async function networkFirst(request) {
  try {
    const response = await fetch(request);

    // Cachear en caché temporal de datos
    if (response.status === 200) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Fallback a caché temporal
    const cached = await caches.match(request);
    return cached || new Response('Sin conexión', { status: 503 });
  }
}

// Limpiar caché de datos periódicamente (pero mantener estructura)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'clear-data-cache') {
    event.waitUntil(
      caches.delete(DATA_CACHE)
    );
  }
});

// Mensajes para control manual
self.addEventListener('message', (event) => {
  switch (event.data.type) {
    case 'CLEAR_DATA_CACHE':
      caches.delete(DATA_CACHE);
      break;
      
    case 'CLEAR_STRUCTURE_CACHE':
      // No permitir limpiar estructura permanente
      console.log('⚠️ No se puede limpiar caché de estructura permanente');
      break;
      
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

// Estrategia para página de unir imágenes
async function imageJoinCacheStrategy(request) {
  const cache = await caches.open(STRUCTURE_CACHE);
  const cached = await cache.match(request);

  // Siempre usar caché si existe (página estática)
  if (cached) {
    return cached;
  }

  // Si no hay caché, descargar y cachear
  try {
    const response = await fetch(request);

    if (response.status === 200) {
      const html = await response.text();

      // Preparar HTML para cache (mantener funcionalidad de unión de imágenes)
      const structureOnly = html
        .replace(/<div[^>]*id="image-join-data"[^>]*>.*?<\/div>/gs, '<div id="image-join-data"></div>')
        .replace(/<script[^>]*data-dynamic[^>]*>.*?<\/script>/gs, '');

      const structureResponse = new Response(structureOnly, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=600' // 10 minutos
        }
      });

      cache.put(request, structureResponse);
    }

    return response;
  } catch (error) {
    // Página offline personalizada para unir imágenes
    if (request.url.includes('/unir-imagenes')) {
      const offlineResponse = await cache.match('/unir-imagenes/offline');
      return offlineResponse || new Response('Sin conexión', { status: 503 });
    }
    // Página offline genérica para otras páginas
    const offlineResponse = await cache.match('/offline');
    return offlineResponse || new Response('Sin conexión', { status: 503 });
  }
}

// Estrategia para página de detalles de revisiones (dinámica)
async function revisionDetailsCacheStrategy(request) {
  const cache = await caches.open(STRUCTURE_CACHE);
  const cached = await cache.match(request);

  // Si hay caché de estructura, usarlo como base
  if (cached) {
    try {
      // Intentar obtener datos frescos en background para páginas dinámicas
      fetch(request).then(response => {
        if (response.status === 200) {
          // Actualizar caché de estructura con datos frescos
          response.text().then(html => {
            const structureOnly = html
              .replace(/<div[^>]*id="revision-details-data"[^>]*>.*?<\/div>/gs, '<div id="revision-details-data"></div>')
              .replace(/<script[^>]*data-dynamic[^>]*>.*?<\/script>/gs, '');

            const structureResponse = new Response(structureOnly, {
              headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'public, max-age=300' // 5 minutos
              }
            });

            cache.put(request, structureResponse);
          });
        }
      }).catch(() => {}); // Ignorar errores de background fetch

      return cached;
    } catch (error) {
      return cached;
    }
  }

  // Si no hay caché, descargar y cachear estructura base
  try {
    const response = await fetch(request);

    if (response.status === 200) {
      const html = await response.text();

      // Preparar HTML para cache (eliminar datos dinámicos específicos)
      const structureOnly = html
        .replace(/<div[^>]*id="revision-details-data"[^>]*>.*?<\/div>/gs, '<div id="revision-details-data"></div>')
        .replace(/<script[^>]*data-dynamic[^>]*>.*?<\/script>/gs, '');

      const structureResponse = new Response(structureOnly, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=300'
        }
      });

      cache.put(request, structureResponse);
    }

    return response;
  } catch (error) {
    // Página offline personalizada para detalles
    if (request.url.includes('/detalles')) {
      const offlineResponse = await cache.match('/detalles/offline');
      return offlineResponse || new Response('Sin conexión', { status: 503 });
    }
    // Página offline genérica para otras páginas
    const offlineResponse = await cache.match('/offline');
    return offlineResponse || new Response('Sin conexión', { status: 503 });
  }
}

// Mantener Service Worker activo para estructura permanente
self.addEventListener('install', () => {
  setInterval(() => {
    // Verificar integridad de caché de estructura
    caches.open(STRUCTURE_CACHE).then(cache => {
      cache.keys().then(keys => {
        console.log('📦 Recursos en caché permanente:', keys.length);
      });
    });
  }, 3600000); // Cada hora
});
