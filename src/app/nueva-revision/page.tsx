'use client';

import { useState, useEffect, useRef, useCallback, createRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ButtonGroup from '@/components/ButtonGroup';
import { getWeek } from 'date-fns';
import { uploadToImageKitClient } from '@/lib/imagekit-client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useSpectacularBackground } from '@/hooks/useSpectacularBackground';

// Importar nuevos componentes
import FormField from '@/components/revision/FormField';
import ImageModal from '@/components/revision/ImageModal';
import EvidenceUploader from '@/components/revision/EvidenceUploader';

// Importar tipos
import type { 
  RevisionData, 
  FileData, 
  CompressionStatus, 
  FileSizes, 
  UploadProgress, 
  EvidenceField 
} from '@/types/revision';

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
  faltantes: '',
  notas: '',
};

const initialFileData: FileData = {
  evidencia_01: null,
  evidencia_02: null,
  evidencia_03: null,
};

const nombresRevisores = [
  'Ricardo B', 'Michael J', 'Ramiro Q', 'Adrian S', 'Esteban B',
  'Willy G', 'Juan M', 'Olman Z', 'Daniel V', 'Jefferson V',
  'Cristopher G', 'Emerson S', 'Joseph R'
];

const requiredFields: (keyof RevisionData)[] = [
  'casita', 'quien_revisa', 'caja_fuerte', 'puertas_ventanas',
  'chromecast', 'binoculares', 'trapo_binoculares', 'speaker',
  'usb_speaker', 'controles_tv', 'secadora', 'accesorios_secadora',
  'steamer', 'bolsa_vapor', 'plancha_cabello', 'bulto',
  'sombrero', 'bolso_yute', 'camas_ordenadas', 'cola_caballo'
];

