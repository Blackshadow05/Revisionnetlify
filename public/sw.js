// ===== ACTUALIZACIÓN 2024 - ESTRATEGIAS MODERNAS DE CACHE =====
const CACHE_NAME = 'revision-casitas-v8-force-update'; // Incrementar versión - FORCE AUTO UPDATE
const STATIC_CACHE = 'static-v14-force-update'; // Incrementar versión - FORCE AUTO UPDATE
const DYNAMIC_CACHE = 'dynamic-v5-force-update'; // Incrementar versión - FORCE AUTO UPDATE
const SW_VERSION = '2024.12.19.001'; // Versión específica del SW
const DB_NAME = 'RevisionCasitasDB';
const DB_VERSION = 1;
const STORE_NAME = 'uploadQueue';

// Configuración de cache por tipos de recursos
const CACHE_STRATEGIES = {
  // Assets estáticos - Cache First con expiración
  STATIC_ASSETS: [
    '/',
    '/manifest.json',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png', 
    '/icons/icon-144x144.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/maskable-icon-192x192.png',
    '/icons/maskable-icon-512x512.png',
    '/output.css'
  ],
  
  // Rutas de navegación - Network First con cache fallback
  NAVIGATION_ROUTES: [
    '/',
    '/nueva-revision',
    '/estadisticas',
    '/unir-imagenes', 
    '/subidas-pendientes',
    '/gestion-usuarios',
    '/nueva-nota',
    '/puesto-01'
  ],
  
  // APIs - Stale While Revalidate
  API_ROUTES: [
    '/api/'
  ],
  
  // Recursos dinámicos - Network First
  DYNAMIC_RESOURCES: [
    '/detalles/'
  ]
};

// Configuración de expiración de cache
const CACHE_EXPIRATION = {
  STATIC_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 días
  DYNAMIC_MAX_AGE: 1 * 60 * 60 * 1000, // 1 hora
  API_MAX_AGE: 5 * 60 * 1000 // 5 minutos
};

// Forzar actualización inmediata del Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔄 Forzando actualización inmediata del Service Worker...');
    self.skipWaiting();
  }
});

// ===== INSTALACIÓN DEL SERVICE WORKER =====
self.addEventListener('install', (event) => {
  console.log(`🔄 Service Worker instalando versión ${SW_VERSION} - FORCE UPDATE...`);
  
  event.waitUntil(
    Promise.all([
      // Limpiar TODOS los caches anteriores inmediatamente
      caches.keys().then(cacheNames => {
        console.log('🗑️ Limpiando caches anteriores...');
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('🗑️ Eliminando cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // Pre-cachear solo assets críticos
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Pre-cacheando assets críticos...');
        return cache.addAll([
          '/manifest.json',
          '/icons/icon-192x192.png',
          '/icons/icon-512x512.png'
        ]);
      })
    ])
      .then(() => {
      console.log('✅ Instalación completada, forzando activación inmediata...');
      // Forzar activación inmediata sin esperar
        return self.skipWaiting();
      })
      .catch(error => {
      console.error('❌ Error en instalación:', error);
      })
  );
});

// ===== ACTIVACIÓN DEL SERVICE WORKER =====
self.addEventListener('activate', (event) => {
  console.log(`🚀 Service Worker activando versión ${SW_VERSION} - FORCE UPDATE...`);
  
  event.waitUntil(
    Promise.all([
      // Limpiar TODOS los caches existentes
      caches.keys().then(cacheNames => {
        const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, CACHE_NAME];
        return Promise.all(
          cacheNames
            .filter(cacheName => !validCaches.includes(cacheName))
            .map(cacheName => {
              console.log('🗑️ Eliminando cache obsoleto:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Tomar control inmediatamente de TODAS las pestañas
      self.clients.claim(),
      
      // Notificar a todos los clientes sobre la actualización
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          console.log('📢 Notificando actualización a cliente:', client.url);
          client.postMessage({
            type: 'SW_UPDATED',
            version: SW_VERSION,
            message: 'Service Worker actualizado - Recargando página...'
          });
        });
      }),
      
      // Procesar cola de subidas pendientes
      processUploadQueue()
    ])
    .then(() => {
      console.log('✅ Service Worker activado completamente');
      // Forzar recarga de todas las pestañas abiertas
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          if (client.url.includes(self.location.origin)) {
            console.log('🔄 Forzando recarga de cliente:', client.url);
            client.navigate(client.url);
          }
        });
      });
    })
  );
});

