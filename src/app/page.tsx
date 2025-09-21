'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import Sidebar from '@/components/Sidebar';
import ImageModal from '@/components/revision/ImageModal';
import PageTitle from '@/components/ui/PageTitle';
import ViewToggle from '@/components/ui/ViewToggle';
import CardView from '@/components/revision/CardView';
import ShareModal from '@/components/ShareModal';
import { PuestoService } from '@/lib/puesto-service';
import { formatearFecha } from '@/lib/dateUtils';
import { MenuData } from '@/types/revision';

interface RevisionData {
  id?: string;
  created_at: string;
  casita: string;
  quien_revisa: string;
  caja_fuerte: string;
  puertas_ventanas: string;
  chromecast: string;
  binoculares: string;
  trapo_binoculares: string;
  speaker: string;
  usb_speaker: string;
  controles_tv: string;
  secadora: string;
  accesorios_secadora: string;

  steamer: string;
  bolsa_vapor: string;
  plancha_cabello: string;
  bulto: string;
  sombrero: string;
  bolso_yute: string;
  evidencia_01: string;
  evidencia_02: string;
  evidencia_03: string;
  fecha_edicion: string;
  quien_edito: string;
  datos_anteriores?: Record<string, unknown>;
  datos_actuales?: Record<string, unknown>;

