'use client';

import { useEffect, useState, useRef, useMemo, memo, useCallback, Suspense, lazy } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import ComponentSkeleton from '@/components/ui/ComponentSkeleton';

// 🚀 CODE SPLITTING: Lazy load de componentes no críticos
const ImageModal = lazy(() => import('@/components/revision/ImageModal'));
const InfoCard = lazy(() => import('@/components/ui/InfoCard'));

// 🚀 CODE SPLITTING: Funciones helper para carga dinámica de utilidades
const loadDateUtils = async () => {
  const { format, getWeek } = await import('date-fns');
  const { es } = await import('date-fns/locale');
  return { format, es, getWeek };
};

const loadImageUtils = async () => {
  return await import('@/lib/imageUtils');
};

const loadCloudinaryUtils = async () => {
  return await import('@/lib/cloudinary');
};

// 🚀 OPTIMIZADO: Componente memoizado para las imágenes de evidencia sin backdrop-blur
const EvidenceImage = memo(({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) => (
  <div className="relative group cursor-pointer" onClick={onClick}>
    <img 
      src={src} 
      alt={alt} 
      loading="lazy"
      className="w-full h-48 object-cover rounded-lg transform transition-transform duration-200 group-hover:scale-[1.02]"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = '/placeholder-image.png';
      }}
    />
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg flex items-center justify-center">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 rounded-full p-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
    </div>
  </div>
));

interface Revision {
  id: number;
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
  camas_ordenadas: string;
  cola_caballo: string;
  evidencia_01: string;
  evidencia_02: string;
  evidencia_03: string;
  notas: string;
  created_at: string;
}

interface Nota {
  id: string;
  fecha: string;
  Casita: string;
  revision_id: string;
  nota: string;
  Evidencia: string;
  Usuario: string;
  created_at: string;
}

interface RegistroEdicion {
  id?: string;
  created_at?: string;
  "Usuario que Edito": string;
  Dato_anterior: string;
  Dato_nuevo: string;
}

