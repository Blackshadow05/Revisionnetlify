'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import ConfirmationModal from '../../components/ConfirmationModal';
import { PuestoService } from '@/lib/puesto-service';
import { PuestoDataItem } from '@/types/puesto';
import PageTitle from '@/components/ui/PageTitle';

// Hook personalizado de debounce global para batch updates
function useGlobalDebounce(delay: number = 20000) {
  const [pendingChanges, setPendingChanges] = useState<Map<number, Partial<PuestoDataItem>>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onSaveRef = useRef<((changes: Map<number, Partial<PuestoDataItem>>) => Promise<void>) | null>(null);
  const hasUnsavedChanges = useRef(false);
  const pendingChangesRef = useRef(pendingChanges);

  // Actualizar ref cuando cambian los pendingChanges
  useEffect(() => {
    pendingChangesRef.current = pendingChanges;
  }, [pendingChanges]);

  // Cargar hora de último guardado al iniciar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('puesto01_last_save');
    if (saved) {
      setLastSaveTime(new Date(saved));
    }
  }, []);

  // Función para ejecutar el guardado
  const executeSave = useCallback(async () => {
    const currentChanges = pendingChangesRef.current;
    
    if (!onSaveRef.current || currentChanges.size === 0) {
      console.log('🔍 No hay cambios que guardar o no hay handler');
      return;
    }

    console.log('🔍 Iniciando guardado de', currentChanges.size, 'cambios');
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      await onSaveRef.current(currentChanges);
      
      // Éxito - limpiar todo
      setPendingChanges(new Map());
      hasUnsavedChanges.current = false;
      const now = new Date();
      setLastSaveTime(now);
      if (typeof window !== 'undefined') {
        localStorage.setItem('puesto01_last_save', now.toISOString());
      }
      setSaveStatus('success');
      
      console.log('✅ Guardado exitoso');
      
      // Ocultar mensaje de éxito después de 2 segundos
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error al guardar cambios:', error);
      setSaveStatus('error');
      
      // Ocultar mensaje de error después de 5 segundos
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Función para forzar el guardado inmediato
  const forceSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    await executeSave();
  }, [executeSave]);

  const scheduleUpdate = useCallback((id: number, field: string, value: string) => {
    console.log('🔍 Programando actualización:', id, field, value);
    
    // Acumular cambios
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(id) || {};
      newMap.set(id, { ...existing, [field]: value });
      return newMap;
    });

    hasUnsavedChanges.current = true;
    setSaveStatus('idle'); // Reset status cuando hay nuevos cambios

    // Limpiar timer anterior
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      console.log('🔍 Timer anterior cancelado');
    }

    // Iniciar nuevo timer de 20 segundos
    console.log('🔍 Timer de 20s iniciado');
    timerRef.current = setTimeout(() => {
      console.log('🔍 Timer de 20s completado, ejecutando guardado...');
      executeSave();
    }, delay);
  }, [delay, executeSave]);

  const setSaveHandler = useCallback((handler: (changes: Map<number, Partial<PuestoDataItem>>) => Promise<void>) => {
    onSaveRef.current = handler;
  }, []);

  // Event listeners para manejar cambios de pestaña y cierre
  useEffect(() => {
    // Detectar cuando la pestaña pierde visibilidad
    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges.current) {
        console.log('🔍 Pestaña oculta, forzando guardado');
        forceSave();
      }
    };

    // Detectar antes de que la página se descargue
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        const changesArray = Array.from(pendingChangesRef.current.entries());
        localStorage.setItem('puesto01_unsaved_changes', JSON.stringify(changesArray));
        
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
        return e.returnValue;
      }
    };

    // Detectar cuando la página se enfoca de nuevo
    const handleFocus = () => {
      const savedChanges = localStorage.getItem('puesto01_unsaved_changes');
      if (savedChanges) {
        try {
          const changesArray = JSON.parse(savedChanges) as [number, Partial<PuestoDataItem>][];
          if (changesArray.length > 0 && onSaveRef.current) {
            console.log('🔍 Recuperando cambios del localStorage');
            const changesMap = new Map<number, Partial<PuestoDataItem>>(changesArray);
            onSaveRef.current(changesMap);
            localStorage.removeItem('puesto01_unsaved_changes');
          }
        } catch (error) {
          console.error('Error al recuperar cambios:', error);
          localStorage.removeItem('puesto01_unsaved_changes');
        }
      }
    };

    // Agregar event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [forceSave]);

  return { 
    scheduleUpdate, 
    setSaveHandler, 
    isSaving, 
    saveStatus,
    lastSaveTime,
    pendingChangesCount: pendingChanges.size,
    forceSave
  };
}

