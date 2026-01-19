'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// Tipos para los filtros
export type AdvancedFilterType = 'all' | 'latest' | 'no-yute' | 'has-yute-1' | 'has-yute-2' | 'no-trapo-binocular' | 'has-trapo-binocular' | 'no-sombrero' | 'has-sombrero' | 'no-bulto' | 'today' | 'no-cola-caballo';

export interface RevisionFilters {
  searchTerm: string;
  cajaFuerte: string;
  date: string;
  advancedFilter: AdvancedFilterType;
}

interface UsePaginatedRevisionesProps {
  page: number;
  pageSize: number;
  filters: RevisionFilters;
}

interface RevisionStats {
  topRevisor: { name: string; count: number } | null;
  topCheckOut: { name: string; count: number } | null;
  topCasita: { name: string; count: number } | null;
  topCheckInCasita: { name: string; count: number } | null;
  checkInCount: number;
}

// Hook principal para paginación desde servidor
export function useRevisionesPaginated({ page, pageSize, filters }: UsePaginatedRevisionesProps) {
  const [data, setData] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce ref para búsqueda
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Construir la query base con filtros
  const buildQuery = (query: any) => {
    // 1. Filtro de búsqueda (Buscador general)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
      const isNumeric = /^\d+$/.test(term);

      if (isNumeric) {
        // Si el término es puramente numérico, buscamos coincidencia exacta en 'casita'
        // para evitar que al buscar "1" aparezcan "11", "12", etc.
        // Pero mantenemos ilike para otros campos por flexibilidad.
        query = query.or(`casita.eq.${term},quien_revisa.ilike.%${term}%,caja_fuerte.ilike.%${term}%`);
      } else {
        // Búsqueda parcial normal para términos no numéricos
        query = query.or(`casita.ilike.%${term}%,quien_revisa.ilike.%${term}%,caja_fuerte.ilike.%${term}%`);
      }
    }

    // 2. Filtro de Caja Fuerte
    if (filters.cajaFuerte) {
      query = query.eq('caja_fuerte', filters.cajaFuerte);
    }

    // 3. Filtro de Fecha
    if (filters.date) {
      // filters.date viene como YYYY-MM-DD
      // Buscamos registros que empiecen con esa fecha (ignorando hora)
      // O usamos gte y lte. 
      // created_at es timestamptz.
      // Mejor: cast created_at to date? No siempre indexado.
      // Usamos rango del día.
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);
      
      query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
    }

    // 4. Filtros Avanzados
    if (filters.advancedFilter !== 'all') {
      switch (filters.advancedFilter) {
        case 'no-yute':
          query = query.eq('bolso_yute', '0');
          break;
        case 'has-yute-1':
          query = query.eq('bolso_yute', '01');
          break;
        case 'has-yute-2':
          query = query.eq('bolso_yute', '02');
          break;
        case 'no-trapo-binocular':
          query = query.eq('trapo_binoculares', 'No');
          break;
        case 'has-trapo-binocular':
          query = query.eq('trapo_binoculares', 'Si');
          break;
        case 'no-sombrero':
          query = query.eq('sombrero', 'No');
          break;
        case 'has-sombrero':
          query = query.eq('sombrero', 'Si');
          break;
        case 'no-bulto':
          query = query.eq('bulto', 'No');
          break;
        case 'no-cola-caballo':
          query = query.eq('cola_caballo', 'No');
          break;
        case 'today':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tonight = new Date();
            tonight.setHours(23, 59, 59, 999);
            query = query.gte('created_at', today.toISOString()).lte('created_at', tonight.toISOString());
            break;
        // 'latest' es especial y difícil de hacer en server-side pagination directa sin SQL complejo.
        // Lo manejaremos aparte o aceptaremos que 'latest' carga diferente.
      }
    }

    return query;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Manejo especial para filtro 'latest' (Última de cada casita)
      if (filters.advancedFilter === 'latest') {
        // Estrategia compromiso para 'latest':
        // Traer las ultimas 2000, y filtrar en cliente (mucho más rápido que traer 10000).
        // No es paginación real server-side efficient, pero resuelve el caso de uso sin RPC.
        const { data: rawData, error: rawError } = await supabase
          .from('revisiones_casitas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(2000);

        if (rawError) throw rawError;

        if (rawData) {
           const latestByCasita = new Map();
           rawData.forEach((row: any) => {
             if (!latestByCasita.has(row.casita)) {
               latestByCasita.set(row.casita, row);
             }
           });
           
           let finalData = Array.from(latestByCasita.values());
           // Ordenar por número de casita
           finalData.sort((a: any, b: any) => {
             const numA = parseInt(a.casita, 10) || 0;
             const numB = parseInt(b.casita, 10) || 0;
             return numA - numB;
           });

           // Aplicar filtros en cliente (el hook recibe filtros que de otro modo se ignoran en 'latest')
           if (filters.searchTerm) {
             const term = filters.searchTerm.toLowerCase().trim();
             const isNumeric = /^\d+$/.test(term);
             
             finalData = finalData.filter((row: any) => {
               if (isNumeric) {
                 // Coincidencia exacta para número en casita
                 return row.casita === term || 
                        (row.quien_revisa && row.quien_revisa.toLowerCase().includes(term)) ||
                        (row.caja_fuerte && row.caja_fuerte.toLowerCase().includes(term));
               } else {
                 return (row.casita && row.casita.toLowerCase().includes(term)) ||
                        (row.quien_revisa && row.quien_revisa.toLowerCase().includes(term)) ||
                        (row.caja_fuerte && row.caja_fuerte.toLowerCase().includes(term));
               }
             });
           }
           
           if (filters.cajaFuerte) {
             finalData = finalData.filter((row: any) => row.caja_fuerte === filters.cajaFuerte);
           }
           
           if (filters.date) {
             finalData = finalData.filter((row: any) => {
               try {
                 const rowDate = new Date(row.created_at).toISOString().split('T')[0];
                 return rowDate === filters.date;
               } catch (e) {
                 return false;
               }
             });
           }

           // Aplicar paginación en cliente a este set reducido
           const start = (page - 1) * pageSize;
           const end = start + pageSize;
           
           setCount(finalData.length);
           setData(finalData.slice(start, end));
        }
        setLoading(false);
        return;
      }


      // Estrategia Normal Server-Side
      let query = supabase
        .from('revisiones_casitas')
        // select count as exact para saber total de páginas
        .select('*', { count: 'exact' });

      query = buildQuery(query);

      // Orden default por fecha
      query = query.order('created_at', { ascending: false });

      // Paginación
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: fetchedData, count: fetchedCount, error: fetchedError } = await query;

      if (fetchedError) throw fetchedError;

      setData(fetchedData || []);
      if (fetchedCount !== null) setCount(fetchedCount);

    } catch (err: any) {
      console.error('Error fetching revisiones:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters.searchTerm, filters.cajaFuerte, filters.date, filters.advancedFilter]);

  // Debounce para fetch cuando cambian filtros de texto
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
        fetchData();
    }, 300); // 300ms delay

    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fetchData]);

  // Refrescar manual
  const refresh = () => {
    fetchData();
  };

  return { data, count, loading, error, refresh };
}


