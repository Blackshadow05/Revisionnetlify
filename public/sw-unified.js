// ===== SERVICE WORKER UNIFICADO =====
const STRUCTURE_CACHE = 'revision-structure-permanent-v1';
const DATA_CACHE = 'revision-data-temp-v1';
const SW_VERSION = '2024.10.10.001';

// URLs críticas para el funcionamiento offline
const PERMANENT_URLS = [
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/estadisticas/offline',
  '/unir-imagenes/offline',
  '/detalles/offline'
];

// Instalación - cache permanente de recursos críticos
self.addEventListener('install', (event) => {
  console.log(`📦 Service Worker unificado instalando versión ${SW_VERSION}`);
  
  event.waitUntil(
    caches.open(STRUCTURE_CACHE).then((cache) => {
      return cache.addAll(PERMANENT_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activación - limpieza de caches obsoletos
self.addEventListener('activate', (event) => {
  console.log(`🚀 Service Worker unificado activando versión ${SW_VERSION}`);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STRUCTURE_CACHE && name !== DATA_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de fetch unificada
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar requests del mismo origin
  if (url.origin !== location.origin) return;

  // Estrategia para navegación: Network First con fallback a cache
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Estrategia para recursos estáticos: Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstWithExpiration(request, STRUCTURE_CACHE, 7 * 24 * 60 * 60 * 1000));
    return;
  }

  // Estrategia para APIs: Stale While Revalidate
  if (isApiRoute(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE, 5 * 60 * 1000));
    return;
  }

  // Estrategia para otros recursos: Network First
  event.respondWith(networkFirstWithFallback(request, DATA_CACHE));
});

// Estrategia para navegación: Network First con fallback a cache
async function handleNavigationRequest(request) {
  try {
    // Intentar cargar desde la red primero
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
  } catch (error) {
    // Fallback a cache si la red falla
    const cachedResponse = await caches.match(request, { cacheName: STRUCTURE_CACHE });
    if (cachedResponse) return cachedResponse;
    
    // Fallback a página offline genérica
    const offlineResponse = await caches.match('/offline');
    return offlineResponse || new Response('Sin conexión', { status: 503 });
  }
}

// ===== ESTRATEGIAS DE CACHE =====

// Cache First con expiración
async function cacheFirstWithExpiration(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('date') || 0);
    if ((Date.now() - cachedDate) < maxAge) {
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return cachedResponse || new Response('Sin conexión', { status: 503 });
  }
}

// Network First con fallback a cache
async function networkFirstWithFallback(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request, { cacheName });
    return cachedResponse || new Response('Sin conexión', { status: 503 });
  }
}

// Stale While Revalidate
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch en background para actualizar cache
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {}); // Ignorar errores
  
  // Si hay cache, devolverlo inmediatamente
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Si no hay cache, esperar por la red
  return await fetchPromise;
}

// ===== FUNCIONES AUXILIARES =====

function isStaticAsset(pathname) {
  return pathname.endsWith('.css') || 
         pathname.endsWith('.js') ||
         pathname.endsWith('.png') || 
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.svg') || 
         pathname.endsWith('.ico') ||
         pathname.includes('_next/static/');
}

function isApiRoute(pathname) {
  return pathname.startsWith('/api/');
}

// Background Sync para formularios offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-form-sync') {
    event.waitUntil(processOfflineFormQueue());
  }
});

// Función para procesar cola de formularios offline
async function processOfflineFormQueue() {
  // Implementación similar a la original en sw.js
  // ...
}

// Mantener Service Worker activo
self.addEventListener('install', () => {
  setInterval(() => {
    // Verificar integridad de caché
    caches.open(STRUCTURE_CACHE).then(cache => {
      cache.keys().then(keys => {
        console.log('📦 Recursos en caché permanente:', keys.length);
      });
    });
  }, 3600000); // Cada hora
});