// Definición de tipo para los datos de la tarjeta
const TIPO_OPTIONS = ['Tour', 'Check in', 'Check out', 'Outside Guest'] as const;
type TipoOption = typeof TIPO_OPTIONS[number];

// Función para obtener fecha actual en formato ISO (YYYY-MM-DD) para Supabase
const getCurrentDateISO = (): string => {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const isoDate = `${year}-${month}-${day}`;
  return isoDate;
};

// Función para convertir de formato DD/MM/YYYY a YYYY-MM-DD
const convertToISO = (dateStr: string): string => {
  if (!dateStr || dateStr.trim() === '') {
    const isoDate = getCurrentDateISO();
    return isoDate;
  }
  
  // Si ya está en formato ISO, devolverlo tal como está
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // Si está en formato DD/MM/YYYY, convertir
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return isoDate;
  }
  
  const fallbackDate = getCurrentDateISO();
  return fallbackDate;
};

// Función para convertir de formato YYYY-MM-DD a DD/MM/YYYY para mostrar
const convertToDisplay = (dateStr: string): string => {
  if (!dateStr || dateStr.trim() === '') return '';
  
  // Si está en formato ISO, convertir a display
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // Si ya está en formato DD/MM/YYYY, devolverlo tal como está
  return dateStr;
};

// Función para crear data inicial
const createInitialData = (): PuestoDataItem[] => [
  {
    id: 1,
    nombre: '',
    casita: '',
    detalle: '',
    tipo: 'Check in',
    placa: '',
    horaIngreso: '',
    oficialIngreso: '',
    horaSalida: '',
    oficialSalida: '',
    fecha: getCurrentDateISO(),
  },
];