export default memo(function DetalleRevision() {
  const params = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [revision, setRevision] = useState<Revision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);
  
  // 🚀 OPTIMIZACIÓN: Refs para evitar consultas DOM repetitivas
  const galeriaInputRef = useRef<HTMLInputElement>(null);
  const camaraInputRef = useRef<HTMLInputElement>(null);
  const [notasModalOpen, setNotasModalOpen] = useState(false);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [notasLoading, setNotasLoading] = useState(false);
  const [showNotaForm, setShowNotaForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Revision | null>(null);
  

  const { userRole, user } = useAuth();
  const [registroEdiciones, setRegistroEdiciones] = useState<RegistroEdicion[]>([]);
  const [nuevaNota, setNuevaNota] = useState({
    fecha: new Date().toISOString().split('T')[0],
    Usuario: '',
    nota: '',
    evidencia: null as File | null,
  });

  // 🚀 OPTIMIZACIÓN: Memoizar array de nombres
  const nombresRevisores = useMemo(() => [
    'Ricardo B', 'Michael J', 'Ramiro Q', 'Adrian S', 'Esteban B',
    'Willy G', 'Juan M', 'Olman Z', 'Daniel V', 'Jefferson V',
    'Cristopher G', 'Emerson S', 'Joseph R'
  ], []);

  // 🚀 CODE SPLITTING: Función de formateo de fechas con carga dinámica
  const formatearFechaParaMostrar = useCallback((fechaISO: string): string => {
    try {
      const fecha = new Date(fechaISO);
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const año = fecha.getFullYear();
      const horas = fecha.getHours().toString().padStart(2, '0');
      const minutos = fecha.getMinutes().toString().padStart(2, '0');
      return `${dia}-${mes}-${año} ${horas}:${minutos}`;
    } catch (error) {
      return fechaISO; // Si hay error, devolver la fecha original
    }
  }, []);

  // 🚀 OPTIMIZACIÓN: Memoizar fieldLabels para evitar recreación
  const fieldLabels: Record<string, string> = useMemo(() => ({
    id: 'ID',
    casita: 'Casita',
    quien_revisa: 'Quien Revisa',
    caja_fuerte: 'Caja Fuerte',
    puertas_ventanas: 'Puertas y Ventanas',
    chromecast: 'Chromecast',
    binoculares: 'Binoculares',
    trapo_binoculares: 'Trapo Binoculares',
    speaker: 'Speaker',
    usb_speaker: 'USB Speaker',
    controles_tv: 'Controles TV',
    secadora: 'Secadora',
    accesorios_secadora: 'Accesorios Secadora',
    steamer: 'Steamer',
    bolsa_vapor: 'Bolsa Vapor',
    plancha_cabello: 'Plancha Cabello',
    bulto: 'Bulto',
    sombrero: 'Sombrero',
    bolso_yute: 'Bolso Yute',
    camas_ordenadas: 'Camas Ordenadas',
    cola_caballo: 'Cola Caballo',
    evidencia_01: 'Evidencia 1',
    evidencia_02: 'Evidencia 2',
    evidencia_03: 'Evidencia 3',
    notas: 'Notas',
    created_at: 'Fecha de Creación'
  }), []);

  // 🚀 OPTIMIZACIÓN: Memoizar función de parseo
  const parseEditData = useCallback((dataString: string) => {
    // Formato: [UUID] campo: valor
    const match = dataString.match(/^\[([a-f0-9-]+)\]\s+([^:]+):\s*(.*)$/);
    if (match) {
      const [, id, fieldName, value] = match;
      const displayName = fieldLabels[fieldName.trim()] || fieldName.trim();
      return {
        fieldName: fieldName.trim(),
        displayName,
        value: value.trim()
      };
    }
    return {
      fieldName: '',
      displayName: 'Campo desconocido',
      value: dataString
    };
  }, [fieldLabels]);

  // 🚀 OPTIMIZACIÓN AVANZADA: Carga diferida de datos críticos vs no críticos
  const [secondaryDataLoading, setSecondaryDataLoading] = useState(false);
  const [secondaryDataLoaded, setSecondaryDataLoaded] = useState(false);
  
  // Función para cargar solo datos críticos (información principal de la revisión)
  const fetchCriticalData = useCallback(async () => {
    try {
      setLoading(true);
      if (!supabase) {
        throw new Error('No se pudo conectar con la base de datos');
      }

      // Solo cargar datos críticos para mostrar la página principal
      const { data: revisionData, error: revisionError } = await supabase
        .from('revisiones_casitas')
        .select('*')
        .eq('id', params.id)
        .single();

      if (revisionError) throw revisionError;

      // Establecer solo los datos críticos
      setRevision(revisionData);

    } catch (error: any) {
      console.error('Error al cargar datos críticos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  // Función para cargar datos no críticos (notas e historial)
  const fetchSecondaryData = useCallback(async () => {
    // Evitar cargas múltiples simultáneas
    if (secondaryDataLoading || secondaryDataLoaded) return;
    
    try {
      setSecondaryDataLoading(true);
      if (!supabase) return;

      // Cargar datos no críticos en paralelo
      const [
        { data: notasData, error: notasError },
        { data: edicionesData, error: edicionesError }
      ] = await Promise.all([
        // Consulta de notas asociadas a esta revisión
        supabase
          .from('Notas')
          .select('*')
          .eq('revision_id', String(params.id))
          .order('id', { ascending: false }),

        // Consulta optimizada de ediciones
        supabase
          .from('Registro_ediciones')
          .select('*')
          .or(`Dato_anterior.like.[${params.id}]%,Dato_nuevo.like.[${params.id}]%`)
          .order('created_at', { ascending: false })
      ]);

      // Manejar errores (no críticos, no bloquean la página)
      if (notasError) {
        console.warn('Error al cargar notas:', notasError);
      } else {
        setNotas(notasData || []);
      }

      if (edicionesError) {
        console.warn('Error al cargar historial:', edicionesError);
      } else {
        setRegistroEdiciones(edicionesData || []);
      }

      // Marcar como cargado exitosamente
      setSecondaryDataLoaded(true);

    } catch (error: any) {
      console.warn('Error al cargar datos secundarios:', error);
    } finally {
      setSecondaryDataLoading(false);
    }
  }, [params.id, secondaryDataLoading, secondaryDataLoaded]);

  // Cargar datos críticos inmediatamente
  useEffect(() => {
    // Resetear estado de datos secundarios al cambiar de revisión
    setSecondaryDataLoaded(false);
    setSecondaryDataLoading(false);
    fetchCriticalData();
  }, [params.id]);

  // 🚀 CORREGIDO: Cargar datos no críticos después de que se carguen los críticos
  useEffect(() => {
    if (revision && !secondaryDataLoading && !secondaryDataLoaded) {
      // Pequeño delay para priorizar el render de datos críticos
      const timer = setTimeout(() => {
        fetchSecondaryData();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [revision, secondaryDataLoading, secondaryDataLoaded]); // ✅ Incluir las banderas de control

  const handleSubmitNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revision || !supabase) return;
    
    try {
      setIsSubmitting(true);
      let evidenciaUrl = null;

      if (nuevaNota.evidencia) {
        try {
          // Comprimir imagen antes de subir a Cloudinary (carpeta notas)
          const compressedImage = await comprimirImagenWebP(nuevaNota.evidencia);
          
          // 🚀 CODE SPLITTING: Cargar dinámicamente la función de Cloudinary
          const { uploadNotaToCloudinary } = await import('@/lib/cloudinary');
          evidenciaUrl = await uploadNotaToCloudinary(compressedImage);
          console.log('✅ Imagen de nota subida exitosamente a Cloudinary/notas:', evidenciaUrl);
        } catch (uploadError) {
          console.error('❌ Error al subir imagen a Cloudinary:', uploadError);
          throw new Error('Error al subir la imagen a Cloudinary');
        }
      }

      // Obtener fecha y hora local del dispositivo
      const now = new Date();
      const fechaLocal = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      
      const notaData = {
        fecha: fechaLocal.toISOString(),
        Casita: revision.casita,
        revision_id: String(params.id), // Convertir explícitamente a string
        Usuario: nuevaNota.Usuario,
        nota: nuevaNota.nota,
        Evidencia: evidenciaUrl
      };
      
      console.log('💾 Insertando nota con datos:', notaData);
      console.log('💾 revision_id que se va a insertar:', params.id, 'tipo:', typeof params.id);
      
      const { data: insertResult, error } = await supabase
        .from('Notas')
        .insert([notaData])
        .select();
      
      console.log('✅ Resultado de inserción:', insertResult);
      console.log('❌ Error de inserción:', error);

      if (error) throw error;

      // Actualizar el contador de notas en la tabla revisiones_casitas
      const { data: countData, error: countError } = await supabase
        .from('Notas')
        .select('id', { count: 'exact' })
        .eq('revision_id', String(params.id));

      if (countError) {
        console.error('Error al contar notas:', countError);
      } else {
        const notasCount = countData?.length || 0;
        
        // Actualizar el campo notas_count en revisiones_casitas
        const { error: updateError } = await supabase
          .from('revisiones_casitas')
          .update({ notas_count: notasCount })
          .eq('id', params.id);

        if (updateError) {
          console.error('Error al actualizar notas_count:', updateError);
        } else {
          console.log('✅ notas_count actualizado a:', notasCount);
        }
      }

      setNuevaNota({
        fecha: new Date().toISOString().split('T')[0],
        Usuario: '',
        nota: '',
        evidencia: null
      });
      setShowNotaForm(false);
      // Recargar datos secundarios después de agregar nota
      setSecondaryDataLoaded(false);
      fetchSecondaryData();
    } catch (error: any) {
      console.error('Error al guardar la nota:', error);
      alert('Error al guardar la nota');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🚀 OPTIMIZACIÓN: Memoizar handlers de modal
  const openModal = useCallback((imgUrl: string) => {
    setModalImg(imgUrl);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalImg(null);
  }, []);

  // Modal functions simplified - using ImageModal component

  // 🚀 OPTIMIZACIÓN: Memoizar handlers de edición
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditedData(revision);
  }, [revision]);

  const handleSaveEdit = useCallback(async () => {
    if (!revision || !editedData || !supabase) return;

    try {
      setIsSubmitting(true);
      // Obtener fecha y hora local del dispositivo en formato ISO para PostgreSQL
      const now = new Date();
      // Crear timestamp en formato ISO local (sin zona horaria UTC)
      const fechaFormateada = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();

      console.log('Fecha local generada:', fechaFormateada);
      console.log('Iniciando actualización...');

      // Preparar datos para actualizar (sin modificar created_at)
      const { created_at, ...dataToUpdate } = editedData;
      
      // Actualizar los datos en revisiones_casitas (preservando fecha original)
      const { error: updateError } = await supabase
        .from('revisiones_casitas')
        .update(dataToUpdate)
        .eq('id', revision.id);

      if (updateError) {
        console.error('Error al actualizar revisiones_casitas:', updateError);
        throw updateError;
      }

      console.log('Actualización en revisiones_casitas exitosa');

      // Guardar el registro de cambios en Registro_ediciones
      const cambios = Object.entries(editedData).reduce((acc, [key, value]) => {
        // Excluir campos que no deben generar registros de edición
        if (key === 'id' || key === 'created_at' || key === 'fecha_edicion' || 
            key === 'quien_edito' || key === 'datos_anteriores' || key === 'datos_actuales') {
          return acc;
        }
        const valorAnterior = revision[key as keyof Revision];
        if (value !== valorAnterior) {
          const registro = {
            "Usuario que Edito": user || 'Usuario',
            Dato_anterior: `[${revision.id}] ${key}: ${String(valorAnterior || '')}`,
            Dato_nuevo: `[${revision.id}] ${key}: ${String(value || '')}`,
            created_at: fechaFormateada // Solo el registro de edición lleva fecha actual
          };
          console.log('Registro a insertar:', registro);
          acc.push(registro);
        }
        return acc;
      }, [] as RegistroEdicion[]);

      console.log('Cambios detectados:', cambios);

      if (cambios.length > 0) {
        console.log('Intentando insertar en Registro_ediciones...');
        const { data: insertData, error: registroError } = await supabase
          .from('Registro_ediciones')
          .insert(cambios)
          .select();

        if (registroError) {
          console.error('Error al guardar en Registro_ediciones:', registroError);
          console.error('Datos que causaron el error:', cambios);
          throw registroError;
        }

        console.log('Inserción exitosa en Registro_ediciones:', insertData);
      } else {
        console.log('No hay cambios para registrar');
      }

      setIsEditing(false);
      setEditedData(null);
      // Recargar datos críticos y secundarios después de editar
      await fetchCriticalData();
      setSecondaryDataLoaded(false);
      await fetchSecondaryData();
    } catch (error: any) {
      console.error('Error detallado:', error);
      setError(`Error al guardar los cambios: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [revision, editedData, supabase]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedData(null);
  }, []);

  const handleInputChange = useCallback((field: keyof Revision, value: string) => {
    if (!editedData) return;
    setEditedData({ ...editedData, [field]: value });
  }, [editedData]);

  // 🚀 CODE SPLITTING: Función de compresión con carga dinámica de utilidades
  const comprimirImagenWebP = useCallback(async (file: File): Promise<File> => {
    console.log('🚀 INICIANDO COMPRESIÓN:', file.name, file.type, `${(file.size / 1024).toFixed(1)} KB`);
    
    // Cargar dinámicamente las utilidades de imagen solo cuando se necesiten
    try {
      const { compressImage } = await import('@/lib/imageUtils');
      return await compressImage(file);
    } catch (error) {
      console.warn('Error cargando utilidades de imagen, usando compresión básica:', error);
      
      // Fallback a compresión básica si falla la carga dinámica
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        let objectUrl: string | null = null;
        
        img.onload = () => {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
          }
          
          const maxWidth = 1200;
          const maxHeight = 1200;
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
            
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/webp',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  reject(new Error('No se pudo generar el blob de la imagen'));
                }
              },
              'image/webp',
              0.8
            );
          } else {
            reject(new Error('No se pudo obtener el contexto del canvas'));
          }
        };
        
        img.onerror = () => {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          reject(new Error('Error al cargar la imagen'));
        };
        
        objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
      });
    }
  }, []);

  // 🚀 OPTIMIZACIÓN: Memoizar renderField para evitar re-renders innecesarios
  const renderField = useCallback((key: keyof Revision, value: any) => {
    // Mostrar TODOS los campos siempre, sin ocultar ninguno
    // Solo excluir el campo 'id' que no es relevante para mostrar
    if (key === 'id') {
      return null;
    }
    
    const label = fieldLabels[key];
    
    // Campos que no se pueden editar: casita, quien_revisa, created_at, evidencias
    const nonEditableFields = ['id', 'casita', 'quien_revisa', 'created_at', 'evidencia_01', 'evidencia_02', 'evidencia_03'];
    
    // 🚀 OPTIMIZADO: Campos principales con estilo simplificado
    if (key === 'casita') {
      return (
        <div key={key} className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg hover:shadow-xl transform transition-transform duration-200 hover:scale-[1.01] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#c9a45c]/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#c9a45c] rounded-lg flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#1a1f35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#c9a45c]">{label}</h3>
            </div>
            <p className="text-2xl font-black text-white drop-shadow-lg">
              {value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === '') ? (value as string) : (
                <span className="text-gray-400 italic text-lg">Sin información</span>
              )}
            </p>
          </div>
        </div>
      );
    }

    if (key === 'created_at') {
      return (
        <div key={key} className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg hover:shadow-xl transform transition-transform duration-200 hover:scale-[1.01] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-blue-400">Fecha de Revisión</h3>
            </div>
            <p className="text-xl font-bold text-white drop-shadow-lg">
              {value && value !== '' && value !== '0' ? formatearFechaParaMostrar(value as string) : (
                <span className="text-gray-400 italic text-base">Sin información</span>
              )}
            </p>
          </div>
        </div>
      );
    }

    if (key === 'quien_revisa') {
      return (
        <div key={key} className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg hover:shadow-xl transform transition-transform duration-200 hover:scale-[1.01] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-400">Revisado por</h3>
            </div>
            <p className="text-xl font-bold text-white drop-shadow-lg">
              {value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === '') ? (value as string) : (
                <span className="text-gray-400 italic text-base">Sin información</span>
              )}
            </p>
          </div>
        </div>
      );
    }

    if (key === 'caja_fuerte') {
      return (
        <div key={key} className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg hover:shadow-xl transform transition-transform duration-200 hover:scale-[1.01] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -translate-y-6 translate-x-6"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-purple-400">{label}</h3>
            </div>
            {isEditing && editedData ? (
              <input
                type="text"
                value={editedData[key] as string}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="w-full px-4 py-3 bg-[#1e2538]/90 border border-purple-500/50 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/70 transition-colors"
                placeholder={`Editar ${label.toLowerCase()}...`}
              />
            ) : (
              <p className="text-xl font-bold text-white drop-shadow-lg">
                {value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === '') ? (value as string) : (
                  <span className="text-gray-400 italic text-base">Sin información</span>
                )}
              </p>
            )}
          </div>
        </div>
      );
    }
    
    // 🚀 OPTIMIZADO: Campos de imagen sin backdrop-blur
    if (key === 'evidencia_01' || key === 'evidencia_02' || key === 'evidencia_03') {
      return (
        <div key={key} className="bg-gray-800/60 p-4 rounded-lg border border-gray-600/50">
          <h3 className="text-sm font-semibold text-[#ff8c42] mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z" />
            </svg>
            {label}
          </h3>
          <EvidenceImage 
            src={value as string} 
            alt={label} 
            onClick={() => openModal(value as string)} 
          />
        </div>
      );
    }
    
    // 🚀 OPTIMIZADO: Campo especial para notas sin backdrop-blur
    if (key === 'notas') {
      return (
        <div key={key} className="bg-gray-800/60 p-4 rounded-lg border border-gray-600/50">
          <h3 className="text-sm font-semibold text-[#ff8c42] mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
            {label}
          </h3>
          {isEditing && editedData ? (
            <textarea
              value={editedData[key] as string}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className="w-full px-3 py-2 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-colors resize-none"
              rows={4}
              placeholder="Escribe las notas aquí..."
            />
          ) : (
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === '') ? (value as string) : (
                <span className="text-gray-500 italic">Sin notas registradas</span>
              )}
            </p>
          )}
        </div>
      );
    }

    // Campos regulares: usar InfoCard para un estilo coherente
    const editable = isEditing && !!editedData && !nonEditableFields.includes(key);
    
    // En modo edición, mostrar TODOS los valores (incluyendo '0', null, '')
    // En modo normal, solo mostrar valores que no sean vacíos o '0'
    let displayValue: string | undefined;
    if (isEditing) {
      // En modo edición, mostrar el valor tal como está (incluso si es '0', null, '')
      // Convertir null/undefined a cadena vacía para que el campo sea editable
      displayValue = value !== null && value !== undefined ? String(value) : '';
    } else {
      // En modo normal, solo mostrar valores que no sean vacíos, null o '0'
      const isEmptyValue = value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
      displayValue = isEmptyValue ? undefined : String(value);
    }

    // Determinar acento según valor (simple ejemplo)
    let accent: 'default' | 'success' | 'error' = 'default';
    if (typeof displayValue === 'string') {
      const valLower = displayValue.toLowerCase();
      if (['ok', 'bien', 'si', 'sí', 'listo'].includes(valLower)) accent = 'success';
      if (['falta', 'no', 'mal'].includes(valLower)) accent = 'error';
    }

    return (
      <Suspense key={key} fallback={<ComponentSkeleton type="card" />}>
        <InfoCard
          key={key}
          label={label}
          value={displayValue}
          editable={editable}
          accent={accent}
          onChange={(newVal) => handleInputChange(key, newVal)}
        />
      </Suspense>
    );
  }, [fieldLabels, isEditing, editedData, handleInputChange]);

  // 🚀 OPTIMIZADO: Loading simplificado sin gradientes complejos ni backdrop-blur
  if (loading) return (
    <div className="min-h-screen bg-[#1a1f35] relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, #c9a45c 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>
      
      {/* Loading skeleton optimizado */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-[#1e2538]/90 rounded-2xl shadow-2xl border border-[#3d4659]/50 overflow-hidden">
          
          {/* Header skeleton */}
          <div className="bg-[#c9a45c]/10 border-b border-[#3d4659]/30 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#c9a45c]/20 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-8 bg-[#c9a45c]/20 rounded-lg w-64 animate-pulse"></div>
                <div className="h-6 bg-[#c9a45c]/10 rounded-lg w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6 p-6">
            {/* Info general skeleton */}
            <div className="bg-[#2a3347]/60 rounded-xl p-6 border border-[#3d4659]/30">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="bg-[#1e2538]/40 rounded-lg p-4 border border-[#3d4659]/20">
                    <div className="h-4 bg-[#c9a45c]/20 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-6 bg-[#c9a45c]/10 rounded w-32 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Accesorios skeleton */}
            <div className="bg-[#2a3347]/60 rounded-xl p-6 border border-[#3d4659]/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="bg-[#1e2538]/50 rounded-lg p-4 border border-[#3d4659]/20">
                    <div className="h-4 bg-orange-500/20 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-5 bg-orange-500/10 rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Evidencias skeleton */}
            <div className="bg-[#2a3347]/60 rounded-xl p-6 border border-[#3d4659]/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="bg-[#1e2538]/50 rounded-lg p-4 border border-[#3d4659]/20">
                    <div className="h-4 bg-blue-500/20 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-48 bg-blue-500/10 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Loading indicator optimizado */}
        <div className="fixed bottom-8 right-8 flex items-center gap-3 bg-[#1e2538] rounded-full px-4 py-3 border border-[#3d4659]/50">
          <div className="w-5 h-5 border-2 border-[#c9a45c]/30 border-t-[#c9a45c] rounded-full animate-spin"></div>
          <span className="text-[#c9a45c] font-medium text-sm">Cargando detalles...</span>
        </div>
      </div>
    </div>
  );
  
  // 🚀 OPTIMIZADO: Error simplificado sin gradientes complejos ni backdrop-blur
  if (error) return (
    <div className="min-h-screen bg-[#1a1f35] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, #c9a45c 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>
      <div className="relative z-10 bg-red-500/10 rounded-2xl p-8 border border-red-500/20 max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-400">Error</h2>
        </div>
        <p className="text-red-300">{error}</p>
      </div>
    </div>
  );
  
  if (!revision) return (
    <div className="min-h-screen bg-[#1a1f35] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, #c9a45c 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>
      <div className="relative z-10 bg-[#1e2538]/90 rounded-2xl p-8 border border-[#3d4659]/50 max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#c9a45c]/20 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#c9a45c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8c0 1.913-.67 3.669-1.791 5.043L19.5 20.5 17 18" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#c9a45c]">Sin Datos</h2>
        </div>
        <p className="text-gray-300">No se encontraron datos para esta revisión</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen relative overflow-hidden" style={{
      background: '#334d50',
      backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
    }}>

      {/* Modal de imagen simplificado */}
      {modalOpen && modalImg && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        }>
          <ImageModal
            isOpen={true}
            imageUrl={modalImg}
            onClose={closeModal}
          />
        </Suspense>
      )}

      {/* 🚀 OPTIMIZADO: Contenedor principal simplificado */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-[#1e2538]/90 rounded-2xl shadow-2xl border border-[#3d4659]/50 overflow-hidden">
          {/* Header optimizado */}
          <div className="bg-[#c9a45c]/10 border-b border-[#3d4659]/30 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#c9a45c] rounded-xl flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1a1f35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5.291A7.962 7.962 0 0112 20c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8c0 1.913-.67 3.669-1.791 5.043L19.5 20.5 17 18" />
                  </svg>
                </div>
                <div className="relative">
                  <div className="relative">
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] leading-tight">
                      Detalles de la Revisión
                    </h1>
                    
                    {/* Badge optimizado para la casita */}
                    <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#c9a45c]/20 rounded-full border border-[#c9a45c]/30">
                      <div className="w-2 h-2 bg-[#c9a45c] rounded-full animate-pulse"></div>
                      <span className="text-[#f0c987] font-semibold text-sm tracking-wide">
                        CASITA {revision?.casita}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                {!isEditing ? (
                  // Temporarily allow all users to edit for debugging
                  // (userRole === 'admin' || userRole === 'SuperAdmin') && (
                    <button
                      onClick={handleEdit}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1a1f35] rounded-xl hover:from-[#d4b06c] hover:to-[#f7d498] transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 border border-[#f0c987]/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                  // )
                ) : (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 border border-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Editando...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Guardar
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 border border-red-500/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancelar
                    </button>
                  </>
                )}
                <button
                  onClick={() => router.back()}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 border border-gray-600/20 relative overflow-hidden"
                  style={{ padding: '10px 18px' }}
                >
                  {/* Efecto de brillo continuo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0cb35]/80 to-transparent animate-[slide_2s_ease-in-out_infinite] z-0"></div>
                  <div className="relative z-10 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* 🚀 OPTIMIZADO: Información de la Revisión sin backdrop-blur */}
            <div className="bg-[#2a3347]/70 rounded-xl p-4 sm:p-6 border border-[#3d4659]/30 shadow-lg">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                  Información de la Revisión
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                style={{
                  background: '#334d50',
                  backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
                }}
              >
                {[
                  'casita', 'quien_revisa', 'created_at', 'caja_fuerte',
                  'puertas_ventanas', 'chromecast', 'binoculares', 'trapo_binoculares',
                  'speaker', 'usb_speaker', 'controles_tv', 'secadora',
                  'accesorios_secadora', 'steamer', 'bolsa_vapor', 'plancha_cabello',
                  'bulto', 'sombrero', 'bolso_yute', 'camas_ordenadas', 'cola_caballo',
                  'evidencia_01', 'evidencia_02', 'evidencia_03', 'notas'
                ].filter((key) => {
                  if ([
                    'casita', 'quien_revisa', 'created_at', 'caja_fuerte',
                    'notas'
                  ].includes(key)) return true;
                  const val = revision?.[key as keyof Revision];
                  return val !== null && val !== undefined && !(typeof val === 'string' && val.trim() === '');
                }).map((key) => renderField(key as keyof Revision, revision?.[key as keyof Revision]))}
              </div>
            </div>


            {/* 🚀 OPTIMIZADO: Notas con carga diferida */}
            <div className="bg-[#2a3347]/70 rounded-xl p-4 sm:p-6 border border-[#3d4659]/30 shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    {secondaryDataLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-purple-400">
                      Notas y Observaciones
                      {secondaryDataLoading && <span className="text-sm text-gray-400 ml-2">Cargando...</span>}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                      {secondaryDataLoading ? 'Cargando notas...' : `${notas.length} nota${notas.length !== 1 ? 's' : ''} registrada${notas.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowNotaForm(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 border border-purple-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar Nota
                </button>
              </div>

              {showNotaForm && (
                <div className="bg-[#1e2538]/90 rounded-xl p-4 sm:p-6 border border-[#3d4659]/40 mb-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-purple-400">Nueva Nota</h3>
                  </div>
                  
                  <form onSubmit={handleSubmitNota} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Usuario
                        </label>
                        <select
                          required
                          className="w-full px-4 py-3 bg-gradient-to-r from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                          value={nuevaNota.Usuario}
                          onChange={(e) => setNuevaNota({ ...nuevaNota, Usuario: e.target.value })}
                        >
                          <option value="">Seleccionar usuario</option>
                          {nombresRevisores.map(nombre => (
                            <option key={nombre} value={nombre}>{nombre}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Evidencia (Opcional)
                        </label>
                        
                        {/* Input oculto para galería */}
                        <input
                          ref={galeriaInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressedFile = await comprimirImagenWebP(file);
                                setNuevaNota({ ...nuevaNota, evidencia: compressedFile });
                              } catch (error) {
                                console.error('Error al comprimir imagen:', error);
                                setNuevaNota({ ...nuevaNota, evidencia: file });
                              }
                            }
                          }}
                        />
                        
                        {/* Input oculto para cámara */}
                        <input
                          ref={camaraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressedFile = await comprimirImagenWebP(file);
                                setNuevaNota({ ...nuevaNota, evidencia: compressedFile });
                              } catch (error) {
                                console.error('Error al comprimir imagen:', error);
                                setNuevaNota({ ...nuevaNota, evidencia: file });
                              }
                            }
                          }}
                        />
                        
                        {/* Botones para seleccionar origen */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              // 🚀 OPTIMIZADO: Uso de useRef en lugar de getElementById repetitivo
                              const input = galeriaInputRef.current;
                              if (input) {
                                input.value = '';
                                input.click();
                              }
                            }}
                            className="flex-1 px-3 py-2.5 bg-gradient-to-r from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white hover:from-[#2a3347] hover:to-[#34404d] transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Galería
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              // 🚀 OPTIMIZADO: Uso de useRef en lugar de getElementById repetitivo
                              const input = camaraInputRef.current;
                              if (input) {
                                input.value = '';
                                input.click();
                              }
                            }}
                            className="flex-1 px-3 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 border border-purple-500/20 rounded-xl text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Cámara
                          </button>
                        </div>
                        
                        {/* Mostrar nombre del archivo seleccionado */}
                        {nuevaNota.evidencia && (
                          <div className="mt-2 text-xs text-purple-400 bg-purple-500/10 rounded-lg px-3 py-2 border border-purple-500/20">
                            📁 {nuevaNota.evidencia.name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Nota
                      </label>
                      <textarea
                        required
                        className="w-full px-4 py-3 bg-gradient-to-r from-[#1e2538] to-[#2a3347] border border-[#3d4659] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
                        rows={4}
                        placeholder="Escribe tu observación aquí..."
                        value={nuevaNota.nota}
                        onChange={(e) => setNuevaNota({ ...nuevaNota, nota: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNotaForm(false)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-[#1a1f35]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Editando...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Guardar Nota
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {secondaryDataLoading ? (
                  // Skeleton para notas mientras cargan
                  <div className="space-y-4">
                    {Array.from({ length: 2 }, (_, i) => (
                      <div key={i} className="bg-[#1e2538]/50 rounded-xl p-4 sm:p-5 border border-[#3d4659]/20 animate-pulse">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-purple-500/20 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-purple-500/20 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-purple-500/10 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-600/20 rounded w-full"></div>
                          <div className="h-3 bg-gray-600/20 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notas.length > 0 ? (
                  notas.map((nota) => (
                    <div key={nota.id} className="bg-gradient-to-br from-[#1e2538]/50 to-[#2a3347]/50 rounded-xl p-4 sm:p-5 border border-[#3d4659]/20 hover:border-purple-400/30 transition-all duration-300 hover:shadow-lg">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-purple-400 font-semibold text-sm">
                              {nota.Usuario}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {formatearFechaParaMostrar(nota.fecha)}
                            </p>
                          </div>
                        </div>
                        
                        {nota.Evidencia && (
                          <button
                            onClick={() => openModal(nota.Evidencia)}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg font-medium text-xs flex items-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver Evidencia
                          </button>
                        )}
                      </div>
                      
                      <div className="bg-gradient-to-r from-[#1e2538]/30 to-[#2a3347]/30 rounded-lg p-3 border border-[#3d4659]/10">
                        <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{nota.nota}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-lg font-medium">No hay notas registradas</p>
                    <p className="text-gray-500 text-sm mt-1">Agrega la primera nota para esta casita</p>
                  </div>
                )}
              </div>
            </div>

            {/* 🚀 OPTIMIZADO: Historial de Ediciones con carga diferida */}
            <div className="bg-[#2a3347]/70 rounded-xl p-4 sm:p-6 border border-[#3d4659]/30 shadow-lg">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  {secondaryDataLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-amber-400">
                    Historial de Ediciones
                    {secondaryDataLoading && <span className="text-sm text-gray-400 ml-2">Cargando...</span>}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {secondaryDataLoading ? 'Cargando historial...' : `${registroEdiciones.length} edición${registroEdiciones.length !== 1 ? 'es' : ''} registrada${registroEdiciones.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {secondaryDataLoading ? (
                  // Skeleton para historial mientras carga
                  <div className="space-y-4">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div key={i} className="bg-[#1e2538]/50 rounded-xl p-4 sm:p-5 border border-[#3d4659]/20 animate-pulse">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-amber-500/20 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-amber-500/20 rounded w-40 mb-2"></div>
                            <div className="h-3 bg-amber-500/10 rounded w-28"></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-600/20 rounded w-20"></div>
                            <div className="h-4 bg-gray-600/10 rounded w-full"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-600/20 rounded w-20"></div>
                            <div className="h-4 bg-gray-600/10 rounded w-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : registroEdiciones.length > 0 ? (
                  registroEdiciones.map((edicion, index) => (
                    <div key={index} className="bg-gradient-to-br from-[#1e2538]/50 to-[#2a3347]/50 rounded-xl p-4 sm:p-5 border border-[#3d4659]/20 hover:border-amber-400/30 transition-all duration-300 hover:shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-amber-400 font-semibold text-sm">
                            {edicion["Usuario que Edito"]}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {edicion.created_at ? formatearFechaParaMostrar(edicion.created_at) : 'Fecha no disponible'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-lg p-4 border border-red-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <span className="text-red-400 font-semibold text-sm">Valor Anterior</span>
                          </div>
                          {(() => {
                            const parsedData = parseEditData(edicion.Dato_anterior);
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-red-300 bg-red-500/20 px-2 py-1 rounded-md">
                                    {parsedData.displayName}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed break-words bg-[#1a1f35]/50 p-3 rounded-lg border border-red-500/10">
                                  {parsedData.value || 'Sin valor'}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg p-4 border border-green-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-green-400 font-semibold text-sm">Valor Nuevo</span>
                          </div>
                          {(() => {
                            const parsedData = parseEditData(edicion.Dato_nuevo);
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-green-300 bg-green-500/20 px-2 py-1 rounded-md">
                                    {parsedData.displayName}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed break-words bg-[#1a1f35]/50 p-3 rounded-lg border border-green-500/10">
                                  {parsedData.value || 'Sin valor'}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-lg font-medium">No hay ediciones registradas</p>
                    <p className="text-gray-500 text-sm mt-1">Los cambios futuros aparecerán aquí</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
});