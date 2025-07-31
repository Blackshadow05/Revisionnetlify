'use client';

import { useState, useMemo, memo, useCallback, Suspense, lazy, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRevisionData } from '@/hooks/useRevisionData';
import { useDetailsPageCache } from '@/hooks/useStructureCache';
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

  // 🚀 CACHE PERMANENTE: Hook para gestión de caché
  const { checkCache } = useDetailsPageCache(params.id as string);

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

  // 🚀 CACHE: Verificar estado del caché
  useEffect(() => {
    const verifyCache = async () => {
      const status = await checkCache();
      console.log('📊 Estado del caché de estructura:', status);
    };
    
    verifyCache();
  }, [checkCache]);

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
      
      return `${dia}/${mes}/${año} ${horas}:${minutos}`;
    } catch {
      return fechaISO;
    }
  }, []);

  // 🚀 OPTIMIZACIÓN: Función de compresión de imágenes
  const comprimirImagenWebP = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            } else {
              reject(new Error('Error al comprimir imagen'));
            }
          }, 'image/webp', 0.8);
        }
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // 🚀 OPTIMIZACIÓN: Función para manejar archivos
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNuevaNota(prev => ({ ...prev, evidencia: file }));
    }
  }, []);

  // 🚀 OPTIMIZACIÓN: Función para determinar si mostrar campo
  const shouldShowField = useCallback((key: keyof Revision, value: any) => {
    if (key === 'id') return false;
    if (key === 'notas') return true;
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  }, []);

  // 🚀 OPTIMIZACIÓN: Renderizar campo individual
  const renderField = useCallback((key: keyof Revision, value: any) => {
    if (!shouldShowField(key, value)) return null;

    const label = fieldLabels[key] || key;
    
    return (
      <FadeIn key={key} delay={100}>
        <div className="border-b border-[#3d4659]/30 pb-4 last:border-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-white capitalize">
                {label.replace(/_/g, ' ')}
              </h3>
              <p className="text-gray-300 mt-1">
                {value || <span className="text-gray-500 italic">No especificado</span>}
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    );
  }, [fieldLabels, shouldShowField]);

  // Resto del componente... (continúa con el resto del código)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#2a3347] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </button>
        </div>

        {/* Contenido principal */}
        {loading ? (
          <DetallesSkeleton />
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">Error: {error}</div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Reintentar
            </button>
          </div>
        ) : !revision ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">No se encontró la revisión</div>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Volver al inicio
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información principal */}
            <div className="bg-[#1e2538]/90 backdrop-blur-sm rounded-2xl border border-[#3d4659]/50 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#2a3347] to-[#3d4659] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      Revisión de {revision.casita}
                    </h1>
                    <p className="text-gray-300">
                      Revisado por: {revision.quien_revisa}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">ID: {revision.id}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(revision.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {Object.entries(revision).map(([key, value]) => {
                  if (key === 'id' || key === 'created_at') return null;
                  
                  return renderField(key as keyof Revision, value);
                })}
              </div>
            </div>

            {/* Notas */}
            {hasNotas && (
              <div className="bg-[#1e2538]/90 backdrop-blur-sm rounded-2xl border border-[#3d4659]/50 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-[#2a3347] to-[#3d4659] p-6">
                  <h2 className="text-2xl font-bold text-white">Notas</h2>
                </div>
                <div className="p-6">
                  {notas?.map((nota: any) => (
                    <div key={nota.id} className="border-b border-[#3d4659]/30 pb-4 mb-4 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white">{nota.nota}</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Por: {nota.Usuario} • {new Date(nota.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

DetalleRevision.displayName = 'DetalleRevision';

export default DetalleRevision;