// Componente para cada fila de datos, ahora editable
const PuestoDataCard = ({ item, onUpdate, onDelete, statusColorClass }: { 
  item: PuestoDataItem, 
  onUpdate: (id: number, field: string, value: string) => void, 
  onDelete: (id: number) => void, 
  statusColorClass: string 
}) => {
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});
  const inputRefs = useRef<Record<string, HTMLElement | null>>({});
  const [localItem, setLocalItem] = useState<PuestoDataItem>(item);

  // Orden de campos para navegación
  const fieldOrder = useRef<string[]>([
    'nombre',
    'casita',
    'detalle',
    'tipo',
    'placa',
    'horaIngreso',
    'oficialIngreso',
    'horaSalida',
    'oficialSalida',
    'fecha',
  ]);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Actualizar estado local inmediatamente (sin lag en UI)
    setLocalItem(prev => ({ ...prev, [name]: value }));
    
    // Programar guardado con debounce global
    onUpdate(item.id, name, value);
  }, [item.id, onUpdate]);

  // Auto-ajustar altura para textareas
  useEffect(() => {
    Object.values(textareaRefs.current).forEach(textarea => {
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    });
  }, [localItem.nombre, localItem.detalle, localItem.oficialIngreso, localItem.oficialSalida]);

  const setTextareaRef = useCallback((name: string) => (el: HTMLTextAreaElement | null) => {
    textareaRefs.current[name] = el;
  }, []);

  const setInputRef = (name: string) => (el: HTMLElement | null) => {
    inputRefs.current[name] = el;
  };

  // Manejar navegación con flechas izquierda/derecha
  const handleArrowNavigate = useCallback((field: string) => (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (typeof window !== 'undefined' && window.innerWidth < 768) return; // Solo desktop

    const order = fieldOrder.current;
    const idx = order.indexOf(field);
    if (idx === -1) return;
    e.preventDefault();
    const nextIdx = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= order.length) return;
    const nextField = order[nextIdx];
    const nextEl = inputRefs.current[nextField];
    if (nextEl) {
      (nextEl as HTMLElement).focus();
      if ((nextEl as HTMLInputElement | HTMLTextAreaElement).select) {
        (nextEl as HTMLInputElement | HTMLTextAreaElement).select();
      }
    }
  }, []);

  const inputStyles = "w-full bg-transparent border-b border-gray-300 focus:border-[#c9a45c] outline-none text-black text-xs";
  const textareaStyles = "w-full bg-transparent border-b border-gray-300 focus:border-[#c9a45c] outline-none text-black text-xs resize-none overflow-hidden";
  const labelStyles = "text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider";

  return (
    <div className={`rounded-xl border p-3 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-x-4 gap-y-2 items-center transition-all duration-300 hover:border-[#c9a45c]/40 ${statusColorClass}`}>
      
      <div className="col-span-2">
        <p className={labelStyles}>Nombre</p>
        <textarea 
          ref={(el) => { setTextareaRef('nombre')(el); setInputRef('nombre')(el); }}
          name="nombre" 
          value={localItem.nombre} 
          onChange={handleInputChange} 
          className={textareaStyles} 
          onKeyDown={handleArrowNavigate('nombre')}
          rows={1}
        />
      </div>
      <div className="col-span-1">
        <p className={labelStyles}>Casita</p>
        <input type="text" name="casita" value={localItem.casita} onChange={handleInputChange} className={inputStyles} ref={setInputRef('casita')} onKeyDown={handleArrowNavigate('casita')}/>
      </div>
      <div className="col-span-4 sm:col-span-3 lg:col-span-1">
        <p className={labelStyles}>Detalle</p>
        <textarea 
          ref={(el) => { setTextareaRef('detalle')(el); setInputRef('detalle')(el); }}
          name="detalle" 
          value={localItem.detalle} 
          onChange={handleInputChange} 
          className={textareaStyles} 
          onKeyDown={handleArrowNavigate('detalle')}
          rows={1}
        />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <p className={labelStyles}>Tipo</p>
        <select name="tipo" value={localItem.tipo} onChange={handleInputChange} ref={setInputRef('tipo')} onKeyDown={handleArrowNavigate('tipo')} className="w-full bg-gray-50 border border-gray-300 focus:border-[#c9a45c] outline-none text-black rounded p-1 text-xs">
          {TIPO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <p className={labelStyles}>Placa</p>
        <input type="text" name="placa" value={localItem.placa} onChange={handleInputChange} className={inputStyles} ref={setInputRef('placa')} onKeyDown={handleArrowNavigate('placa')}/>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <p className={`${labelStyles} text-green-600`}>Hora Ingreso</p>
        <input type="text" name="horaIngreso" value={localItem.horaIngreso} onChange={handleInputChange} className={inputStyles} placeholder="HH:MM" ref={setInputRef('horaIngreso')} onKeyDown={handleArrowNavigate('horaIngreso')}/>
      </div>
      <div className="col-span-2 sm:col-span-2 lg:col-span-1">
        <p className={`${labelStyles} text-green-600`}>Oficial Ingreso</p>
        <textarea 
          ref={(el) => { setTextareaRef('oficialIngreso')(el); setInputRef('oficialIngreso')(el); }}
          name="oficialIngreso" 
          value={localItem.oficialIngreso} 
          onChange={handleInputChange} 
          className={textareaStyles} 
          onKeyDown={handleArrowNavigate('oficialIngreso')}
          rows={1}
        />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <p className={`${labelStyles} text-blue-600`}>Hora Salida</p>
        <input type="text" name="horaSalida" value={localItem.horaSalida} onChange={handleInputChange} className={inputStyles} placeholder="HH:MM" ref={setInputRef('horaSalida')} onKeyDown={handleArrowNavigate('horaSalida')}/>
      </div>
      <div className="col-span-2 sm:col-span-2 lg:col-span-1">
        <p className={`${labelStyles} text-blue-600`}>Oficial Salida</p>
        <textarea 
          ref={(el) => { setTextareaRef('oficialSalida')(el); setInputRef('oficialSalida')(el); }}
          name="oficialSalida" 
          value={localItem.oficialSalida} 
          onChange={handleInputChange} 
          className={textareaStyles} 
          onKeyDown={handleArrowNavigate('oficialSalida')}
          rows={1}
        />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <p className={labelStyles}>Fecha</p>
        <input 
          type="text" 
          name="fecha" 
          value={convertToDisplay(localItem.fecha)} 
          className={inputStyles}
          placeholder="DD/MM/YYYY"
          ref={setInputRef('fecha')}
          onKeyDown={handleArrowNavigate('fecha')}
          readOnly
        />
      </div>
      <div className="col-span-1 flex items-end justify-center">
        <button 
          onClick={() => onDelete(item.id)} 
          className="bg-red-500 text-white hover:bg-red-600 transition-colors p-1 rounded-full"
          title="Eliminar este registro"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function Puesto01Page() {
  const [records, setRecords] = useState<PuestoDataItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToDeleteId, setRecordToDeleteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // Fecha seleccionada (YYYY-MM-DD) para filtrar registros
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => getCurrentDateISO());
  // Mostrar todas las fechas sin filtro
  const [showAllDates, setShowAllDates] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Hook de debounce global (25 segundos)
  const { scheduleUpdate, setSaveHandler, isSaving: isAutoSaving, saveStatus, lastSaveTime, pendingChangesCount, forceSave } = useGlobalDebounce(25000);

  // Contador regresivo para el autosave
  const [countdown, setCountdown] = useState(25);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Función para iniciar el contador de 25 → 0
  const startCountdown = useCallback(() => {
    // Reiniciar
    setCountdown(25);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);
  
  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Evitar error de hidratación - solo ejecutar en el cliente
  useEffect(() => {
    setIsMounted(true);
    loadRecords();
  }, []);

  // Recargar registros cuando cambie la fecha seleccionada o el modo de todas las fechas
  useEffect(() => {
    if (isMounted) {
      loadRecords();
    }
  }, [selectedDateStr, showAllDates]);

  // Configurar el handler de guardado para el debounce
  useEffect(() => {
    setSaveHandler(async (pendingChanges) => {
      const changesArray = Array.from(pendingChanges.entries());
      
      for (const [id, changes] of changesArray) {
        try {
          const currentRecord = records.find(r => r.id === id);
          if (currentRecord) {
            const updatedRecord: PuestoDataItem = { ...currentRecord, ...changes };
            
            // Convertir fecha si es necesario
            if (changes.fecha) {
              updatedRecord.fecha = convertToISO(changes.fecha);
            }
            
            await PuestoService.updateRecord(id, updatedRecord);
          }
        } catch (error) {
          console.error('❌ Error al guardar registro:', id, error);
          throw error; // Re-throw para que se maneje en el UI
        }
      }
    });
  }, [records, setSaveHandler]);

  const loadRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await PuestoService.getAllRecords();
      
      // Si no hay datos, crear un registro inicial
      if (data.length === 0) {
        const initialRecord = {
          nombre: '',
          casita: '',
          detalle: '',
          tipo: 'Check in' as TipoOption,
          placa: '',
          horaIngreso: '',
          oficialIngreso: '',
          horaSalida: '',
          oficialSalida: '',
          fecha: getCurrentDateISO(),
        };
        const newRecord = await PuestoService.createRecord(initialRecord);
        // Convertir la fecha del registro creado para mostrar
        const recordWithDisplayDate = {
          ...newRecord,
          fecha: convertToDisplay(newRecord.fecha)
        };
        setRecords([recordWithDisplayDate]);
      } else {
        // Convertir fechas de ISO a formato display
        const dataWithDisplayDates = data.map(record => ({
          ...record,
          fecha: convertToDisplay(record.fecha)
        }));
        setRecords(dataWithDisplayDates);
      }
    } catch (err) {
      console.error('Error al cargar registros:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      // Fallback a datos locales si hay error (solo en el cliente)
      if (typeof window !== 'undefined') {
        setRecords(createInitialData());
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para actualizaciones con debounce global
  const handleUpdateRecord = useCallback((id: number, field: string, value: string) => {
    // Actualizar inmediatamente en la UI (optimistic update)
    setRecords(prevRecords => 
      prevRecords.map(rec => 
        rec.id === id ? { ...rec, [field]: value } : rec
      )
    );

    // Programar guardado con debounce de 25 segundos
    scheduleUpdate(id, field, value);
    startCountdown();
  }, [scheduleUpdate]);

  const handleAddRecord = useCallback(async () => {
    try {
      setIsSaving(true);
      const newRecord = {
        nombre: '',
        casita: '',
        detalle: '',
        tipo: 'Check in' as TipoOption,
        placa: '',
        horaIngreso: '',
        oficialIngreso: '',
        horaSalida: '',
        oficialSalida: '',
        fecha: getCurrentDateISO(),
      };
      const createdRecord = await PuestoService.createRecord(newRecord);
      // Convertir la fecha del registro creado para mostrar
      const recordWithDisplayDate = {
        ...createdRecord,
        fecha: convertToDisplay(createdRecord.fecha)
      };
      setRecords(prevRecords => [recordWithDisplayDate, ...prevRecords]);
    } catch (error) {
      console.error('Error al agregar registro:', error);
      setError('Error al agregar registro');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleDeleteClick = useCallback((id: number) => {
    setRecordToDeleteId(id);
    setIsModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (recordToDeleteId !== null) {
      try {
        await PuestoService.deleteRecord(recordToDeleteId);
        setRecords(prevRecords => prevRecords.filter(rec => rec.id !== recordToDeleteId));
        setRecordToDeleteId(null);
      } catch (err) {
        console.error('Error al eliminar registro:', err);
        setError(err instanceof Error ? err.message : 'Error al eliminar el registro');
      }
    }
    setIsModalOpen(false);
  }, [recordToDeleteId]);

  const handleCancelDelete = useCallback(() => {
    setRecordToDeleteId(null);
    setIsModalOpen(false);
  }, []);

  // Función para obtener la fecha de hoy en formato DD/MM/YYYY
  const getTodayDisplayDate = () => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString();
    return `${day}/${month}/${year}`;
  };

  // Filtrar registros según la fecha seleccionada y el estado de "todas las fechas"
  const dateFiltered = showAllDates
    ? records
    : records.filter(item => {
        const [year, month, day] = selectedDateStr.split('-');
        const displayDate = `${day}/${month}/${year}`;
        return item.fecha === displayDate;
      });

  // Campos a considerar en búsqueda
  const SEARCHABLE_FIELDS: (keyof PuestoDataItem)[] = ['nombre', 'casita', 'detalle', 'tipo', 'placa'];

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return dateFiltered;
    const query = searchQuery.toLowerCase();
    return dateFiltered.filter((item) => {
      return SEARCHABLE_FIELDS.some((field) => String(item[field] ?? '').toLowerCase().includes(query));
    });
  }, [searchQuery, dateFiltered]);

  // Prevenir error de hidratación - no renderizar hasta que esté montado
  if (!isMounted) {
    return (
      <main className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a45c]"></div>
            <span className="ml-3 text-gray-400">Cargando...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{
      background: '#334d50',
      backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
    }}>
      <main className="max-w-7xl mx-auto">
        {/* Indicadores de estado solo después de montar - Evita hidratación */}
        {isMounted && (
          <>
            {saveStatus === 'saving' && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-down">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span className="font-medium">Guardando cambios...</span>
                {pendingChangesCount > 0 && (
                  <span className="bg-blue-800 px-2 py-1 rounded text-sm">
                    {pendingChangesCount} cambios
                  </span>
                )}
              </div>
            )}

            {saveStatus === 'success' && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-down">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">✅ Cambios guardados exitosamente</span>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-down">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-medium">❌ Error al guardar cambios</span>
                <button 
                  onClick={forceSave}
                  className="bg-red-800 hover:bg-red-700 px-2 py-1 rounded text-sm transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}
          </>
        )}

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <PageTitle size="md">Puesto 01 Control</PageTitle>
            <div className="flex gap-2 items-center overflow-x-auto">
              {/* Menú desplegable para móvil (ahora primero) */}
              <div className="relative md:hidden">
                <button
                  onClick={() => setIsMenuOpen(prev => !prev)}
                  className="px-2 py-1 bg-slate-800 text-gray-300 rounded-lg border border-gray-600 flex items-center gap-1 focus:outline-none hover:bg-slate-700"
                  title="Menú"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                  </svg>
                </button>
                {isMenuOpen && (
                  <div className="absolute left-0 mt-2 top-full w-40 bg-slate-800 border border-gray-700 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => { setShowAllDates(v => !v); setIsMenuOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-slate-700"
                    >
                      {showAllDates ? 'Filtrar fecha' : 'Todas las fechas'}
                    </button>
                    <button
                      onClick={() => { loadRecords(); setIsMenuOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-slate-700"
                    >
                      Actualizar
                    </button>
                  </div>
                )}
              </div>

              {/* Selector de fecha */}
              <input
                type="date"
                value={selectedDateStr}
                onChange={e => setSelectedDateStr(e.target.value)}
                className="px-2 py-1 bg-slate-800 text-gray-300 rounded-lg border border-gray-600 focus:border-[#c9a45c] focus:outline-none text-xs md:text-sm min-w-[120px]"
              />
              {/* Botón Todas las fechas */}
              <button
                onClick={() => setShowAllDates(v => !v)}
                className={`px-2 py-1 rounded-lg text-xs md:text-sm transition-colors ${showAllDates ? 'bg-[#c9a45c] text-[#1a1f35]' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'} border border-gray-600`}
              >
                {showAllDates ? 'Filtrar fecha' : 'Todas las fechas'}
              </button>
              <button 
                onClick={handleAddRecord} 
                disabled={isSaving}
                className="hidden md:flex px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isSaving ? 'Guardando...' : 'Agregar Registro'}
              </button>
              {/* Botón guardar ahora solo después de montar */}
              {isMounted && (
                <button 
                  onClick={forceSave}
                  disabled={pendingChangesCount === 0}
                  className="hidden md:flex px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Guardar Ahora
                </button>
              )}
              {/* Botón Actualizar solo visible en escritorio */}
              <button 
                onClick={loadRecords}
                className="hidden md:flex px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Actualizar
              </button>

              <Link href="/" className="hidden md:flex px-4 py-2 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition-colors items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Volver
              </Link>
            </div>
            {/* Fila de botones de acción solo móvil */}
            <div className="md:hidden flex gap-2 w-full mt-2">
              <button 
                onClick={handleAddRecord} 
                disabled={isSaving}
                className="flex-1 px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isSaving ? 'Guardando...' : 'Agregar'}
              </button>
              {isMounted && (
                <button 
                  onClick={forceSave}
                  disabled={pendingChangesCount === 0}
                  className="flex-1 px-2 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Guardar
                </button>
              )}
              <Link href="/" className="flex-1 px-2 py-1 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition-colors text-center text-xs flex items-center justify-center gap-1 min-w-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Volver
              </Link>
            </div>
          </div>
          
          {/* Información de estado mejorada - Solo después de montar */}
          <div className="mt-2 space-y-1">
            <div className="backdrop-blur-md bg-white/30 border border-white/40 text-slate-900 shadow-lg rounded-xl px-4 py-2 flex flex-col md:flex-row md:items-center md:gap-6">
              <p className={`flex items-center gap-2 font-semibold drop-shadow-sm` }>
                {pendingChangesCount > 0 ? (
                  <>
                    Guardando en <span className="text-slate-700 font-mono text-sm">{countdown}s</span>
                  </>
                ) : (
                  <>Últimos guardados</>
                )}
              </p>
              {isMounted && lastSaveTime && (
                <span className="text-slate-700 font-mono text-sm mt-1 md:mt-0">
                  {`Hora: ${lastSaveTime.toLocaleTimeString()}`}
                </span>
              )}
            </div>
          </div>
          
          {/* Mostrar errores */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Cerrar
              </button>
            </div>
          )}
        </header>

        {/* Buscador */}
        <div className="w-full mt-3 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full md:w-80 px-2 py-2 bg-slate-800 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:border-[#c9a45c] focus:outline-none text-sm"
          />
        </div>

        {/* "Tabla" de datos con diseño de tarjetas */}
        <div className="space-y-2">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a45c]"></div>
              <span className="ml-3 text-gray-400">Cargando registros...</span>
            </div>
          )}

          {/* Indicador de cambios pendientes */}
          {pendingChangesCount > 0 && (
            <div className="text-sm text-yellow-500 mt-2">
              {pendingChangesCount} cambios pendientes por guardar
            </div>
          )}

          {/* Lista de datos filtrada */}
          {!isLoading && filteredRecords.map(item => {
            const hasHoraIngreso = item.horaIngreso && item.horaIngreso.trim() !== '';
            const hasHoraSalida = item.horaSalida && item.horaSalida.trim() !== '';

            let statusColorClass = 'bg-white border-gray-200'; // Color por defecto (ningún horario)

            if (hasHoraIngreso && hasHoraSalida) {
              // Verde más notorio y "lujoso"
              statusColorClass = 'bg-green-200 border-green-500';
            } else if (hasHoraIngreso || hasHoraSalida) {
              // Rojo más notorio y "lujoso"
              statusColorClass = 'bg-red-200 border-red-500';
            }

            return (
              <PuestoDataCard 
                key={item.id} 
                item={item} 
                onUpdate={handleUpdateRecord} 
                onDelete={handleDeleteClick} 
                statusColorClass={statusColorClass}
              />
            );
          })}
        </div>

        <ConfirmationModal
          isOpen={isModalOpen}
          message="¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </main>
    </div>
  );
}
