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

// 📱 Detección de dispositivo móvil
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

// ⏱️ Configuración de timeouts específicos por dispositivo
const getTimeoutConfig = () => {
  const mobile = isMobile();
  return {
    queryTimeout: mobile ? 15000 : 10000, // 15s para móviles, 10s para desktop
    retryDelay: mobile ? 2000 : 1000,     // 2s para móviles, 1s para desktop
    maxRetries: mobile ? 2 : 3            // Menos reintentos en móviles
  };
};

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

  // 🚀 Función de carga de datos optimizada con manejo de errores mejorado
  const loadData = useCallback(async (isRefresh = false) => {
    const { queryTimeout, retryDelay, maxRetries } = getTimeoutConfig();
    let retryCount = 0;

    const attemptLoad = async (): Promise<void> => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
        
        // ✅ Verificar conexión primero
        console.log(`🔍 Verificando conexión a Supabase... (Intento ${retryCount + 1}/${maxRetries + 1})`);
        
        // ✅ Crear promise con timeout
        const queryPromise = supabase
          .from('revisiones_casitas')
          .select('id, quien_revisa, caja_fuerte, casita, created_at', { count: 'exact' })
          .not('id', 'is', null) // ✅ Asegurar que el ID existe
          .not('casita', 'is', null) // ✅ Asegurar que casita existe
          .order('created_at', { ascending: false })
          .limit(1000); // ✅ Limitar resultados para evitar sobrecarga

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: La consulta tardó demasiado en responder')), queryTimeout);
        });

        // ✅ Ejecutar con timeout
        const { data, error: supabaseError, count } = await Promise.race([
          queryPromise,
          timeoutPromise
        ]) as any;

        if (supabaseError) {
          console.error('❌ Error específico de Supabase:', supabaseError);
          console.error('❌ Código de error:', supabaseError.code);
          console.error('❌ Mensaje:', supabaseError.message);
          console.error('❌ Detalles:', supabaseError.details);
          
          // ✅ Manejo de errores más específico
          if (supabaseError.code === 'PGRST116') {
            throw new Error('Error de consulta: múltiples resultados inesperados. Intenta actualizar la página.');
          } else if (supabaseError.code === 'PGRST301') {
            throw new Error('Problema de permisos en la base de datos. Contacta al administrador.');
          } else if (supabaseError.message.includes('JSON')) {
            throw new Error('Error de formato de datos. La aplicación se actualizará automáticamente.');
          } else {
            throw supabaseError;
          }
        }

        // ✅ Validar que data es un array
        if (!Array.isArray(data)) {
          console.error('❌ Los datos recibidos no son un array:', data);
          throw new Error('Formato de datos incorrecto recibido del servidor.');
        }

        // ✅ Filtrar datos válidos
        const validData = data.filter(item => 
          item && 
          item.id !== null && 
          item.id !== undefined &&
          typeof item.casita === 'string' &&
          item.casita.trim() !== ''
        );

        console.log(`✅ Datos válidos: ${validData.length} de ${data.length} registros totales`);
        console.log(`✅ Total en BD: ${count || 'desconocido'} registros`);

        setRevisioinesData(validData as RevisionCasita[]);
        console.log(`✅ Cargados ${validData.length} registros válidos`);
        
      } catch (err: any) {
        console.error(`❌ Error en intento ${retryCount + 1}:`, err);

        // ✅ Retry logic para errores de red o timeout
        if (retryCount < maxRetries && 
           (err.message?.includes('fetch') || 
            err.message?.includes('Timeout') || 
            err.message?.includes('network') ||
            err.message?.includes('Failed to fetch'))) {
          
          retryCount++;
          console.log(`🔄 Reintentando en ${retryDelay}ms... (${retryCount}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return attemptLoad();
        }

        let errorMessage = 'Error al cargar datos. Verifica tu conexión.';
        
        // ✅ Mensajes de error más específicos para móviles
        if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
          errorMessage = 'Error de conexión. Verifica tu señal de internet y reinténtalo.';
        } else if (err.message?.includes('JSON')) {
          errorMessage = 'Error de formato de datos. Cierra y vuelve a abrir la aplicación.';
        } else if (err.message?.includes('timeout') || err.message?.includes('Timeout')) {
          errorMessage = 'Tiempo de espera agotado. Tu conexión puede ser lenta, reinténtalo.';
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        console.error('❌ Error detallado en loadData:', {
          error: err,
          message: err.message,
          code: err.code,
          details: err.details,
          stack: err.stack,
          retryCount,
          isMobileDevice: isMobile()
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    return attemptLoad();
  }, []);

  // 🌐 Verificación de conectividad inicial
  useEffect(() => {
    const checkConnectionAndLoad = async () => {
      if (!authLoading && isLoggedIn) {
        const { queryTimeout } = getTimeoutConfig();
        
        try {
          console.log('🔍 Verificando conectividad inicial...');
          console.log('📱 Dispositivo móvil:', isMobile());
          
          // ✅ Test de conectividad con consulta mínima y timeout
          const connectivityPromise = supabase
            .from('revisiones_casitas')
            .select('id')
            .limit(1);

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout en verificación inicial')), queryTimeout);
          });

          const { data: testData, error: testError } = await Promise.race([
            connectivityPromise,
            timeoutPromise
          ]) as any;

          if (testError) {
            console.error('❌ Error de conectividad inicial:', testError);
            if (testError.message.includes('JSON') || testError.code === 'PGRST116') {
              setError('Error de conectividad. Por favor, cierra y abre la aplicación nuevamente.');
            } else if (testError.message.includes('timeout') || testError.message.includes('Timeout')) {
              setError('Conexión lenta detectada. Revisa tu señal de internet.');
            } else {
              setError('Error de conexión inicial. Verifica tu conexión a internet.');
            }
            setLoading(false);
            return;
          }

          console.log('✅ Conectividad verificada, cargando datos...');
          loadData();
        } catch (error: any) {
          console.error('❌ Error verificando conectividad:', error);
          if (error.message?.includes('Timeout')) {
            setError('Tiempo de espera agotado. Tu conexión es muy lenta.');
          } else {
            setError('Error de red. Verifica tu conexión a internet y reinténtalo.');
          }
          setLoading(false);
        }
      }
    };

    checkConnectionAndLoad();
  }, [authLoading, isLoggedIn, loadData]);

  // 🔄 Sistema de actualización automática en horas clave
  useEffect(() => {
    if (!isLoggedIn || loading) return;

    const setupAutoRefresh = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      
      // Calcular próxima hora clave (12:00 o 22:00)
      let nextRefreshTime = new Date(now);
      
      if (currentHour < 12) {
        // Próximo refresh a las 12:00
        nextRefreshTime.setHours(12, 0, 0, 0);
      } else if (currentHour < 22) {
        // Próximo refresh a las 22:00
        nextRefreshTime.setHours(22, 0, 0, 0);
      } else {
        // Próximo refresh a las 12:00 del día siguiente
        nextRefreshTime.setDate(nextRefreshTime.getDate() + 1);
        nextRefreshTime.setHours(12, 0, 0, 0);
      }
      
      const timeUntilRefresh = nextRefreshTime.getTime() - now.getTime();
      
      console.log(`🔄 Programando actualización automática en ${Math.round(timeUntilRefresh / 1000 / 60)} minutos (a las ${nextRefreshTime.toLocaleTimeString('es-ES')})`);
      
      const timeout = setTimeout(() => {
        console.log('🔄 Actualizando automáticamente por cambio de período de tiempo...');
        loadData(true);
        setupAutoRefresh(); // Programar el siguiente refresh
      }, timeUntilRefresh);
      
      return timeout;
    };

    const timeoutId = setupAutoRefresh();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoggedIn, loading, loadData]);

  // 🎯 Debounced refresh para evitar múltiples llamadas (optimizado para móviles)
  const debouncedRefresh = useMemo(
    () => debounce(() => loadData(true), 500), // ✅ Delay más largo para móviles
    [loadData]
  );

  // 🕒 Función para obtener rangos de fechas específicos por tipo con ventana deslizante
  const getTimeRanges = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 🔄 Lógica de ventana deslizante para Check In
    // Si ya pasaron las 12:00, usar el período actual (hoy 18:00 → mañana 12:00)
    // Si no han llegado las 12:00, usar el período anterior (ayer 18:00 → hoy 12:00)
    let checkInStartDate, checkInEndDate;
    
    if (currentHour >= 12) {
      // Ya pasaron las 12:00 - mostrar período actual hasta mañana 12:00
      checkInStartDate = new Date(currentDate);
      checkInEndDate = new Date(currentDate);
      checkInEndDate.setDate(checkInEndDate.getDate() + 1);
    } else {
      // Aún no llegan las 12:00 - mostrar período anterior hasta hoy 12:00
      checkInStartDate = new Date(currentDate);
      checkInStartDate.setDate(checkInStartDate.getDate() - 1);
      checkInEndDate = new Date(currentDate);
    }
    
    const checkInStart = new Date(checkInStartDate);
    checkInStart.setHours(18, 0, 0, 0);
    const checkInEnd = new Date(checkInEndDate);
    checkInEnd.setHours(12, 0, 0, 0);
    
    // 🔄 Lógica de ventana deslizante para Upsell (período extendido de 28 horas)
    // Siempre desde 18:00 del día anterior hasta 22:00 del día actual
    // Solo cambia de período cuando pasan las 22:00 del día actual
    let upsellStartDate, upsellEndDate;
    
    if (currentHour >= 22) {
      // Ya pasaron las 22:00 - cambiar al siguiente período (hoy 18:00 → mañana 22:00)
      upsellStartDate = new Date(currentDate);
      upsellEndDate = new Date(currentDate);
      upsellEndDate.setDate(upsellEndDate.getDate() + 1);
    } else {
      // Antes de las 22:00 - período actual extendido (ayer 18:00 → hoy 22:00)
      upsellStartDate = new Date(currentDate);
      upsellStartDate.setDate(upsellStartDate.getDate() - 1);
      upsellEndDate = new Date(currentDate);
    }
    
    const upsellStart = new Date(upsellStartDate);
    upsellStart.setHours(18, 0, 0, 0);
    const upsellEnd = new Date(upsellEndDate);
    upsellEnd.setHours(22, 0, 0, 0);
    
    console.log('🕒 Rangos de tiempo actualizados automáticamente:', {
      currentTime: now.toLocaleString('es-ES'),
      currentHour,
      checkIn: {
        from: checkInStart.toLocaleString('es-ES'),
        to: checkInEnd.toLocaleString('es-ES'),
        status: currentHour >= 12 ? 'Período actual' : 'Período anterior'
      },
      upsell: {
        from: upsellStart.toLocaleString('es-ES'),
        to: upsellEnd.toLocaleString('es-ES'),
        status: currentHour >= 22 ? 'Nuevo período' : 'Período extendido (28 horas)',
        duration: '28 horas continuas'
      }
    });
    
    return { 
      checkIn: { startTime: checkInStart, endTime: checkInEnd },
      upsell: { startTime: upsellStart, endTime: upsellEnd }
    };
  }, []);

  // 📋 Procesamiento de datos con horarios específicos y validación mejorada
  const processedData = useMemo(() => {
    // ✅ Validar que tenemos datos antes de procesar
    if (!Array.isArray(revisioinesData) || revisioinesData.length === 0) {
      console.log('⚠️ No hay datos para procesar');
      return { checkIns: [], checkOuts: [], upsells: [] };
    }

    try {
      const timeRanges = getTimeRanges();
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      console.log('🕒 Procesando datos con rangos específicos:', {
        checkIn: timeRanges.checkIn,
        upsell: timeRanges.upsell,
        todayStart,
        todayEnd
      });

      // ✅ Función helper para validar y crear item de revisión
      const createRevisionItem = (item: RevisionCasita, tipo: 'Check In' | 'Check Out' | 'Upsell') => {
        // Validar datos requeridos
        if (!item || !item.created_at) {
          console.warn('⚠️ Item sin fecha válida:', item);
          return null;
        }

        try {
          const fecha = new Date(item.created_at);
          
          // Validar que la fecha es válida
          if (isNaN(fecha.getTime())) {
            console.warn('⚠️ Fecha inválida en item:', item);
            return null;
          }

          return {
            id: item.id,
            casita: String(item.casita || 'N/A').trim(),
            fecha,
            revisor: String(item.quien_revisa || 'N/A').trim(),
            tipo
          };
        } catch (error) {
          console.error('❌ Error procesando item:', item, error);
          return null;
        }
      };

      // Check Ins: 18:00 día anterior hasta 12:00 día actual
      const checkIns = revisioinesData
        .filter(item => {
          try {
            if (!item?.created_at || item.caja_fuerte !== CHECK_IN_VALUE) return false;
            const itemDate = new Date(item.created_at);
            return !isNaN(itemDate.getTime()) && 
                   itemDate >= timeRanges.checkIn.startTime && 
                   itemDate <= timeRanges.checkIn.endTime;
          } catch (error) {
            console.warn('⚠️ Error filtrando Check In:', item, error);
            return false;
          }
        })
        .map(item => createRevisionItem(item, 'Check In'))
        .filter(item => item !== null) // Remover items inválidos
        .sort((a, b) => {
          if (!a?.fecha || !b?.fecha) return 0;
          return b.fecha.getTime() - a.fecha.getTime();
        });

      // Check Outs: Solo día actual completo
      const checkOuts = revisioinesData
        .filter(item => {
          try {
            if (!item?.created_at || item.caja_fuerte !== CHECK_OUT_VALUE) return false;
            const itemDate = new Date(item.created_at);
            return !isNaN(itemDate.getTime()) && itemDate >= todayStart && itemDate < todayEnd;
          } catch (error) {
            console.warn('⚠️ Error filtrando Check Out:', item, error);
            return false;
          }
        })
        .map(item => createRevisionItem(item, 'Check Out'))
        .filter(item => item !== null) // Remover items inválidos
        .sort((a, b) => {
          if (!a?.fecha || !b?.fecha) return 0;
          return b.fecha.getTime() - a.fecha.getTime();
        });

      // Upsells: 18:00 día anterior hasta 22:00 día actual
      const upsells = revisioinesData
        .filter(item => {
          try {
            if (!item?.created_at || item.caja_fuerte !== UPSELL_VALUE) return false;
            const itemDate = new Date(item.created_at);
            return !isNaN(itemDate.getTime()) && 
                   itemDate >= timeRanges.upsell.startTime && 
                   itemDate <= timeRanges.upsell.endTime;
          } catch (error) {
            console.warn('⚠️ Error filtrando Upsell:', item, error);
            return false;
          }
        })
        .map(item => createRevisionItem(item, 'Upsell'))
        .filter(item => item !== null) // Remover items inválidos
        .sort((a, b) => {
          if (!a?.fecha || !b?.fecha) return 0;
          return b.fecha.getTime() - a.fecha.getTime();
        });

      console.log(`✅ Datos procesados - Check Ins: ${checkIns.length}, Check Outs: ${checkOuts.length}, Upsells: ${upsells.length}`);

      return { checkIns, checkOuts, upsells };
    } catch (error) {
      console.error('❌ Error procesando datos:', error);
      return { checkIns: [], checkOuts: [], upsells: [] };
    }
  }, [revisioinesData, getTimeRanges, new Date().getHours()]); // 🔄 Actualizar cuando cambie la hora

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

  const timeRanges = getTimeRanges();
  const now = new Date();
  const currentHour = now.getHours();
  
  // 📅 Textos dinámicos que se actualizan según la hora actual
  const checkInTimeText = `Desde ${timeRanges.checkIn.startTime.toLocaleDateString('es-ES')} a las 18:00 hasta ${timeRanges.checkIn.endTime.toLocaleDateString('es-ES')} a las 12:00 ${currentHour >= 12 ? '(Período actual)' : '(Período anterior)'}`;
  const upsellTimeText = `Desde ${timeRanges.upsell.startTime.toLocaleDateString('es-ES')} a las 18:00 hasta ${timeRanges.upsell.endTime.toLocaleDateString('es-ES')} a las 22:00 ${currentHour >= 22 ? '(Nuevo período)' : '(Período extendido 28h)'}`;
  const todayText = `Día actual: ${now.toLocaleDateString('es-ES')} - ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{
        background: '#334d50',
        backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)',
        ['WebkitBackgroundImage' as any]: '-webkit-linear-gradient(to left, #cbcaa5, #334d50)'
      }}
    >
      <div className="min-h-screen p-4 md:p-8">
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
            checkInTimeText
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
            upsellTimeText
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
    </main>
  );
} 