// ===== BACKGROUND SYNC PARA FORMULARIOS OFFLINE =====
self.addEventListener('sync', (event) => {
  console.log('🔄 SW: Background Sync activado:', event.tag);
  
  if (event.tag === 'offline-form-sync') {
    event.waitUntil(processOfflineFormQueue());
  }
});

// Función para procesar cola de formularios offline
async function processOfflineFormQueue() {
  try {
    console.log('📤 SW: Procesando cola de formularios offline...');
    
    // Abrir IndexedDB específicamente para formularios
    const db = await openOfflineFormsDB();
    const transaction = db.transaction(['offlineForms'], 'readwrite');
    const store = transaction.objectStore('offlineForms');
    
    // Obtener formularios pendientes
    const pendingForms = await getAllPendingForms(store);
    console.log(`📋 SW: ${pendingForms.length} formularios pendientes encontrados`);
    
    if (pendingForms.length === 0) {
      db.close();
      return;
    }
    
    for (const form of pendingForms) {
      try {
        console.log(`📤 SW: Procesando formulario ${form.id}...`);
        
        // Actualizar estado a 'uploading'
        form.status = 'uploading';
        await updateFormInStore(store, form);
        
        // Enviar formulario según tipo
        if (form.formType === 'revision') {
          await submitRevisionOffline(form.data);
        } else if (form.formType === 'nota') {
          await submitNotaOffline(form.data);
        }
        
        // Marcar como completado
        form.status = 'completed';
        await updateFormInStore(store, form);
        
        console.log(`✅ SW: Formulario ${form.id} enviado exitosamente`);
        
        // Notificar al cliente sobre el éxito
        notifyClients({
          type: 'FORM_SYNC_SUCCESS',
          formId: form.id,
          formType: form.formType
        });
        
      } catch (error) {
        console.error(`❌ SW: Error procesando formulario ${form.id}:`, error);
        
        // Marcar como error
        form.status = 'error';
        form.lastError = error.message;
        form.retryCount = (form.retryCount || 0) + 1;
        await updateFormInStore(store, form);
        
        // Notificar al cliente sobre el error
        notifyClients({
          type: 'FORM_SYNC_ERROR',
          formId: form.id,
          formType: form.formType,
          error: error.message
        });
      }
    }
    
    db.close();
    console.log('✅ SW: Procesamiento de cola de formularios completado');
    
  } catch (error) {
    console.error('❌ SW: Error procesando cola offline:', error);
  }
}

// Función auxiliar para abrir IndexedDB de formularios desde SW
async function openOfflineFormsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineFormsDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineForms')) {
        const store = db.createObjectStore('offlineForms', { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('formType', 'formType', { unique: false });
      }
    };
  });
}

