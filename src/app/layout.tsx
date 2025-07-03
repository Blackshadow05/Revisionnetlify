import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Roboto } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { UploadProvider } from '@/context/UploadContext'
import { ToastProvider } from '@/context/ToastContext'
import UploadIndicator from '@/components/UploadIndicator'
import UploadRecovery from '@/components/UploadRecovery'
import ChromeCompatibilityFix from '@/components/ChromeCompatibilityFix'

// 🚀 OPTIMIZADO: Solo las variantes esenciales con font-display swap
const roboto = Roboto({ 
  subsets: ['latin'],
  weight: ['400', '500', '700'], // Usando pesos comunes para Roboto
  display: 'swap', // Evita FOIT - Flash of Invisible Text
  preload: true
})

export const metadata: Metadata = {
  title: 'Sistema de Revisión de Casitas',
  description: 'Sistema moderno para la gestión y control de revisiones',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        {/* 🚀 OPTIMIZACIÓN: Preconnect para recursos críticos */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA Theme Colors */}
        <meta name="theme-color" content="#c9a45c" />
        <meta name="msapplication-TileColor" content="#c9a45c" />
        <meta name="msapplication-navbutton-color" content="#c9a45c" />
        
        {/* PWA Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-96x96.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/icon-96x96.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/icon-96x96.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/icon-72x72.png" />
        
        {/* PWA Mobile App Capabilities */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Casitas" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* PWA Windows Tiles */}
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="none" />
        
        {/* PWA Service Worker Registration */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // PWA Install Detection
            let deferredPrompt;
            
            window.addEventListener('beforeinstallprompt', (e) => {
              console.log('🎉 beforeinstallprompt evento detectado - PWA es instalable!');
              e.preventDefault();
              deferredPrompt = e;
              // Aquí podrías mostrar tu propio botón de instalación
            });
            
            window.addEventListener('appinstalled', (evt) => {
              console.log('✅ PWA fue instalada exitosamente');
            });
            
            // Service Worker Registration con manejo de actualizaciones modernas
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('✅ SW registered: ', registration);
                    
                    // Manejar actualizaciones
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nueva versión disponible
                            console.log('🔄 Nueva versión disponible');
                            
                            // Mostrar notificación de actualización
                            if (confirm('Nueva versión disponible. ¿Actualizar ahora?')) {
                              newWorker.postMessage({ type: 'SKIP_WAITING' });
                            }
                          }
                        });
                      }
                    });
                    
                    // 🚀 OPTIMIZADO: Verificar actualizaciones menos frecuentemente y solo cuando es necesario
                    let updateCheckInterval: NodeJS.Timeout | null = null;
                    const scheduleUpdateCheck = () => {
                      if (updateCheckInterval) clearInterval(updateCheckInterval);
                      updateCheckInterval = setTimeout(() => {
                        if (document.visibilityState === 'visible' && navigator.onLine) {
                          registration.update();
                        }
                        scheduleUpdateCheck();
                      }, 600000); // 🚀 OPTIMIZADO: Cada 10 minutos en lugar de 5
                    };
                    
                    // Solo verificar cuando la página sea visible
                    document.addEventListener('visibilitychange', () => {
                      if (document.visibilityState === 'visible') {
                        scheduleUpdateCheck();
                      } else if (updateCheckInterval) {
                        clearInterval(updateCheckInterval);
                      }
                    });
                    
                    scheduleUpdateCheck();
                    
                  })
                  .catch((registrationError) => {
                    console.log('❌ SW registration failed: ', registrationError);
                  });
              });
              
              // Escuchar cuando el SW se actualiza
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('🔄 Controlador de SW actualizado');
                window.location.reload();
              });
              
              // Escuchar mensajes del SW
              navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'CACHE_CLEARED') {
                  console.log('🗑️ Cache limpiado');
                }
              });
            }
            
            // Funciones globales para debugging y control manual
            window.clearPWACache = function() {
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
                console.log('🗑️ Solicitando limpieza de cache...');
              } else {
                console.log('❌ No hay Service Worker activo');
              }
            };
            
            window.forceUpdatePWA = function() {
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'FORCE_UPDATE' });
                console.log('🔄 Forzando actualización de PWA...');
                setTimeout(() => window.location.reload(), 2000);
              } else {
                console.log('❌ No hay Service Worker activo');
              }
            };
            
            // Diagnóstico PWA completo después de cargar
            window.addEventListener('load', () => {
              setTimeout(() => {
                console.log('=== DIAGNÓSTICO PWA COMPLETO ===');
                console.log('User Agent:', navigator.userAgent);
                console.log('Service Worker Support:', 'serviceWorker' in navigator);
                console.log('beforeinstallprompt Support:', 'onbeforeinstallprompt' in window);
                console.log('HTTPS:', location.protocol === 'https:');
                console.log('Display Mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
                
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(registrations => {
                    console.log('Service Workers registrados:', registrations.length);
                    registrations.forEach((reg, index) => {
                      console.log(\`SW \${index}:\`, reg.scope, reg.active ? 'activated' : 'not active');
                    });
                  });
                }
                
                // Verificar manifest
                const manifestLink = document.querySelector('link[rel="manifest"]');
                if (manifestLink) {
                  fetch(manifestLink.href)
                    .then(response => response.json())
                    .then(manifest => {
                      console.log('Manifest válido:', manifest);
                      console.log('Icons disponibles:', manifest.icons?.length || 0);
                      console.log('Display:', manifest.display);
                      console.log('Start URL:', manifest.start_url);
                    })
                    .catch(err => console.log('❌ Error cargando manifest:', err));
                }
                
                // Test de rutas críticas
                testCriticalRoutes();
                
              }, 2000);
            });
            
            // Test de rutas críticas para PWA
            async function testCriticalRoutes() {
              const criticalRoutes = ['/estadisticas', '/unir-imagenes', '/nueva-revision'];
              console.log('🧪 Testing rutas críticas...');
              
              for (const route of criticalRoutes) {
                try {
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 5000);
                  
                  const response = await fetch(route, { 
                    method: 'HEAD',
                    signal: controller.signal
                  });
                  
                  clearTimeout(timeoutId);
                  
                  if (response.ok) {
                    console.log(\`✅ Ruta \${route}: OK\`);
                  } else {
                    console.log(\`⚠️ Ruta \${route}: \${response.status}\`);
                  }
                } catch (error) {
                  if (error.name === 'AbortError') {
                    console.log(\`⏱️ Ruta \${route}: Timeout\`);
                  } else {
                    console.log(\`❌ Ruta \${route}: \${error.message}\`);
                  }
                }
              }
            }
            
            // Manejo de errores de esquema
            window.addEventListener('error', (e) => {
              if (e.message && e.message.includes('schema cache')) {
                console.error('🔥 Error de esquema Supabase detectado:', e.message);
                console.log('💡 Sugerencia: El esquema de la base de datos puede estar desactualizado');
              }
            });
            
            // Interceptar fetch errors para debugging
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
              return originalFetch.apply(this, args).catch(error => {
                if (error.message.includes('Failed to fetch')) {
                  console.warn('🌐 Error de conectividad:', args[0]);
                }
                throw error;
              });
            };
          `
        }} />
      </head>
      <body className={roboto.className}>
        <ChromeCompatibilityFix />
        <AuthProvider>
          <ToastProvider>
                      <UploadProvider>
            {children}
            <UploadIndicator />
            <UploadRecovery />
          </UploadProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
