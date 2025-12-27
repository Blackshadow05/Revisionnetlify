'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';

import Sidebar from '@/components/Sidebar';
import ImageModal from '@/components/revision/ImageModal';
import PageTitle from '@/components/ui/PageTitle';
import ViewToggle from '@/components/ui/ViewToggle';
import CardView from '@/components/revision/CardView';
import ShareModal from '@/components/ShareModal';
import { PuestoService } from '@/lib/puesto-service';
import { useRevisiones } from '@/hooks/useRevisionesCache';



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
  const { isOpen: showSidebar, openSidebar, closeSidebar, toggleSidebar } = useSidebar();
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
  
  // 🚀 Hook para cargar revisiones con caché en localStorage
  const {
    data: revisionesData,
    loading: revisionesLoading,
    error: revisionesError,
    isFromCache,
    lastUpdated,
    refresh: refreshRevisiones
  } = useRevisiones();
  
  const [data, setData] = useState<RevisionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sincronizar datos del hook con el estado local
  useEffect(() => {
    if (revisionesData) {
      setData(revisionesData);
    }
    setLoading(revisionesLoading);
    setError(revisionesError);
  }, [revisionesData, revisionesLoading, revisionesError]);
  
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
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalCasita, setModalCasita] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({
    usuario: '',
    password: ''
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportType, setReportType] = useState<'Revisión Casitas' | 'Puesto 01'>('Revisión Casitas');
  const [showFilterModal, setShowFilterModal] = useState(false);
  // Definir el tipo para el filtro activo
  type FilterType = 'all' | 'latest' | 'no-yute' | 'has-yute-1' | 'has-yute-2' | 'no-trapo-binocular' | 'has-trapo-binocular' | 'no-sombrero' | 'has-sombrero' | 'no-bulto' | 'today' | 'no-cola-caballo';
  
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

    }
    setShowFilterDropdown(false);
    setShowFilterModal(false);
    setCurrentPage(1);
  };
  
  // Función para limpiar el filtro de fecha
  const clearDateFilter = () => {
    setDateFilter('');
    // También eliminamos del localStorage
    try {
      localStorage.removeItem('revisionDateFilter');
    } catch (err) {
      
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
          
        }
      }
    } catch (err) {
      
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
      
    }
  }, [cajaFuerteFilter]);
  
  // Persistir el filtro activo en localStorage
  useEffect(() => {
    try {
      const savedActiveFilter = localStorage.getItem('activeRevisionFilter');
      if (typeof savedActiveFilter === 'string' && savedActiveFilter.length > 0) {
        // Validar que el filtro sea uno de los valores permitidos
        const validFilters: FilterType[] = ['all', 'latest', 'no-yute', 'has-yute-1', 'has-yute-2', 'no-trapo-binocular', 'has-trapo-binocular', 'no-sombrero', 'has-sombrero', 'no-bulto', 'today', 'no-cola-caballo'];
        if (validFilters.includes(savedActiveFilter as FilterType)) {
          setActiveFilter(savedActiveFilter as FilterType);
        }
      }
    } catch (err) {
      
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
      
    }
  }, [activeFilter]);
  


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
    toggleSidebar();
  };

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const cajaFuerteOptions = [
    'Si', 'No', 'Check in', 'Check out', 'Upsell', 'Guardar Upsell', 'Back to Back', 'Show Room'
  ];


  const searchInputRef = useRef<HTMLInputElement>(null);



  // 🔄 Efecto para despertar el servidor de Supabase con un ping silencioso
  useEffect(() => {
    const wakeupSupabase = async () => {
      
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
          
          
        } else {
          
          
          setSupabaseAwake(true);
        }
      } catch (err) {
        
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
      
    }
  };

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
        
      } catch (error) {
        
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
    
    // Date filter logic - Use local date comparison without timezone conversion
    const dateMatch = !dateFilter || (row.created_at && (() => {
      if (dateFilter) {
        // Extract date portion from created_at (YYYY-MM-DD) for comparison
        const createdAtDate = row.created_at.split('T')[0];
        return createdAtDate === dateFilter;
      }
      return true;
    })());

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

    if (activeFilter === 'has-trapo-binocular') {
      return getLatestByCasita()
        .filter(row => row.trapo_binoculares === 'Si');
    }

    if (activeFilter === 'no-sombrero') {
      return getLatestByCasita()
        .filter(row => row.sombrero === 'No');
    }

    if (activeFilter === 'has-sombrero') {
      return getLatestByCasita()
        .filter(row => row.sombrero === 'Si');
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
          
        }
        
        return isToday;
      });
      
      
      
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

  
    // Función auxiliar para obtener todas las imágenes de una revisión
    const getAllImagesFromRevision = (revision: RevisionData) => {
      const images = [];
      if (revision.evidencia_01) images.push(revision.evidencia_01);
      if (revision.evidencia_02) images.push(revision.evidencia_02);
      if (revision.evidencia_03) images.push(revision.evidencia_03);
      return images;
    };
  
    const openModal = (imgUrl: string, revision?: RevisionData) => {
      setModalImg(imgUrl);
      const images = revision ? getAllImagesFromRevision(revision) : [imgUrl];

      setModalImages(images);
      setModalCasita(revision?.casita || null);
      setModalOpen(true);
    };
  const closeModal = () => {
    // Eliminada la limpieza de caché para evitar problemas al reabrir imágenes
    // El caché del navegador debe mantenerse para permitir recargas rápidas
    setModalOpen(false);
    setModalImg(null);
    setModalImages([]);
    setModalCasita(null);
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

    // Normalizar usuario: sin espacios al final
    const usuarioTrimmed = loginData.usuario.trimEnd();

    try {
      await login(usuarioTrimmed, loginData.password);
      setShowLoginModal(false);
      setLoginData({ usuario: '', password: '' });
    } catch (error: unknown) {
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
      refreshRevisiones();
    } catch (error: unknown) {
      
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
      closeSidebar();
      setReportDateFrom('');
      setReportDateTo('');
      alert(`Reporte exportado exitosamente como CSV`);
    } catch (error: unknown) {
      
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
    <main
      className="min-h-screen relative overflow-hidden bg-white md:bg-[#334d50]"
      style={{
        backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
      }}
      data-mobile="true"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative text-center mb-12">
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

          {/* Botón del menú lateral dentro del hero (solo visible cuando está logueado y en tablet/desktop) */}
          {isLoggedIn && (
            <button
              className="hidden md:flex absolute left-0 z-20 w-11 h-11 neu-sidebar-button items-center justify-center group top-4 md:top-2"
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

          {/* Información del Usuario o Título Principal */}
          {isLoggedIn && user ? (
            <div className="neumorphic-user-container max-w-3xl mx-auto">
              <div className="neumorphic-user-card flex-col gap-2">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[#c9a45c] to-[#f0c987] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 text-[#1a1f35]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <p className="text-white font-bold text-sm sm:text-lg truncate">{user}</p>
                  <p className="text-[#c9a45c] text-[10px] sm:text-xs font-medium flex-shrink-0">• {userRole}</p>
                  {supabaseAwake && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full flex-shrink-0">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                {/* Puntos verdes indicando días restantes de sesión */}
                <div className="flex items-center gap-1.5 justify-center">
                  {(() => {
                    try {
                      const storedSession = localStorage.getItem('userSession');
                      if (storedSession) {
                        const { timestamp } = JSON.parse(storedSession);
                        const now = new Date().getTime();
                        const sessionAge = now - timestamp;
                        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
                        const remainingMs = maxAge - sessionAge;
                        const remainingDays = Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
                        return Array.from({ length: remainingDays }, (_, i) => (
                          <div key={i} className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        ));
                      }
                    } catch (error) {
                      return null;
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Título principal para usuarios no logueados */}
              <PageTitle size="md">
                Revisión de<br />Casitas
              </PageTitle>

              {/* Línea decorativa animada */}
              <div className="relative mt-6 h-1 w-32 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c9a45c] to-transparent rounded-full"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0c987] to-transparent rounded-full animate-pulse"></div>
              </div>

              {/* Botón de inicio de sesión para usuarios no logueados */}
              <div className="mt-8">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="neu-button-login px-8 py-3 text-white rounded-xl hover:shadow-lg hover:shadow-[#c9a45c]/40 transition-all duration-300 transform hover:scale-[1.02] items-center gap-3 font-medium text-lg inline-flex"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Iniciar Sesión
                </button>
              </div>
            </>
          )}
        </div>

        {/* Barra de Búsqueda */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número de casita..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c] transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar - Solo visible en tablet y desktop */}
        <div className="hidden md:block">
          <Sidebar
            isOpen={showSidebar}
            onClose={closeSidebar}
            onShowReportModal={() => setShowReportModal(true)}
          />
        </div>

        {/* Barra de Acciones */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex flex-wrap gap-3">

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

        {/* Barra de Búsqueda y Filtros Mejorada - Solo resultados activos */}
        {(mounted && (searchTerm || cajaFuerteFilter || dateFilter || activeFilter !== 'all')) && (
          <div className="neumorphic-search-container mb-8">
            {/* Resultados de búsqueda y filtros */}
            <div className="py-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <p className="text-gray-400 text-sm">
                  Mostrando {finalFilteredData.length} de {data.length} revisiones
                  {searchTerm && <span> para "{searchTerm}"</span>}
                  {cajaFuerteFilter && <span> con estado "{cajaFuerteFilter}"</span>}
                  {dateFilter && (() => {
                    // Formatear la fecha manualmente sin conversión de zona horaria
                    const [year, month, day] = dateFilter.split('-');
                    return <span> del {day}/{month}/{year}</span>;
                  })()}
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
          </div>
        )}

        {/* Toggle de Vista y Filtros - Visible para todos los usuarios */}
        <div className="flex justify-center items-center gap-4 mb-8 mt-4">
          <ViewToggle
            currentView={viewMode}
            onViewChange={handleViewModeChange}
          />

          {/* Botón único de Filtros */}
          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            className="relative p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center bg-[#2a3347] border border-[#3d4659]"
            title="Filtros"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            {/* Indicador de filtros activos */}
            {(searchTerm || cajaFuerteFilter || dateFilter || activeFilter !== 'all') && (
              <span className="absolute -top-1 -right-1 bg-[#c9a45c] text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">
                !
              </span>
            )}
          </button>
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
                onImageClick={(imgUrl, revision) => openModal(imgUrl, revision)}
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
                                      ? (searchTerm || cajaFuerteFilter || dateFilter || activeFilter !== 'all')
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
                                      onClick={() => openModal(row.evidencia_01, row)}
                                      className="text-[#c9a45c] hover:text-[#f0c987] underline cursor-pointer hover:scale-110 transform bg-[#1e2538]/50 px-1.5 py-0.5 rounded text-xs shadow-[0_2px_4px_rgb(0_0_0/0.2)] hover:shadow-[0_2px_4px_rgb(0_0_0/0.3)] transition-all duration-200 min-w-[20px] flex-shrink-0"
                                      title="Ver evidencia 1"
                                    >
                                      1
                                    </button>
                                  )}
                                  {row.evidencia_02 && (
                                    <button
                                      type="button"
                                      onClick={() => openModal(row.evidencia_02, row)}
                                      className="text-[#c9a45c] hover:text-[#f0c987] underline cursor-pointer hover:scale-110 transform bg-[#1e2538]/50 px-1.5 py-0.5 rounded text-xs shadow-[0_2px_4px_rgb(0_0_0/0.2)] hover:shadow-[0_2px_4px_rgb(0_0_0/0.3)] transition-all duration-200 min-w-[20px] flex-shrink-0"
                                      title="Ver evidencia 2"
                                    >
                                      2
                                    </button>
                                  )}
                                  {row.evidencia_03 && (
                                    <button
                                      type="button"
                                      onClick={() => openModal(row.evidencia_03, row)}
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
          images={modalImages.length > 0 ? modalImages : (modalImg ? [modalImg] : [])}
          initialIndex={modalImages.length > 0 ? modalImages.indexOf(modalImg || '') : 0}
          casita={modalCasita || undefined}
          onClose={closeModal}
        />

        {/* Modal de Login Modernizado */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center md:items-center md:justify-center z-50 p-4 pt-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-[#1e2538] to-[#2a3347] p-4 md:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#3d4659]/50 backdrop-blur-md">
              <div className="text-center mb-2">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-[#c9a45c] bg-clip-text text-transparent">
                  Iniciar Sesión
                </h2>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
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
                    onBlur={(e) => setLoginData({ ...loginData, usuario: e.target.value.trimEnd() })}
                    autoComplete="username"
                    inputMode="text"
                    className="w-full px-3 py-2 text-sm bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30"
                    placeholder="Ingresa tu usuario"
                    required
                  />
                  {loginData.usuario.endsWith(' ') && (
                    <p className="text-xs text-yellow-400 mt-1">No debe haber espacios al final del usuario</p>
                  )}
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
                      className="w-full px-3 py-2 pr-10 text-sm bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30"
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

                <div className="flex gap-2 pt-2 md:pt-4">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 px-3 py-2 text-sm md:text-base bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-gray-600/25 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 text-sm md:text-base bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1a1f35] rounded-xl hover:from-[#d4b06c] hover:to-[#f5d49a] transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-[#c9a45c]/25 font-medium"
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


      {/* Botón flotante para móvil - Nueva Revisión con estilo neumórfico */}
      <div className="md:hidden fixed bottom-24 right-6 z-[60]">
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

      {/* Modal de Filtros */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilterModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-bold text-gray-900">Filtros</h2>
              <button onClick={() => setShowFilterModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {/* Dropdown de Casita */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Seleccionar casita</label>
                <select value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]">
                  <option value="">Todas las casitas</option>
                  {Array.from({ length: 50 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>Casita {i + 1}</option>
                  ))}
                </select>
              </div>

              {/* Filtro de Fecha */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Filtrar por fecha</label>
                <div className="relative">
                  <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]" />
                  {dateFilter && (
                    <button onClick={() => clearDateFilter()} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Estado</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Check in', 'Check out', 'Si', 'No'].map((status) => (
                    <button key={status} onClick={() => setCajaFuerteFilter(cajaFuerteFilter === status ? '' : status)} className={'px-3 py-2 rounded-lg text-xs font-medium transition-all ' + (cajaFuerteFilter === status ? (status === 'Check in' ? 'bg-green-500 text-white shadow-lg' : status === 'Check out' ? 'bg-red-500 text-white shadow-lg' : status === 'Si' ? 'bg-[#c9a45c] text-white shadow-lg' : 'bg-gray-500 text-white shadow-lg') : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200')}>
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtros Avanzados - Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Filtros avanzados</label>
                <select value={activeFilter} onChange={(e) => handleFilterChange(e.target.value as FilterType)} className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]">
                  <option value="all">Todas las revisiones</option>
                  <option value="today">Revisiones de hoy</option>
                  <option value="latest">Última revisión por casita</option>
                  <option value="no-yute">Sin bolso yute</option>
                  <option value="has-yute-1">Con 1 yute</option>
                  <option value="has-yute-2">Con 2 yutes</option>
                  <option value="no-trapo-binocular">Sin trapo binocular</option>
                  <option value="has-trapo-binocular">Hay trapo binocular</option>
                  <option value="no-sombrero">Sin sombrero</option>
                  <option value="has-sombrero">Hay sombrero</option>
                  <option value="no-bulto">Sin bulto</option>
                  <option value="no-cola-caballo">Sin cola de caballo</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2 rounded-b-2xl">
              <button onClick={() => {clearAllFilters(); setShowFilterModal(false);}} className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all text-xs font-medium">Limpiar todo</button>
              <button onClick={() => setShowFilterModal(false)} className="flex-1 px-3 py-2 bg-[#c9a45c] text-gray-900 rounded-lg hover:bg-[#d4b06c] transition-all text-xs font-medium shadow-lg">Aplicar</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