// Función auxiliar para obtener formularios pendientes
async function getAllPendingForms(store) {
  return new Promise((resolve, reject) => {
    const request = store.index('status').getAll('pending');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Función auxiliar para actualizar formulario en store
async function updateFormInStore(store, form) {
  return new Promise((resolve, reject) => {
    const request = store.put(form);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Función para enviar revisión offline
async function submitRevisionOffline(formData) {
  const response = await fetch('/api/revisiones', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
  });
  
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Función para enviar nota offline
async function submitNotaOffline(formData) {
  const response = await fetch('/api/notas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
  });
  
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Función auxiliar para notificar a todos los clientes
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// ===== ESTRATEGIA MODERNA DE FETCH =====
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Solo interceptar requests del mismo origin
  if (url.origin !== location.origin) {
    return;
  }
  
  // Solo manejar requests GET
  if (request.method !== 'GET') {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// ===== MANEJADOR PRINCIPAL DE REQUESTS =====
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // 1. NAVEGACIÓN - Estrategia Network-Only ESTRICTA (NUNCA CACHE)
    if (request.mode === 'navigate') {
      console.log('🌐 NAVEGACIÓN DETECTADA - FORZANDO RED (NO CACHE):', request.url);
      try {
        // SIEMPRE ir a la red, NUNCA usar cache para navegación
        const networkResponse = await fetch(request, { 
          cache: 'no-store' // Forzar no usar cache del navegador
        });
        console.log('✅ Página cargada desde la red:', request.url);
        return networkResponse;
      } catch (error) {
        console.error('❌ Red falló para navegación:', error);
        // Solo en caso de error de red, mostrar fallback offline
        return await getOfflineFallback(request);
      }
    }

    // 2. RUTAS DE NAVEGACIÓN ESPECÍFICAS - También Network-Only
    if (isNavigationRoute(pathname)) {
      console.log('🌐 RUTA DE NAVEGACIÓN - FORZANDO RED (NO CACHE):', request.url);
      try {
        const networkResponse = await fetch(request, { 
          cache: 'no-store' // Forzar no usar cache del navegador
        });
        console.log('✅ Ruta cargada desde la red:', request.url);
        return networkResponse;
      } catch (error) {
        console.error('❌ Red falló para ruta de navegación:', error);
        return await getOfflineFallback(request);
      }
    }

    // 3. ASSETS ESTÁTICOS - Cache First con validación de frescura
    if (isStaticAsset(pathname)) {
      return await cacheFirstWithExpiration(request, STATIC_CACHE, CACHE_EXPIRATION.STATIC_MAX_AGE);
    }
    
    // 4. APIs - Stale While Revalidate
    if (isApiRoute(pathname)) {
      return await staleWhileRevalidate(request, DYNAMIC_CACHE, CACHE_EXPIRATION.API_MAX_AGE);
    }
    
    // 5. RECURSOS DINÁMICOS (Imágenes, etc.) - Network First
    if (isDynamicResource(pathname)) {
      return await networkFirstWithFallback(request, DYNAMIC_CACHE);
    }
    
    // 6. FALLBACK - Network only para todo lo demás
    console.log('🌐 FALLBACK - FORZANDO RED:', request.url);
    return await fetch(request, { cache: 'no-store' });
    
  } catch (error) {
    console.error('❌ Error manejando request:', error);
    return await getOfflineFallback(request);
  }
}

// ===== ESTRATEGIAS DE CACHE MODERNAS =====

// Cache First con expiración
async function cacheFirstWithExpiration(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('date') || 0);
    const now = new Date();
    
    // Si el cache no ha expirado, devolverlo
    if ((now - cachedDate) < maxAge) {
      console.log('📦 Sirviendo desde cache:', request.url);
      return cachedResponse;
    }
  }
  
  // Fetch desde la red y actualizar cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      console.log('🌐 Actualizado en cache desde red:', request.url);
    }
    return networkResponse;
  } catch (error) {
    // Si hay error de red, devolver cache aunque esté expirado
    if (cachedResponse) {
      console.log('⚠️ Red fallida, sirviendo cache expirado:', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

// Network First con cache fallback
async function networkFirstWithFallback(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      console.log('🌐 Sirviendo desde red y cacheando:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('⚠️ Red fallida, intentando cache:', request.url);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('📦 Sirviendo desde cache fallback:', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

// Stale While Revalidate
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch en background para actualizar cache
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
      console.log('🔄 Cache actualizado en background:', request.url);
    }
    return networkResponse;
  }).catch(error => {
    console.log('⚠️ Error actualizando cache en background:', error);
  });
  
  // Si hay cache, devolverlo inmediatamente
  if (cachedResponse) {
    console.log('📦 Sirviendo desde cache, actualizando en background:', request.url);
    return cachedResponse;
  }
  
  // Si no hay cache, esperar por la red
  return await fetchPromise;
}

// ===== FUNCIONES DE UTILIDAD =====

function isStaticAsset(pathname) {
  return CACHE_STRATEGIES.STATIC_ASSETS.some(asset => 
    pathname === asset || pathname.startsWith('/icons/') || 
    pathname.endsWith('.css') || pathname.endsWith('.js') ||
    pathname.endsWith('.png') || pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') || pathname.endsWith('.ico')
  );
}

function isNavigationRoute(pathname) {
  return CACHE_STRATEGIES.NAVIGATION_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route)
  );
}

function isApiRoute(pathname) {
  return CACHE_STRATEGIES.API_ROUTES.some(route => 
    pathname.startsWith(route)
  );
}

function isDynamicResource(pathname) {
  return CACHE_STRATEGIES.DYNAMIC_RESOURCES.some(route => 
    pathname.startsWith(route)
  );
}

async function getOfflineFallback(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  if (request.mode === 'navigate') {
    // Para navegación, devolver página principal
    return await cache.match('/') || new Response(
      '<!DOCTYPE html><html><body><h1>Sin conexión</h1><p>Verifica tu conexión a internet</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
  
  // Para otros recursos, devolver respuesta de error
  return new Response('Recurso no disponible offline', { 
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

// ===== FUNCIONES EXISTENTES DE INDEXEDDB Y SUBIDAS =====

// Abrir IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

// Procesar cola de subidas
async function processUploadQueue() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('status');
    
    const pendingUploads = await new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Procesar máximo 3 subidas simultáneas
    const activeUploads = pendingUploads.slice(0, 3);
    
    for (const upload of activeUploads) {
      uploadToCloudinary(upload);
    }
  } catch (error) {
    console.error('Error procesando cola de subidas:', error);
  }
}

// Subir a Cloudinary
async function uploadToCloudinary(uploadItem) {
  try {
    // Actualizar estado a "uploading"
    await updateUploadStatus(uploadItem.id, 'uploading', { progress: 0 });

    // Generar carpeta automática para evidencias: Evidencias/[Mes Año]
    const now = new Date();
    const year = now.getFullYear();
    
    // Array con nombres de meses en español
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const mesNombre = meses[now.getMonth()];
    const folder = `Evidencias/${mesNombre} ${year}`;

    // Preparar FormData para Cloudinary
    const formData = new FormData();
    formData.append('file', uploadItem.file);
    formData.append('upload_preset', 'ml_default');
    formData.append('cloud_name', 'dhd61lan4');
    formData.append('folder', folder);

    const response = await fetch('https://api.cloudinary.com/v1_1/dhd61lan4/image/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error al subir imagen a Cloudinary');
    }

    const data = await response.json();
    
    // Agregar optimizaciones automáticas f_auto,q_auto a la URL
    const originalUrl = data.secure_url;
    const finalUrl = originalUrl.replace('/upload/', '/upload/f_auto,q_auto/');

    // Actualizar Supabase
    await updateSupabaseRecord(uploadItem.recordId, uploadItem.fieldName, finalUrl);
    
    // Marcar como completado
    await updateUploadStatus(uploadItem.id, 'completed', { 
      url: finalUrl, 
      completedAt: new Date().toISOString() 
    });

    // Notificar a la aplicación
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'UPLOAD_COMPLETED',
          uploadId: uploadItem.id,
          url: finalUrl,
          recordId: uploadItem.recordId,
          fieldName: uploadItem.fieldName
        });
      });
    });

  } catch (error) {
    console.error('Error subiendo imagen:', error);
    
    // Incrementar intentos
    const retryCount = (uploadItem.retryCount || 0) + 1;
    const maxRetries = 3;
    
    if (retryCount < maxRetries) {
      // Programar reintento con backoff exponencial
      const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
      setTimeout(() => {
        updateUploadStatus(uploadItem.id, 'pending', { retryCount });
      }, delay);
    } else {
      // Marcar como error después de 3 intentos
      await updateUploadStatus(uploadItem.id, 'error', { 
        error: error.message,
        failedAt: new Date().toISOString()
      });
      
      // Notificar error
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPLOAD_ERROR',
            uploadId: uploadItem.id,
            error: error.message
          });
        });
      });
    }
  }
}

