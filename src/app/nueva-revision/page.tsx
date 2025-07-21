'use client';

import { useState, useEffect, useRef, useCallback, createRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ButtonGroup from '@/components/ButtonGroup';
import { getWeek } from 'date-fns';
import { uploadEvidenciaToCloudinary } from '@/lib/cloudinary';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// 🚀 NUEVO: Importar función de compresión avanzada
import { compressImageAdvanced, createImagePreview, revokeImagePreview } from '@/lib/imageUtils';

// Importar nuevos componentes
import FormField from '@/components/revision/FormField';
import ImageModal from '@/components/revision/ImageModal';
import EvidenceUploader from '@/components/revision/EvidenceUploader';
import { OfflineQueue } from '@/components/OfflineQueue';

// Importar hook para offline
import { useOfflineFormSubmit } from '@/hooks/useOfflineFormSubmit';

// Importar tipos
import type { 
  RevisionData, 
  FileData, 
  CompressionStatus, 
  FileSizes, 
  UploadProgress, 
  EvidenceField 
} from '@/types/revision';

import PageTitle from '@/components/ui/PageTitle';

// 🚀 Función debounce custom ligera (siguiendo principio de JavaScript mínimo)
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
}

const initialFormData: RevisionData = {
  casita: '',
  quien_revisa: '',
  caja_fuerte: '',
  puertas_ventanas: '',
  chromecast: '',
  binoculares: '',
  trapo_binoculares: '',
  speaker: '',
  usb_speaker: '',
  controles_tv: '',
  secadora: '',
  accesorios_secadora: '',
  steamer: '',
  bolsa_vapor: '',
  plancha_cabello: '',
  bulto: '',
  sombrero: '',
  bolso_yute: '',
  camas_ordenadas: '',
  cola_caballo: '',
  evidencia_01: '',
      evidencia_02: '',
    evidencia_03: '',
    notas: '',
};

const initialFileData: FileData = {
  evidencia_01: null,
  evidencia_02: null,
  evidencia_03: null,
};

const requiredFields: (keyof RevisionData)[] = [
  'casita', 'quien_revisa', 'caja_fuerte', 'puertas_ventanas',
  'chromecast', 'binoculares', 'trapo_binoculares', 'speaker',
  'usb_speaker', 'controles_tv', 'secadora', 'accesorios_secadora',
  'steamer', 'bolsa_vapor', 'plancha_cabello', 'bulto',
  'sombrero', 'bolso_yute', 'camas_ordenadas', 'cola_caballo'
];

// 🔍 NUEVO: Mapeo de nombres técnicos a nombres amigables
const fieldLabels: Record<string, string> = {
  'casita': 'Casita',
  'quien_revisa': 'Quien revisa',
  'caja_fuerte': 'Caja fuerte',
  'puertas_ventanas': 'Puertas/Ventanas',
  'chromecast': 'Chromecast',
  'binoculares': 'Binoculares',
  'trapo_binoculares': 'Trapo Binoculares',
  'speaker': 'Speaker',
  'usb_speaker': 'USB Speaker',
  'controles_tv': 'Controles TV',
  'secadora': 'Secadora',
  'accesorios_secadora': 'Accesorios Secadora',
  'steamer': 'Steamer',
  'bolsa_vapor': 'Bolsa Vapor',
  'plancha_cabello': 'Plancha Cabello',
  'bulto': 'Bulto',
  'sombrero': 'Sombrero',
  'bolso_yute': 'Bolso Yute',
  'camas_ordenadas': 'Camas Ordenadas',
  'cola_caballo': 'Cola Caballo'
};

