
'use client';
import { useState, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';

export default function InstallPrompter() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
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
  }, []);

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

        {/* Contenido principal */}
        <div className="px-6 py-5">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🏠</span>
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                Accede rápidamente a todas las funciones de la app desde tu pantalla de inicio. 
                <span className="font-medium text-gray-900">¡Es más rápido y cómodo!</span>
              </p>
              
              {/* Características */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Acceso sin conexión</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Notificaciones push</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Experiencia móvil optimizada</span>
                </div>
              </div>

              {/* Botón de instalación */}
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
      </div>
    </div>
  );
}