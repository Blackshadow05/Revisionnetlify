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
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

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
      <div className="hidden md:flex items-center w-full">
        {/* Columna 1: Nombre */}
        <div className="flex flex-col min-w-0 w-[140px] max-w-[140px] overflow-hidden">
          <p className={`${labelStyles} flex items-center`}>
            <Icon icon="mdi:account-outline" className="mr-1 w-3 h-3" />
            Nombre
          </p>
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['nombre'] = el; }}
            name="nombre"
            value={localItem.nombre}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full text-[10px]`}
            minRows={1}
            placeholder="Nombre..."
            style={{maxWidth: '100%', overflow: 'hidden', whiteSpace: 'pre-line', wordBreak: 'break-word', resize: 'none'}}
          />
        </div>
        {/* Columna 2: Casita */}
        <div className="flex flex-col min-w-0 w-[100px] max-w-[100px] overflow-hidden">
          <p className={labelStyles}>Casita</p>
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['casita'] = el; }}
            name="casita"
            value={localItem.casita}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full text-[10px]`}
            minRows={1}
            placeholder="Casita..."
            style={{maxWidth: '100%', overflow: 'hidden', whiteSpace: 'pre-line', wordBreak: 'break-word', resize: 'none'}}
          />
        </div>
        {/* Columna 3: Detalle */}
        <div className="flex flex-col min-w-0 w-[220px] max-w-[220px] overflow-hidden border-l border-gray-300 pl-1">
          <p className={labelStyles}>Detalle</p>
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['detalle'] = el; }}
            name="detalle"
            value={localItem.detalle}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full text-[10px]`}
            minRows={1}
            placeholder="Detalle..."
            style={{maxWidth: '100%', overflow: 'hidden', whiteSpace: 'pre-line', wordBreak: 'break-word', resize: 'none'}}
          />
        </div>
        {/* Columna 4: Tipo */}
        <div className="flex flex-col min-w-0 w-[70px] max-w-[70px] overflow-hidden border-l border-gray-300 pl-1">
          <p className={labelStyles}>Tipo</p>
          <select 
            name="tipo" 
            value={localItem.tipo} 
            onChange={handleInputChange} 
            className={`${selectStyles} text-orange-600 font-bold w-full text-[10px]`}
            style={{maxWidth: '100%', overflow: 'hidden'}}
          >
            {TIPO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        {/* Columna 5: Placa */}
        <div className="flex flex-col min-w-0 w-[70px] max-w-[70px] overflow-hidden border-l border-gray-300 pl-1">
          <p className={labelStyles}>Placa</p>
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['placa'] = el; }}
            name="placa"
            value={localItem.placa}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full text-[10px]`}
            minRows={1}
            placeholder="Placa..."
            style={{maxWidth: '100%', overflow: 'hidden', whiteSpace: 'pre-line', wordBreak: 'break-word', resize: 'none'}}
          />
        </div>
        {/* Columna 6: Hora Ingreso */}
        <div className="flex flex-col min-w-0 w-[90px] max-w-[90px] overflow-hidden border-l border-gray-300 pl-1">
          <p className={labelStyles}>Hora Ingreso</p>
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['horaIngreso'] = el; }}
            name="horaIngreso"
            value={localItem.horaIngreso}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full text-[10px]`}
            minRows={1}
            placeholder="HH:MM"
            style={{maxWidth: '100%', overflow: 'hidden', whiteSpace: 'pre-line', wordBreak: 'break-word', resize: 'none'}}
          />
        </div>
        {/* Columna 7: Oficial Ingreso */}
        <div className="flex flex-col min-w-0 w-[90px] max-w-[90px] overflow-hidden border-l border-gray-300 pl-1">
          <p className={labelStyles}>Oficial Ingreso</p>
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['oficialIngreso'] = el; }}
            name="oficialIngreso"
            value={localItem.oficialIngreso}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full text-[10px]`}
            minRows={1}
            placeholder="Oficial..."
            style={{maxWidth: '100%', overflow: 'hidden', whiteSpace: 'pre-line', wordBreak: 'break-word', resize: 'none'}}
          />
        </div>
        {/* Columna 8: Hora Salida */}
        <div className="flex flex-col min-w-0 w-[90px] max-w-[90px] overflow-hidden border-l border-gray-300 pl-1">
          <p className={labelStyles}>Hora Salida</p>
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['horaSalida'] = el; }}
            name="horaSalida"
            value={localItem.horaSalida}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full text-[10px]`}
            minRows={1}
            placeholder="HH:MM"
            style={{maxWidth: '100%', overflow: 'hidden', whiteSpace: 'pre-line', wordBreak: 'break-word', resize: 'none'}}
          />
        </div>
        {/* Columna 9: Oficial Salida */}
        <div className="flex flex-col min-w-0 w-[90px] max-w-[90px] overflow-hidden border-l border-gray-300 pl-1">
          <p className={labelStyles}>Oficial Salida</p>
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['oficialSalida'] = el; }}
            name="oficialSalida"
            value={localItem.oficialSalida}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full text-[10px]`}
            minRows={1}
            placeholder="Oficial..."
            style={{maxWidth: '100%', overflow: 'hidden', whiteSpace: 'pre-line', wordBreak: 'break-word', resize: 'none'}}
          />
        </div>
        {/* Columna 10: Botón Eliminar */}
        <div className="flex flex-col items-center min-w-0 w-[70px] max-w-[70px] border-l border-gray-300 pl-1">
          <p className={labelStyles}>Acción</p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 border-2 border-white shadow-lg hover:scale-110 hover:bg-red-700 transition-all p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
            title="Eliminar este registro"
          >
            <Icon icon="mdi:trash-can-outline" className="w-4 h-4 text-white drop-shadow" />
          </button>
        </div>
        {/* Columna 11: Fecha */}
        <div className="flex flex-col min-w-0 w-[90px] max-w-[90px] overflow-hidden border-l border-gray-300 pl-1">
          <p className={labelStyles}>Fecha</p>
          <input
            type="text"
            name="fecha"
            value={localItem.fecha}
            readOnly
            className={`${commonInputStyles} w-full text-[10px] bg-gray-100 cursor-not-allowed`}
            placeholder="DD/MM/YYYY"
            style={{maxWidth: '100%', overflow: 'hidden'}}
          />
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
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['nombre'] = el; }}
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
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['casita'] = el; }}
            name="casita"
            value={localItem.casita}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full`}
            minRows={1}
            placeholder="Casita..."
          />
        </div>

        {/* Fila 2: Detalle (span completo) */}
        <div className="col-span-2 relative z-20">
          <p className={labelStyles}>Detalle</p>
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['detalle'] = el; }}
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
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['placa'] = el; }}
            name="placa"
            value={localItem.placa}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full`}
            minRows={1}
            placeholder="Placa..."
          />
        </div>

        {/* Fila 4: Horas */}
        <div className="col-span-1">
          <p className={`${labelStyles}`}>Hora Ingreso</p>
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['horaIngreso'] = el; }}
            name="horaIngreso"
            value={localItem.horaIngreso}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full`}
            minRows={1}
            placeholder="HH:MM"
          />
        </div>
        <div className="col-span-1">
          <p className={`${labelStyles}`}>Hora Salida</p>
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['horaSalida'] = el; }}
            name="horaSalida"
            value={localItem.horaSalida}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full`}
            minRows={1}
            placeholder="HH:MM"
          />
        </div>

        {/* Fila 5: Oficiales */}
        <div className="col-span-1">
          <p className={labelStyles}>Oficial Ingreso</p>
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['oficialIngreso'] = el; }}
            name="oficialIngreso"
            value={localItem.oficialIngreso}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full`}
            minRows={1}
            placeholder="Oficial..."
          />
        </div>
        <div className="col-span-1">
          <p className={labelStyles}>Oficial Salida</p>
          <TextareaAutosize
            ref={(el: HTMLTextAreaElement | null) => { textareaRefs.current['oficialSalida'] = el; }}
            name="oficialSalida"
            value={localItem.oficialSalida}
            onChange={handleInputChange}
            className={`${commonTextareaStyles} w-full`}
            minRows={1}
            placeholder="Oficial..."
          />
        </div>

        {/* Fila 6: Fecha (solo lectura, span completo) */}
        <div className="col-span-2">
          <p className={labelStyles}>Fecha</p>
          <input
            type="text"
            name="fecha"
            value={localItem.fecha}
            readOnly
            className={`${commonInputStyles} w-full text-[10px] bg-gray-100 cursor-not-allowed`}
            placeholder="DD/MM/YYYY"
            style={{maxWidth: '100%', overflow: 'hidden'}}
          />
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

export default function Page() {
  const [data, setData] = useState<PuestoDataItem[]>(createInitialData());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    scheduleUpdate,
    setSaveHandler,
    isSaving,
    saveStatus,
    lastSaveTime,
    pendingChangesCount,
    forceSave
  } = useGlobalDebounce(20000);

  // Función para cargar datos desde la API
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/puesto01');
      if (!response.ok) {
        throw new Error('Error al cargar datos');
      }
      
      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al cargar los datos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    fetchData();
  }, []);

  // Handler para guardar cambios
  const handleSave = async (changes: Map<number, Partial<PuestoDataItem>>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convertir cambios a formato PATCH para la API
      const patchRequests = Array.from(changes.entries()).map(async ([id, change]) => {
        const response = await fetch(`/api/puesto01/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(change),
        });
        
        if (!response.ok) {
          throw new Error(`Error al actualizar el registro ${id}`);
        }
      });
      
      await Promise.all(patchRequests);
      
      // Recargar datos después de guardar
      fetchData();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al guardar cambios');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Registrar el handler de guardado en el debounce
  useEffect(() => {
    setSaveHandler(handleSave);
  }, [handleSave, setSaveHandler]);

  // Función para manejar la eliminación de un registro
  const handleDelete = async (id: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/puesto01/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar el registro');
      }
      
      // Eliminar el registro de la lista localmente
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al eliminar el registro');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Comprobar si hay cambios pendientes al salir de la página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChangesCount > 0) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pendingChangesCount]);

  // Forzar guardado al cerrar la pestaña o navegador
  useEffect(() => {
    const handleUnload = () => {
      forceSave();
    };

    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('unload', handleUnload);
    };
  }, [forceSave]);

  // Mostrar mensaje de éxito o error al guardar
  useEffect(() => {
    if (saveStatus === 'success') {
      alert('Guardado exitoso');
    } else if (saveStatus === 'error') {
      alert('Error al guardar cambios');
    }
  }, [saveStatus]);

  return (
    <div className="p-4">
      <PageTitle size="md">Puesto 01 Control</PageTitle>
      
      {/* Botón para agregar nuevo registro */}
      <Link href="/nuevo-registro" className="mb-4 inline-block bg-blue-600 text-white py-2 px-4 rounded-md shadow-md hover:bg-blue-700 transition-all">
        <Icon icon="mdi:plus" className="mr-2" />
        Nuevo Registro
      </Link>
      
      {/* Indicador de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Icon icon="mdi:loading" className="animate-spin mr-2" />
          Cargando datos...
        </div>
      )}
      
      {/* Mensaje de error */}
      {error && (
        <div className="text-red-600 py-4">
          {error}
        </div>
      )}
      
      {/* Tabla de datos */}
      <div className="overflow-x-auto rounded-lg shadow-md">
        <div className="min-w-full bg-white">
          {/* Header */}
          <div className="grid grid-cols-11 gap-2 bg-gray-100 text-gray-700 text-xs font-semibold uppercase py-3 px-4 rounded-t-lg">
            <div className="col-span-1"></div>
            <div className="col-span-1">Nombre</div>
            <div className="col-span-1">Casita</div>
            <div className="col-span-1">Detalle</div>
            <div className="col-span-1">Tipo</div>
            <div className="col-span-1">Placa</div>
            <div className="col-span-1">Hora Ingreso</div>
            <div className="col-span-1">Oficial Ingreso</div>
            <div className="col-span-1">Hora Salida</div>
            <div className="col-span-1">Oficial Salida</div>
            <div className="col-span-1">Acción</div>
          </div>
          {/* Body */}
          <div className="divide-y divide-gray-200">
            {data.map(item => (
              <div key={item.id} className="grid grid-cols-11 gap-2 py-2 px-4">
                <div className="col-span-1">
                  <Icon icon="mdi:circle" className={`text-xs ${item.horaSalida ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="col-span-1">
                  {item.nombre}
                </div>
                <div className="col-span-1">
                  {item.casita}
                </div>
                <div className="col-span-1">
                  {item.detalle}
                </div>
                <div className="col-span-1">
                  {item.tipo}
                </div>
                <div className="col-span-1">
                  {item.placa}
                </div>
                <div className="col-span-1">
                  {item.horaIngreso}
                </div>
                <div className="col-span-1">
                  {item.oficialIngreso}
                </div>
                <div className="col-span-1">
                  {item.horaSalida}
                </div>
                <div className="col-span-1">
                  {item.oficialSalida}
                </div>
                <div className="col-span-1 flex justify-center">
                  <Link 
                    href={`/editar-registro/${item.id}`} 
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Editar registro"
                  >
                    <Icon icon="mdi:pencil-outline" className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