export default function NuevaRevision() {
  // Estado para logs de compresión
  const [compressionLogs, setCompressionLogs] = useState<string[]>([]);
  // Función para agregar un log
  const addCompressionLog = (msg: string, data?: any) => {
    setCompressionLogs(prev => [
      `${new Date().toLocaleTimeString()} | ${msg}${data ? ' | ' + JSON.stringify(data) : ''}`,
      ...prev.slice(0, 99) // Máximo 100 logs
    ]);
  };
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // Hook para manejo offline
  const { 
    submitForm: submitOfflineForm, 
    isSubmitting: isOfflineSubmitting, 
    isOnline 
  } = useOfflineFormSubmit();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<string[]>([]);

  const [highlightedField, setHighlightedField] = useState<string | null>('casita');
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Combinar estado de loading local y offline
  const isFormLoading = loading || isOfflineSubmitting;
  
  // Estados para formulario y archivos
  const [formData, setFormData] = useState<RevisionData>({
    ...initialFormData,
    quien_revisa: user || ''
  });
  
  const [fileData, setFileData] = useState<FileData>(initialFileData);
  const [compressedFiles, setCompressedFiles] = useState<FileData>(initialFileData);
  
  // Estados para compresión
  const [compressionStatus, setCompressionStatus] = useState<Record<EvidenceField, CompressionStatus>>({
    evidencia_01: { status: 'idle', progress: 0, stage: '' },
    evidencia_02: { status: 'idle', progress: 0, stage: '' },
    evidencia_03: { status: 'idle', progress: 0, stage: '' },
  });
  
  const [fileSizes, setFileSizes] = useState<Record<EvidenceField, FileSizes>>({
    evidencia_01: { original: 0, compressed: 0 },
    evidencia_02: { original: 0, compressed: 0 },
    evidencia_03: { original: 0, compressed: 0 },
  });

  // 🚀 NUEVO: Estados para compresión avanzada
  const [compressionProgress, setCompressionProgress] = useState<Record<EvidenceField, {
    attempt: number;
    currentSize: number;
    targetSize: number;
    quality: number;
    resolution: string;
    status: 'compressing' | 'compressed' | 'timeout' | 'error';
  } | null>>({
    evidencia_01: null,
    evidencia_02: null,
    evidencia_03: null,
  });

  const [isCompressing, setIsCompressing] = useState<Record<EvidenceField, boolean>>({
    evidencia_01: false,
    evidencia_02: false,
    evidencia_03: false,
  });
  
  // Estados para modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);
  
  // Refs para scroll automático
  const fieldRefs = useRef<{ [key: string]: React.RefObject<any> }>({});

  // 🚀 OPTIMIZACIÓN 1: Memoizar cálculo pesado del siguiente campo vacío
  const nextEmptyField = useMemo(() => {
    return requiredFields.find(f => !formData[f]) || null;
  }, [formData]);

  // 🚀 OPTIMIZACIÓN 2: Debounced localStorage para evitar escrituras excesivas
  const debouncedSave = useCallback(
    debounce((data: RevisionData) => {
      saveToLocalStorage(data);
    }, 300), // 300ms es óptimo para UX sin lag
    []
  );

  // 🚀 OPTIMIZACIÓN 3: Highlighting separado que solo se ejecuta cuando realmente cambió
  useEffect(() => {
    setHighlightedField(nextEmptyField);
    saveHighlightedField(nextEmptyField);
  }, [nextEmptyField]);

  // Inicializar refs para los campos requeridos
  useEffect(() => {
    requiredFields.forEach((field) => {
      if (!fieldRefs.current[field]) {
        fieldRefs.current[field] = createRef();
      }
    });
  }, []);

  // Funciones de localStorage
  const loadFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('revision-form-data');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          return { ...initialFormData, ...parsedData, quien_revisa: user || parsedData.quien_revisa || '' };
        } catch (error) {
          console.error('Error parsing saved form data:', error);
          return { ...initialFormData, quien_revisa: user || '' };
        }
      }
    }
    return { ...initialFormData, quien_revisa: user || '' };
  };

  const saveToLocalStorage = (data: RevisionData) => {
    if (typeof window !== 'undefined') {
      const { evidencia_01, evidencia_02, evidencia_03, ...dataToSave } = data;
      localStorage.setItem('revision-form-data', JSON.stringify(dataToSave));
    }
  };

  const saveHighlightedField = (field: string | null) => {
    if (typeof window !== 'undefined') {
      if (field) {
        localStorage.setItem('revision-highlighted-field', field);
      } else {
        localStorage.removeItem('revision-highlighted-field');
      }
    }
  };

  const loadHighlightedField = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('revision-highlighted-field');
    }
    return 'casita';
  };

  const clearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('revision-form-data');
      localStorage.removeItem('revision-highlighted-field');
    }
  };

  // Efecto para cargar usuarios desde Supabase
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const { data, error } = await supabase
          .from('Usuarios')
          .select('Usuario')
          .order('Usuario', { ascending: true });
        
        if (error) {
          console.error('Error al cargar usuarios:', error);
          // Si hay error, usar lista por defecto
          setUsuarios(['Ricardo B', 'Michael J', 'Ramiro Q', 'Adrian S', 'Esteban B']);
        } else if (data) {
          const nombresUsuarios = data.map(u => u.Usuario).filter(Boolean);
          setUsuarios(nombresUsuarios);
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        setUsuarios(['Ricardo B', 'Michael J', 'Ramiro Q', 'Adrian S', 'Esteban B']);
      }
    };

    cargarUsuarios();
  }, []);

  // Efecto para actualizar quien_revisa cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setFormData(prev => {
        const newData = { ...prev, quien_revisa: user };
        debouncedSave(newData);
        return newData;
      });
    }
  }, [user, debouncedSave]);

  // Efecto de hidratación - DEBE EJECUTARSE PRIMERO
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Efecto para cargar datos del localStorage O limpiar si es un formulario nuevo
  useEffect(() => {
    if (!isHydrated) return; // Esperar a que se complete la hidratación
    
    // 🆕 Solo limpiar si específicamente viene del botón "Nueva Revisión" con parámetro
    const urlParams = new URLSearchParams(window.location.search);
    const isNewFormFromButton = urlParams.get('new') === 'true';
    
    if (isNewFormFromButton) {
      // 🧹 Limpiar localStorage SOLO cuando viene del botón "Nueva Revisión"
      clearLocalStorage();
      console.log('🆕 Formulario iniciado limpio desde botón "Nueva Revisión"');
      
      // Resetear todo a estado inicial
      setFormData({ ...initialFormData, quien_revisa: user || '' });
      setFileData(initialFileData);
      setCompressedFiles(initialFileData);
      setCompressionStatus({
        evidencia_01: { status: 'idle', progress: 0, stage: '' },
        evidencia_02: { status: 'idle', progress: 0, stage: '' },
        evidencia_03: { status: 'idle', progress: 0, stage: '' },
      });
      setFileSizes({
        evidencia_01: { original: 0, compressed: 0 },
        evidencia_02: { original: 0, compressed: 0 },
        evidencia_03: { original: 0, compressed: 0 },
      });
      setHighlightedField('casita');
      
      // Limpiar URL para evitar que se ejecute en cada refresh
      window.history.replaceState({}, '', window.location.pathname);
    } else {
      // 📂 En TODOS los demás casos (refresh, volver a abrir, etc.), mantener progreso
      const savedData = loadFromLocalStorage();
      const savedHighlightedField = loadHighlightedField();
      
      if (savedData && Object.keys(savedData).some(key => savedData[key as keyof RevisionData] && key !== 'quien_revisa')) {
        setFormData(savedData);
        
        if (savedHighlightedField && !requiredFields.find(f => !savedData[f])) {
          setHighlightedField(savedHighlightedField);
        }
        console.log('📂 Progreso restaurado desde localStorage (refresh/reabrir)');
      } else {
        console.log('📝 Formulario iniciado sin datos previos');
      }
    }
  }, [user, isHydrated]);

  // 🧹 Función para limpiar manualmente el formulario
  const limpiarFormulario = useCallback(() => {
    console.log('🧹 INICIANDO LIMPIEZA COMPLETA DEL FORMULARIO...');
    
    // 1. 🧹 Revocar URLs de imágenes antes de limpiar
    (['evidencia_01', 'evidencia_02', 'evidencia_03'] as EvidenceField[]).forEach(field => {
      if (compressedFiles[field]) {
        try {
          const url = URL.createObjectURL(compressedFiles[field]!);
          revokeImagePreview(url);
        } catch (error) {
          // Silenciar error si no se puede revocar
        }
      }
    });
    
    // 2. 🧹 Limpiar localStorage
    clearLocalStorage();
    
    // 3. 🧹 Resetear estados del formulario
    setFormData({ ...initialFormData, quien_revisa: user || '' });
    setFileData(initialFileData);
    setCompressedFiles(initialFileData);
    setCompressionStatus({
      evidencia_01: { status: 'idle', progress: 0, stage: '' },
      evidencia_02: { status: 'idle', progress: 0, stage: '' },
      evidencia_03: { status: 'idle', progress: 0, stage: '' },
    });
    setFileSizes({
      evidencia_01: { original: 0, compressed: 0 },
      evidencia_02: { original: 0, compressed: 0 },
      evidencia_03: { original: 0, compressed: 0 },
    });
    
    // 4. 🚀 NUEVO: Resetear estados avanzados
    setCompressionProgress({
      evidencia_01: null,
      evidencia_02: null,
      evidencia_03: null,
    });
    setIsCompressing({
      evidencia_01: false,
      evidencia_02: false,
      evidencia_03: false,
    });
    
    setHighlightedField('casita');
    
    // 5. 🧹 Estados limpiados
    
    // 6. 🧹 Forzar garbage collection si está disponible (solo en desarrollo)
    if (typeof window !== 'undefined' && 'gc' in window && process.env.NODE_ENV === 'development') {
      try {
        (window as any).gc();
        console.log('🗑️ Garbage collection forzado (desarrollo)');
      } catch {
        // Silenciar error si gc no está disponible
      }
    }
    
    console.log('✅ LIMPIEZA COMPLETA TERMINADA - Memoria liberada');
  }, [user, compressedFiles]);

  // 🚀 OPTIMIZACIÓN 4: Input handler simplificado y optimizado
  const handleInputChange = useCallback((field: keyof RevisionData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    debouncedSave(newFormData);
  }, [formData, debouncedSave]);

  // 🚀 NUEVA: Función de manejo de archivos con compresión avanzada
  const manejarArchivoSeleccionado = async (field: EvidenceField, file: File) => {
    // --- INICIO LOG AVANZADO ---
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const logId = `${field}-${Date.now()}-${Math.floor(Math.random()*10000)}`;
    console.log(`[LOG_COMPRESION][${logId}] UserAgent:`, userAgent);
    addCompressionLog(`[LOG_COMPRESION][${logId}] UserAgent: ${userAgent}`);
    console.log(`[LOG_COMPRESION][${logId}] isIOS:`, isIOS, '| isSafari:', isSafari);
    addCompressionLog(`[LOG_COMPRESION][${logId}] isIOS: ${isIOS} | isSafari: ${isSafari}`);
    console.log(`[LOG_COMPRESION][${logId}] Archivo recibido:`, {
      nombre: file.name,
      tamaño: file.size,
      tipo: file.type,
      lastModified: file.lastModified
    });
    addCompressionLog(`[LOG_COMPRESION][${logId}] Archivo recibido`, {
      nombre: file.name,
      tamaño: file.size,
      tipo: file.type,
      lastModified: file.lastModified
    });
    // --- FIN LOG AVANZADO ---
    if (!file.type.startsWith('image/')) {
      showError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    console.log(`🚀 Iniciando compresión avanzada para ${field}:`, {
      nombre: file.name,
      tamaño_original: `${(file.size / 1024).toFixed(1)}KB`,
      tipo: file.type
    });

    // 🧹 LIMPIEZA: Si ya había un archivo, limpiar estado anterior
    if (fileData[field] || compressedFiles[field]) {
      console.log(`🧹 Limpiando archivo anterior en ${field}`);
      if (compressedFiles[field]) {
        // Revocar URL anterior si existe
        try {
          const oldUrl = URL.createObjectURL(compressedFiles[field]!);
          revokeImagePreview(oldUrl);
        } catch (error) {
          // Silenciar error si no se puede revocar
        }
      }
    }

    // Actualizar estado del archivo original
    setFileData(prev => ({ ...prev, [field]: file }));
    setFileSizes(prev => ({ ...prev, [field]: { ...prev[field], original: file.size } }));
    setIsCompressing(prev => ({ ...prev, [field]: true }));
    setCompressionProgress(prev => ({ ...prev, [field]: null }));

    try {
      // 🎯 Configuración personalizada para evidencias
      // Ajuste dinámico según navegador
      let targetSizeKB = 200;
      let format: 'webp' | 'jpeg' = 'webp';
      if (isIOS || isSafari) {
        targetSizeKB = 600;
        format = 'jpeg';
        addCompressionLog(`[LOG_COMPRESION][${logId}] Safari/iOS detectado: usando JPEG y 600KB como objetivo`);
      }
      const compressionConfig = {
        targetSizeKB,      // Objetivo según navegador
        maxResolution: 1600,    // Resolución máxima
        maxQuality: 0.85,       // Calidad máxima
        minQuality: 0.35,       // Calidad mínima
        maxAttempts: 10,        // Más intentos para mejor resultado
        timeout: 30000,         // 30 segundos timeout
        format
      };

      // 📈 Callback de progreso para mostrar estado en tiempo real
      const onProgress = (progress: {
        attempt: number;
        currentSize: number;
        targetSize: number;
        quality: number;
        resolution: string;
        status: 'compressing' | 'compressed' | 'timeout' | 'error' | 'pre-processing';
      }) => {
        // --- LOG AVANZADO DE PROGRESO ---
        const logObj = {
          field,
          intento: `${progress.attempt}/10`,
          tamaño_actual: `${(progress.currentSize / 1024).toFixed(1)}KB`,
          objetivo: `${(progress.targetSize / 1024).toFixed(1)}KB`,
          calidad: `${Math.round(progress.quality * 100)}%`,
          resolución: progress.resolution,
          estado: progress.status
        };
        console.log(`[LOG_COMPRESION][${logId}] Progreso:`, logObj);
        addCompressionLog(`[LOG_COMPRESION][${logId}] Progreso`, logObj);
        // --- FIN LOG AVANZADO DE PROGRESO ---

        setCompressionProgress(prev => ({ ...prev, [field]: progress }));

        // Actualizar estado legacy para compatibilidad con EvidenceUploader
        if (progress.status === 'compressing') {
          setCompressionStatus(prev => ({
            ...prev,
            [field]: { 
              status: 'compressing', 
              progress: Math.min(90, (progress.attempt / 10) * 100), 
              stage: `Comprimiendo... (Intento ${progress.attempt})` 
            }
          }));
        }
      };

      // 🚀 Ejecutar compresión avanzada
      console.log(`[LOG_COMPRESION][${logId}] Iniciando compresión avanzada con config:`, compressionConfig);
      addCompressionLog(`[LOG_COMPRESION][${logId}] Iniciando compresión avanzada con config`, compressionConfig);
      if (isIOS || isSafari) {
        addCompressionLog(`[LOG_COMPRESION][${logId}] ADVERTENCIA: En Safari/iOS la compresión puede no ser tan eficiente como en otros navegadores.`);
      }
      const compressedFile = await compressImageAdvanced(file, compressionConfig, onProgress);

      const logResult = {
        tamaño_original: `${(file.size / 1024).toFixed(1)}KB`,
        tamaño_comprimido: `${(compressedFile.size / 1024).toFixed(1)}KB`,
        reducción: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`,
        formato: compressedFile.type,
        type_final: compressedFile.type,
        name_final: compressedFile.name
      };
      console.log(`[LOG_COMPRESION][${logId}] Compresión completada:`, logResult);
      addCompressionLog(`[LOG_COMPRESION][${logId}] Compresión completada`, logResult);

      // Actualizar estados con resultado exitoso
      setCompressedFiles(prev => ({ ...prev, [field]: compressedFile }));
      setFileSizes(prev => ({ 
        ...prev, 
        [field]: { ...prev[field], compressed: compressedFile.size } 
      }));
      
      // Estado legacy para compatibilidad
      setCompressionStatus(prev => ({
        ...prev,
        [field]: { status: 'completed', progress: 100, stage: 'Compresión completada' }
      }));

    } catch (error: any) {
      console.error(`[LOG_COMPRESION][${logId}] ❌ Error en compresión avanzada:`, error);
      addCompressionLog(`[LOG_COMPRESION][${logId}] ❌ Error en compresión avanzada`, error?.message || error);
      if (typeof window !== 'undefined') {
        console.log(`[LOG_COMPRESION][${logId}] window.navigator info:`, window.navigator);
        addCompressionLog(`[LOG_COMPRESION][${logId}] window.navigator info`, window.navigator);
      }
      // Actualizar estado de error
      setCompressionProgress(prev => ({
        ...prev,
        [field]: {
          attempt: 0,
          currentSize: file.size,
          targetSize: 200 * 1024,
          quality: 0,
          resolution: 'N/A',
          status: 'error'
        }
      }));

      // Estado legacy para compatibilidad
      setCompressionStatus(prev => ({
        ...prev,
        [field]: { 
          status: 'error', 
          progress: 0, 
          stage: 'Error en compresión',
          error: error.message || 'Error desconocido'
        }
      }));

      // Determinar mensaje de error específico
      let errorMessage = 'Error al comprimir la imagen';
      if (error.message?.includes('Timeout')) {
        errorMessage = 'La compresión tardó demasiado. Intenta con una imagen más pequeña.';
      } else if (error.message?.includes('load')) {
        errorMessage = 'No se pudo cargar la imagen. Verifica que sea un archivo válido.';
      }

      showError(errorMessage);
    } finally {
      setIsCompressing(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleFileChange = (field: EvidenceField, file: File | null) => {
    // 🔍 LOG: Registrar cambio de archivo
    const logId = `handleFileChange-${field}-${Date.now()}`;
    addCompressionLog(`[${logId}] Cambio de archivo en ${field}`, {
      tieneArchivo: !!file,
      nombreArchivo: file?.name || 'null',
      tamañoArchivo: file?.size || 0,
      tipoArchivo: file?.type || 'null',
      cajaFuerte: formData.caja_fuerte,
      timestamp: new Date().toISOString()
    });
    
    if (file) {
      // 🔍 LOG: Información detallada del archivo seleccionado
      addCompressionLog(`[${logId}] Iniciando procesamiento de archivo`, {
        campo: field,
        archivo: {
          nombre: file.name,
          tamaño: `${(file.size / 1024).toFixed(1)}KB`,
          tipo: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        },
        dispositivo: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a',
          plataforma: typeof navigator !== 'undefined' ? navigator.platform : 'n/a',
          idioma: typeof navigator !== 'undefined' ? navigator.language : 'n/a'
        }
      });
      
      manejarArchivoSeleccionado(field, file);
    } else {
      // 🧹 LIMPIEZA COMPLETA: Limpiar archivo y todos los estados relacionados
      console.log(`🧹 Limpiando completamente campo ${field}`);
      addCompressionLog(`[${logId}] Limpiando campo ${field}`);
      
      // Revocar URL si existe
      if (compressedFiles[field]) {
        try {
          const url = URL.createObjectURL(compressedFiles[field]!);
          revokeImagePreview(url);
          addCompressionLog(`[${logId}] URL de imagen revocada correctamente`);
        } catch (error) {
          addCompressionLog(`[${logId}] Error al revocar URL de imagen`, error);
        }
      }
      
      setFileData(prev => ({ ...prev, [field]: null }));
      setCompressedFiles(prev => ({ ...prev, [field]: null }));
      setCompressionStatus(prev => ({
        ...prev,
        [field]: { status: 'idle', progress: 0, stage: '' }
      }));
      setFileSizes(prev => ({
        ...prev,
        [field]: { original: 0, compressed: 0 }
      }));
      
      // 🚀 NUEVO: Limpiar estados avanzados
      setCompressionProgress(prev => ({ ...prev, [field]: null }));
      setIsCompressing(prev => ({ ...prev, [field]: false }));
      
      addCompressionLog(`[${logId}] Campo ${field} limpiado completamente`);
    }
  };

  const clearFile = (field: EvidenceField) => {
    console.log(`🧹 Limpiando archivo de ${field}`);
    handleFileChange(field, null);
  };

  // Funciones para modal
  const openModal = (imageUrl: string) => {
    setModalImg(imageUrl);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalImg(null);
  };

  // Función auxiliar para el envío online tradicional
  const submitRevisionOnline = async (finalData: any) => {
    console.log('📤 Enviando datos a Supabase:');
    console.log(JSON.stringify(finalData, null, 2));
    
    const { error: insertError } = await supabase
      .from('revisiones_casitas')
      .insert([finalData]);

    if (insertError) {
      console.error('❌ Error de Supabase:');
      console.error('Code:', insertError.code);
      console.error('Message:', insertError.message);
      console.error('Details:', insertError.details);
      console.error('Hint:', insertError.hint);
      console.error('Full error:', JSON.stringify(insertError, null, 2));
      throw insertError;
    }

    console.log('✅ Datos insertados exitosamente');
  };

  // Manejar envío del formulario con soporte offline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Usar loading del hook offline si está disponible, sino el local
    setLoading(true);

    try {
      // Validar campos requeridos
      const emptyFields = requiredFields.filter(field => !formData[field]);
      if (emptyFields.length > 0) {
        const friendlyFieldNames = emptyFields.map(field => fieldLabels[field] || field).join(', ');
        throw new Error(`Faltan completar campos requeridos: ${friendlyFieldNames}`);
      }

      // 📸 VALIDACIÓN CONDICIONAL: Evidencia 1 obligatoria para Check in y Upsell
      const requiresEvidencia01 = ['Check in', 'Upsell'].includes(formData.caja_fuerte);
      if (requiresEvidencia01 && !compressedFiles.evidencia_01) {
        // Destacar el campo de evidencia_01 y mostrarlo en pantalla
        const evidenciaSection = document.querySelector('[data-section="evidencia-fotografica"]');
        if (evidenciaSection) {
          evidenciaSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        throw new Error(`Evidencia 1 es obligatoria cuando el estado de la caja fuerte es "${formData.caja_fuerte}"`);
      }

      // Preparar datos para envío
      const submitData = { ...formData };
      const evidenceFields: EvidenceField[] = ['evidencia_01', 'evidencia_02', 'evidencia_03'];
      const imageFiles: { [key: string]: File } = {};
      
      // Solo subir imágenes si estamos online
      if (isOnline) {
        // Subir imágenes comprimidas a Cloudinary/Evidencias
        for (const field of evidenceFields) {
          const compressedFile = compressedFiles[field];
          if (compressedFile) {
            try {
              const uploadedUrl = await uploadEvidenciaToCloudinary(compressedFile);
              submitData[field] = uploadedUrl;
              console.log(`✅ ${field} subida exitosamente a Cloudinary/Evidencias:`, uploadedUrl);
            } catch (uploadError) {
              console.error(`❌ Error subiendo ${field} a Cloudinary/Evidencias:`, uploadError);
              showError(`Error al subir ${field} a Cloudinary/Evidencias`);
              return;
            }
          }
        }
      } else {
        // Guardar archivos para upload offline posterior
        evidenceFields.forEach(field => {
          const compressedFile = compressedFiles[field];
          if (compressedFile) {
            imageFiles[field] = compressedFile;
          }
        });
      }

      // Generar fecha y hora local del dispositivo
      const now = new Date();
      const fechaLocal = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
      
      console.log(`📅 Fecha y hora local generada: ${fechaLocal}`);
      console.log(`🕐 Hora actual del dispositivo: ${now.toLocaleString()}`);

      // Preparar datos finales
      const finalData = {
        casita: submitData.casita,
        quien_revisa: submitData.quien_revisa,
        caja_fuerte: submitData.caja_fuerte,
        puertas_ventanas: submitData.puertas_ventanas,
        chromecast: submitData.chromecast,
        binoculares: submitData.binoculares,
        trapo_binoculares: submitData.trapo_binoculares,
        speaker: submitData.speaker,
        usb_speaker: submitData.usb_speaker,
        controles_tv: submitData.controles_tv,
        secadora: submitData.secadora,
        accesorios_secadora: submitData.accesorios_secadora,
        steamer: submitData.steamer,
        bolsa_vapor: submitData.bolsa_vapor,
        plancha_cabello: submitData.plancha_cabello,
        bulto: submitData.bulto,
        sombrero: submitData.sombrero,
        bolso_yute: submitData.bolso_yute,
        camas_ordenadas: submitData.camas_ordenadas,
        cola_caballo: submitData.cola_caballo,
        evidencia_01: submitData.evidencia_01,
        evidencia_02: submitData.evidencia_02,
        evidencia_03: submitData.evidencia_03,
        notas: submitData.notas,
        created_at: fechaLocal,
      };

      // Usar el sistema offline que maneja automáticamente online/offline
      await submitOfflineForm(
        'revision',
        finalData,
        submitRevisionOnline,
        Object.keys(imageFiles).length > 0 ? imageFiles : undefined
      );

      // 🎉 ENVÍO EXITOSO: Limpiar formulario y scroll al top
      limpiarFormulario();
      
      // 📜 Scroll suave hacia arriba para comenzar nueva revisión
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
      
      console.log('🔄 Formulario limpiado exitosamente. Listo para nueva revisión.');

    } catch (error) {
      console.error('Error al guardar revisión:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // 🔍 MEJORADO: Mostrar mensaje específico con campos faltantes en el toast
      if (errorMessage.includes('Faltan completar campos requeridos')) {
        showError(`Error al guardar la revisión: ${errorMessage}`);
      } else {
        showError('Error al guardar la revisión');
      }
    } finally {
      setLoading(false);
    }
  };

  const showEvidenceFields = ['Check in', 'Upsell', 'Back to Back'].includes(formData.caja_fuerte);

  // Evitar problemas de hidratación - no renderizar hasta que esté hidratado
  if (!isHydrated) {
    return (
      <main className="min-h-screen relative overflow-hidden" style={{
        background: '#334d50',
        backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
      }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#2a3347] rounded-xl shadow-xl p-4 md:p-8 border border-[#3d4659]">
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse text-[#c9a45c] text-lg">Cargando...</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden" style={{
      background: '#334d50',
      backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
    }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="rounded-xl shadow-xl p-4 md:p-8 border border-[#3d4659]" style={{
          background: '#334d50',
          backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
        }}>
          {/* Header */}
          <header className="flex justify-between items-center mb-6 md:mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#c9a45c]/20 via-[#f0c987]/20 to-[#c9a45c]/20 blur-lg rounded-xl"></div>
              
              <PageTitle size="md">Nueva Revisión</PageTitle>
              
              <div className="relative mt-2 h-0.5 w-20">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c9a45c] to-transparent rounded-full"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0c987] to-transparent rounded-full"></div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Botón Volver */}
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-sm text-white bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 rounded-xl hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden border border-gray-600/40 hover:border-gray-500/60 font-medium flex items-center justify-center gap-2"
                style={{ padding: '10px 18px' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0cb35]/80 to-transparent animate-[slide_2s_ease-in-out_infinite] z-0"></div>
                <div className="relative z-10 flex items-center gap-2">
                  Volver
                </div>
              </button>
            </div>
          </header>

          {/* Cola de formularios offline */}
          <OfflineQueue className="mb-6" />

          {/* Formulario */}
          <div className="space-y-6">
            {/* Información básica */}
            <fieldset>
              <legend className="sr-only">Información básica</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <FormField
                  label="Casita"
                  required
                  highlight={highlightedField === 'casita'}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                  }
                >
                  <div className="relative">
                    <select
                      ref={fieldRefs.current['casita']}
                      required
                      className="form-select"
                      value={formData.casita}
                      onChange={(e) => handleInputChange('casita', e.target.value)}
                    >
                      <option value="" className="bg-[#1e2538] text-gray-400">Seleccionar casita</option>
                      {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num} className="bg-[#1e2538] text-white">{num}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </FormField>

                <FormField
                  label="Quien revisa"
                  required
                  highlight={highlightedField === 'quien_revisa'}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  }
                >
                  {user ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={user}
                        readOnly
                        className="form-input cursor-not-allowed opacity-80"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        ref={fieldRefs.current['quien_revisa']}
                        required
                        className="form-select"
                        value={formData.quien_revisa}
                        onChange={(e) => handleInputChange('quien_revisa', e.target.value)}
                      >
                        <option value="" className="bg-[#1e2538] text-gray-400">Seleccionar persona</option>
                        {usuarios.map((nombre: string) => (
                          <option key={nombre} value={nombre} className="bg-[#1e2538] text-white">{nombre}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-[#c9a45c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </FormField>
              </div>
            </fieldset>

            {/* Caja fuerte */}
            <fieldset>
              <legend className="sr-only">Estado de la caja fuerte</legend>
              <div ref={fieldRefs.current['caja_fuerte']}>
                <ButtonGroup
                  label="Guardado en la caja fuerte?"
                  options={['Si', 'No', 'Check in', 'Check out', 'Upsell', 'Guardar Upsell', 'Back to Back', 'Show Room']}
                  selectedValue={formData.caja_fuerte}
                  onSelect={(value) => handleInputChange('caja_fuerte', value)}
                  required
                  highlight={highlightedField === 'caja_fuerte'}
                />
              </div>
            </fieldset>

            {/* Puertas y ventanas */}
            <fieldset>
              <legend className="sr-only">Estado de puertas y ventanas</legend>
              <FormField
                label="¿Puertas y ventanas? (revisar casa por fuera)"
                required
                highlight={highlightedField === 'puertas_ventanas'}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V9.75a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75V21m-4.5 0H2.36m11.04 0H21m-1.5 0H9.375a1.125 1.125 0 01-1.125-1.125v-11.25c0-1.125.504-2.25 1.125-2.25H15a2.25 2.25 0 012.25 2.25v11.25c0 .621-.504 1.125-1.125 1.125z" />
                  </svg>
                }
              >
                <div className="relative">
                  <input
                    ref={fieldRefs.current['puertas_ventanas']}
                    type="text"
                    required
                    className="form-input"
                    value={formData.puertas_ventanas}
                    onChange={(e) => handleInputChange('puertas_ventanas', e.target.value)}
                    placeholder="Estado de puertas y ventanas"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-5 h-5 text-[#c9a45c]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </div>
                </div>
              </FormField>
            </fieldset>

            {/* Elementos a revisar */}
            <fieldset>
              <legend className="sr-only">Elementos a revisar</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div ref={fieldRefs.current['chromecast']}>
                  <ButtonGroup 
                    label="Chromecast" 
                    options={['0', '01', '02', '03', '04']} 
                    selectedValue={formData.chromecast} 
                    onSelect={v => handleInputChange('chromecast', v)} 
                    required 
                    highlight={highlightedField === 'chromecast'}
                  />
                </div>
                <div ref={fieldRefs.current['binoculares']}>
                  <ButtonGroup 
                    label="Binoculares" 
                    options={['0', '01', '02', '03']} 
                    selectedValue={formData.binoculares} 
                    onSelect={v => handleInputChange('binoculares', v)} 
                    required 
                    highlight={highlightedField === 'binoculares'}
                  />
                </div>
                <div ref={fieldRefs.current['trapo_binoculares']}>
                  <ButtonGroup 
                    label="Trapo para los binoculares" 
                    options={['Si', 'No']} 
                    selectedValue={formData.trapo_binoculares} 
                    onSelect={v => handleInputChange('trapo_binoculares', v)} 
                    required 
                    highlight={highlightedField === 'trapo_binoculares'}
                  />
                </div>
                <div ref={fieldRefs.current['speaker']}>
                  <ButtonGroup 
                    label="Speaker" 
                    options={['0', '01', '02', '03']} 
                    selectedValue={formData.speaker} 
                    onSelect={v => handleInputChange('speaker', v)} 
                    required 
                    highlight={highlightedField === 'speaker'}
                  />
                </div>
                <div ref={fieldRefs.current['usb_speaker']}>
                  <ButtonGroup 
                    label="USB Speaker" 
                    options={['0', '01', '02', '03']} 
                    selectedValue={formData.usb_speaker} 
                    onSelect={v => handleInputChange('usb_speaker', v)} 
                    required 
                    highlight={highlightedField === 'usb_speaker'}
                  />
                </div>
                <div ref={fieldRefs.current['controles_tv']}>
                  <ButtonGroup 
                    label="Controles TV" 
                    options={['0', '01', '02', '03']} 
                    selectedValue={formData.controles_tv} 
                    onSelect={v => handleInputChange('controles_tv', v)} 
                    required 
                    highlight={highlightedField === 'controles_tv'}
                  />
                </div>
                <div ref={fieldRefs.current['secadora']}>
                  <ButtonGroup 
                    label="Secadora" 
                    options={['0', '01', '02', '03']} 
                    selectedValue={formData.secadora} 
                    onSelect={v => handleInputChange('secadora', v)} 
                    required 
                    highlight={highlightedField === 'secadora'}
                  />
                </div>
              </div>
            </fieldset>

            {/* Más elementos */}
            <fieldset>
              <legend className="sr-only">Accesorios adicionales</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div ref={fieldRefs.current['accesorios_secadora']}>
                  <ButtonGroup 
                    label="Accesorios Secadora" 
                    options={['0', '01', '02', '03', '04', '05', '06', '07', '08']} 
                    selectedValue={formData.accesorios_secadora} 
                    onSelect={v => handleInputChange('accesorios_secadora', v)} 
                    required 
                    highlight={highlightedField === 'accesorios_secadora'}
                  />
                </div>
              </div>
            </fieldset>

            {/* Más ButtonGroups para los campos restantes */}
            <fieldset>
              <legend className="sr-only">Elementos adicionales</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[
                  { field: 'steamer', label: 'Steamer', options: ['0', '01', '02', '03'] },
                  { field: 'bolsa_vapor', label: 'Bolsa Vapor', options: ['Si', 'No'] },
                  { field: 'plancha_cabello', label: 'Plancha Cabello', options: ['0', '01', '02'] },
                  { field: 'bulto', label: 'Bulto', options: ['Si', 'No'] },
                  { field: 'sombrero', label: 'Sombrero', options: ['Si', 'No'] },
                  { field: 'bolso_yute', label: 'Bolso Yute', options: ['0', '01', '02', '03'] },
                  { field: 'camas_ordenadas', label: 'Camas Ordenadas', options: ['Si', 'No'] },
                  { field: 'cola_caballo', label: 'Cola Caballo', options: ['Si', 'No'] }
                ].map(({ field, label, options }) => (
                  <div key={field} ref={fieldRefs.current[field]}>
                    <ButtonGroup 
                      label={label}
                      options={options}
                      selectedValue={formData[field as keyof RevisionData] as string}
                      onSelect={v => handleInputChange(field as keyof RevisionData, v)}
                      required
                      highlight={highlightedField === field}
                    />
                  </div>
                ))}
              </div>
            </fieldset>

            {/* Evidencia fotográfica */}
            {showEvidenceFields && (
              <fieldset data-section="evidencia-fotografica">
                <legend className="sr-only">Evidencia fotográfica</legend>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-[#ff8c42] flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Evidencia Fotográfica
                    {/* 📸 Indicador de obligatorio para Check in/Upsell */}
                    {['Check in', 'Upsell'].includes(formData.caja_fuerte) && (
                      <span className="text-sm bg-gradient-to-r from-pink-500 to-orange-400 text-white px-2 py-1 rounded-full">
                        Evidencia 1 obligatoria
                      </span>
                    )}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(['evidencia_01', 'evidencia_02', 'evidencia_03'] as EvidenceField[]).map(field => (
                      <EvidenceUploader
                        key={field}
                        fieldName={field}
                        file={fileData[field]}
                        compressedFile={compressedFiles[field]}
                        compressionStatus={compressionStatus[field]}
                        fileSizes={fileSizes[field]}
                        onFileSelect={handleFileChange}
                        onClearFile={clearFile}
                        onImageClick={openModal}
                        required={field === 'evidencia_01' && ['Check in', 'Upsell'].includes(formData.caja_fuerte)}
                        compressionProgress={compressionProgress[field]}
                        isCompressing={isCompressing[field]}
                      />
                    ))}
                  </div>

                  {/* 🔍 Panel de Logs de Compresión - Solo visible en Check in */}
                  {formData.caja_fuerte === 'Check in' && compressionLogs.length > 0 && (
                    <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-yellow-400 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Logs de Compresión de Imágenes
                        </h4>
                        <button
                          onClick={() => setCompressionLogs([])}
                          className="text-sm text-gray-400 hover:text-white px-2 py-1 rounded border border-gray-600 hover:border-gray-500 transition-colors"
                        >
                          Limpiar Logs
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1 text-sm font-mono">
                        {compressionLogs.map((log, index) => (
                          <div 
                            key={index} 
                            className="text-gray-300 bg-gray-800/50 p-2 rounded border-l-2 border-blue-500/50"
                          >
                            {log}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        💡 Estos logs ayudan a diagnosticar problemas de compresión de imágenes en diferentes dispositivos.
                      </div>
                    </div>
                  )}
                </div>
              </fieldset>
            )}

            {/* Campo notas */}
            <fieldset>
              <legend className="sr-only">Notas adicionales</legend>
              <FormField
                label="Notas y observaciones adicionales"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                }
              >
                <textarea
                  className="form-input min-h-[100px] resize-y"
                  value={formData.notas}
                  onChange={(e) => handleInputChange('notas', e.target.value)}
                  placeholder="Observaciones, notas adicionales, comentarios..."
                />
              </FormField>
            </fieldset>

            {/* Submit button con estado offline */}
            <div className="space-y-3">
              {/* Indicador de conexión */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className={isOnline ? 'text-green-400' : 'text-yellow-400'}>
                  {isOnline ? 'En línea - Envío directo' : 'Sin conexión - Se guardará offline'}
                </span>
              </div>

              {/* 🔍 Indicador de campos pendientes (café claro/naranja) */}
              {nextEmptyField && (
                <div className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-3 text-orange-200">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>
                      Faltan completar campos requeridos. Siguiente: {fieldLabels[nextEmptyField] || nextEmptyField}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isFormLoading}
                className={isFormLoading ? "btn-primary btn-loading" : "btn-primary"}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isFormLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isOnline ? 'Guardando y subiendo imágenes...' : 'Guardando offline...'}
                    </>
                  ) : (
                    <>
                      {isOnline ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Guardar Revisión
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Guardar Offline
                        </>
                      )}
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de imagen */}
      <ImageModal
        isOpen={modalOpen}
        imageUrl={modalImg}
        onClose={closeModal}
      />
  </main>
  );
} 