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
    <div className="fixed bottom-4 right-4 w-full max-w-md z-50 animate-fade-in-up">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105">
        <div className="p-4 flex items-start">
          <div className="flex-shrink-0">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <FiDownload className="text-white text-2xl" />
            </div>
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-bold text-white">Instalar la App</h3>
            <p className="mt-1 text-blue-100">
              Agrega esta aplicación a tu pantalla de inicio para una mejor experiencia.
            </p>
            
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleInstall}
                className="flex-1 bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Instalar ahora
              </button>
              
              <button
                onClick={handleClose}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}