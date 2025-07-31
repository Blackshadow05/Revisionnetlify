'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { compressImageAdvanced } from '@/lib/imageUtils';
import CompressionIndicator from '@/components/revision/CompressionIndicator';

interface ImageData {
  file: File | null;
  compressed: string | null;
  originalSize: number;
  compressedSize: number;
}

interface CompressionStatus {
  status: 'idle' | 'compressing' | 'completed' | 'error';
  progress: number;
  stage: string;
  error?: string;
}

interface FileSizes {
  original: number;
  compressed: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export default function UnirImagenes() {
  const router = useRouter();
  
  const [imagen1, setImagen1] = useState<ImageData>({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
  const [imagen2, setImagen2] = useState<ImageData>({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
  const [imagenUnida, setImagenUnida] = useState<string | null>(null);
  const [orientacion, setOrientacion] = useState<'vertical' | 'horizontal'>('vertical');
  
  const [compressionStatus1, setCompressionStatus1] = useState<CompressionStatus>({ status: 'idle', progress: 0, stage: '' });
  const [compressionStatus2, setCompressionStatus2] = useState<CompressionStatus>({ status: 'idle', progress: 0, stage: '' });
  const [fileSizes1, setFileSizes1] = useState<FileSizes>({ original: 0, compressed: 0 });
  const [fileSizes2, setFileSizes2] = useState<FileSizes>({ original: 0, compressed: 0 });
  
  const [memoryInfo, setMemoryInfo] = useState<string>('');
  
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  
  // Función para obtener información de memoria
  const getMemoryInfo = () => {
    if ('memory' in performance) {
      // @ts-ignore: performance.memory es específico de Chrome
      const memory: MemoryInfo = performance.memory;
      if (memory) {
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
        return `RAM: ${usedMB}MB / ${totalMB}MB (Límite: ${limitMB}MB)`;
      }
    }
    return 'Información de memoria no disponible';
  };
  
  // Forzar recolección de basura si está disponible (solo en Chrome con flags especiales)
  const forceGC = () => {
    if ('gc' in window && typeof window.gc === 'function') {
      // @ts-ignore: window.gc es específico de Chrome con flags
      window.gc();
      console.log('Recolección de basura forzada');
    }
  };
  
  // Verificar si Web Share API está disponible
  const isWebShareAvailable = () => {
    if (typeof navigator === 'undefined' || !navigator.share) return false;
    
    // Verificar si el navegador soporta compartir archivos
    // @ts-ignore - navigator.canShare puede no estar definido en todos los navegadores
    return typeof navigator.canShare === 'function' 
      ? navigator.canShare({ files: [new File([], 'test.jpg', { type: 'image/jpeg' })] })
      : true; // Fallback para navegadores que no tienen canShare
  };
  
  // Forzar GC cuando se limpian las imágenes
  useEffect(() => {
    if (!imagen1.compressed && !imagen2.compressed && imagenUnida) {
      forceGC();
    }
  }, [imagen1.compressed, imagen2.compressed, imagenUnida]);
  
  // Actualizar información de memoria cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryInfo(getMemoryInfo());
    }, 2000);
    
    // Establecer información inicial
    setMemoryInfo(getMemoryInfo());
    
    return () => clearInterval(interval);
  }, []);

  // Función para manejar la selección de archivos
  const manejarSeleccionArchivo = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'img1' | 'img2') => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Actualizar estado con el archivo original
      if (tipo === 'img1') {
        setImagen1(prev => ({ ...prev, file, originalSize: file.size }));
        setFileSizes1({ original: file.size, compressed: 0 });
        setCompressionStatus1({ status: 'compressing', progress: 0, stage: 'Comprimiendo imagen 1...' });
      } else {
        setImagen2(prev => ({ ...prev, file, originalSize: file.size }));
        setFileSizes2({ original: file.size, compressed: 0 });
        setCompressionStatus2({ status: 'compressing', progress: 0, stage: 'Comprimiendo imagen 2...' });
      }

