'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import Sidebar from '@/components/Sidebar';
import ImageModal from '@/components/revision/ImageModal';
import PageTitle from '@/components/ui/PageTitle';
import ViewToggle from '@/components/ui/ViewToggle';
import CardView from '@/components/revision/CardView';
import { PuestoService } from '@/lib/puesto-service';

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
  datos_anteriores: any;
  datos_actuales: any;

  camas_ordenadas: string;
  cola_caballo: string;
  notas: string;
  notas_count: number;
}

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, userRole, login, logout, user } = useAuth();
  const [data, setData] = useState<RevisionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cajaFuerteFilter, setCajaFuerteFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({
    usuario: '',
    password: ''
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportType, setReportType] = useState<'Revisión Casitas' | 'Puesto 01'>('Revisión Casitas');

  // 🚀 Estados para paginado
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(40);

  // 🎯 Estado para modo de vista (tabla/tarjeta) - Card por defecto en móvil
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => {
    // Detectar si es móvil para establecer vista por defecto
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768; // md breakpoint
      return isMobile ? 'card' : 'table';
    }
    return 'table';
  });

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



  // 🎯 Efecto para cargar preferencia de vista desde sessionStorage
  useEffect(() => {
    try {
      const savedViewMode = sessionStorage.getItem('revisionViewMode');
      if (savedViewMode === 'card' || savedViewMode === 'table') {
        setViewMode(savedViewMode);
      }
    } catch (error) {
      console.log('Error al cargar preferencia de vista:', error);
    }
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

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // 🚀 Efecto para detectar dispositivo y ajustar elementos por página
  // Paginación fija de 40 registros por página para todos los dispositivos
  useEffect(() => {
    setItemsPerPage(40);
    setCurrentPage(1);
  }, []);

  // Cerrar sidebar con tecla ESC se maneja dentro del componente Sidebar

  const fetchRevisiones = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar la conexión con Supabase
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        throw new Error('No se pudo conectar con la base de datos. Por favor, verifica tu conexión.');
      }

      // Cargar TODOS los datos sin paginación en la consulta
      const { data, error } = await supabase
        .from('revisiones_casitas')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching data:', error);
        throw new Error('Error al cargar los datos: ' + error.message);
      }

      if (!data) {
        throw new Error('No se encontraron datos');
      }

      setData(data);
    } catch (error: any) {
      console.error('Error in fetchData:', error);
      setError(error.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(row => {
    const searchLower = searchTerm.toLowerCase();

    const cajaFuerteMatch = !cajaFuerteFilter || row.caja_fuerte === cajaFuerteFilter;

    if (!searchTerm) {
      return cajaFuerteMatch;
    }

    const searchMatch =
      row.casita.toLowerCase() === searchLower ||
      row.quien_revisa.toLowerCase().includes(searchLower) ||
      row.caja_fuerte.toLowerCase().includes(searchLower);

    return cajaFuerteMatch && searchMatch;
  });

  // 🚀 Cálculos de paginado
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);



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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Error al eliminar la revisión:', error);
      setError(error.message);
    }
  };

  const handleExportExcel = async () => {
    try {
      // Filtrar datos por rango de fechas
      const filteredDataForExport = data.filter(row => {
        const rowDate = new Date(row.created_at).toISOString().split('T')[0];
        return rowDate >= reportDateFrom && rowDate <= reportDateTo;
      });

      if (filteredDataForExport.length === 0) {
        alert('No hay datos en el rango de fechas seleccionado');
        return;
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

      // Crear archivo Excel usando una implementación simple
      const csvContent = [
        Object.keys(excelData[0]).join(','),
        ...excelData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Reporte_Revisiones_${reportDateFrom}_${reportDateTo}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cerrar modal y limpiar campos
      setShowReportModal(false);
      setShowSidebar(false);
      setReportDateFrom('');
      setReportDateTo('');

      alert(`Reporte exportado exitosamente como CSV`);
    } catch (error) {
      console.error('Error al exportar:', error);
    }
  };

  // Exportar reporte de Puesto_01 por rango de fechas en CSV
  // Exportar reporte de Puesto_01 por rango de fechas en CSV
  function formatToDDMMYYYY(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  const handleExportPuesto01 = async () => {
    try {
      if (!reportDateFrom || !reportDateTo) {
        alert('Debes seleccionar un rango de fechas para exportar el reporte de Puesto 01');
        return;
      }
      const fechaDesde = formatToDDMMYYYY(reportDateFrom);
      const fechaHasta = formatToDDMMYYYY(reportDateTo);
      const data = await PuestoService.getRecordsByDateRange(fechaDesde, fechaHasta);
      if (!data.length) {
        alert('No hay registros de Puesto 01 en el rango de fechas seleccionado');
        return;
      }
      // @ts-ignore - sheetjs types opcional
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Puesto01_${reportDateFrom}_${reportDateTo}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      alert('Reporte Puesto 01 exportado exitosamente como CSV');
    } catch (err) {
      console.error(err);
      alert('Error al exportar reporte Puesto 01');
    }
  };

  // Función para exportar el reporte adecuado
  const handleExport = async () => {
    if (reportType === 'Revisión Casitas') {
      await handleExportExcel();
    } else {
      await handleExportPuesto01();
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
          {/* Botón del menú lateral dentro del hero */}
          <button
            className="absolute left-0 z-20 w-11 h-11 bg-gradient-to-br from-[#c9a45c] to-[#f0c987] rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200 group top-4 md:top-2"
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

        {/* Sidebar */}
        <Sidebar
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
          onShowReportModal={() => setShowReportModal(true)}
        />

        {/* Barra de Acciones Mejorada */}
        <div className="bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-xl p-6 border border-[#3d4659]/50 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Info del Usuario */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#c9a45c] to-[#f0c987] rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#1a1f35]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">{user}</p>
                    <p className="text-[#c9a45c] text-sm">{userRole}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-wrap gap-3">
              {/* Solo mostrar botón de login si no está logueado */}
              {!isLoggedIn && (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="metallic-button metallic-button-gold px-4 py-2.5 text-white rounded-xl hover:shadow-lg hover:shadow-[#c9a45c]/40 transition-all duration-300 transform hover:scale-[1.02] flex items-center gap-2 font-medium"
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

        {/* Barra de Búsqueda y Filtros Mejorada */}
        <div className="bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-xl p-6 border border-[#3d4659]/50 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda Principal */}
            <div className="flex-1 relative order-2 lg:order-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por casita, revisor o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30"
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
                className="w-full lg:w-48 px-4 py-3 bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30 appearance-none cursor-pointer"
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

          {/* Resultados de búsqueda */}
          {(searchTerm || cajaFuerteFilter) && (
            <div className="mt-4 pt-4 border-t border-[#3d4659]/50">
              <p className="text-gray-400 text-sm">
                Mostrando {filteredData.length} de {data.length} revisiones
                {searchTerm && <span> para "{searchTerm}"</span>}
                {cajaFuerteFilter && <span> con caja fuerte "{cajaFuerteFilter}"</span>}
              </p>
            </div>
          )}
        </div>

        {/* Toggle de Vista - Solo visible si el usuario está logueado */}
        {isLoggedIn && (
          <div className="flex justify-center mb-6">
            <ViewToggle
              currentView={viewMode}
              onViewChange={handleViewModeChange}
            />
          </div>
        )}

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
                                    {filteredData.length === 0 ? 'No se encontraron revisiones' : 'No hay datos en esta página'}
                                  </h3>
                                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                                    {filteredData.length === 0
                                      ? (searchTerm || cajaFuerteFilter)
                                        ? 'Intenta ajustar los filtros de búsqueda para encontrar revisiones.'
                                        : 'Aún no se han registrado revisiones en el sistema.'
                                      : `Página ${currentPage} está vacía. Navega a una página anterior.`
                                    }
                                  </p>
                                  {filteredData.length === 0 && (searchTerm || cajaFuerteFilter) && (
                                    <button
                                      onClick={() => {
                                        setSearchTerm('');
                                        setCajaFuerteFilter('');
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
                                    {row.created_at.split('+')[0].split('T')[0]}
                                  </span>
                                  <span className="text-[13px] md:text-xs text-[#c9a45c]">
                                    {row.created_at.split('+')[0].split('T')[1].split(':').slice(0, 2).join(':')}
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
                                      className="text-[#c9a45c] hover:text-[#f0c987] underline cursor-pointer hover:scale-110 transform duration-200 bg-[#1e2538]/50 px-1.5 py-0.5 rounded text-xs shadow-[0_2px_4px_rgb(0_0_0/0.2)] hover:shadow-[0_2px_4px_rgb(0_0_0/0.3)] transition-all duration-200 min-w-[20px] flex-shrink-0"
                                      title="Ver evidencia 1"
                                    >
                                      1
                                    </button>
                                  )}
                                  {row.evidencia_02 && (
                                    <button
                                      type="button"
                                      onClick={() => openModal(row.evidencia_02)}
                                      className="text-[#c9a45c] hover:text-[#f0c987] underline cursor-pointer hover:scale-110 transform duration-200 bg-[#1e2538]/50 px-1.5 py-0.5 rounded text-xs shadow-[0_2px_4px_rgb(0_0_0/0.2)] hover:shadow-[0_2px_4px_rgb(0_0_0/0.3)] transition-all duration-200 min-w-[20px] flex-shrink-0"
                                      title="Ver evidencia 2"
                                    >
                                      2
                                    </button>
                                  )}
                                  {row.evidencia_03 && (
                                    <button
                                      type="button"
                                      onClick={() => openModal(row.evidencia_03)}
                                      className="text-[#c9a45c] hover:text-[#f0c987] underline cursor-pointer hover:scale-110 transform duration-200 bg-[#1e2538]/50 px-1.5 py-0.5 rounded text-xs shadow-[0_2px_4px_rgb(0_0_0/0.3)] transition-all duration-200 min-w-[20px] flex-shrink-0"
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
                  <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
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
                  <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#c9a45c]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#1a1f35] to-[#1e2538] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-all duration-300 hover:border-[#c9a45c]/30"
                    placeholder="Ingresa tu contraseña"
                    required
                  />
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
                  <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
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
                  <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
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
                  <label className="block text-sm font-semibold text-gray-300 flex items-center gap-2">
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

      {/* Botón flotante para móvil - Nueva Revisión con verde difuminado */}
      <div className="md:hidden fixed bottom-24 right-6 z-50">
        <button
          onClick={() => router.push('/nueva-revision?new=true')}
          className="w-14 h-14 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-full shadow-lg hover:shadow-xl hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center group hover:from-green-400 hover:via-green-500 hover:to-emerald-500"
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
    </main>
  );
}