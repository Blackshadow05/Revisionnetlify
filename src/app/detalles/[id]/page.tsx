'use client';

import { useState, useMemo, memo, useCallback, Suspense, lazy } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { uploadNotaToCloudinary } from '@/lib/cloudinary';
import { useRevisionData } from '@/hooks/useRevisionData';
import DetallesSkeleton from '@/components/ui/DetallesSkeleton';
import LoadingButton from '@/components/ui/LoadingButton';
import FadeIn from '@/components/ui/FadeIn';
import ClickableImage from '@/components/ui/ClickableImage';

// 🚀 CODE SPLITTING: Lazy load de componentes no críticos
const ImageModal = lazy(() => import('@/components/revision/ImageModal'));
const InfoCard = lazy(() => import('@/components/ui/InfoCard'));



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

const DetalleRevision = memo(() => {
  const params = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  
  // 🚀 OPTIMIZACIÓN: Hook personalizado para carga de datos
  const {
    revision,
    notas,
    registroEdiciones,
    loading,
    secondaryLoading,
    error,
    hasNotas,
    hasRegistroEdiciones,
    loadSecondaryData,
    refetchRevision,
    refetchSecondaryData
  } = useRevisionData(params.id);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Revision | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para el formulario de notas
  const [showNotaForm, setShowNotaForm] = useState(false);
  const [isSubmittingNota, setIsSubmittingNota] = useState(false);
  const [nuevaNota, setNuevaNota] = useState({
    Usuario: '',
    nota: '',
    evidencia: null as File | null,
  });

  const { userRole, user } = useAuth();

  // 🚀 OPTIMIZACIÓN: Memoizar fieldLabels para evitar recreación
  const fieldLabels: Record<string, string> = useMemo(() => ({
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

  // 🚀 OPTIMIZACIÓN: Función de formateo de fechas
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
      return fechaISO;
    }
  }, []);

  // 🚀 OPTIMIZACIÓN: Memoizar handlers de modal
  const openModal = useCallback((imgUrl: string) => {
    setModalImg(imgUrl);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalImg(null);
  }, []);

  // 🚀 OPTIMIZACIÓN: Memoizar handlers de edición
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditedData(revision);
  }, [revision]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedData(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!revision || !editedData || !supabase) return;

    try {
      setIsSubmitting(true);
      
      // Obtener fecha y hora local del dispositivo en formato ISO para PostgreSQL
      const now = new Date();
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
        showError('Error al guardar los cambios');
        return;
      }

      console.log('Actualización en revisiones_casitas exitosa');

      // Guardar el registro de cambios en Registro_ediciones
      const cambios = Object.entries(editedData).reduce((acc, [key, value]) => {
        // Lista de campos válidos para registrar cambios
        const validFields: (keyof Revision)[] = [
          'casita', 'quien_revisa', 'caja_fuerte', 'puertas_ventanas', 'chromecast',
          'binoculares', 'trapo_binoculares', 'speaker', 'usb_speaker', 'controles_tv',
          'secadora', 'accesorios_secadora', 'steamer', 'bolsa_vapor', 'plancha_cabello',
          'bulto', 'sombrero', 'bolso_yute', 'camas_ordenadas', 'cola_caballo',
          'evidencia_01', 'evidencia_02', 'evidencia_03', 'notas'
        ];
        
        // Solo procesar campos válidos
        if (!validFields.includes(key as keyof Revision)) {
          return acc;
        }
        
        // Verificación adicional de que la propiedad existe
        if (!revision.hasOwnProperty(key)) {
          return acc;
        }
        
        // Acceso seguro usando bracket notation con any
        const valorAnterior = (revision as any)[key];
        if (value !== valorAnterior) {
          const registro = {
            "Usuario que Edito": user || 'Usuario',
            Dato_anterior: `[${revision.id}] ${key}: ${String(valorAnterior || '')}`,
            Dato_nuevo: `[${revision.id}] ${key}: ${String(value || '')}`,
            created_at: fechaFormateada
          };
          console.log('Registro a insertar:', registro);
          acc.push(registro);
        }
        return acc;
      }, [] as any[]);

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
          // No bloquear la edición por error en el registro
        } else {
          console.log('Inserción exitosa en Registro_ediciones:', insertData);
        }
      } else {
        console.log('No hay cambios para registrar');
      }

      setIsEditing(false);
      setEditedData(null);
      showSuccess('Cambios guardados correctamente');
      
      // Recargar datos críticos y secundarios después de editar
      await refetchRevision();
      await refetchSecondaryData();
      
    } catch (error: any) {
      console.error('Error detallado:', error);
      showError(`Error al guardar los cambios: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [revision, editedData, supabase, user, showError, showSuccess, refetchRevision, refetchSecondaryData]);

  const handleInputChange = useCallback((field: keyof Revision, value: string) => {
    if (!editedData) return;
    setEditedData({ ...editedData, [field]: value });
  }, [editedData]);

  // 🚀 FUNCIONES PARA MANEJO DE NOTAS
  const comprimirImagenWebP = useCallback(async (file: File): Promise<File> => {
    console.log('🚀 INICIANDO COMPRESIÓN:', file.name, file.type, `${(file.size / 1024).toFixed(1)} KB`);
    
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
                console.log('✅ COMPRESIÓN COMPLETADA:', `${(compressedFile.size / 1024).toFixed(1)} KB`);
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
  }, []);



  const handleSubmitNota = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revision || !supabase) return;
    
    try {
      setIsSubmittingNota(true);
      let evidenciaUrl = null;

      if (nuevaNota.evidencia) {
        try {
          // Comprimir imagen antes de subir a Cloudinary
          const compressedImage = await comprimirImagenWebP(nuevaNota.evidencia);
          evidenciaUrl = await uploadNotaToCloudinary(compressedImage);
          console.log('✅ Imagen de nota subida exitosamente a Cloudinary/notas:', evidenciaUrl);
        } catch (uploadError) {
          console.error('❌ Error al subir imagen a Cloudinary:', uploadError);
          showError('Error al subir la imagen');
          return;
        }
      }

      // Obtener fecha y hora local del dispositivo sin zona horaria
      const now = new Date();
      const fechaLocal = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      
      const notaData = {
        fecha: fechaLocal.toISOString().slice(0, 19), // Formato: YYYY-MM-DDTHH:mm:ss (sin Z)
        Casita: revision.casita,
        revision_id: String(params.id),
        Usuario: nuevaNota.Usuario,
        nota: nuevaNota.nota,
        Evidencia: evidenciaUrl
      };
      
      console.log('💾 Insertando nota con datos:', notaData);
      
      const { data: insertResult, error } = await supabase
        .from('Notas')
        .insert([notaData])
        .select();
      
      if (error) {
        console.error('❌ Error de inserción:', error);
        showError('Error al guardar la nota');
        return;
      }

      console.log('✅ Nota guardada exitosamente:', insertResult);
      showSuccess('Nota agregada correctamente');

      // Limpiar formulario
      setNuevaNota({
        Usuario: '',
        nota: '',
        evidencia: null
      });
      setShowNotaForm(false);
      
      // Recargar datos secundarios
      await refetchSecondaryData();

    } catch (error: any) {
      console.error('Error al guardar la nota:', error);
      showError('Error al guardar la nota');
    } finally {
      setIsSubmittingNota(false);
    }
  }, [revision, params.id, nuevaNota, supabase, comprimirImagenWebP, showError, showSuccess, refetchSecondaryData]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNuevaNota(prev => ({ ...prev, evidencia: file }));
    }
  }, []);

  // 🚀 FUNCIÓN PARA PARSEAR DATOS DE EDICIÓN
  const parseEditData = useCallback((dataString: string) => {
    // Formato esperado: [UUID] campo: valor
    const match = dataString.match(/^\[([a-f0-9-]+)\]\s+([^:]+):\s*(.*)$/);
    if (match) {
      const [, id, fieldName, value] = match;
      const displayName = fieldLabels[fieldName.trim()] || fieldName.trim();
      return {
        id,
        fieldName: fieldName.trim(),
        displayName,
        value: value.trim()
      };
    }
    return {
      id: '',
      fieldName: '',
      displayName: 'Campo desconocido',
      value: dataString
    };
  }, [fieldLabels]);

  // 🚀 FUNCIÓN PARA DETERMINAR SI UN CAMPO DEBE MOSTRARSE
  const shouldShowField = useCallback((key: keyof Revision, value: any) => {
    // Nunca mostrar estos campos
    if (key === 'id') return false;
    
    // Siempre mostrar el campo notas, aunque esté vacío
    if (key === 'notas') return true;
    
    // Para otros campos, verificar si tienen valor
    // El número 0 cuenta como valor válido
    if (value === 0) return true;
    
    // Verificar si el valor está vacío (null, undefined, string vacía o solo espacios)
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    
    return true;
  }, []);

  // 🚀 OPTIMIZACIÓN: Renderizar campo individual
  const renderField = useCallback((key: keyof Revision, value: any) => {
    // Usar la función para determinar si mostrar el campo
    if (!shouldShowField(key, value)) return null;
    
    const label = fieldLabels[key] || key;
    const nonEditableFields = ['id', 'casita', 'quien_revisa', 'created_at', 'evidencia_01', 'evidencia_02', 'evidencia_03'];
    
    // Campos principales con estilo especial
    if (key === 'casita') {
      return (
        <FadeIn key={key} delay={100}>
          <div className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg hover:shadow-xl transform transition-transform duration-200 hover:scale-[1.01] relative overflow-hidden">
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
                {value || <span className="text-gray-400 italic text-lg">Sin información</span>}
              </p>
            </div>
          </div>
        </FadeIn>
      );
    }

    if (key === 'created_at') {
      return (
        <FadeIn key={key} delay={200}>
          <div className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg hover:shadow-xl transform transition-transform duration-200 hover:scale-[1.01] relative overflow-hidden">
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
                {value ? formatearFechaParaMostrar(value) : <span className="text-gray-400 italic text-base">Sin información</span>}
              </p>
            </div>
          </div>
        </FadeIn>
      );
    }

    if (key === 'quien_revisa') {
      return (
        <FadeIn key={key} delay={300}>
          <div className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg hover:shadow-xl transform transition-transform duration-200 hover:scale-[1.01] relative overflow-hidden">
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
                {value || <span className="text-gray-400 italic text-base">Sin información</span>}
              </p>
            </div>
          </div>
        </FadeIn>
      );
    }

    // Campos de imagen
    if (key === 'evidencia_01' || key === 'evidencia_02' || key === 'evidencia_03') {
      const delays = { evidencia_01: 400, evidencia_02: 500, evidencia_03: 600 };
      return (
        <FadeIn key={key} delay={delays[key as keyof typeof delays]}>
          <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-600/50">
            <h3 className="text-sm font-semibold text-[#ff8c42] mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z" />
              </svg>
              {label}
            </h3>
            {value && (
              <ClickableImage 
                src={value} 
                alt={label} 
                onClick={() => openModal(value)} 
              />
            )}
          </div>
        </FadeIn>
      );
    }

    // Campo de notas
    if (key === 'notas') {
      return (
        <FadeIn key={key} delay={700}>
          <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-600/50">
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
                {value || <span className="text-gray-500 italic">Sin notas registradas</span>}
              </p>
            )}
          </div>
        </FadeIn>
      );
    }

    // Campos regulares
    return (
      <FadeIn key={key} delay={Math.min(800, 100 * Object.keys(fieldLabels).indexOf(key))}>
        <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-600/50">
          <h3 className="text-sm font-semibold text-[#ff8c42] mb-2">{label}</h3>
          {isEditing && editedData && !nonEditableFields.includes(key) ? (
            <input
              type="text"
              value={editedData[key] as string}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className="w-full px-3 py-2 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-colors"
              placeholder={`Editar ${label?.toLowerCase() || 'campo'}...`}
            />
          ) : (
            <p className="text-gray-300">
              {value || <span className="text-gray-500 italic">Sin información</span>}
            </p>
          )}
        </div>
      </FadeIn>
    );
  }, [fieldLabels, isEditing, editedData, handleInputChange, openModal, formatearFechaParaMostrar, shouldShowField]);

  // 🚀 VALIDACIÓN: Verificar que existe ID de revisión
  if (!params.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f35] to-[#2d3748] flex items-center justify-center p-4">
        <FadeIn>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-red-400 font-bold text-lg mb-2">ID de revisión no válido</h3>
            <p className="text-gray-300 mb-4">No se pudo encontrar el ID de la revisión</p>
            <LoadingButton
              onClick={() => router.back()}
              variant="danger"
            >
              Volver
            </LoadingButton>
          </div>
        </FadeIn>
      </div>
    );
  }

  // 🚀 LOADING INSTANTÁNEO: Mostrar skeleton mientras carga
  if (loading) {
    return <DetallesSkeleton />;
  }

  // 🚀 ERROR HANDLING
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f35] to-[#2d3748] flex items-center justify-center p-4">
        <FadeIn>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-red-400 font-bold text-lg mb-2">Error al cargar</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <LoadingButton
              onClick={() => window.location.reload()}
              variant="danger"
            >
              Reintentar
            </LoadingButton>
          </div>
        </FadeIn>
      </div>
    );
  }

  if (!revision) {
    return <DetallesSkeleton />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: '#334d50',
      backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
    }}>
      {/* Header */}
      <FadeIn>
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-12 h-12 bg-[#c9a45c] hover:bg-[#b8934d] rounded-xl flex items-center justify-center transition-colors shadow-lg flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1a1f35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">
                  Detalles de Revisión
                </h1>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <LoadingButton
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </LoadingButton>
                  <LoadingButton
                    onClick={handleSaveEdit}
                    loading={isSubmitting}
                    variant="success"
                    className="w-full sm:w-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar
                  </LoadingButton>
                </>
              ) : (
                <LoadingButton
                  onClick={handleEdit}
                  variant="primary"
                  className="w-full sm:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </LoadingButton>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Banner informativo sobre datos adicionales disponibles */}
      {(hasNotas || hasRegistroEdiciones) && (
        <div className="max-w-6xl mx-auto mb-8">
          <FadeIn delay={200}>
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-orange-500/15 border border-blue-400/30 rounded-xl p-5 shadow-lg backdrop-blur-sm">
              {/* Efecto de brillo animado */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
              
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-blue-300 font-bold text-xl">
                      📋 Información Adicional Disponible
                    </h3>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {hasNotas && (
                      <div className="flex items-center gap-3 bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-purple-300 font-semibold text-sm">Notas Adicionales</p>
                          <p className="text-purple-200/80 text-xs">Observaciones y evidencia</p>
                        </div>
                      </div>
                    )}
                    
                    {hasRegistroEdiciones && (
                      <div className="flex items-center gap-3 bg-orange-500/10 rounded-lg p-3 border border-orange-400/20">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-orange-300 font-semibold text-sm">Historial de Ediciones</p>
                          <p className="text-orange-200/80 text-xs">Cambios registrados</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-300 text-sm bg-gray-800/30 rounded-lg p-3 border border-gray-600/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      <strong className="text-yellow-400">Tip:</strong> Desplázate hacia abajo para encontrar los botones que te permitirán ver esta información adicional.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      )}

      {/* Información principal */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {renderField('casita', revision.casita)}
        {renderField('created_at', revision.created_at)}
        {renderField('quien_revisa', revision.quien_revisa)}
      </div>

      {/* Grid de elementos de revisión */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {Object.entries(revision)
          .filter(([key]) => !['id', 'casita', 'quien_revisa', 'created_at', 'evidencia_01', 'evidencia_02', 'evidencia_03', 'notas'].includes(key))
          .filter(([key, value]) => shouldShowField(key as keyof Revision, value))
          .map(([key, value]) => renderField(key as keyof Revision, value))}
      </div>

      {/* Evidencias */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {renderField('evidencia_01', revision.evidencia_01)}
        {renderField('evidencia_02', revision.evidencia_02)}
        {renderField('evidencia_03', revision.evidencia_03)}
      </div>

      {/* Notas */}
      <div className="max-w-6xl mx-auto mb-8">
        {renderField('notas', revision.notas)}
      </div>

      {/* Formulario para agregar nueva nota - Siempre disponible */}
      {showNotaForm ? (
        <div className="max-w-6xl mx-auto mb-8">
          <FadeIn delay={750}>
            <div className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-purple-400">Nueva Nota Adicional</h3>
              </div>

              <form onSubmit={handleSubmitNota} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Usuario
                    </label>
                    <input
                      type="text"
                      value={nuevaNota.Usuario}
                      onChange={(e) => setNuevaNota(prev => ({ ...prev, Usuario: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors"
                      placeholder="Nombre del usuario"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Evidencia (Imagen)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nota
                  </label>
                  <textarea
                    value={nuevaNota.nota}
                    onChange={(e) => setNuevaNota(prev => ({ ...prev, nota: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors resize-none"
                    rows={4}
                    placeholder="Escribe tu nota u observación aquí..."
                    required
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <LoadingButton
                    onClick={() => {
                      setShowNotaForm(false);
                      setNuevaNota({ Usuario: '', nota: '', evidencia: null });
                    }}
                    variant="secondary"
                    type="button"
                  >
                    Cancelar
                  </LoadingButton>
                  <LoadingButton
                    onClick={() => {}}
                    loading={isSubmittingNota}
                    variant="success"
                    type="submit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar Nota
                  </LoadingButton>
                </div>
              </form>
            </div>
          </FadeIn>
        </div>
      ) : (
        // Botón para mostrar formulario - Siempre visible
        <div className="max-w-6xl mx-auto mb-8">
          <FadeIn delay={750}>
            <div className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-purple-400 mb-2">Agregar Nota Adicional</h3>
              <p className="text-gray-400 mb-4">Añade observaciones, comentarios o evidencia adicional</p>
              <LoadingButton
                onClick={() => {
                  // Si hay notas pero no están cargadas, cargar primero
                  if (hasNotas && notas.length === 0) {
                    loadSecondaryData().then(() => setShowNotaForm(true));
                  } else {
                    setShowNotaForm(true);
                  }
                }}
                variant="primary"
                loading={secondaryLoading && hasNotas && notas.length === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Agregar Nota
              </LoadingButton>
            </div>
          </FadeIn>
        </div>
      )}

      {/* Sección de Notas Adicionales Existentes - Solo mostrar si hay notas cargadas */}
      {notas.length > 0 && (
        <div className="max-w-6xl mx-auto mb-8">
          <FadeIn delay={800}>
            <div className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-purple-400">Notas Adicionales ({notas.length})</h3>
              </div>

              <div className="space-y-4">
                {notas.map((nota, index) => (
                  <FadeIn key={nota.id} delay={900 + (index * 100)}>
                    <div className="bg-[#2a3441]/30 p-4 rounded-lg border border-[#3d4659]/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <span className="text-blue-400 text-sm font-bold">
                              {nota.Usuario?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{nota.Usuario || 'Usuario'}</p>
                            <p className="text-gray-400 text-sm">
                              {nota.fecha ? formatearFechaParaMostrar(nota.fecha) : 'Fecha no disponible'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-3 leading-relaxed">{nota.nota}</p>
                      
                      {nota.Evidencia && (
                        <div className="mt-3">
                          <ClickableImage
                            src={nota.Evidencia}
                            alt="Evidencia de nota"
                            onClick={() => openModal(nota.Evidencia)}
                            className="max-w-xs h-32 object-cover rounded-lg"
                            containerClassName="relative group cursor-pointer inline-block"
                          />
                        </div>
                      )}
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      )}



      {/* Botón para cargar notas existentes si las hay pero no están cargadas */}
      {hasNotas && notas.length === 0 && !showNotaForm && (
        <div className="max-w-6xl mx-auto mb-8">
          <FadeIn delay={800}>
            <div className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-purple-400 mb-2">Notas Adicionales Disponibles</h3>
              <p className="text-gray-400 mb-4">Esta revisión tiene notas adicionales registradas</p>
              <LoadingButton
                onClick={loadSecondaryData}
                loading={secondaryLoading}
                variant="primary"
              >
                Ver Notas Existentes
              </LoadingButton>
            </div>
          </FadeIn>
        </div>
      )}

      {/* Sección de Historial de Ediciones */}
      {hasRegistroEdiciones && (
        <div className="max-w-6xl mx-auto mb-8">
          <FadeIn delay={900}>
            {registroEdiciones.length > 0 ? (
              // Mostrar historial completo cuando los datos están cargados
              <div className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-orange-400">Historial de Ediciones ({registroEdiciones.length})</h3>
                </div>

                {secondaryLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Cargando historial...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registroEdiciones.map((edicion, index) => {
                      const datoAnterior = parseEditData(edicion.Dato_anterior || '');
                      const datoNuevo = parseEditData(edicion.Dato_nuevo || '');
                      
                      return (
                        <FadeIn key={edicion.id || index} delay={1000 + (index * 100)}>
                          <div className="bg-[#2a3441]/30 p-4 rounded-lg border border-[#3d4659]/20">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                                  <span className="text-orange-400 text-sm font-bold">
                                    {edicion["Usuario que Edito"]?.charAt(0)?.toUpperCase() || 'E'}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-white font-medium">{edicion["Usuario que Edito"] || 'Usuario'}</p>
                                  <p className="text-gray-400 text-sm">
                                    {edicion.created_at ? formatearFechaParaMostrar(edicion.created_at) : 'Fecha no disponible'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="text-orange-400 font-medium text-sm">
                                  Campo editado: {datoAnterior.displayName}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                    <span className="text-red-400 font-medium text-sm">Valor Anterior</span>
                                  </div>
                                  <p className="text-gray-300 text-sm break-words">
                                    {datoAnterior.value || <span className="text-gray-500 italic">Sin valor</span>}
                                  </p>
                                </div>
                                
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-green-400 font-medium text-sm">Valor Nuevo</span>
                                  </div>
                                  <p className="text-gray-300 text-sm break-words">
                                    {datoNuevo.value || <span className="text-gray-500 italic">Sin valor</span>}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </FadeIn>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Mostrar botón para cargar cuando hay datos pero no están cargados
              <div className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-orange-400 mb-2">Historial de Ediciones Disponible</h3>
                <p className="text-gray-400 mb-4">Esta revisión tiene un historial de cambios</p>
                <LoadingButton
                  onClick={loadSecondaryData}
                  loading={secondaryLoading}
                  variant="primary"
                >
                  Ver Historial
                </LoadingButton>
              </div>
            )}
          </FadeIn>
        </div>
      )}

      {/* Modal de imagen */}
      <Suspense fallback={null}>
        <ImageModal
          isOpen={modalOpen}
          imageUrl={modalImg}
          onClose={closeModal}
        />
      </Suspense>
    </div>
  );
});

DetalleRevision.displayName = 'DetalleRevision';

export default DetalleRevision;