// Actualizar estado de subida
async function updateUploadStatus(id, status, additionalData = {}) {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  const request = store.get(id);
  request.onsuccess = () => {
    const upload = request.result;
    if (upload) {
      upload.status = status;
      upload.updatedAt = new Date().toISOString();
      Object.assign(upload, additionalData);
      store.put(upload);
    }
  };
}

// Actualizar registro en Supabase
async function updateSupabaseRecord(recordId, fieldName, url) {
  // Esta función será llamada desde el cliente principal
  // El SW no puede acceder directamente a Supabase por CORS
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_SUPABASE',
        recordId,
        fieldName,
        url
      });
    });
  });
}

// Función de configuración de ImageKit eliminada - ahora usamos Cloudinary

// Agregar a cola de subidas
async function addToUploadQueue(uploadData) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const uploadItem = {
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file: uploadData.file,
      recordId: uploadData.recordId,
      fieldName: uploadData.fieldName,
      fileName: uploadData.fileName,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0,
      priority: uploadData.priority || 1 // Prioridad para ordenar
    };
    
    store.add(uploadItem);
    
    // Iniciar keep-alive si hay subidas pendientes
    startKeepAlive();
    
    // Procesar cola automáticamente
    setTimeout(() => processUploadQueue(), 100);
    
    // Registrar background sync si está disponible
    if ('serviceWorker' in self && 'sync' in self.registration) {
      try {
        await self.registration.sync.register('background-upload');
      } catch (error) {
        console.log('Background sync no disponible:', error);
      }
    }
    
  } catch (error) {
    console.error('Error agregando a cola:', error);
  }
}

