'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import { PuestoService } from '@/lib/puesto-service';
import { PuestoDataItem } from '@/types/puesto';
import PageTitle from '@/components/ui/PageTitle';
import { Icon } from '@iconify/react';

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

  // Cargar hora de último guardado al iniciar desde la API
  useEffect(() => {
    const fetchLastSaveTime = async () => {
      try {
        const response = await fetch('/api/metadata/lastSaved_puesto01');
        if (response.ok) {
          const data = await response.json();
          if (data && data.updated_at) {
            setLastSaveTime(new Date(data.updated_at));
          }
        }
      } catch (error) {
        console.error('Error al obtener la hora del último guardado:', error);
      }
    };

    fetchLastSaveTime();
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
      
      // Actualizar la hora en la base de datos centralizada
      try {
        await fetch('/api/metadata/lastSaved_puesto01', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: now.toISOString() }),
        });
      } catch (error) {
        console.error('Error al actualizar la hora de guardado en la BD:', error);
        // No se considera un error fatal para el guardado de datos
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
        
        // Guardar cambios en localStorage
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
  const [localItem, setLocalItem] = useState<PuestoDataItem>(item);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    setLocalItem(item);
  }, [item]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalItem(prev => ({ ...prev, [name]: value }));
    onUpdate(item.id, name, value);

    if (e.target.tagName.toLowerCase() === 'textarea') {
      const textarea = e.target as HTMLTextAreaElement;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [item.id, onUpdate]);

  // Función para ajustar altura de todos los textareas
  const autoResizeAllTextareas = useCallback(() => {
    Object.values(textareaRefs.current).forEach(textarea => {
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    });
  }, []);

  // Ajustar altura al montar y cada vez que cambie cualquier campo relevante
  useEffect(() => {
    autoResizeAllTextareas();
  }, [localItem.nombre, localItem.detalle, localItem.oficialIngreso, localItem.oficialSalida]);

  // También al montar
  useEffect(() => {
    autoResizeAllTextareas();
  }, []);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(item.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error al eliminar el registro:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Función para determinar el color del registro basado en las horas
  const getRecordBackgroundStyle = () => {
    const hasHoraIngreso = localItem.horaIngreso && localItem.horaIngreso.trim() !== '';
    const hasHoraSalida = localItem.horaSalida && localItem.horaSalida.trim() !== '';

    if (hasHoraIngreso && hasHoraSalida) {
      // Ambos campos tienen datos - Verde claro
      return 'bg-green-100';
    } else if ((hasHoraIngreso || hasHoraSalida) && !(hasHoraIngreso && hasHoraSalida)) {
      // SOLO uno de los campos tiene datos (XOR) - Rojo claro
      return 'bg-red-100';
    } else {
      // Ninguno tiene datos - Blanco puro
      return 'bg-white';
    }
  };

  // Estilos base para inputs/textarea/select: fondo transparente para igualar el contenedor, bordes suaves
  const commonInputStyles = "w-full bg-transparent border border-transparent focus:border-[#c9a45c] outline-none text-gray-900 rounded p-0.5 text-xs placeholder-gray-500";
  const commonTextareaStyles = `${commonInputStyles} resize-none overflow-hidden break-words`;
  const selectStyles = "w-full bg-transparent border border-transparent focus:border-[#c9a45c] outline-none text-gray-900 rounded p-0.5 text-xs appearance-none";
  const labelStyles = "text-xs font-semibold text-black dark:text-slate-900 mb-0.5 whitespace-nowrap";

  return (
    <div className={`relative p-2 rounded-2xl transition-all duration-300 ${getRecordBackgroundStyle()}`}>
      {/* Vista Desktop */}
      <div className="hidden md:grid grid-cols-[auto_auto_auto_auto_auto_auto_auto_auto_auto_auto] gap-2 items-start">
        {/* Columna 1: Nombre */}
        <div className="min-w-0">
          <p className={`${labelStyles} flex items-center`}>
            <Icon icon="mdi:account-outline" className="mr-1 w-3 h-3" />
            Nombre
          </p>
          <TextareaAutosize
            ref={el => { textareaRefs.current['nombre'] = el; }}
            name="nombre"
            value={localItem.nombre}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} min-w-[120px] w-full`}
            minRows={1}
            placeholder="Nombre..."
          />
        </div>
        
        {/* Columna 2: Casita */}
        <div className="min-w-0">
          <p className={labelStyles}>Casita</p>
          <TextareaAutosize
            name="casita"
            value={localItem.casita}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} min-w-[80px] max-w-[100px]`}
            minRows={1}
            placeholder="Casita..."
          />
        </div>
        
        {/* Columna 3: Detalle */}
        <div className="min-w-0 relative z-20">
          <p className={labelStyles}>Detalle</p>
          <TextareaAutosize
            ref={el => { textareaRefs.current['detalle'] = el; }}
            name="detalle"
            value={localItem.detalle}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} min-w-[150px] w-full`}
            minRows={1}
            placeholder="Detalle..."
          />
        </div>
        
        {/* Columna 4: Tipo */}
        <div className="min-w-0 relative z-10 ml-1">
          <p className={labelStyles}>Tipo</p>
          <select 
            name="tipo" 
            value={localItem.tipo} 
            onChange={handleInputChange} 
            className={`${selectStyles} min-w-[100px] text-orange-600 font-bold` }
          >
            {TIPO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        
        {/* Columna 5: Placa */}
        <div className="min-w-0">
          <p className={labelStyles}>Placa</p>
          <TextareaAutosize
            name="placa"
            value={localItem.placa}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} min-w-[50px] max-w-[70px]`}
            minRows={1}
            placeholder="Placa..."
          />
        </div>
        
        {/* Columna 6: Hora Ingreso */}
        <div className="min-w-0">
          <p className={`${labelStyles}`}>Hora Ingreso</p>
          <input 
            type="text" 
            name="horaIngreso" 
            value={localItem.horaIngreso} 
            onChange={handleInputChange} 
            className={`${commonInputStyles} min-w-[50px] max-w-[70px]`}
            placeholder="HH:MM" 
          />
        </div>
        
        {/* Columna 7: Oficial Ingreso */}
        <div className="min-w-0">
          <p className={`${labelStyles} flex items-center`}>
            <Icon icon="mdi:account-tie" className="mr-1 w-3 h-3" />
            Oficial Ingreso
          </p>
          <TextareaAutosize
            ref={el => { textareaRefs.current['oficialIngreso'] = el; }}
            name="oficialIngreso"
            value={localItem.oficialIngreso}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} min-w-[120px] w-full`}
            minRows={1}
            placeholder="Oficial..."
          />
        </div>
        
        {/* Columna 8: Hora Salida */}
        <div className="min-w-0">
          <p className={`${labelStyles}`}>Hora Salida</p>
          <input 
            type="text" 
            name="horaSalida" 
            value={localItem.horaSalida} 
            onChange={handleInputChange} 
            className={`${commonInputStyles} min-w-[50px] max-w-[70px]`}
            placeholder="HH:MM" 
          />
        </div>
        
        {/* Columna 9: Oficial Salida */}
        <div className="min-w-0">
          <p className={`${labelStyles}`}>Oficial Salida</p>
          <TextareaAutosize
            ref={el => { textareaRefs.current['oficialSalida'] = el; }}
            name="oficialSalida"
            value={localItem.oficialSalida}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} min-w-[120px] w-full`}
            minRows={1}
            placeholder="Oficial..."
          />
        </div>
        
        {/* Columna 10: Fecha + Acción */}
        <div className="min-w-0 flex flex-col items-center justify-center">
          <p className={labelStyles}>Fecha / Acción</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 whitespace-nowrap select-none border border-gray-300">
              {localItem.fecha}
            </span>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-500 text-white hover:bg-red-600 transition-colors p-1 rounded-full"
              title="Eliminar este registro"
            >
              <Icon icon="mdi:trash-can-outline" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Vista Móvil */}
      <div className="md:hidden grid grid-cols-2 gap-2">
        {/* Fila 1: Nombre y Casita */}
        <div className="col-span-1">
          <p className={`${labelStyles} flex items-center`}>
            <Icon icon="mdi:account-outline" className="mr-1 w-3 h-3" />
            Nombre
          </p>
          <TextareaAutosize
            ref={el => { textareaRefs.current['nombre'] = el; }}
            name="nombre"
            value={localItem.nombre}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full`}
            minRows={1}
            placeholder="Nombre..."
          />
        </div>
        <div className="col-span-1">
          <p className={labelStyles}>Casita</p>
          <input 
            type="text" 
            name="casita" 
            value={localItem.casita} 
            onChange={handleInputChange} 
            className={`${commonInputStyles} w-full`}
            placeholder="Casita..."
          />
        </div>

        {/* Fila 2: Detalle (span completo) */}
        <div className="col-span-2 relative z-20">
          <p className={labelStyles}>Detalle</p>
          <TextareaAutosize
            ref={el => { textareaRefs.current['detalle'] = el; }}
            name="detalle"
            value={localItem.detalle}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full`}
            minRows={1}
            placeholder="Detalle..."
          />
        </div>

        {/* Fila 3: Tipo y Placa */}
        <div className="col-span-1 relative z-10 mt-1">
          <p className={labelStyles}>Tipo</p>
          <select 
            name="tipo" 
            value={localItem.tipo} 
            onChange={handleInputChange} 
            className={selectStyles}
          >
            {TIPO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="col-span-1">
          <p className={labelStyles}>Placa</p>
          <input 
            type="text" 
            name="placa" 
            value={localItem.placa} 
            onChange={handleInputChange} 
            className={`${commonInputStyles} w-full`}
            placeholder="Placa..."
          />
        </div>

        {/* Fila 4: Horas */}
        <div className="col-span-1">
          <p className={`${labelStyles}`}>Hora Ingreso</p>
          <input 
            type="text" 
            name="horaIngreso" 
            value={localItem.horaIngreso} 
            onChange={handleInputChange} 
            className={`${commonInputStyles} w-full`}
            placeholder="HH:MM" 
          />
        </div>
        <div className="col-span-1">
          <p className={`${labelStyles}`}>Hora Salida</p>
          <input 
            type="text" 
            name="horaSalida" 
            value={localItem.horaSalida} 
            onChange={handleInputChange} 
            className={`${commonInputStyles} w-full`}
            placeholder="HH:MM" 
          />
        </div>

        {/* Fila 5: Oficiales */}
        <div className="col-span-1">
          <p className={`${labelStyles} flex items-center`}>
            <Icon icon="mdi:account-tie" className="mr-1 w-3 h-3" />
            Oficial Ingreso
          </p>
          <TextareaAutosize
            ref={el => { textareaRefs.current['oficialIngreso'] = el; }}
            name="oficialIngreso"
            value={localItem.oficialIngreso}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full`}
            minRows={1}
            placeholder="Oficial..."
          />
        </div>
        <div className="col-span-1">
          <p className={`${labelStyles}`}>Oficial Salida</p>
          <TextareaAutosize
            ref={el => { textareaRefs.current['oficialSalida'] = el; }}
            name="oficialSalida"
            value={localItem.oficialSalida}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full`}
            minRows={1}
            placeholder="Oficial..."
          />
        </div>

        {/* Fila 6: Fecha y Botón Eliminar */}
        <div className="col-span-1 flex flex-col justify-center items-center mt-2">
          <p className={labelStyles}>Fecha</p>
          <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 whitespace-nowrap select-none border border-gray-300">
            {localItem.fecha}
          </span>
        </div>
        <div className="col-span-1 flex justify-center items-center mt-2">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-500 text-white hover:bg-red-600 transition-colors p-2 rounded-full"
            title="Eliminar este registro"
          >
            <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          message="¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export const capturarDesdeCamara = async (): Promise<File | null> => {
  return new Promise((resolve, reject) => {
    try {
      // Crear input temporal
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      // Forzar apertura de cámara en móviles (no galería)
      input.setAttribute('capture', 'environment');
      
      // Limpiar eventos previos
      input.onchange = null;
      
      // Manejar selección de archivo
      input.onchange = (e) => {
        try {
          const files = (e.target as HTMLInputElement).files;
          if (!files || files.length === 0) {
            resolve(null);
            return;
          }
          
          const file = files[0];
          
          // Validar tamaño (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            throw new Error('El archivo es demasiado grande (máximo 5MB)');
          }
          
          resolve(file);
        } catch (error) {
          console.error('Error al procesar imagen:', error);
          reject(error);
        } finally {
          // Limpieza garantizada
          if (input.parentNode) {
            input.parentNode.removeChild(input);
          }
        }
      };
      
      // Trigger file selection
      document.body.appendChild(input); // Necesario para algunos navegadores
      input.click();
      
      // Limpieza si el usuario cancela
      window.addEventListener('focus', () => {
        setTimeout(() => {
          if (input.parentNode) {
            input.parentNode.removeChild(input);
          }
        }, 1000);
      }, { once: true });
      
    } catch (error) {
      console.error('Error en capturarDesdeCamara:', error);
      reject(error);
    }
  });
};

