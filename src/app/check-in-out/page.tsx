'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';

// 🎯 Tipos TypeScript para la nueva página
interface RevisionCasita {
  id?: number;
  quien_revisa: string | null;
  caja_fuerte: string | null;
  casita: string | null;
  created_at?: string;
}

interface RevisionItem {
  id?: number;
  casita: string;
  fecha: Date | null;
  revisor: string;
  tipo: 'Check In' | 'Check Out' | 'Upsell';
}

// 🎨 Constantes
const CHECK_IN_VALUE = 'Check in';
const CHECK_OUT_VALUE = 'Check out';
const UPSELL_VALUE = 'Upsell';

// 🚀 Función debounce ligera para optimizaciones de rendimiento
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
}

export default function CheckInOutPage() {
  const router = useRouter();
  const { isLoggedIn, userRole, isLoading: authLoading } = useAuth();
  
  // Estados principales optimizados
  const [revisioinesData, setRevisioinesData] = useState<RevisionCasita[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 🛡️ Verificación de autenticación
  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        console.warn('🚫 Usuario no autenticado, redirigiendo...');
        router.push('/');
        return;
      }
      console.log('✅ Usuario autenticado correctamente');
    }
  }, [authLoading, isLoggedIn, router]);

  // 🚀 Función de carga de datos optimizada
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('revisiones_casitas')
        .select('id, quien_revisa, caja_fuerte, casita, created_at')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('❌ Error fetching data:', supabaseError);
        throw supabaseError;
      }

      setRevisioinesData(data as RevisionCasita[] || []);
      console.log(`✅ Cargados ${data?.length || 0} registros`);
      
    } catch (err) {
      const errorMessage = 'Error al cargar datos. Verifica tu conexión.';
      setError(errorMessage);
      console.error('❌ Error en loadData:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 🎯 Debounced refresh para evitar múltiples llamadas
  const debouncedRefresh = useMemo(
    () => debounce(() => loadData(true), 300),
    [loadData]
  );

  // Efecto inicial de carga
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      console.log('✅ Usuario autenticado, cargando datos...');
      loadData();
    }
  }, [authLoading, isLoggedIn, loadData]);

  // 🕒 Función para obtener el rango de fechas (18:00 día anterior hasta 12:00 día actual)
  const getTimeRange = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 18:00 del día anterior
    const startTime = new Date(yesterday);
    startTime.setHours(18, 0, 0, 0);
    
    // 12:00 del día actual
    const endTime = new Date(today);
    endTime.setHours(12, 0, 0, 0);
    
    return { startTime, endTime };
  }, []);

  // 📋 Procesamiento de datos con horarios específicos
  const processedData = useMemo(() => {
    const { startTime, endTime } = getTimeRange();
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Check Ins: 18:00 día anterior hasta 12:00 día actual
    const checkIns = revisioinesData
      .filter(item => {
        if (!item.created_at || item.caja_fuerte !== CHECK_IN_VALUE) return false;
        const itemDate = new Date(item.created_at);
        return itemDate >= startTime && itemDate <= endTime;
      })
      .map(item => ({
        id: item.id,
        casita: item.casita || 'N/A',
        fecha: item.created_at ? new Date(item.created_at) : null,
        revisor: item.quien_revisa || 'N/A',
        tipo: 'Check In' as const
      }))
      .sort((a, b) => {
        if (!a.fecha || !b.fecha) return 0;
        return b.fecha.getTime() - a.fecha.getTime();
      });

    // Check Outs: Solo día actual completo
    const checkOuts = revisioinesData
      .filter(item => {
        if (!item.created_at || item.caja_fuerte !== CHECK_OUT_VALUE) return false;
        const itemDate = new Date(item.created_at);
        return itemDate >= todayStart && itemDate < todayEnd;
      })
      .map(item => ({
        id: item.id,
        casita: item.casita || 'N/A',
        fecha: item.created_at ? new Date(item.created_at) : null,
        revisor: item.quien_revisa || 'N/A',
        tipo: 'Check Out' as const
      }))
      .sort((a, b) => {
        if (!a.fecha || !b.fecha) return 0;
        return b.fecha.getTime() - a.fecha.getTime();
      });

    // Upsells: 18:00 día anterior hasta 12:00 día actual
    const upsells = revisioinesData
      .filter(item => {
        if (!item.created_at || item.caja_fuerte !== UPSELL_VALUE) return false;
        const itemDate = new Date(item.created_at);
        return itemDate >= startTime && itemDate <= endTime;
      })
      .map(item => ({
        id: item.id,
        casita: item.casita || 'N/A',
        fecha: item.created_at ? new Date(item.created_at) : null,
        revisor: item.quien_revisa || 'N/A',
        tipo: 'Upsell' as const
      }))
      .sort((a, b) => {
        if (!a.fecha || !b.fecha) return 0;
        return b.fecha.getTime() - a.fecha.getTime();
      });

    return { checkIns, checkOuts, upsells };
  }, [revisioinesData, getTimeRange]);

  // 🛡️ Guards de renderizado
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-[#2a3347]/95 rounded-2xl border border-[#c9a45c]/20 p-8 shadow-2xl">
          <LoadingSpinner />
          <p className="text-[#c9a45c] text-center mt-4 font-medium">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-[#2a3347]/95 rounded-2xl border border-[#c9a45c]/20 p-8 shadow-2xl">
          <LoadingSpinner />
          <p className="text-[#c9a45c] text-center mt-4 font-medium">Cargando revisiones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-[#2a3347] rounded-2xl border border-red-500/30 p-8 shadow-2xl text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error al cargar datos</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-[#c9a45c] text-white rounded-lg hover:bg-[#f0c987] transition-colors duration-200 font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // 🎨 Función para renderizar sección de revisiones
  const renderSection = (
    title: string,
    data: RevisionItem[],
    color: { bg: string; text: string; border: string },
    icon: React.ReactElement,
    timeRange?: string
  ) => (
    <section className="mb-8">
      <div className="bg-[#2a3347]/95 rounded-2xl border border-[#c9a45c]/20 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 ${color.bg} rounded-xl flex items-center justify-center`}>
            {React.cloneElement(icon, { className: `w-6 h-6 ${color.text}` })}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${color.text}`}>{title}</h3>
            {timeRange && (
              <p className="text-gray-400 text-sm">{timeRange}</p>
            )}
          </div>
          <div className="ml-auto">
            <div className={`${color.bg} px-3 py-1 rounded-full`}>
              <span className={`${color.text} font-semibold text-sm`}>
                {data.length} {title.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item, index) => (
              <div 
                key={`${item.casita}-${index}`}
                onClick={() => item.id && router.push(`/detalles/${item.id}`)}
                className={`bg-[#1a1f35]/50 rounded-xl ${color.border} p-4 hover:border-opacity-60 transition-all duration-300 group cursor-pointer hover:bg-[#1a1f35]/70 hover:shadow-lg`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${color.bg} rounded-lg flex items-center justify-center`}>
                      <svg className={`w-4 h-4 ${color.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                      </svg>
                    </div>
                    <span className={`${color.text} font-bold text-lg`}>
                      Casita {item.casita}
                    </span>
                  </div>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${color.text.replace('text-', 'bg-')}`}></div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-300">
                      {item.fecha 
                        ? item.fecha.toLocaleDateString('es-ES', { 
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) + ' ' + item.fecha.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : 'Fecha no disponible'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    <span className="text-gray-300">
                      {item.revisor}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" />
                    </svg>
                    <span className={`${color.text} font-medium`}>
                      {item.tipo}
                    </span>
                  </div>
                  
                  {/* Indicador de clic para ver detalles */}
                  <div className={`flex items-center gap-2 text-xs mt-3 pt-2 border-t ${color.border.replace('border-', 'border-').replace('/20', '/10')}`}>
                    <svg className={`w-3 h-3 ${color.text} opacity-70 group-hover:opacity-100 transition-opacity duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className={`${color.text} opacity-70 group-hover:opacity-100 transition-opacity duration-300`}>
                      Clic para ver detalles
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-400 mb-2">No hay {title.toLowerCase()}</h4>
            <p className="text-gray-500 text-sm">
              No se han registrado {title.toLowerCase()} en el período especificado.
            </p>
          </div>
        )}
      </div>
    </section>
  );

  const { startTime, endTime } = getTimeRange();
  const timeRangeText = `Desde ${startTime.toLocaleDateString('es-ES')} a las 18:00 hasta ${endTime.toLocaleDateString('es-ES')} a las 12:00`;
  const todayText = `Día actual: ${new Date().toLocaleDateString('es-ES')}`;

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="bg-[#2a3347]/95 rounded-2xl border border-[#c9a45c]/20 p-6 md:p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#c9a45c] via-[#f0c987] to-[#ff8c42] bg-clip-text text-transparent">
                  Check In/Out Revisiones
                </h1>
                <p className="text-gray-300 mt-2">Monitoreo de actividades de revisión</p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Botón de refresh */}
                <button
                  onClick={debouncedRefresh}
                  disabled={refreshing}
                  className="px-4 py-2 bg-[#c9a45c]/20 hover:bg-[#c9a45c]/30 border border-[#c9a45c]/40 text-[#c9a45c] rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshing ? 'Actualizando...' : 'Actualizar'}
                </button>
                
                {/* Botón volver */}
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

        {/* Secciones de datos */}
        {renderSection(
          'Check Ins',
          processedData.checkIns,
          {
            bg: 'bg-green-500/20',
            text: 'text-green-400',
            border: 'border border-green-500/20'
          },
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>,
          timeRangeText
        )}

        {renderSection(
          'Check Outs',
          processedData.checkOuts,
          {
            bg: 'bg-orange-500/20',
            text: 'text-orange-400',
            border: 'border border-orange-500/20'
          },
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>,
          todayText
        )}

        {renderSection(
          'Upsells',
          processedData.upsells,
          {
            bg: 'bg-blue-500/20',
            text: 'text-blue-400',
            border: 'border border-blue-500/20'
          },
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>,
          timeRangeText
        )}

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="bg-[#2a3347]/95 rounded-2xl border border-[#c9a45c]/20 p-4 shadow-2xl">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Revision Casitas AG. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
} 