      try {
        // Comprimir la imagen
        const compressedFile = await compressImageAdvanced(
          file,
          { targetSizeKB: 800 },
          (progress) => {
            const progressPercent = Math.min(100, Math.round((progress.currentSize / progress.targetSize) * 100));
            
            if (tipo === 'img1') {
              setCompressionStatus1({
                status: 'compressing',
                progress: progressPercent,
                stage: `Intento ${progress.attempt}: ${progressPercent}%`
              });
            } else {
              setCompressionStatus2({
                status: 'compressing',
                progress: progressPercent,
                stage: `Intento ${progress.attempt}: ${progressPercent}%`
              });
            }
          }
        );

        // Crear URL para previsualización
        const previewUrl = URL.createObjectURL(compressedFile);
        
        // Actualizar estado con la imagen comprimida
        if (tipo === 'img1') {
          setImagen1(prev => ({
            ...prev,
            compressed: previewUrl,
            compressedSize: compressedFile.size
          }));
          setFileSizes1(prev => ({ ...prev, compressed: compressedFile.size }));
          setCompressionStatus1({ status: 'completed', progress: 100, stage: 'Imagen 1 comprimida' });
        } else {
          setImagen2(prev => ({
            ...prev,
            compressed: previewUrl,
            compressedSize: compressedFile.size
          }));
          setFileSizes2(prev => ({ ...prev, compressed: compressedFile.size }));
          setCompressionStatus2({ status: 'completed', progress: 100, stage: 'Imagen 2 comprimida' });
        }
      } catch (error) {
        console.error('Error al comprimir la imagen:', error);
        
        if (tipo === 'img1') {
          setCompressionStatus1({ 
            status: 'error', 
            progress: 0, 
            stage: 'Error al comprimir', 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          });
        } else {
          setCompressionStatus2({ 
            status: 'error', 
            progress: 0, 
            stage: 'Error al comprimir', 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          });
        }
      }
    }
  };

  // Función para unir las imágenes
  const unirImagenes = useCallback(() => {
    if (!imagen1.compressed || !imagen2.compressed) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img1 = new Image();
    const img2 = new Image();

    img1.onload = () => {
      img2.onload = () => {
        let width, height;
        
        if (orientacion === 'vertical') {
          width = Math.max(img1.width, img2.width);
          height = img1.height + img2.height;
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img1, 0, 0);
          ctx.drawImage(img2, 0, img1.height);
        } else {
          width = img1.width + img2.width;
          height = Math.max(img1.height, img2.height);
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img1, 0, 0);
          ctx.drawImage(img2, img1.width, 0);
        }

        const dataURL = canvas.toDataURL('image/jpeg', 0.9);
        setImagenUnida(dataURL);
      };
      
      if (imagen2.compressed) {
        img2.src = imagen2.compressed;
      }
    };
    
    if (imagen1.compressed) {
      img1.src = imagen1.compressed;
    }
  }, [imagen1.compressed, imagen2.compressed, orientacion]);

  // Efecto para unir imágenes automáticamente cuando cambian
  useEffect(() => {
    if (imagen1.compressed && imagen2.compressed) {
      unirImagenes();
    }
  }, [imagen1.compressed, imagen2.compressed, orientacion, unirImagenes]);

  // Función para limpiar una imagen
  const limpiarImagen = (tipo: 'img1' | 'img2') => {
    if (tipo === 'img1') {
      // Revocar URL de previsualización
      if (imagen1.compressed) {
        URL.revokeObjectURL(imagen1.compressed);
      }
      setImagen1({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
      setCompressionStatus1({ status: 'idle', progress: 0, stage: '' });
      setFileSizes1({ original: 0, compressed: 0 });
      if (fileInputRef1.current) fileInputRef1.current.value = '';
    } else {
      // Revocar URL de previsualización
      if (imagen2.compressed) {
        URL.revokeObjectURL(imagen2.compressed);
      }
      setImagen2({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
      setCompressionStatus2({ status: 'idle', progress: 0, stage: '' });
      setFileSizes2({ original: 0, compressed: 0 });
      if (fileInputRef2.current) fileInputRef2.current.value = '';
    }
    setImagenUnida(null);
  };

  // Función para guardar la imagen unida
  const guardarImagen = () => {
    if (!imagenUnida) return;
    
    const link = document.createElement('a');
    link.href = imagenUnida;
    link.download = 'imagen-unida.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para compartir la imagen usando Web Share API
  const compartirImagen = async () => {
    if (!imagenUnida || !navigator.share) return;
    
    try {
      // Convertir data URL a blob
      const response = await fetch(imagenUnida);
      const blob = await response.blob();
      
      // Compartir usando Web Share API
      await navigator.share({
        title: 'Imagen Unida',
        text: 'Imagen creada con la aplicación de unión de imágenes',
        files: [
          new File([blob], 'imagen-unida.jpg', { 
            type: blob.type 
          })
        ]
      });
      
      console.log('Imagen compartida exitosamente');
    } catch (error) {
      console.error('Error al compartir la imagen:', error);
      
      // Fallback: mostrar mensaje al usuario
      if ((error as Error).name !== 'AbortError') {
        alert('No se pudo compartir la imagen. Puedes guardarla y compartirla manualmente.');
      }
    }
  };
  
  // Función para limpiar todos los campos
  const limpiarCampos = () => {
    // Limpiar estado de imágenes
    setImagen1({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
    setImagen2({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
    setImagenUnida(null);
    
    // Limpiar estados de compresión
    setCompressionStatus1({ status: 'idle', progress: 0, stage: '' });
    setCompressionStatus2({ status: 'idle', progress: 0, stage: '' });
    setFileSizes1({ original: 0, compressed: 0 });
    setFileSizes2({ original: 0, compressed: 0 });
    
    // Revocar object URLs
    if (imagen1.compressed) URL.revokeObjectURL(imagen1.compressed);
    if (imagen2.compressed) URL.revokeObjectURL(imagen2.compressed);
    if (imagenUnida) URL.revokeObjectURL(imagenUnida);
  };
  
  // Efecto para limpiar URLs de imagen 1 cuando cambia
  useEffect(() => {
    // Este efecto se ejecuta cuando imagen1.compressed cambia
    // La función de limpieza revocará la URL anterior
    return () => {
      if (imagen1.compressed) URL.revokeObjectURL(imagen1.compressed);
    };
  }, [imagen1.compressed]);
  
  // Efecto para limpiar URLs de imagen 2 cuando cambia
  useEffect(() => {
    // Este efecto se ejecuta cuando imagen2.compressed cambia
    // La función de limpieza revocará la URL anterior
    return () => {
      if (imagen2.compressed) URL.revokeObjectURL(imagen2.compressed);
    };
  }, [imagen2.compressed]);
  
  // Efecto para limpiar URL de imagen unida cuando cambia
  useEffect(() => {
    // Este efecto se ejecuta cuando imagenUnida cambia
    // La función de limpieza revocará la URL anterior
    return () => {
      if (imagenUnida) URL.revokeObjectURL(imagenUnida);
    };
  }, [imagenUnida]);
  
  // Efecto para limpiar URLs al desmontar el componente
  useEffect(() => {
    return () => {
      if (imagen1.compressed) URL.revokeObjectURL(imagen1.compressed);
      if (imagen2.compressed) URL.revokeObjectURL(imagen2.compressed);
      if (imagenUnida) URL.revokeObjectURL(imagenUnida);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Unir Imágenes</h1>
        
        {/* Controles */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setOrientacion('vertical')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  orientacion === 'vertical' 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Vertical
              </button>
              <button
                onClick={() => setOrientacion('horizontal')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  orientacion === 'horizontal' 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Horizontal
              </button>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Imagen 1 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Imagen 1</h2>
            
            {imagen1.compressed ? (
              <div className="space-y-4">
                <img 
                  src={imagen1.compressed} 
                  alt="Imagen 1" 
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={() => limpiarImagen('img1')}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
                <CompressionIndicator 
                  status={compressionStatus1} 
                  fileSizes={fileSizes1} 
                  fieldName="Imagen 1" 
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <div className="text-4xl">📸</div>
                  <p className="text-gray-600">Selecciona una imagen</p>
                  <button
                    onClick={() => fileInputRef1.current?.click()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Seleccionar Imagen
                  </button>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef1}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => manejarSeleccionArchivo(e, 'img1')}
              className="hidden"
            />
          </div>

          {/* Imagen 2 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Imagen 2</h2>
            
            {imagen2.compressed ? (
              <div className="space-y-4">
                <img 
                  src={imagen2.compressed} 
                  alt="Imagen 2" 
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={() => limpiarImagen('img2')}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
                <CompressionIndicator 
                  status={compressionStatus2} 
                  fileSizes={fileSizes2} 
                  fieldName="Imagen 2" 
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <div className="text-4xl">📸</div>
                  <p className="text-gray-600">Selecciona una imagen</p>
                  <button
                    onClick={() => fileInputRef2.current?.click()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Seleccionar Imagen
                  </button>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef2}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => manejarSeleccionArchivo(e, 'img2')}
              className="hidden"
            />
          </div>
        </div>

        {/* Imagen unida */}
        {imagenUnida && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Imagen Unida</h2>
            <div className="flex justify-center mb-4">
              <img 
                src={imagenUnida} 
                alt="Imagen Unida" 
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <button
                onClick={guardarImagen}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Guardar Imagen
              </button>
              
              <button
                onClick={compartirImagen}
                disabled={!isWebShareAvailable()}
                className={`px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  isWebShareAvailable() 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                </svg>
                Compartir
              </button>
              
              <button
                onClick={limpiarCampos}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Limpiar Todo
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/" className="text-blue-500 hover:text-blue-700 transition-colors">
            ← Volver al inicio
          </Link>
        </div>
        
        {/* Log de memoria */}
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-2 text-xs font-mono">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <span>💾 {memoryInfo}</span>
            <button 
              onClick={forceGC}
              className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              Forzar GC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
