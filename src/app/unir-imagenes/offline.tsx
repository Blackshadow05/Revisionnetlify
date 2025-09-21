'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function UnirImagenesOfflinePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen relative overflow-hidden" style={{
      background: '#334d50',
      backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
    }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex justify-between items-center mb-6 md:mb-8 pt-6">
          <div className="relative">
            <h1 className="text-3xl font-bold text-white">Unir Imágenes</h1>
            <div className="relative mt-2 h-0.5 w-20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c9a45c] to-transparent rounded-full"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0c987] to-transparent rounded-full"></div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm text-white bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 rounded-xl hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden border border-gray-600/40 hover:border-gray-500/60 font-medium flex items-center justify-center gap-2"
              style={{ padding: '10px 18px' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0cb35]/80 to-transparent animate-[slide_2s_ease-in-out_infinite] z-0"></div>
              <div className="relative z-10 flex items-center gap-2">
                Volver
              </div>
            </button>
          </div>
        </header>

        {/* Contenido offline */}
        <div className="bg-[#2a3347]/80 backdrop-blur-sm rounded-xl shadow-xl p-8 mb-8 border border-[#3d4659] text-center">
          <div className="w-24 h-24 bg-[#c9a45c]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l2 2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">
            Sin conexión a internet
          </h2>

          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            No se puede acceder a la funcionalidad de unir imágenes porque no hay conexión a internet.
            Esta función requiere conexión para comprimir y procesar las imágenes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#1f2937]/50 rounded-xl border border-gray-600/30 p-6">
              <div className="w-12 h-12 bg-[#c9a45c]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Compresión de Imágenes</h3>
              <p className="text-gray-400 text-sm">Requiere conexión para optimizar imágenes</p>
            </div>

            <div className="bg-[#1f2937]/50 rounded-xl border border-gray-600/30 p-6">
              <div className="w-12 h-12 bg-[#c9a45c]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Unión de Imágenes</h3>
              <p className="text-gray-400 text-sm">Procesamiento local no disponible offline</p>
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

        <div className="text-center mt-8 pb-6">
          <button
            onClick={() => router.push('/')}
            className="text-[#c9a45c] hover:text-[#f0c987] transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Volver al inicio
          </button>
        </div>
      </div>
    </main>
  );
}