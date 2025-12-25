'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';
import LazyInView from '@/components/ui/LazyInView';
import { useRevisionStatistics, clearRevisionStatisticsCache } from '@/hooks/useStatisticsCache';


// 🚀 Importación dinámica optimizada con mejor loading
const BarChartComponent = dynamic(() => import('@/components/BarChartComponent'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg h-96 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#c9a45c] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-600 font-medium">Cargando gráfico...</span>
      </div>
    </div>
  )
});

const AreaCheckInChart = dynamic(() => import('@/components/AreaCheckInChart'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg h-96 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#c9a45c] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-600 font-medium">Cargando gráfico...</span>
      </div>
    </div>
  )
});

// 🎯 Tipos TypeScript mejorados y más específicos
interface RevisionCasita {
  id?: number;
  quien_revisa: string | null;
  caja_fuerte: string | null;
  casita: string | null;
  created_at?: string;
}

interface ChartDataItem {
  name: string;
  value: number;
}

interface StatCard {
  title: string;
  value: number;
  icon: React.ReactElement;
  color: string;
  description: string;
}

interface ProcessedStats {
  totalRevisiones: number;
  revisionesHoy: number;
  casitasCheckIn: ChartDataItem[];
  revisionesPorPersona: ChartDataItem[];
  checkOutsPorPersona: ChartDataItem[];
}

// 🎨 Constantes de colores actualizadas para consistencia con el diseño
const CHART_COLORS = {
  PRIMARY: '#c9a45c',
  SECONDARY: '#f0c987', 
  TERTIARY: '#ff8c42',
  SUCCESS: '#10b981',
  INFO: '#3b82f6'
} as const;

const CHECK_IN_VALUE = 'Check in';
const CHECK_OUT_VALUE = 'Check out';

// 🚀 Función debounce ligera para optimizaciones de rendimiento
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
}

