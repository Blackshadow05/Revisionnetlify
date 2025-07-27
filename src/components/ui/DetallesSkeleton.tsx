'use client';

import { memo } from 'react';

const DetallesSkeleton = memo(() => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f35] to-[#2d3748] p-4">
      {/* Header con animación */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#c9a45c]/20 to-[#c9a45c]/40 rounded-xl animate-pulse"></div>
            <div>
              <div className="h-8 w-48 bg-gradient-to-r from-[#c9a45c]/20 to-[#c9a45c]/40 rounded-lg animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-gray-600/40 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-24 h-10 bg-blue-500/20 rounded-lg animate-pulse"></div>
            <div className="w-24 h-10 bg-green-500/20 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Grid de cards principales */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Card de Casita */}
        <div className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#c9a45c]/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#c9a45c]/30 rounded-lg animate-pulse"></div>
              <div className="h-5 w-16 bg-[#c9a45c]/30 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-24 bg-white/20 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Card de Fecha */}
        <div className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500/30 rounded-lg animate-pulse"></div>
              <div className="h-5 w-32 bg-blue-400/30 rounded animate-pulse"></div>
            </div>
            <div className="h-6 w-40 bg-white/20 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Card de Revisor */}
        <div className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-500/30 rounded-lg animate-pulse"></div>
              <div className="h-5 w-28 bg-green-400/30 rounded animate-pulse"></div>
            </div>
            <div className="h-6 w-32 bg-white/20 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Grid de elementos de revisión */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="bg-gray-800/60 p-4 rounded-lg border border-gray-600/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-[#ff8c42]/30 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-[#ff8c42]/30 rounded animate-pulse"></div>
            </div>
            <div className="h-5 w-16 bg-gray-300/20 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Sección de evidencias */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-gray-800/60 p-4 rounded-lg border border-gray-600/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-[#ff8c42]/30 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-[#ff8c42]/30 rounded animate-pulse"></div>
            </div>
            <div className="w-full h-48 bg-gray-700/40 rounded-lg animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Sección de notas */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-600/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-[#ff8c42]/30 rounded animate-pulse"></div>
            <div className="h-4 w-12 bg-[#ff8c42]/30 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-300/20 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-300/20 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-gray-300/20 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Animación de carga central */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-[#1e2538]/95 backdrop-blur-sm rounded-2xl p-8 border border-[#c9a45c]/30 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#c9a45c]/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[#c9a45c] rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <h3 className="text-[#c9a45c] font-bold text-lg mb-1">Cargando detalles</h3>
              <p className="text-gray-400 text-sm">Preparando la información...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

DetallesSkeleton.displayName = 'DetallesSkeleton';

export default DetallesSkeleton;