// Obtener estado de la cola
async function getQueueStatus() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const all = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    return {
      pending: all.filter(item => item.status === 'pending').length,
      uploading: all.filter(item => item.status === 'uploading').length,
      completed: all.filter(item => item.status === 'completed').length,
      error: all.filter(item => item.status === 'error').length,
      total: all.length
    };
  } catch (error) {
    console.error('Error obteniendo estado de cola:', error);
    return { pending: 0, uploading: 0, completed: 0, error: 0, total: 0 };
  }
}

// Mantener SW vivo con mensajes periódicos
let keepAliveInterval;

function startKeepAlive() {
  if (keepAliveInterval) return;
  
  keepAliveInterval = setInterval(() => {
    // Enviar mensaje a todos los clientes para mantener conexión
    self.clients.matchAll().then(clients => {
      if (clients.length === 0) {
        // No hay clientes, pero seguir procesando cola
        processUploadQueue();
      }
    });
  }, 25000); // Cada 25 segundos
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Iniciar keep-alive cuando hay subidas pendientes
async function checkAndStartKeepAlive() {
  const status = await getQueueStatus();
  if (status.pending > 0 || status.uploading > 0) {
    startKeepAlive();
  } else {
    stopKeepAlive();
  }
}

// Verificar keep-alive periódicamente
setInterval(checkAndStartKeepAlive, 60000); // Cada minuto

// Procesar cola periódicamente
setInterval(() => {
  processUploadQueue();
}, 30000); // Cada 30 segundos

// Mantener el Service Worker activo
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-upload') {
    event.waitUntil(processUploadQueue());
  }
});

// ===== MANEJO DE MENSAJES MODERNOS =====
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        });
      });
      break;
      
    case 'FORCE_UPDATE':
      // Forzar actualización de cache
      caches.keys().then(cacheNames => {
        Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      }).then(() => {
        return caches.open(STATIC_CACHE).then(cache => {
          return cache.addAll(CACHE_STRATEGIES.STATIC_ASSETS);
        });
      });
      break;
      
    // Casos existentes para subidas
    case 'ADD_TO_QUEUE':
      addToUploadQueue(data);
      break;
    case 'PROCESS_QUEUE':
      processUploadQueue();
      break;
    case 'GET_QUEUE_STATUS':
      getQueueStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
} 