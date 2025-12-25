'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function ConfiguracionPage() {
  const router = useRouter();
  const { isLoggedIn, logout, userRole } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Opciones de configuración */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gestion de usuarios */}
          <button
            onClick={() => router.push('/gestion-usuarios')}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl hover:border-[#c9a45c] transition-all duration-300 group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#c9a45c]/20 group-hover:bg-[#c9a45c]/30 transition-colors duration-300">
                <svg className="w-6 h-6 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-black mb-1">Gestión de Usuarios</h2>
                <p className="text-gray-600 text-sm">Administrar usuarios y permisos del sistema</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#c9a45c] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Reportes */}
          <button
            onClick={() => router.push('/reportes')}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl hover:border-[#c9a45c] transition-all duration-300 group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#c9a45c]/20 group-hover:bg-[#c9a45c]/30 transition-colors duration-300">
                <svg className="w-6 h-6 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-black mb-1">Reportes</h2>
                <p className="text-gray-600 text-sm">Ver y generar reportes del sistema</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#c9a45c] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Estadisticas */}
          <button
            onClick={() => router.push('/estadisticas')}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl hover:border-[#c9a45c] transition-all duration-300 group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#c9a45c]/20 group-hover:bg-[#c9a45c]/30 transition-colors duration-300">
                <svg className="w-6 h-6 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-black mb-1">Estadísticas</h2>
                <p className="text-gray-600 text-sm">Ver estadísticas y análisis de datos</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#c9a45c] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Cerrar sesion */}
          <button
            onClick={handleLogout}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl hover:border-red-500 transition-all duration-300 group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-300">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-500 mb-1">Cerrar Sesión</h2>
                <p className="text-gray-600 text-sm">Salir de tu cuenta actual</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Información del usuario */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-black mb-4">Información de la sesión</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Rol:</span>
              <span className="text-[#c9a45c] font-medium">{userRole || 'Usuario'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className="text-green-500 font-medium">Conectado</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