export default function Puesto01Page() {
  const [records, setRecords] = useState<PuestoDataItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToDeleteId, setRecordToDeleteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // Fecha seleccionada (YYYY-MM-DD) para filtrar registros
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  // Mostrar todas las fechas sin filtro
  const [showAllDates, setShowAllDates] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 40;

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
    setSelectedDateStr(getCurrentDateISO());
  }, []);

  // Recargar registros cuando cambie la fecha seleccionada o el modo de todas las fechas
  useEffect(() => {
    if (isMounted && selectedDateStr) {
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
          tipo: 'Check in',
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
        tipo: 'Check in',
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

  // Resetear paginación si los filtros cambian
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFiltered]);

  // Calcular registros para la página actual
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);

  // Render layout base siempre, loader solo en contenido dinámico
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <PageTitle size="md">Puesto 01 Control</PageTitle>

              {/* Controles de Escritorio */}
              <div className="hidden md:flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={e => setSelectedDateStr(e.target.value)}
                  className="px-2 py-1 bg-slate-800 text-gray-300 rounded-lg border border-gray-600 focus:border-[#c9a45c] focus:outline-none text-xs md:text-sm min-w-[120px]"
                />
                <button
                  onClick={() => setShowAllDates(v => !v)}
                  className={`px-2 py-1 rounded-lg text-xs md:text-sm transition-colors ${showAllDates ? 'bg-[#c9a45c] text-[#1a1f35]' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'} border border-gray-600`}
                >
                  {showAllDates ? 'Filtrar fecha' : 'Todas las fechas'}
                </button>
                <button 
                  onClick={forceSave}
                  disabled={pendingChangesCount === 0}
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  Guardar Ahora
                </button>
                <button 
                  onClick={loadRecords}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors items-center gap-2 flex"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                  Actualizar
                </button>
                <Link href="/" className="px-4 py-2 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition-colors items-center gap-2 flex">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                  Volver
                </Link>
              </div>
            </div>

            {/* Controles Móviles */}
            <div className="w-full flex flex-col gap-4 md:hidden">
              {/* Sección 1: Filtros de fecha */}
              <div className="flex w-full gap-2">
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={e => setSelectedDateStr(e.target.value)}
                  className="flex-grow px-2 py-1 bg-slate-800 text-gray-300 rounded-lg border border-gray-600 focus:border-[#c9a45c] focus:outline-none text-xs"
                />
                <button
                  onClick={() => setShowAllDates(v => !v)}
                  className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs transition-colors border border-gray-600 ${showAllDates ? 'bg-[#c9a45c] text-[#1a1f35]' : 'bg-slate-800 text-gray-300'}`}
                >
                  {showAllDates ? 'Filtrar' : 'Ver Todas'}
                </button>
              </div>

              {/* Sección 2: Botones de acción */}
              <div className="grid grid-cols-3 gap-2 w-full">
                <button 
                  onClick={handleAddRecord} 
                  disabled={isSaving}
                  className="px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 text-xs disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{isSaving ? '...' : 'Agregar'}</span>
                </button>
                <button 
                  onClick={forceSave}
                  disabled={pendingChangesCount === 0}
                  className="px-2 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-1 text-xs disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  <span>Guardar</span>
                </button>
                <Link href="/" className="px-2 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 text-center text-xs flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                  <span>Volver</span>
                </Link>
              </div>
            </div>
            
            {/* Sección 3: Estado de guardado (común para ambas vistas) */}
            <div className="w-full">
              <div className="backdrop-blur-md bg-white/30 border border-white/40 text-slate-900 shadow-lg rounded-xl px-4 py-2 flex flex-col md:flex-row md:items-center md:gap-6">
                <p className={`flex items-center gap-2 font-semibold drop-shadow-sm`}>
                  {pendingChangesCount > 0 ? (
                    <>Guardando en <span className="text-slate-700 font-mono text-sm">{countdown}s</span></>
                  ) : (<>Últimos guardados</>)}
                </p>
                {isMounted && lastSaveTime && (
                  <span className="text-slate-700 font-mono text-sm mt-1 md:mt-0">
                    {`Hora: ${lastSaveTime.toLocaleTimeString()}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Loader o contenido principal */}
        {!isMounted ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a45c]"></div>
            <span className="ml-3 text-gray-400">Cargando...</span>
          </div>
        ) : (
          <>
        {/* Buscador y botón Agregar */}
        <div className="w-full mt-3 mb-6 flex items-center gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full md:w-80 px-2 py-2 bg-slate-800 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:border-[#c9a45c] focus:outline-none text-sm"
          />
          <button
            onClick={handleAddRecord}
            disabled={isSaving}
            className="hidden md:flex px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{isSaving ? 'Agregando...' : 'Agregar Registro'}</span>
          </button>
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
          {!isLoading && paginatedRecords.map(item => {
            const hasHoraIngreso = item.horaIngreso && item.horaIngreso.trim() !== '';
            const hasHoraSalida = item.horaSalida && item.horaSalida.trim() !== '';
            let statusColorClass = 'bg-transparent'; // Base transparente para el efecto vidrio
            if (hasHoraIngreso && hasHoraSalida) {
              statusColorClass = 'bg-green-500/20'; // Tinte verde
            } else if (hasHoraIngreso || hasHoraSalida) {
              statusColorClass = 'bg-red-500/20'; // Tinte rojo
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

        {/* Controles de Paginación */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-white font-medium">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}

        <ConfirmationModal
          isOpen={isModalOpen}
          message="¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
          </>
        )}
      </main>
    </div>
  );
} 