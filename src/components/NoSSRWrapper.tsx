'use client';

import { useEffect, useState } from 'react';

interface NoSSRWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 🚀 COMPONENTE ANTI-HYDRATION
 * Evita errores de hydratación al renderizar contenido solo en el cliente
 * Específicamente diseñado para Netlify deployment
 */
export default function NoSSRWrapper({ children, fallback = null }: NoSSRWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Durante SSR y hasta que se monte, mostrar fallback
  if (!isMounted) {
    return (
      <div className="min-h-screen p-4 md:p-8" style={{
        background: '#334d50',
        backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
      }}>
        <main className="max-w-7xl mx-auto">
          {fallback || (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a45c]"></div>
              <span className="ml-3 text-gray-400">Cargando aplicación...</span>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Una vez montado, renderizar el contenido real
  return <>{children}</>;
} 