export default function EstadisticasPage() {
 const router = useRouter();
 const { isLoggedIn, isLoading: authLoading } = useAuth();

  // Hook de cache para estadísticas
  const {
    data: statisticsData,
    loading: cacheLoading,
    error: cacheError,
    isFromCache,
    lastUpdated,
    refresh: refreshCache
  } = useRevisionStatistics();

  // Estados adicionales para UI
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const currentYear = new Date().getFullYear();

  // 🛡️ Verificación de autenticación mejorada para producción
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

  // Función de refresh optimizada
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshCache();
    } finally {
      setRefreshing(false);
    }
  }, [refreshCache]);

  // 🎯 Debounced refresh para evitar múltiples llamadas
  const debouncedRefresh = useMemo(
    () => debounce(handleRefresh, 300),
    [handleRefresh]
  );

  // Datos derivados del cache
  const dataFilteredByCurrentYear = useMemo(() => {
    return statisticsData?.yearData || [];
  }, [statisticsData?.yearData]);

  const totalRevisionesCount = statisticsData?.totalRevisiones || 0;
  const revisionesHoy = statisticsData?.revisionesHoy || 0;

  // 🎯 Función optimizada para procesar datos de gráficos
  const processChartData = useCallback((
    data: RevisionCasita[], 
    keyExtractor: (item: RevisionCasita) => string | null,
    filterFn?: (item: RevisionCasita) => boolean,
    limit?: number
  ): ChartDataItem[] => {
    const filteredData = filterFn ? data.filter(filterFn) : data;
    
    const counts = filteredData.reduce((acc, item) => {
      const key = keyExtractor(item);
      if (key) {
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const sortedData = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return limit ? sortedData.slice(0, limit) : sortedData;
  }, []);

  // 🎯 Estadísticas procesadas (usando datos del cache)
  const processedStats: ProcessedStats = useMemo(() => {
    // Usar los datos que vienen del cache
    const totalRevisiones = totalRevisionesCount;

    const casitasCheckIn = processChartData(
      dataFilteredByCurrentYear,
      (item) => item.casita,
      (item) => item.caja_fuerte === CHECK_IN_VALUE,
      10
    );

    const revisionesPorPersona = processChartData(
      dataFilteredByCurrentYear, // Usar datos del año actual
      (item) => item.quien_revisa,
      undefined,
      20
    );

    const checkOutsPorPersona = processChartData(
      dataFilteredByCurrentYear,
      (item) => item.quien_revisa,
      (item) => item.caja_fuerte === CHECK_OUT_VALUE,
      10
    );

    return {
      totalRevisiones,
      revisionesHoy, // Usar el valor que viene del cache
      casitasCheckIn,
      revisionesPorPersona,
      checkOutsPorPersona
    };
  }, [dataFilteredByCurrentYear, processChartData, totalRevisionesCount, revisionesHoy]);

  // 🎯 Datos procesados para el gráfico de líneas de Check In por mes
  const checkInByMonth = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('es-ES', { month: 'long' }));
    const monthlyCounts = months.map((month, index) => {
      const count = dataFilteredByCurrentYear.filter(item => {
        if (!item.created_at) return false;
        const itemDate = new Date(item.created_at);
        return itemDate.getFullYear() === currentYear &&
               itemDate.getMonth() === index &&
               item.caja_fuerte === CHECK_IN_VALUE;
      }).length;
      return { name: month, value: count };
    });
    return monthlyCounts;
  }, [dataFilteredByCurrentYear, currentYear]);

  // 🎨 Tarjetas de estadísticas con diseño glassmorphism
  const statCards: StatCard[] = useMemo(() => [
    {
      title: 'Total Revisiones',
      value: processedStats.totalRevisiones,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-[#c9a45c]',
      description: 'Todos los registros'
    },
    {
      title: 'Revisiones Hoy',
      value: processedStats.revisionesHoy,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-[#f0c987]',
      description: new Date().toLocaleDateString('es-ES')
    }
  ], [processedStats]);

  // 🛡️ Guards de renderizado
  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
          <LoadingSpinner />
          <p className="text-[#c9a45c] text-center mt-4 font-medium">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  if (cacheLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
          <LoadingSpinner />
          <p className="text-[#c9a45c] text-center mt-4 font-medium">
            {isFromCache ? 'Cargando datos frescos...' : 'Cargando estadísticas...'}
          </p>
          {isFromCache && (
            <p className="text-gray-500 text-center mt-2 text-sm">
              Mostrando datos en cache mientras se actualizan
            </p>
          )}
        </div>
      </div>
    );
  }

  if (cacheError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-300 p-8 shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Error al cargar datos</h2>
          <p className="text-gray-600 mb-4">{cacheError}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-[#c9a45c] text-white rounded-lg hover:bg-[#f0c987] transition-colors duration-200 font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen bg-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-black">
                  Estadísticas de Revisiones
                </h1>
                <p className="text-gray-600 mt-2">Panel de control y análisis de datos</p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Botón de limpiar cache */}
                <button
                  onClick={() => {
                    clearRevisionStatisticsCache();
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 border border-red-300 text-red-600 rounded-xl transition-all duration-200 flex items-center gap-2"
                  title="Limpiar cache y recargar datos"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpiar Cache
                </button>

                {/* Botón volver */}
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 border border-gray-300 text-gray-700 rounded-xl transition-all duration-200 flex items-center gap-2"
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

        {/* Tarjetas de estadísticas */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {statCards.map((card, index) => (
              <div
                key={card.title}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg group hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-1">{card.title}</h3>
                    <p className="text-sm text-gray-500">{card.description}</p>
                  </div>
                  <div className={`${card.color} group-hover:scale-110 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-4xl font-bold ${card.color}`}>
                    {card.value.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gráficos con diseño glassmorphism mejorado */}
        <section className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <LazyInView className="cv-auto-384">
              <BarChartComponent
                data={processedStats.casitasCheckIn}
                title="Top Casitas - Check In"
                barColor={CHART_COLORS.PRIMARY}
                xAxisLabel="Casita"
                yAxisLabel="Check-ins"
              />
            </LazyInView>
          </div>
          
          <div className="xl:col-span-1">
            <LazyInView className="cv-auto-384">
              <BarChartComponent
                data={processedStats.revisionesPorPersona}
                title="Revisiones por Persona"
                barColor={CHART_COLORS.SECONDARY}
                xAxisLabel="Revisor"
                yAxisLabel="Total Revisiones"
              />
            </LazyInView>
          </div>

          <div className="xl:col-span-2 2xl:col-span-1">
            <LazyInView className="cv-auto-384">
              <BarChartComponent
                data={processedStats.checkOutsPorPersona}
                title="Check-outs por Persona"
                barColor={CHART_COLORS.TERTIARY}
                xAxisLabel="Revisor"
                yAxisLabel="Check-outs"
              />
            </LazyInView>
          </div>

          {/* Gráfico de área para Check In por mes */}
          <div className="xl:col-span-2">
            <LazyInView>
              <AreaCheckInChart data={checkInByMonth} currentYear={currentYear} />
            </LazyInView>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg">
            <p className="text-sm text-gray-500">
              © {currentYear} Revision Casitas AG. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
