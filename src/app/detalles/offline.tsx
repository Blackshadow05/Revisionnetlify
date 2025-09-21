'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function DetallesOfflinePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: '#334d50',
      backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
    }}>
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-12 h-12 bg-[#c9a45c] hover:bg-[#b8934d] rounded-xl flex items-center justify-center transition-colors shadow-lg flex-shrink-0"
            >
              <svg className="h-6 w-6 text-[#1a1f35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">
                Detalles de Revisión
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido offline */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#1e2538]/90 p-8 rounded-xl border border-[#3d4659]/50 shadow-lg text-center">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">
            Sin conexión a internet
          </h2>

          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            No se pueden cargar los detalles de la revisión porque no hay conexión a internet.
            Los datos se cargarán automáticamente cuando vuelvas a estar online.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#1f2937]/50 rounded-xl border border-gray-600/30 p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Datos de Revisión</h3>
              <p className="text-gray-400 text-sm">Información detallada de la casita</p>
            </div>

            <div className="bg-[#1f2937]/50 rounded-xl border border-gray-600/30 p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Notas y Ediciones</h3>
              <p className="text-gray-400 text-sm">Historial de cambios y observaciones</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#c9a45c] text-white rounded-xl hover:bg-[#f0c987] transition-colors duration-200 font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reintentar conexión
            </button>

            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/40 text-gray-300 rounded-xl transition-all duration-200 font-medium"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}