export default function NuevaRevision() {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const spectacularBg = useSpectacularBackground();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedField, setHighlightedField] = useState<string | null>('casita');
  
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

  // Efecto para cargar datos del localStorage O limpiar si es un formulario nuevo
  useEffect(() => {
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
  }, [user]);

  // 🧹 Función para limpiar manualmente el formulario
  const limpiarFormulario = useCallback(() => {
    clearLocalStorage();
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
    if (error) setError(null);
    console.log('🧹 Formulario limpiado manualmente');
  }, [user, error]);

  // 🚀 OPTIMIZACIÓN 4: Input handler simplificado y optimizado
  const handleInputChange = useCallback((field: keyof RevisionData, value: string) => {
    if (error) setError(null);
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    debouncedSave(newFormData);
  }, [formData, error, debouncedSave]);

  // Función de compresión de imágenes
  const comprimirImagenWebP = useCallback((file: File): Promise<File> => {
    console.log('🚀 INICIANDO COMPRESIÓN:', file.name, file.type, `${(file.size / 1024).toFixed(1)} KB`);
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 1600;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressRecursively = (quality: number, attempt: number = 1): void => {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const sizeKB = blob.size / 1024;
                  console.log(`📊 Intento ${attempt}: calidad ${(quality * 100).toFixed(0)}% = ${sizeKB.toFixed(1)} KB`);
                  
                  if (sizeKB <= 250 || attempt >= 8) {
                    const compressedFile = new File([blob], file.name, {
                      type: 'image/webp',
                      lastModified: Date.now(),
                    });
                    
                    console.log(`✅ COMPRESIÓN COMPLETADA: ${sizeKB.toFixed(1)} KB (${attempt} intentos)`);
                    resolve(compressedFile);
                  } else {
                    const newQuality = Math.max(0.1, quality - 0.1);
                    compressRecursively(newQuality, attempt + 1);
                  }
                } else {
                  reject(new Error('No se pudo generar el blob de la imagen'));
                }
              },
              'image/webp',
              quality
            );
          };
          
          compressRecursively(0.8);
        } else {
          reject(new Error('No se pudo obtener el contexto del canvas'));
        }
      };
      
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Manejar selección de archivos
  const manejarArchivoSeleccionado = async (field: EvidenceField, file: File) => {
    if (!file.type.startsWith('image/')) {
      showError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Actualizar estado del archivo original
    setFileData(prev => ({ ...prev, [field]: file }));
    setFileSizes(prev => ({ ...prev, [field]: { ...prev[field], original: file.size } }));

    try {
      // Iniciar compresión
      setCompressionStatus(prev => ({
        ...prev,
        [field]: { status: 'compressing', progress: 50, stage: 'Comprimiendo imagen...' }
      }));

      const compressedFile = await comprimirImagenWebP(file);

      // Actualizar estado de compresión completada
      setCompressedFiles(prev => ({ ...prev, [field]: compressedFile }));
      setFileSizes(prev => ({ 
        ...prev, 
        [field]: { ...prev[field], compressed: compressedFile.size } 
      }));
      setCompressionStatus(prev => ({
        ...prev,
        [field]: { status: 'completed', progress: 100, stage: 'Compresión completada' }
      }));

    } catch (error) {
      console.error('Error en compresión:', error);
      setCompressionStatus(prev => ({
        ...prev,
        [field]: { 
          status: 'error', 
          progress: 0, 
          stage: 'Error en compresión',
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
      }));
      showError('Error al comprimir la imagen');
    }
  };

  const handleFileChange = (field: EvidenceField, file: File | null) => {
    if (error) setError(null);
    
    if (file) {
      manejarArchivoSeleccionado(field, file);
    } else {
      // Limpiar archivo
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
    }
  };

  const clearFile = (field: EvidenceField) => {
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

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar campos requeridos
      const emptyFields = requiredFields.filter(field => !formData[field]);
      if (emptyFields.length > 0) {
        throw new Error(`Campos requeridos faltantes: ${emptyFields.join(', ')}`);
      }

      // Preparar datos para envío
      const submitData = { ...formData };
      const evidenceFields: EvidenceField[] = ['evidencia_01', 'evidencia_02', 'evidencia_03'];
      
      // Subir imágenes comprimidas
      for (const field of evidenceFields) {
        const compressedFile = compressedFiles[field];
        if (compressedFile) {
          try {
            const uploadedUrl = await uploadToImageKitClient(compressedFile, 'evidencias', `revision_${Date.now()}_${field}`);
            submitData[field] = uploadedUrl;
          } catch (uploadError) {
            console.error(`Error subiendo ${field}:`, uploadError);
            showError(`Error al subir ${field}`);
            return;
          }
        }
      }

      // Generar fecha y hora local del dispositivo
      const now = new Date();
      // Crear timestamp en formato ISO local (ajustado para zona horaria local)
      const fechaLocal = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
      
      console.log(`📅 Fecha y hora local generada: ${fechaLocal}`);
      console.log(`🕐 Hora actual del dispositivo: ${now.toLocaleString()}`);

      // Preparar datos finales (solo campos básicos)
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
        faltantes: submitData.faltantes,
        created_at: fechaLocal,
      };

      // Insertar en Supabase
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

      // 🎉 ENVÍO EXITOSO: Limpiar formulario y scroll al top
      limpiarFormulario();
      showSuccess('Revisión guardada exitosamente. Listo para nueva revisión.');
      
      // 📜 Scroll suave hacia arriba para comenzar nueva revisión
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
      
      console.log('🔄 Formulario limpiado exitosamente. Listo para nueva revisión.');

    } catch (error) {
      console.error('Error al guardar revisión:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      showError('Error al guardar la revisión');
    } finally {
      setLoading(false);
    }
  };

  const showEvidenceFields = ['Check in', 'Upsell', 'Back to Back'].includes(formData.caja_fuerte);

  return (
    <main style={spectacularBg} className="py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-[#2a3347] rounded-xl shadow-xl p-4 md:p-8 border border-[#3d4659]">
          {/* Header */}
          <header className="flex justify-between items-center mb-6 md:mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#c9a45c]/20 via-[#f0c987]/20 to-[#c9a45c]/20 blur-lg rounded-xl"></div>
              
              <h1 className="relative text-2xl md:text-4xl lg:text-5xl font-black tracking-tight">
                <span className="block bg-gradient-to-r from-[#c9a45c] via-[#f0c987] to-[#ff8c42] bg-clip-text text-transparent drop-shadow-md">
                  Nueva
                </span>
                <span className="block bg-gradient-to-r from-[#f0c987] via-[#c9a45c] to-[#ff8c42] bg-clip-text text-transparent mt-1 transform translate-x-1">
                  Revisión
                </span>
              </h1>
              
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
                        {nombresRevisores.map(nombre => (
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
              <fieldset>
                <legend className="sr-only">Evidencia fotográfica</legend>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-[#ff8c42] flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Evidencia Fotográfica
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
                      />
                    ))}
                  </div>
                </div>
              </fieldset>
            )}

            {/* Campo notas */}
            <fieldset>
              <legend className="sr-only">Notas adicionales</legend>
              <FormField
                label="Faltantes o notas adicionales"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                }
              >
                <textarea
                  className="form-input min-h-[100px] resize-y"
                  value={formData.faltantes}
                  onChange={(e) => handleInputChange('faltantes', e.target.value)}
                  placeholder="Elementos faltantes, observaciones adicionales..."
                />
              </FormField>
            </fieldset>

            {/* Error display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={loading ? "btn-primary btn-loading" : "btn-primary"}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando y subiendo imágenes...
                    </>
                  ) : (
                    'Guardar Revisión'
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