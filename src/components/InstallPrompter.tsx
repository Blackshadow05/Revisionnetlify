
'use client';
import { useState, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export default function InstallPrompter() {
  const { isDesktop } = useDeviceDetection();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // No mostrar ni suscribirse a eventos en escritorio
    if (isDesktop) return;

    // Respetar preferencia del usuario de ocultar el banner
    const hidden = typeof window !== 'undefined' && localStorage.getItem('hideInstallPrompt') === 'true';
    if (hidden) return;

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA instalada');
      setIsVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isDesktop]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Resultado instalación: ${outcome}`);

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
    // Guardar en localStorage para no mostrar de nuevo
    localStorage.setItem('hideInstallPrompt', 'true');
  };

  // Nunca renderizar en escritorio
  if (isDesktop) return null;
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-sm z-50 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-500 hover:scale-[1.02] backdrop-blur-sm">
        {/* Header con gradiente suave */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
                <FiDownload className="text-white text-xl" />
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Instalar App
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:rotate-90 hover:scale-110"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        {/* Contenido principal simplificado */}
        <div className="px-6 py-5">
          <button
            onClick={handleInstall}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center space-x-2">
              <FiDownload className="text-lg" />
              <span>Instalar ahora</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}