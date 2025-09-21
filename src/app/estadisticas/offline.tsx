'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function EstadisticasOfflinePage() {
  const router = useRouter();

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{
        background: '#334d50',
        backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
      }}
    >
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="bg-[#2a3347]/95 backdrop-blur-xl rounded-2xl border border-[#c9a45c]/20 p-6 md:p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#c9a45c] via-[#f0c987] to-[#ff8c42] bg-clip-text text-transparent">
                  Estadísticas de Revisiones
                </h1>
                <p className="text-gray-300 mt-2">Panel de control y análisis de datos</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/40 text-gray-300 rounded-xl transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido offline */}
        <div className="bg-[#2a3347]/95 backdrop-blur-xl rounded-2xl border border-[#c9a45c]/20 p-8 shadow-2xl text-center">
          <div className="w-24 h-24 bg-[#c9a45c]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">
            Sin conexión a internet
          </h2>

          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            No se pueden cargar las estadísticas porque no hay conexión a internet.
            Los datos se actualizarán automáticamente cuando vuelvas a estar online.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Tarjetas de estadísticas offline */}
            <div className="bg-[#1f2937]/50 rounded-xl border border-gray-600/30 p-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Total Revisiones</h3>
              <div className="text-3xl font-bold text-gray-500">--</div>
              <p className="text-sm text-gray-400 mt-1">Año actual</p>
            </div>

            <div className="bg-[#1f2937]/50 rounded-xl border border-gray-600/30 p-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Revisiones Hoy</h3>
              <div className="text-3xl font-bold text-gray-500">--</div>
              <p className="text-sm text-gray-400 mt-1">{new Date().toLocaleDateString('es-ES')}</p>
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

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="bg-[#2a3347]/95 backdrop-blur-xl rounded-2xl border border-[#c9a45c]/20 p-4 shadow-2xl">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Revision Casitas AG. Funcionando en modo offline.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}