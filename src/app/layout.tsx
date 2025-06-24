import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { UploadProvider } from '@/context/UploadContext'
import { ToastProvider } from '@/context/ToastContext'
import UploadIndicator from '@/components/UploadIndicator'
import UploadRecovery from '@/components/UploadRecovery'

const inter = Inter({ subsets: ['latin'] })

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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA Theme Colors */}
        <meta name="theme-color" content="#c9a45c" />
        <meta name="msapplication-TileColor" content="#c9a45c" />
        <meta name="msapplication-navbutton-color" content="#c9a45c" />
        
        {/* PWA Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-152x152.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-128x128.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/icon-128x128.png" />
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
            
            // Service Worker Registration
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('✅ SW registered: ', registration);
                  })
                  .catch((registrationError) => {
                    console.log('❌ SW registration failed: ', registrationError);
                  });
              });
            }
            
            // Diagnóstico PWA después de cargar
            window.addEventListener('load', () => {
              setTimeout(() => {
                console.log('=== DIAGNÓSTICO PWA ===');
                console.log('User Agent:', navigator.userAgent);
                console.log('Service Worker Support:', 'serviceWorker' in navigator);
                console.log('beforeinstallprompt Support:', 'onbeforeinstallprompt' in window);
                
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
                      console.log('Manifest:', manifest);
                      console.log('Icons:', manifest.icons);
                      console.log('Display:', manifest.display);
                      console.log('Start URL:', manifest.start_url);
                    })
                    .catch(err => console.log('Error cargando manifest:', err));
                }
              }, 2000);
            });
          `
        }} />
      </head>
      <body className={inter.className}>
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
