import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Roboto } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { UploadProvider } from '@/context/UploadContext'
import { ToastProvider } from '@/context/ToastContext'
import UploadIndicator from '@/components/UploadIndicator'
import UploadRecovery from '@/components/UploadRecovery'
import InstallPrompter from '@/components/InstallPrompter'
import UpdateNotifier from '@/components/UpdateNotifier'

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
        
        {/* El manejo de instalación de PWA ahora se hace a través del componente InstallPrompter */}
      </head>
      <body className={roboto.className}>
        <AuthProvider>
          <ToastProvider>
            <UploadProvider>
              {children}
              <UploadIndicator />
              <UploadRecovery />
              <InstallPrompter />
              <UpdateNotifier />
            </UploadProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