// Nuevo Hook optimizado para Estadísticas (carga ligera)
export function useRevisionesStats() {
    const [stats, setStats] = useState<RevisionStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Solo traemos las columnas necesarias para las estadísticas
                // Evitamos traer fotos (data pesada)
                const { data, error } = await supabase
                    .from('revisiones_casitas')
                    .select('casita, quien_revisa, caja_fuerte')
                    // Limitamos a ultimos 2000 para que sea "stats recientes" y rápido,
                    // O quitamos el limite si se quieren stats históricos absolutos (pero cuidado con performance si crece a 100k)
                    // Por ahora traemos TODO pero solo columnas clave. Supabase aguanta bien seleccionar 10k rows si son pocas columnas.
                    .limit(5000); 

                if (error) throw error;

                if (!data) return;

                // Calcular Stats en cliente (memory cheap con pocas columnas)
                const revisorCounts: Record<string, number> = {};
                const checkOutCounts: Record<string, number> = {};
                const checkInCasitaCounts: Record<string, number> = {};
                const casitaCounts: Record<string, number> = {};
                let checkInCount = 0;

                data.forEach(row => {
                    // Top Revisor
                    const revisor = row.quien_revisa || 'Desconocido';
                    revisorCounts[revisor] = (revisorCounts[revisor] || 0) + 1;

                    // Top Casita
                    const casita = row.casita || 'Desconocida';
                    casitaCounts[casita] = (casitaCounts[casita] || 0) + 1;

                    // Caja Fuerte Logica
                    if (row.caja_fuerte === 'Check out') {
                        checkOutCounts[revisor] = (checkOutCounts[revisor] || 0) + 1;
                    }
                    if (row.caja_fuerte === 'Check in') {
                        checkInCount++;
                        checkInCasitaCounts[casita] = (checkInCasitaCounts[casita] || 0) + 1;
                    }
                });

                // Helpers para sort
                const getTop = (record: Record<string, number>) => {
                    const entries = Object.entries(record);
                    if (entries.length === 0) return null;
                    const sorted = entries.sort((a, b) => b[1] - a[1]);
                    return { name: sorted[0][0], count: sorted[0][1] };
                };

                setStats({
                    topRevisor: getTop(revisorCounts),
                    topCheckOut: getTop(checkOutCounts),
                    topCasita: getTop(casitaCounts),
                    topCheckInCasita: getTop(checkInCasitaCounts),
                    checkInCount
                });

            } catch (err) {
                console.error("Error loading stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading };
}

// Mantener exportación legacy por si algo explota inmediato, pero se recomienda cambiar
export function useRevisiones() {
    // Versión Dummy que devuelve vacío para obligar refactor
    return { data: [], loading: false, error: 'Deprecado: Usar useRevisionesPaginated' };
}