  camas_ordenadas: string;
  cola_caballo: string;
  notas: string;
  notas_count: number;
}

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, userRole, login, logout, user } = useAuth();
  const pathname = usePathname();
  
  useEffect(() => {
    // Asegura ancla y foco en montaje
    let anchor = document.getElementById('page-top');
    if (!anchor) {
      anchor = document.createElement('div');
      anchor.id = 'page-top';
      anchor.setAttribute('tabindex', '-1');
      document.body.insertBefore(anchor, document.body.firstChild);
    }
    anchor?.focus();
  }, []);
  
  useEffect(() => {
    // En cambios de ruta
    if (!pathname) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    const anchor = document.getElementById('page-top');
    anchor?.focus();
  }, [pathname]);
  
  const [data, setData] = useState<RevisionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para estadísticas principales
  const [statsLoading, setStatsLoading] = useState(true);
  const [topRevisor, setTopRevisor] = useState<{name: string, count: number} | null>(null);
  const [topCheckOut, setTopCheckOut] = useState<{name: string, count: number} | null>(null);
  const [topCasita, setTopCasita] = useState<{name: string, count: number} | null>(null);
  const [checkInCount, setCheckInCount] = useState(0);
  const [topCheckInCasita, setTopCheckInCasita] = useState<{name: string, count: number} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cajaFuerteFilter, setCajaFuerteFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({
    usuario: '',
    password: ''
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportType, setReportType] = useState<'Revisión Casitas' | 'Puesto 01'>('Revisión Casitas');
  // Definir el tipo para el filtro activo
  type FilterType = 'all' | 'latest' | 'no-yute' | 'has-yute-1' | 'has-yute-2' | 'no-trapo-binocular' | 'no-sombrero' | 'no-bulto' | 'today' | 'no-cola-caballo';
  
  // Estado para el filtro activo: inicial estable en SSR. Leer localStorage en useEffect para evitar hydration mismatch.
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Función auxiliar para cambiar el filtro y guardarlo en localStorage
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    try {
      if (filter !== 'all') {
        localStorage.setItem('activeRevisionFilter', filter);
        // Actualizar timestamp cuando se aplica un filtro
        localStorage.setItem('revisionFiltersTimestamp', Date.now().toString());
      } else {
        localStorage.removeItem('activeRevisionFilter');
      }
    } catch (err) {
      console.log('Error al guardar activeRevisionFilter en localStorage:', err);
    }
    setShowFilterDropdown(false);
    setCurrentPage(1);
  };
  
  // Función para limpiar el filtro de fecha
  const clearDateFilter = () => {
    setDateFilter('');
    // También eliminamos del localStorage
    try {
      localStorage.removeItem('revisionDateFilter');
    } catch (err) {
      console.log('Error al eliminar revisionDateFilter de localStorage:', err);
    }
  };
  
  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchTerm('');
    setCajaFuerteFilter('');
    clearDateFilter();
    setActiveFilter('all');
    // Eliminar el timestamp cuando se limpian los filtros manualmente
    try {
      localStorage.removeItem('revisionFiltersTimestamp');
    } catch (err) {
      console.log('Error al eliminar revisionFiltersTimestamp de localStorage:', err);
    }
  };
  
  // Función para verificar y limpiar filtros si han pasado 20 minutos
  const checkAndClearFiltersIfExpired = () => {
    try {
      const filterTimestamp = localStorage.getItem('revisionFiltersTimestamp');
      if (filterTimestamp) {
        const timestamp = parseInt(filterTimestamp, 10);
        const now = Date.now();
        const twentyMinutes = 20 * 60 * 1000; // 20 minutos en milisegundos
        
        // Si han pasado más de 20 minutos, limpiamos los filtros
        if (now - timestamp > twentyMinutes) {
          clearAllFilters();
          localStorage.removeItem('revisionFiltersTimestamp');
          console.log('Filtros limpiados automáticamente después de 20 minutos de inactividad');
        }
      }
    } catch (err) {
      console.log('Error al verificar expiración de filtros:', err);
    }
  };
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Persistir el término de búsqueda en localStorage para que se mantenga al navegar a detalles y volver
  // Cargar el valor guardado al montar el componente (evita problemas de hydration al ejecutarse en cliente)
  useEffect(() => {
    try {
      // Verificar si los filtros deben limpiarse por inactividad
      checkAndClearFiltersIfExpired();
      
      const saved = localStorage.getItem('revisionSearchTerm');
      if (typeof saved === 'string' && saved.length > 0) {
        setSearchTerm(saved);
      }
    } catch (err) {
      console.log('Error al cargar revisionSearchTerm desde localStorage:', err);
    }
  }, []);

  // Verificar periódicamente si los filtros han expirado mientras el usuario está en la página
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndClearFiltersIfExpired();
    }, 60000); // Verificar cada minuto
    
    return () => clearInterval(interval);
  }, []);

  // Guardar el término de búsqueda cada vez que cambie. Si se limpia, se elimina de localStorage.
  useEffect(() => {
    try {
      if (searchTerm && searchTerm.length > 0) {
        localStorage.setItem('revisionSearchTerm', searchTerm);
        // Actualizar timestamp cuando se aplica un filtro
        localStorage.setItem('revisionFiltersTimestamp', Date.now().toString());
      } else {
        localStorage.removeItem('revisionSearchTerm');
      }
    } catch (err) {
      console.log('Error al guardar revisionSearchTerm en localStorage:', err);
    }
  }, [searchTerm]);
  
  // Persistir el filtro de fecha en localStorage
  useEffect(() => {
    try {
      const savedDate = localStorage.getItem('revisionDateFilter');
      if (typeof savedDate === 'string' && savedDate.length > 0) {
        setDateFilter(savedDate);
      }
    } catch (err) {
      console.log('Error al cargar revisionDateFilter desde localStorage:', err);
    }
  }, []);

  // Guardar el filtro de fecha cada vez que cambie. Si se limpia, se elimina de localStorage.
  useEffect(() => {
    try {
      if (dateFilter && dateFilter.length > 0) {
        localStorage.setItem('revisionDateFilter', dateFilter);
        // Actualizar timestamp cuando se aplica un filtro
        localStorage.setItem('revisionFiltersTimestamp', Date.now().toString());
      } else {
        localStorage.removeItem('revisionDateFilter');
      }
    } catch (err) {
      console.log('Error al guardar revisionDateFilter en localStorage:', err);
    }
  }, [dateFilter]);
  
  // Persistir el filtro de caja fuerte en localStorage
  useEffect(() => {
    try {
      const savedCajaFuerte = localStorage.getItem('revisionCajaFuerteFilter');
      if (typeof savedCajaFuerte === 'string' && savedCajaFuerte.length > 0) {
        setCajaFuerteFilter(savedCajaFuerte);
      }
    } catch (err) {
      console.log('Error al cargar revisionCajaFuerteFilter desde localStorage:', err);
    }
  }, []);

  // Guardar el filtro de caja fuerte cada vez que cambie. Si se limpia, se elimina de localStorage.
  useEffect(() => {
    try {
      if (cajaFuerteFilter && cajaFuerteFilter.length > 0) {
        localStorage.setItem('revisionCajaFuerteFilter', cajaFuerteFilter);
        // Actualizar timestamp cuando se aplica un filtro
        localStorage.setItem('revisionFiltersTimestamp', Date.now().toString());
      } else {
        localStorage.removeItem('revisionCajaFuerteFilter');
      }
    } catch (err) {
      console.log('Error al guardar revisionCajaFuerteFilter en localStorage:', err);
    }
  }, [cajaFuerteFilter]);
  
  // Persistir el filtro activo en localStorage
  useEffect(() => {
    try {
      const savedActiveFilter = localStorage.getItem('activeRevisionFilter');
      if (typeof savedActiveFilter === 'string' && savedActiveFilter.length > 0) {
        // Validar que el filtro sea uno de los valores permitidos
        const validFilters: FilterType[] = ['all', 'latest', 'no-yute', 'has-yute-1', 'has-yute-2', 'no-trapo-binocular', 'no-sombrero', 'no-bulto', 'today', 'no-cola-caballo'];
        if (validFilters.includes(savedActiveFilter as FilterType)) {
          setActiveFilter(savedActiveFilter as FilterType);
        }
      }
    } catch (err) {
      console.log('Error al cargar activeRevisionFilter desde localStorage:', err);
    }
  }, []);
  
  // Guardar el filtro activo cada vez que cambie. Si se limpia, se elimina de localStorage.
  useEffect(() => {
    try {
      if (activeFilter && activeFilter !== 'all') {
        localStorage.setItem('activeRevisionFilter', activeFilter);
        // Actualizar timestamp cuando se aplica un filtro
        localStorage.setItem('revisionFiltersTimestamp', Date.now().toString());
      } else {
        localStorage.removeItem('activeRevisionFilter');
      }
    } catch (err) {
      console.log('Error al guardar activeRevisionFilter en localStorage:', err);
    }
  }, [activeFilter]);
  
  // 🍽️ Estados para menú del día
  const [menuDelDia, setMenuDelDia] = useState<MenuData | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // 🚀 Estados para paginado
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(40);
  const [supabaseAwake, setSupabaseAwake] = useState(false);

  // 🎯 Estado para modo de vista (tabla/tarjeta) - inicial estable en SSR; se ajustará en cliente en useEffect
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // 📱 Estados para modal de compartir WhatsApp
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImages, setShareImages] = useState<string[]>([]);
  const [shareRevision, setShareRevision] = useState<RevisionData | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Función para manejar el toggle del menú
  const handleMenuToggle = () => {
    setShowSidebar(prev => !prev);
  };

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const cajaFuerteOptions = [
    'Si', 'No', 'Check in', 'Check out', 'Upsell', 'Guardar Upsell', 'Back to Back', 'Show Room'
  ];


  const searchInputRef = useRef<HTMLInputElement>(null);

  // 🍽️ Función para cargar el menú del día actual
  const fetchMenuDelDia = async () => {
    try {
      setLoadingMenu(true);
      // Obtener fecha local sin conversión UTC
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayLocal = `${year}-${month}-${day}`; // Formato YYYY-MM-DD
      
      console.log('Buscando menú para la fecha:', todayLocal);
      
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('fecha_menu', todayLocal)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error al cargar menú del día:', error);
        setMenuDelDia(null);
      } else {
        setMenuDelDia(data);
      }
    } catch (err) {
      console.error('Error al cargar menú del día:', err);
      setMenuDelDia(null);
    } finally {
      setLoadingMenu(false);
    }
  };

  // 🍽️ Función para parsear el contenido del menú
  const parseMenuContent = (contenidoMenu: string) => {
    try {
      return JSON.parse(contenidoMenu);
    } catch (err) {
      console.error('Error al parsear contenido del menú:', err);
      return null;
    }
  };

  // 🍽️ Efecto para cargar el menú del día
  useEffect(() => {
    fetchMenuDelDia();
  }, []);

  // 🔄 Efecto para despertar el servidor de Supabase con un ping silencioso
  useEffect(() => {
    const wakeupSupabase = async () => {
      console.log('🚀 Despertando Supabase con consulta real...');
      try {
        // Consulta específica para despertar la tabla revisiones_casitas
        const startTime = performance.now();
        const { data, error } = await supabase
          .from('revisiones_casitas')
          .select('*')
          .eq('id', '8b96beb1-87fb-4cbe-9925-f50846e6b191')
          .single();
        
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        if (error) {
          console.error('❌ Error al consultar Supabase:', error.message);
          console.log('📊 Supabase respondió pero con error - servidor activo');
        } else {
          console.log(`✅ Supabase despertado exitosamente (${responseTime}ms)`);
          console.log('📋 Datos recuperados (no mostrados en UI):', data ? 'Registro encontrado' : 'Registro no encontrado');
          setSupabaseAwake(true);
        }
      } catch (err) {
        console.error('❌ Error al despertar Supabase:', err);
      }
    };
    
    // Ejecutar el ping silencioso inmediatamente al cargar la página
    wakeupSupabase();
  }, []);

  // Efecto para cargar preferencia de vista desde sessionStorage
  useEffect(() => {
    try {
      const savedViewMode = sessionStorage.getItem('revisionViewMode');
      if (savedViewMode === 'card' || savedViewMode === 'table') {
        setViewMode(savedViewMode);
        return;
      }
    } catch (error) {
      console.log('Error al cargar preferencia de vista:', error);
    }
    // Si no hay preferencia guardada, detectar ancho en cliente (solo en cliente)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('card');
    }
  }, []);

  // Bandera de montaje para evitar mismatches SSR/CSR en condiciones que dependen de valores del cliente
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🎯 Función para cambiar modo de vista
  const handleViewModeChange = (newMode: 'table' | 'card') => {
    setViewMode(newMode);
    try {
      sessionStorage.setItem('revisionViewMode', newMode);
    } catch (error) {
      console.log('Error al guardar preferencia de vista:', error);
    }
  };

  useEffect(() => {
    fetchRevisiones();
  }, []);

  // 🚀 Efecto para detectar dispositivo y ajustar elementos por página
  // Paginación fija de 40 registros por página para todos los dispositivos
  useEffect(() => {
    setItemsPerPage(40);
    setCurrentPage(1);
  }, []);

  // 🚀 Efecto para precargar la página de detalles en caché
  useEffect(() => {
    const prefetchDetailsPages = async () => {
      try {
        // Prefetch de la ruta dinámica de detalles
        // Next.js automáticamente manejará el caché
        await router.prefetch('/detalles/[id]');
        console.log('✅ Página de detalles precargada en caché');
      } catch (error) {
        console.log('⚠️ Error al precargar página de detalles:', error);
        // Silencioso - no afecta la funcionalidad principal
      }
    };

    // Ejecutar después de que la página principal se haya cargado
    if (typeof window !== 'undefined' && router) {
      prefetchDetailsPages();
    }
  }, [router]);

  // Cerrar sidebar con tecla ESC se maneja dentro del componente Sidebar

  // Cerrar dropdown de filtros al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  const fetchRevisiones = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar la conexión con Supabase
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        throw new Error('No se pudo conectar con la base de datos. Por favor, verifica tu conexión.');
      }

      // Cargar todos los registros en lotes para evitar límites
      let allData: RevisionData[] = [];
      let start = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('revisiones_casitas')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(start, start + batchSize - 1);
        
        if (error) {
          console.error('Error fetching data:', error);
          throw new Error('Error al cargar los datos: ' + error.message);
        }
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          start += batchSize;
          // Si el lote tiene menos registros que el tamaño del lote, ya no hay más datos
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      if (!allData) {
        throw new Error('No se encontraron datos');
      }

      setData(allData);
    } catch (error: unknown) {
      console.error('Error in fetchData:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular estadísticas principales
  const calcularEstadisticas = useCallback(() => {
    if (!data || data.length === 0) return;

    // Calcular quién ha revisado más
    const revisorCounts = data.reduce((acc, item) => {
      const name = item.quien_revisa || 'Desconocido';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topRevisorEntry = Object.entries(revisorCounts)
      .sort((a, b) => b[1] - a[1])[0];

    setTopRevisor({
      name: topRevisorEntry[0],
      count: topRevisorEntry[1]
    });

    // Calcular quién ha realizado más check-out
    const checkOutCounts = data
      .filter(item => item.caja_fuerte === 'Check out')
      .reduce((acc, item) => {
        const name = item.quien_revisa || 'Desconocido';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topCheckOutEntry = Object.entries(checkOutCounts)
      .sort((a, b) => b[1] - a[1])[0];

    setTopCheckOut(topCheckOutEntry ? {
      name: topCheckOutEntry[0],
      count: topCheckOutEntry[1]
    } : null);

    // Calcular qué casita tiene más registros
    const casitaCounts = data.reduce((acc, item) => {
      const name = item.casita || 'Desconocida';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCasitaEntry = Object.entries(casitaCounts)
      .sort((a, b) => b[1] - a[1])[0];

    setTopCasita({
      name: topCasitaEntry[0],
      count: topCasitaEntry[1]
    });
    setCheckInCount(data.filter(item => item.caja_fuerte === 'Check in').length);

    // Calcular qué casita tiene más "Check in"
    const checkInCasitaCounts = data
      .filter(item => item.caja_fuerte === 'Check in')
      .reduce((acc, item) => {
        const name = item.casita || 'Desconocida';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topCheckInCasitaEntry = Object.entries(checkInCasitaCounts).sort((a, b) => b[1] - a[1])[0];

    setTopCheckInCasita(topCheckInCasitaEntry ? {
      name: topCheckInCasitaEntry[0],
      count: topCheckInCasitaEntry[1]
    } : null);
  }, [data]);

  // Calcular estadísticas cuando los datos cambian
  useEffect(() => {
    if (data.length > 0) {
      setStatsLoading(false);
      calcularEstadisticas();
    }
  }, [data, calcularEstadisticas]);

  const filteredData = data.filter(row => {
    const searchLower = searchTerm.toLowerCase();

    const cajaFuerteMatch = !cajaFuerteFilter || row.caja_fuerte === cajaFuerteFilter;
    
    // Date filter logic
    const dateMatch = !dateFilter || (row.created_at && row.created_at.startsWith(dateFilter));

    if (!searchTerm && !dateFilter) {
      return cajaFuerteMatch;
    }

    const searchMatch = searchTerm ? (
      row.casita.toLowerCase() === searchLower ||
      row.quien_revisa.toLowerCase().includes(searchLower) ||
      row.caja_fuerte.toLowerCase().includes(searchLower)
    ) : true;

    return cajaFuerteMatch && searchMatch && dateMatch;
  });

  const applyAdvancedFilters = (data: RevisionData[]) => {
    if (activeFilter === 'all') {
      return data;
    }

    // Helper function to get latest revision per casita
    const getLatestByCasita = () => {
      const latestByCasita = new Map<string, RevisionData>();
      
      data.forEach(row => {
        const existing = latestByCasita.get(row.casita);
        if (!existing || new Date(row.created_at) > new Date(existing.created_at)) {
          latestByCasita.set(row.casita, row);
        }
      });
      
      return Array.from(latestByCasita.values()).sort((a, b) => {
        const numA = parseInt(a.casita, 10);
        const numB = parseInt(b.casita, 10);
        return numA - numB;
      });
    };

    if (activeFilter === 'latest') {
      return getLatestByCasita();
    }

    if (activeFilter === 'no-yute') {
      return getLatestByCasita()
        .filter(row => row.bolso_yute === '0');
    }

    if (activeFilter === 'has-yute-1') {
      return getLatestByCasita()
        .filter(row => row.bolso_yute === '01');
    }

    if (activeFilter === 'has-yute-2') {
      return getLatestByCasita()
        .filter(row => row.bolso_yute === '02');
    }

    if (activeFilter === 'no-trapo-binocular') {
      return getLatestByCasita()
        .filter(row => row.trapo_binoculares === 'No');
    }

    if (activeFilter === 'no-sombrero') {
      return getLatestByCasita()
        .filter(row => row.sombrero === 'No');
    }

    if (activeFilter === 'no-bulto') {
      return getLatestByCasita()
        .filter(row => row.bulto === 'No');
    }

    if (activeFilter === 'no-cola-caballo') {
      return getLatestByCasita()
        .filter(row => row.cola_caballo === 'No');
    }

    if (activeFilter === 'today') {
      // Ejecutar este filtro solo en cliente para evitar hydration mismatch.
      // Si todavía no estamos montados en el cliente, devolvemos los datos sin filtrar.
      if (!mounted) {
        return data;
      }

      // Obtener la fecha de hoy en formato YYYY-MM-DD usando la fecha local del dispositivo
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexados
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      
      console.log('Filtrando por fecha local de hoy:', todayStr);
      
      // Filtrar revisiones de hoy y ordenar por casita ascendente
      const todayRevisions = data.filter(row => {
        if (!row.created_at) return false;
        
        // Convertir la fecha UTC de la base de datos a fecha local
        const rowDate = new Date(row.created_at);
        const rowYear = rowDate.getFullYear();
        const rowMonth = String(rowDate.getMonth() + 1).padStart(2, '0');
        const rowDay = String(rowDate.getDate()).padStart(2, '0');
        const rowDateStr = `${rowYear}-${rowMonth}-${rowDay}`;
        
        const isToday = rowDateStr === todayStr;
        
        if (isToday) {
          console.log('Revisión de hoy encontrada:', row.casita, rowDateStr, 'original:', row.created_at);
        }
        
        return isToday;
      });
      
      console.log(`Se encontraron ${todayRevisions.length} revisiones de hoy (fecha local: ${todayStr})`);
      
      // Ordenar por casita ascendente
      return todayRevisions.sort((a, b) => {
        const numA = parseInt(a.casita, 10) || 0;
        const numB = parseInt(b.casita, 10) || 0;
        return numA - numB;
      });
    }

    return data;
  };

  const finalFilteredData = applyAdvancedFilters(filteredData);

  // 🚀 Cálculos de paginado
  const totalItems = finalFilteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = finalFilteredData.slice(startIndex, endIndex);



  // 🚀 Funciones de navegación de páginas
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPrevious = () => goToPage(currentPage - 1);
  const goToNext = () => goToPage(currentPage + 1);

  // Reset página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, cajaFuerteFilter]);

  const openModal = (imgUrl: string) => {
    setModalImg(imgUrl);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalImg(null);
  };

  // Modal functions simplified - using ImageModal component

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tableContainerRef.current) {
      setStartX(e.pageX - tableContainerRef.current.offsetLeft);
      setScrollLeft(tableContainerRef.current.scrollLeft);
      tableContainerRef.current.style.cursor = 'grabbing';
      tableContainerRef.current.style.userSelect = 'none';
    }
  };

  const handleMouseLeave = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.style.cursor = 'grab';
      tableContainerRef.current.style.userSelect = 'auto';
    }
    setStartX(0);
    setScrollLeft(0);
  };

  const handleMouseUp = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.style.cursor = 'grab';
      tableContainerRef.current.style.userSelect = 'auto';
    }
    setStartX(0);
    setScrollLeft(0);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (startX && tableContainerRef.current) {
      e.preventDefault();
      const x = e.pageX - tableContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      const newScrollLeft = scrollLeft - walk;

      // Prevenir el scroll más allá de los límites
      const maxScroll = tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth;
      tableContainerRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      await login(loginData.usuario, loginData.password);
      setShowLoginModal(false);
      setLoginData({ usuario: '', password: '' });
    } catch (error: unknown) {
      console.error('Error al iniciar sesión:', error);
      setLoginError('Error al iniciar sesión');
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) {
      setError('No se pudo conectar con la base de datos');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar esta revisión?')) return;

    try {
      const { error } = await supabase
        .from('revisiones_casitas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchRevisiones();
    } catch (error: unknown) {
      console.error('Error al eliminar la revisión:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  // 📱 Funciones para compartir en WhatsApp
  const handleShareClick = (revision: RevisionData) => {
    const images = [];
    if (revision.evidencia_01) images.push(revision.evidencia_01);
    if (revision.evidencia_02) images.push(revision.evidencia_02);
    if (revision.evidencia_03) images.push(revision.evidencia_03);
    
    setShareRevision(revision);
    setShareImages(images);
    setShowShareModal(true);
  };

  const handleShare = async (message: string) => {
    if (!shareRevision || shareImages.length === 0) return;
    
    setIsSharing(true);
    
    try {
      // Convertir URLs de Cloudinary a archivos para compartir
      const imageFiles: File[] = [];
      
      for (let i = 0; i < shareImages.length; i++) {
        const imageUrl = shareImages[i];
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], `evidencia_${i + 1}.jpg`, { type: 'image/jpeg' });
          imageFiles.push(file);
        } catch (error) {
          console.error(`Error al cargar imagen ${i + 1}:`, error);
        }
      }
      
      if (imageFiles.length === 0) {
        alert('No se pudieron cargar las imágenes para compartir');
        return;
      }
      
      // Usar Web Share API si está disponible
      if (navigator.share && navigator.canShare && navigator.canShare({ files: imageFiles })) {
        await navigator.share({
          title: `${shareRevision.caja_fuerte} ${shareRevision.casita}`,
          text: message,
          files: imageFiles
        });
      } else {
        // Fallback: crear URLs para WhatsApp Web
        const whatsappMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;
        window.open(whatsappUrl, '_blank');
        
        // Mostrar las imágenes para que el usuario las pueda descargar manualmente
        shareImages.forEach((imageUrl, index) => {
          const link = document.createElement('a');
          link.href = imageUrl;
          link.download = `evidencia_${shareRevision.casita}_${index + 1}.jpg`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      }
      
      // Cerrar modal
      setShowShareModal(false);
      setShareRevision(null);
      setShareImages([]);
      
    } catch (error) {
      console.error('Error al compartir:', error);
      alert('Error al compartir. Inténtalo de nuevo.');
    } finally {
      setIsSharing(false);
    }
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setShareRevision(null);
    setShareImages([]);
    setIsSharing(false);
  };

  // Función para generar el blob del reporte de Revisión Casitas
  const generateRevisionesBlob = async () => {
    // Filtrar datos por rango de fechas
    const filteredDataForExport = data.filter(row => {
      const rowDate = new Date(row.created_at).toISOString().split('T')[0];
      return rowDate >= reportDateFrom && rowDate <= reportDateTo;
    });

    if (filteredDataForExport.length === 0) {
      throw new Error('No hay datos en el rango de fechas seleccionado');
    }

    // Preparar datos para Excel
    const excelData = filteredDataForExport.map(row => {
      // Usar la fecha tal como está almacenada, sin conversiones de zona horaria
      const fechaOriginal = row.created_at;
      const fechaFormateada = fechaOriginal.replace('T', ' ').substring(0, 16); // YYYY-MM-DD HH:MM
      const [fecha, hora] = fechaFormateada.split(' ');
      const [year, month, day] = fecha.split('-');
      const fechaFinal = `${day}/${month}/${year} ${hora}`;

      return {
        'Fecha': fechaFinal,
        'Casita': row.casita,
        'Quien Revisa': row.quien_revisa,
        'Caja Fuerte': row.caja_fuerte,
        'Puertas/Ventanas': row.puertas_ventanas,
        'Chromecast': row.chromecast,
        'Binoculares': row.binoculares,
        'Trapo Binoculares': row.trapo_binoculares,
        'Speaker': row.speaker,
        'USB Speaker': row.usb_speaker,
        'Controles TV': row.controles_tv,
        'Secadora': row.secadora,
        'Accesorios Secadora': row.accesorios_secadora,
        'Steamer': row.steamer,
        'Bolsa Vapor': row.bolsa_vapor,
        'Plancha Cabello': row.plancha_cabello,
        'Bulto': row.bulto,
        'Sombrero': row.sombrero,
        'Bolso Yute': row.bolso_yute,
        'Camas Ordenadas': row.camas_ordenadas,
        'Cola Caballo': row.cola_caballo,
        'Notas': row.notas || '',
        'Evidencia 1': row.evidencia_01 ? 'Sí' : 'No',
        'Evidencia 2': row.evidencia_02 ? 'Sí' : 'No',
        'Evidencia 3': row.evidencia_03 ? 'Sí' : 'No'
      };
    });

    // Crear archivo CSV
    const csvContent = [
      Object.keys(excelData[0]).join(','),
      ...excelData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  };

  // Función para generar el blob del reporte de Puesto 01
  const generatePuesto01Blob = async () => {
    if (!reportDateFrom || !reportDateTo) {
      throw new Error('Debes seleccionar un rango de fechas para exportar el reporte de Puesto 01');
    }
    
    const fechaDesde = formatToDDMMYYYY(reportDateFrom);
    const fechaHasta = formatToDDMMYYYY(reportDateTo);
    const data = await PuestoService.getRecordsByDateRange(fechaDesde, fechaHasta);
    
    if (!data.length) {
      throw new Error('No hay registros de Puesto 01 en el rango de fechas seleccionado');
    }
    
    // @ts-ignore - sheetjs types opcional
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    return new Blob([csv], { type: 'text/csv' });
  };

  // Exportar reporte de Puesto_01 por rango de fechas en CSV
  function formatToDDMMYYYY(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  // Función para exportar el reporte adecuado usando Web Share API o descarga directa
  const handleExport = async () => {
    try {
      // Generar blob y nombre de archivo según el tipo de reporte
      let blob: Blob;
      let filename: string;
      if (reportType === 'Revisión Casitas') {
        blob = await generateRevisionesBlob();
        filename = `reporte_casitas_${reportDateFrom}_a_${reportDateTo}.csv`;
      } else {
        blob = await generatePuesto01Blob();
        filename = `reporte_puesto01_${reportDateFrom}_a_${reportDateTo}.csv`;
      }
 
      // Función para descargar el archivo
      const downloadFile = (blobToDownload: Blob, filenameToUse: string) => {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blobToDownload);
        link.setAttribute('href', url);
        link.setAttribute('download', filenameToUse);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };
 
      // Intentar compartir mediante Web Share API si está disponible y se pueden compartir archivos
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'text/csv' })] })) {
        await navigator.share({
          title: 'Reporte',
          files: [new File([blob], filename, { type: 'text/csv' })],
        });
      } else {
        // Fallback: descarga directa
        downloadFile(blob, filename);
      }
 
      // Cerrar modal y limpiar campos
      setShowReportModal(false);
      setShowSidebar(false);
      setReportDateFrom('');
      setReportDateTo('');
      alert(`Reporte exportado exitosamente como CSV`);
    } catch (error: unknown) {
      console.error('Error al exportar:', error);
      const isPermissionError = error instanceof Error && (
        error.name === 'NotAllowedError' ||
        error.message.toLowerCase().includes('permission')
      );
 
      if (isPermissionError) {
        // Regenerar el blob y filename para el fallback
        let fallbackBlob: Blob;
        let fallbackFilename: string;
        if (reportType === 'Revisión Casitas') {
          fallbackBlob = await generateRevisionesBlob();
          fallbackFilename = `reporte_casitas_${reportDateFrom}_a_${reportDateTo}.csv`;
        } else {
          fallbackBlob = await generatePuesto01Blob();
          fallbackFilename = `reporte_puesto01_${reportDateFrom}_a_${reportDateTo}.csv`;
        }
        
        // Fallback a descarga directa
        const fallbackLink = document.createElement('a');
        const fallbackUrl = URL.createObjectURL(fallbackBlob);
        fallbackLink.setAttribute('href', fallbackUrl);
        fallbackLink.setAttribute('download', fallbackFilename);
        fallbackLink.style.visibility = 'hidden';
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        document.body.removeChild(fallbackLink);
        URL.revokeObjectURL(fallbackUrl);
        alert('No se pudo compartir el reporte (permiso denegado). Se descargó automáticamente.');
      } else {
        alert(`Error al exportar reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden" style={{
      background: '#334d50',
      backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
    }}>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative text-center mb-12 pl-16 sm:pl-0">
          {/* Botón de inicio de sesión para móviles */}
          {!isLoggedIn && (
            <button
              onClick={() => setShowLoginModal(true)}
              className="absolute left-0 z-20 w-11 h-11 neu-sidebar-button flex items-center justify-center group top-4 md:top-2"
              aria-label="Iniciar sesión"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#1a1f35]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </button>
          )}
          
          {/* Botón del menú lateral dentro del hero (solo visible cuando está logueado) */}
          {isLoggedIn && (
            <button
              className="absolute left-0 z-20 w-11 h-11 neu-sidebar-button flex items-center justify-center group top-4 md:top-2"
              onClick={handleMenuToggle}
              type="button"
              aria-label="Abrir menú lateral"
            >
              <div className="flex flex-col gap-1">
                <div className={`w-5 h-0.5 bg-[#1a1f35] rounded transition-transform duration-200 ${showSidebar ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                <div className={`w-5 h-0.5 bg-[#1a1f35] rounded transition-opacity duration-200 ${showSidebar ? 'opacity-0' : ''}`}></div>
                <div className={`w-5 h-0.5 bg-[#1a1f35] rounded transition-transform duration-200 ${showSidebar ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
              </div>
            </button>
          )}

          {/* Efecto de resplandor de fondo */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#c9a45c]/20 via-[#f0c987]/20 to-[#c9a45c]/20 blur-3xl rounded-full transform scale-150"></div>

          {/* Título principal uniforme */}
          <PageTitle size="md">
            Revisión de<br />Casitas
          </PageTitle>

          {/* Línea decorativa animada */}
          <div className="relative mt-6 h-1 w-32 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c9a45c] to-transparent rounded-full"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0c987] to-transparent rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Información del Usuario */}
        <div className="neumorphic-user-container mb-6 max-w-3xl mx-auto">
          {user && (
            <div className="neumorphic-user-card">
              <div className="w-10 h-10 bg-gradient-to-br from-[#c9a45c] to-[#f0c987] rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#1a1f35]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-white font-medium">{user}</p>
                  <p className="text-[#c9a45c] text-sm">{userRole}</p>
                </div>
                {supabaseAwake && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs font-medium">awake</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 🍽️ Menú del Día */}
        {!loadingMenu && menuDelDia && (
          <div className="neumorphic-menu-container mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5-1.5M3 21l1.5-1.5m15-5.25v-2.513C19.5 10.608 18.155 9.51 16.976 9.166 15.697 8.944 14.355 8.25 13 8.25s-2.697.694-3.976.916C7.845 9.51 6.5 10.608 6.5 11.735v2.513m13-2.513v2.513" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">🍽️ Menú del Día</h3>
                <p className="text-green-400 text-sm">{formatearFecha(menuDelDia.fecha_menu)}</p>
              </div>
            </div>
            
            {(() => {
              const menuContent = parseMenuContent(menuDelDia.contenido_menu);

              const splitOnCapitalizedWords = (text: string) => {
                if (!text) return [];
                const tokens = text.split(/\s+/);
                const groups: string[] = [];
                let current: string[] = [];

                tokens.forEach((token) => {
                  const firstChar = token.charAt(0) || '';
                  const isUpper = firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();

                  if (current.length === 0) {
                    current.push(token);
                  } else if (isUpper) {
                    groups.push(current.join(' '));
                    current = [token];
                  } else {
                    current.push(token);
                  }
                });

                if (current.length) groups.push(current.join(' '));
                return groups;
              };

              if (menuContent && menuContent.comidas) {
                const allItems = menuContent.comidas.flatMap((comida: string) =>
                  splitOnCapitalizedWords(String(comida))
                );

                return (
                  <div className="neumorphic-menu-content">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-green-400 font-semibold">{menuContent.dia_semana}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {allItems.map((item: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                          <span className="text-green-500">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="neumorphic-menu-content">
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{menuDelDia.contenido_menu}</p>
                  </div>
                );
              }
            })()
            }
          </div>
        )}

        {/* Sidebar */}
        <Sidebar
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
          onShowReportModal={() => setShowReportModal(true)}
        />

        {/* Barra de Acciones */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex flex-wrap gap-3">
              {/* Solo mostrar botón de login si no está logueado */}
              {!isLoggedIn && (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="neumorphic-login-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Iniciar Sesión
                </button>
              )}

              {/* Botón Nueva Revisión - Oculto en móvil */}
              <button
                onClick={() => router.push('/nueva-revision?new=true')}
                className="hidden md:flex nueva-revision-button px-8 py-3 text-white rounded-xl hover:shadow-lg hover:shadow-[#098042]/40 transition-all duration-300 transform hover:scale-[1.02] items-center gap-3 font-medium text-lg min-w-[200px] justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nueva Revisión
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas Principales */}
        {!statsLoading && (
          <div className="bg-gradient-to-r from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-xl p-3 mb-4 border border-[#3d4659]/50 shadow-md">
            <h3 className="sr-only">📊 Estadísticas</h3>
            
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg border border-blue-500/30">
                <div className="w-6 h-6 bg-blue-500/20 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-blue-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide">Revisor</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-blue-300 truncate max-w-[80px]">{topRevisor?.name || 'N/A'}</span>
                    <span className="text-[9px] text-gray-400">({topRevisor?.count || 0})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg border border-green-500/30">
                <div className="w-6 h-6 bg-green-500/20 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide">Check-outs</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-green-300 truncate max-w-[80px]">{topCheckOut?.name || 'N/A'}</span>
                    <span className="text-[9px] text-gray-400">({topCheckOut?.count || 0})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-amber-900/30 to-amber-800/20 rounded-lg border border-amber-500/30">
                <div className="w-6 h-6 bg-amber-500/20 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-amber-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide">Más Check in</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-amber-300 truncate max-w-[60px]">{topCheckInCasita?.name || 'N/A'}</span>
                    <span className="text-[9px] text-gray-400">({topCheckInCasita?.count || 0})</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botón para ver más estadísticas */}
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => router.push('/estadisticas')}
                className="flex items-center gap-1 text-[10px] text-[#c9a45c] hover:text-[#f0c987] transition-colors duration-200 group"
              >
                <span>Ver más estadísticas</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Barra de Búsqueda y Filtros Mejorada */}
        <div className="neumorphic-search-container mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda Principal */}
            <div className="flex-1 relative order-2 lg:order-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por casita, revisor o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neumorphic-input w-full pl-4 pr-12 py-3 text-white placeholder-gray-400"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filtro por Caja Fuerte */}
            <div className="relative order-1 lg:order-2">
              <select
                value={cajaFuerteFilter}
                onChange={(e) => setCajaFuerteFilter(e.target.value)}
                className="neumorphic-select w-full lg:w-48 px-4 py-3 text-white appearance-none cursor-pointer"
              >
                <option value="">Todas las cajas</option>
                {cajaFuerteOptions.map(option => (
                  <option key={option} value={option} className="bg-[#1e2538]">{option}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg className="w-4 h-4 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Resultados de búsqueda y filtros */}
          {(mounted && (searchTerm || cajaFuerteFilter || dateFilter || activeFilter !== 'all')) && (
            <div className="mt-4 pt-4 border-t border-[#3d4659]/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <p className="text-gray-400 text-sm">
                  Mostrando {finalFilteredData.length} de {data.length} revisiones
                  {searchTerm && <span> para "{searchTerm}"</span>}
                  {cajaFuerteFilter && <span> con caja fuerte "{cajaFuerteFilter}"</span>}
                  {dateFilter && <span> del {format(new Date(dateFilter), 'dd/MM/yyyy', { locale: es })}</span>}
                  {activeFilter === 'latest' && <span> (última revisión por casita)</span>}
                  {activeFilter === 'no-yute' && <span> (sin bolso yute)</span>}
                  {activeFilter === 'today' && <span> (revisiones de hoy)</span>}
                  {activeFilter === 'no-cola-caballo' && <span> (sin cola de caballo)</span>}
                </p>
                {(searchTerm || cajaFuerteFilter || dateFilter || activeFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCajaFuerteFilter('');
                      clearDateFilter();
                      setActiveFilter('all');
                    }}
                    className="px-3 py-1 bg-[#c9a45c]/20 hover:bg-[#c9a45c]/30 border border-[#c9a45c]/40 text-[#c9a45c] rounded-lg transition-all duration-200 text-sm whitespace-nowrap"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Toggle de Vista y Filtros - Visible para todos los usuarios */}
        <div className="flex justify-center items-center gap-4 mb-8 mt-4">
          <ViewToggle
            currentView={viewMode}
            onViewChange={handleViewModeChange}
          />
          <div className="flex items-center gap-2">
            {/* Date Filter Icon */}
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button
                type="button"
                className={`neu-button p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center ${
                  dateFilter
                    ? 'border-blue-400/40 bg-blue-500/20'
                    : ''
                }`}
                title={dateFilter ? `Filtrando por: ${dateFilter}` : "Filtrar por fecha"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.6}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v2M16 3v2M3.5 8.5h17M5 5h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                  <rect x="7" y="11" width="2.5" height="2.5" rx="0.5" />
                  <rect x="11" y="11" width="2.5" height="2.5" rx="0.5" />
                  <rect x="15" y="11" width="2.5" height="2.5" rx="0.5" />
                  <rect x="7" y="15" width="2.5" height="2.5" rx="0.5" />
                  <rect x="11" y="15" width="2.5" height="2.5" rx="0.5" />
                  <rect x="15" y="15" width="2.5" height="2.5" rx="0.5" />
                </svg>
              </button>
              {dateFilter && (
                <span
                  className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearDateFilter();
                  }}
                >
                  ×
                </span>
              )}
            </div>
            
            {/* Existing Filter Button */}
            <div className="relative filter-dropdown-container">
            <button
              type="button"
              className={`neu-button p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                activeFilter !== 'all'
                  ? 'border-red-400/40 bg-red-500/20'
                  : ''
              }`}
              title="Filtros"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <style jsx>{`
                @keyframes pulse {
                  0% { transform: scale(1); }
                  50% { transform: scale(1.15); }
                  100% { transform: scale(1); }
                }
                @keyframes glow {
                  0% { box-shadow: 0 0 5px rgba(255, 59, 48, 0.5); }
                  50% { box-shadow: 0 0 15px rgba(255, 59, 48, 0.8); }
                  100% { box-shadow: 0 0 5px rgba(255, 59, 48, 0.5); }
                }
                .filter-pulse {
                  animation: pulse 1.5s infinite;
                  color: #ff3b30;
                }
                .filter-active {
                  border-color: #ff3b30 !important;
                  animation: glow 2s infinite;
                }
                .filter-badge {
                  position: absolute;
                  top: -6px;
                  right: -6px;
                  background-color: #ff3b30;
                  color: white;
                  border-radius: 50%;
                  width: 16px;
                  height: 16px;
                  font-size: 10px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                }
              `}</style>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`w-5 h-5 ${activeFilter !== 'all' ? 'filter-pulse' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              {activeFilter !== 'all' && (
                <span className="filter-badge">!</span>
              )}
            </button>
            
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1e2538] border border-[#3d4659] rounded-xl shadow-xl z-50">
                <div className="py-1">
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                      activeFilter === 'all'
                        ? 'text-[#c9a45c] bg-[#2a3347]/50'
                        : 'text-gray-300 hover:text-white hover:bg-[#2a3347]/30'
                    }`}
                    onClick={() => handleFilterChange('all')}
                  >
                    Todas las revisiones
                  </button>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                      activeFilter === 'today'
                        ? 'text-[#c9a45c] bg-[#2a3347]/50'
                        : 'text-gray-300 hover:text-white hover:bg-[#2a3347]/30'
                    }`}
                    onClick={() => handleFilterChange('today')}
                  >
                    Revisiones de Hoy
                  </button>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                      activeFilter === 'latest'
                        ? 'text-[#c9a45c] bg-[#2a3347]/50'
                        : 'text-gray-300 hover:text-white hover:bg-[#2a3347]/30'
                    }`}
                    onClick={() => handleFilterChange('latest')}
                  >
                    Última Revisión
                  </button>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                      activeFilter === 'no-yute'
                        ? 'text-[#c9a45c] bg-[#2a3347]/50'
                        : 'text-gray-300 hover:text-white hover:bg-[#2a3347]/30'
                    }`}
                    onClick={() => handleFilterChange('no-yute')}
                  >
                    No hay yute
                  </button>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                      activeFilter === 'has-yute-1'
                        ? 'text-[#c9a45c] bg-[#2a3347]/50'
                        : 'text-gray-300 hover:text-white hover:bg-[#2a3347]/30'
                    }`}
                    onClick={() => handleFilterChange('has-yute-1')}
                  >
                    Hay un yute
                  </button>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                      activeFilter === 'has-yute-2'
                        ? 'text-[#c9a45c] bg-[#2a3347]/50'
                        : 'text-gray-300 hover:text-white hover:bg-[#2a3347]/30'
                    }`}
                    onClick={() => handleFilterChange('has-yute-2')}
                  >
                    Hay 2 Yutes
                  </button>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                      activeFilter === 'no-trapo-binocular'
                        ? 'text-[#c9a45c] bg-[#2a3347]/50'
                        : 'text-gray-300 hover:text-white hover:bg-[#2a3347]/30'
                    }`}
                    onClick={() => handleFilterChange('no-trapo-binocular')}
                  >
                    No hay trapo binocular
                  </button>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                      activeFilter === 'no-sombrero'
                        ? 'text-[#c9a45c] bg-[#2a3347]/50'
                        : 'text-gray-300 hover:text-white hover:bg-[#2a3347]/30'
                    }`}
                    onClick={() => handleFilterChange('no-sombrero')}
                  >
                    No hay sombrero
                  </button>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                      activeFilter === 'no-bulto'
                        ? 'text-[#c9a45c] bg-[#2a3347]/50'
                        : 'text-gray-300 hover:text-white hover:bg-[#2a3347]/30'
                    }`}
                    onClick={() => handleFilterChange('no-bulto')}
                  >
                    No hay Bulto
                  </button>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                      activeFilter === 'no-cola-caballo'
                        ? 'text-[#c9a45c] bg-[#2a3347]/50'
                        : 'text-gray-300 hover:text-white hover:bg-[#2a3347]/30'
                    }`}
                    onClick={() => handleFilterChange('no-cola-caballo')}
                  >
                    No hay Cola de Caballo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Vista de datos - Solo visible si el usuario está logueado */}
        {isLoggedIn ? (
          <>
            {loading && !error ? (
              <div className="p-8 text-center text-gray-400 animate-pulse">
                <p>Cargando datos...</p>
              </div>
            ) : viewMode === 'card' ? (
              /* Vista de Tarjetas */
              <CardView
                data={paginatedData}
                onCardClick={(id) => router.push(`/detalles/${id}`)}
                onImageClick={openModal}
                onShareClick={handleShareClick}
                loading={loading}
              />
            ) : (
              /* Vista de Tabla */
              <div className="relative">
                <div className="overflow-hidden rounded-xl shadow-[0_8px_32px_rgb(0_0_0/0.2)] backdrop-blur-md bg-[#1e2538]/80 border border-[#3d4659]/50">
                  <div
                    ref={tableContainerRef}
                    className="table-container overflow-x-auto overflow-y-auto relative cursor-grab h-[70vh] min-h-[500px] max-h-[800px]"
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                  >
                    <table className="min-w-full divide-y divide-[#3d4659]/50">
                      <thead className="sticky top-0 z-30">
                        <tr className="bg-gradient-to-r from-[#1e2538]/90 to-[#2a3347]/90 backdrop-blur-md text-gray-300 text-left">
                          <th className="fixed-column-1 bg-gradient-to-r from-[#1e2538]/90 to-[#2a3347]/90 backdrop-blur-md px-3 py-3 md:px-4 md:py-4 border-r border-[#3d4659]/50">Fecha</th>
                          <th className="fixed-column-2 bg-gradient-to-r from-[#1e2538]/90 to-[#2a3347]/90 backdrop-blur-md px-3 py-3 md:px-4 md:py-4 border-r border-[#3d4659]/50">Casita</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Quien revisa</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Caja fuerte</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Puertas/Ventanas</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Chromecast</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Binoculares</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Trapo binoculares</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Speaker</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">USB Speaker</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Controles TV</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Secadora</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Accesorios secadora</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Steamer</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Bolsa vapor</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Plancha cabello</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Bulto</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Sombrero</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Bolso yute</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Camas ordenadas</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Cola caballo</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Notas</th>
                          <th className="px-3 py-2 md:px-4 md:py-3">Evidencias</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3d4659]/50">
                        {paginatedData.length === 0 ? (
                          <tr>
                            <td colSpan={23} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="w-16 h-16 bg-gray-600/20 rounded-full flex items-center justify-center">
                                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.75m-16.5 0h.008v.008H3v-.008z" />
                                  </svg>
                                </div>
                                <div className="text-center">
                                  <h3 className="text-lg font-semibold text-gray-400 mb-2">
                                    {finalFilteredData.length === 0 ? 'No se encontraron revisiones' : 'No hay datos en esta página'}
                                  </h3>
                                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                                    {finalFilteredData.length === 0
                                      ? (searchTerm || cajaFuerteFilter || activeFilter !== 'all')
                                        ? 'Intenta ajustar los filtros de búsqueda para encontrar revisiones.'
                                        : 'Aún no se han registrado revisiones en el sistema.'
                                      : `Página ${currentPage} está vacía. Navega a una página anterior.`
                                    }
                                  </p>
                                  {finalFilteredData.length === 0 && (searchTerm || cajaFuerteFilter || dateFilter || activeFilter !== 'all') && (
                                    <button
                                      onClick={() => {
                                        setSearchTerm('');
                                        setCajaFuerteFilter('');
                                        setDateFilter('');
                                        setActiveFilter('all');
                                      }}
                                      className="mt-4 px-4 py-2 bg-[#c9a45c]/20 hover:bg-[#c9a45c]/30 border border-[#c9a45c]/40 text-[#c9a45c] rounded-xl transition-all duration-200 text-sm"
                                    >
                                      Limpiar filtros
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedData.map((row, index) => (
                            <tr
                              key={row.id || index}
                              className="border-t border-[#3d4659]/50 text-gray-300 hover:bg-[#1e2538]/50 transition-colors duration-200"
                            >
                              <td className="fixed-column-1 w-[320px] md:w-[200px]">
                                <div className="flex flex-col whitespace-nowrap">
                                  <span className="text-[13px] md:text-xs text-[#c9a45c]">
                                    {row.created_at ? row.created_at.split('+')[0].split('T')[0] : 'N/A'}
                                  </span>
                                  <span className="text-[13px] md:text-xs text-[#c9a45c]">
                                    {row.created_at ? row.created_at.split('+')[0].split('T')[1].split(':').slice(0, 2).join(':') : '--:--'}
                                  </span>
                                </div>
                              </td>
                              <td className="fixed-column-2 bg-gradient-to-r from-[#1a1f35]/90 to-[#1c2138]/90 backdrop-blur-md px-3 py-3 md:px-4 md:py-4 border-r border-[#3d4659]/50">
                                <button
                                  onClick={() => {
                                    console.log('ID de la revisión:', row.id);
                                    router.push(`/detalles/${row.id}`);
                                  }}
                                  className={
                                    (row.notas_count && row.notas_count > 0
                                      ? 'text-orange-400 font-extrabold underline underline-offset-4 decoration-orange-400/60 hover:text-orange-300 hover:decoration-orange-300/80 scale-105'
                                      : 'text-sky-400 hover:text-sky-300 underline decoration-sky-400/30 hover:decoration-sky-300/50') +
                                    ' transition-colors duration-200 hover:scale-105 transform'
                                  }
                                >
                                  {row.casita}
                                </button>
                              </td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.quien_revisa}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.caja_fuerte}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.puertas_ventanas}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.chromecast}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.binoculares}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.trapo_binoculares}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.speaker}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.usb_speaker}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.controles_tv}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.secadora}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.accesorios_secadora}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.steamer}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.bolsa_vapor}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.plancha_cabello}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.bulto}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.sombrero}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.bolso_yute}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.camas_ordenadas}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.cola_caballo}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">{row.notas}</td>
                              <td className="px-3 py-2 md:px-4 md:py-3">
                                <div className="flex items-center gap-1 flex-nowrap">
                                  {row.evidencia_01 && (
                                    <button
                                      type="button"
                                      onClick={() => openModal(row.evidencia_01)}
                                      className="text-[#c9a45c] hover:text-[#f0c987] underline cursor-pointer hover:scale-110 transform bg-[#1e2538]/50 px-1.5 py-0.5 rounded text-xs shadow-[0_2px_4px_rgb(0_0_0/0.2)] hover:shadow-[0_2px_4px_rgb(0_0_0/0.3)] transition-all duration-200 min-w-[20px] flex-shrink-0"
                                      title="Ver evidencia 1"
                                    >
                                      1
                                    </button>
                                  )}
                                  {row.evidencia_02 && (
                                    <button
                                      type="button"
                                      onClick={() => openModal(row.evidencia_02)}
                                      className="text-[#c9a45c] hover:text-[#f0c987] underline cursor-pointer hover:scale-110 transform bg-[#1e2538]/50 px-1.5 py-0.5 rounded text-xs shadow-[0_2px_4px_rgb(0_0_0/0.2)] hover:shadow-[0_2px_4px_rgb(0_0_0/0.3)] transition-all duration-200 min-w-[20px] flex-shrink-0"
                                      title="Ver evidencia 2"
                                    >
                                      2
                                    </button>
                                  )}
                                  {row.evidencia_03 && (
                                    <button
                                      type="button"
                                      onClick={() => openModal(row.evidencia_03)}
                                      className="text-[#c9a45c] hover:text-[#f0c987] underline cursor-pointer hover:scale-110 transform bg-[#1e2538]/50 px-1.5 py-0.5 rounded text-xs shadow-[0_2px_4px_rgb(0_0_0/0.3)] transition-all duration-200 min-w-[20px] flex-shrink-0"
                                      title="Ver evidencia 3"
                                    >
                                      3
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 🚀 Componente de Paginado Compartido - Visible para ambas vistas */}
            {!loading && filteredData.length > 0 && (
              <div className="mt-8 flex items-center justify-between bg-[#2a3347]/95 backdrop-blur-xl rounded-2xl border border-[#c9a45c]/20 p-4 shadow-2xl">
                {/* Información de registros */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#c9a45c]/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.75m-16.5 0h.008v.008H3v-.008z" />
                    </svg>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm text-gray-400">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} registros
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {itemsPerPage} por página • Página {currentPage} de {totalPages}
                    </p>
                  </div>
                  <div className="sm:hidden">
                    <p className="text-sm text-gray-400">
                      {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
                    </p>
                    <p className="text-xs text-gray-500">
                      Pág. {currentPage}/{totalPages}
                    </p>
                  </div>
                </div>

                {/* Controles de navegación */}
                <div className="flex items-center gap-2">
                  {/* Botón Anterior */}
                  <button
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-3 py-2 bg-[#c9a45c]/20 hover:bg-[#c9a45c]/30 disabled:bg-gray-600/20 border border-[#c9a45c]/40 disabled:border-gray-500/40 text-[#c9a45c] disabled:text-gray-500 rounded-xl transition-all duration-200 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    title="Página anterior"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    <span className="hidden sm:inline">Anterior</span>
                  </button>

                  {/* Indicador de página actual */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#c9a45c]/20 via-[#f0c987]/20 to-[#c9a45c]/20 border border-[#c9a45c]/40 rounded-xl">
                    <div className="w-2 h-2 bg-[#c9a45c] rounded-full animate-pulse"></div>
                    <span className="text-[#c9a45c] font-semibold text-sm">
                      {currentPage}
                    </span>
                  </div>

                  {/* Botón Siguiente */}
                  <button
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-3 py-2 bg-[#c9a45c]/20 hover:bg-[#c9a45c]/30 disabled:bg-gray-600/20 border border-[#c9a45c]/40 disabled:border-gray-500/40 text-[#c9a45c] disabled:text-gray-500 rounded-xl transition-all duration-200 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    title="Página siguiente"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-xl p-8 border border-[#3d4659]/50 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#c9a45c] to-[#f0c987] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#1a1f35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Acceso Restringido</h3>
            <p className="text-gray-400">Debes iniciar sesión para ver los datos de las revisiones</p>
          </div>
        )}

        {/* Modal de imagen simplificado */}
        <ImageModal
          isOpen={modalOpen}
          imageUrl={modalImg}
          onClose={closeModal}
        />

        {/* Modal de Login Modernizado */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#1e2538] to-[#2a3347] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#3d4659]/50 backdrop-blur-md">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#c9a45c] to-[#f0c987] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#1a1f35]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-[#c9a45c] bg-clip-text text-transparent">
                  Iniciar Sesión
                </h2>
                <p className="text-gray-400 mt-2">Accede a tu cuenta para continuar</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#c9a45c]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={loginData.usuario}
                    onChange={(e) => setLoginData({ ...loginData, usuario: e.target.value })}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30"
                    placeholder="Ingresa tu usuario"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#c9a45c]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30"
                      placeholder="Ingresa tu contraseña"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#c9a45c] transition-colors"
                      title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-red-400 text-sm flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      {loginError}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-gray-600/25 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1a1f35] rounded-xl hover:from-[#d4b06c] hover:to-[#f5d49a] transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-[#c9a45c]/25 font-medium"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Reportes */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#1e2538] to-[#2a3347] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#3d4659]/50 backdrop-blur-md">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
                  Exportar Reporte
                </h2>
                <p className="text-gray-400 mt-2">Selecciona el rango de fechas para el reporte</p>
              </div>

              <div className="space-y-6">
                {/* Selector de tipo de reporte */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25z" />
                    </svg>
                    Tipo de Reporte
                  </label>
                  <select
                    value={reportType}
                    onChange={e => setReportType(e.target.value as 'Revisión Casitas' | 'Puesto 01')}
                    className="w-full px-4 py-3 bg-[#232a3e] border border-[#3d4659] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:border-green-500/30 appearance-none"
                    style={{ backgroundImage: 'none' }}
                  >
                    <option value="Revisión Casitas" style={{ background: '#232a3e', color: '#fff' }}>Revisión Casitas</option>
                    <option value="Puesto 01" style={{ background: '#232a3e', color: '#fff' }}>Puesto 01</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                    </svg>
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    value={reportDateFrom}
                    onChange={(e) => setReportDateFrom(e.target.value)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:border-green-500/30"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                    </svg>
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    value={reportDateTo}
                    onChange={(e) => setReportDateTo(e.target.value)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 hover:border-green-500/30"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportModal(false);
                      setReportDateFrom('');
                      setReportDateTo('');
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-gray-600/25 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={!reportDateFrom || !reportDateTo}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-green-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Exportar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Botón flotante para móvil - Nueva Revisión con estilo neumórfico */}
      <div className="md:hidden fixed bottom-24 right-6 z-50">
        <button
          onClick={() => router.push('/nueva-revision?new=true')}
          className="w-14 h-14 neu-floating-button flex items-center justify-center"
          aria-label="Nueva Revisión"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-6 h-6 text-white drop-shadow-lg group-hover:rotate-90 transition-transform duration-300"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* 📱 Modal de Compartir WhatsApp */}
      {showShareModal && shareRevision && (
        <ShareModal
          isOpen={showShareModal}
          onClose={closeShareModal}
          onShare={handleShare}
          images={shareImages}
          casita={shareRevision.casita}
          cajaFuerte={shareRevision.caja_fuerte}
          initialMessage={`${shareRevision.caja_fuerte} ${shareRevision.casita}`}
          isLoading={isSharing}
        />
      )}
    </main>
  );
}
