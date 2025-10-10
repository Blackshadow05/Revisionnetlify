'use client';
import { useState, useEffect } from 'react';

export default function InstallPrompter() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Capturar el evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    });

    // Verificar si la app ya está instalada
    window.addEventListener('appinstalled', () => {
      console.log('PWA instalada');
      setIsVisible(false);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Mostrar el prompt de instalación
    deferredPrompt.prompt();
    
    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Resultado instalación: ${outcome}`);
    
    // Resetear el prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      <button onClick={handleInstall}>
        Instalar App
      </button>
    </div>
  );
}