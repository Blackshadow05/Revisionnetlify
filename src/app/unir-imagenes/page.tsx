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
    if (typeof navigator.canShare === 'function') {
      try {
        // Crear un pequeño archivo de prueba para verificar soporte
        const testBlob = new Blob(['a'], { type: 'image/jpeg' });
        const testFile = new File([testBlob], 'test.jpg', { type: 'image/jpeg' });
        // Si canShare falla, atrapamos y devolvemos false
        return navigator.canShare({ files: [testFile] });
      } catch {
        return false;
      }
    }
    // Si no hay canShare, asumimos soporte
    return true;
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

  // Función para unir las imágenes con límite de dimensiones y permitiendo re-evaluar orientación
  const unirImagenes = useCallback(() => {
    if (!imagen1.compressed || !imagen2.compressed) return;

    const MAX_DIM = 1200;

    const img1 = new Image();
    const img2 = new Image();

    img1.crossOrigin = 'anonymous';
    img2.crossOrigin = 'anonymous';

    const getScaled = (w: number, h: number, max: number) => {
      if (w <= max && h <= max) return { w, h };
      const ratio = Math.max(w / max, h / max);
      return { w: Math.round(w / ratio), h: Math.round(h / ratio) };
    };

    img1.onload = () => {
      img2.onload = () => {
        // Escalar dimensiones manteniendo proporción antes de dibujar
        const s1 = getScaled(img1.width, img1.height, MAX_DIM);
        const s2 = getScaled(img2.width, img2.height, MAX_DIM);

        let canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          img1.src = '';
          img2.src = '';
          canvas = null as any;
          return;
        }

        if (orientacion === 'vertical') {
          const width = Math.max(s1.w, s2.w);
          const height = s1.h + s2.h;
          canvas.width = width;
          canvas.height = height;
          // Fondo blanco para evitar transparencias raras en JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img1, 0, 0, s1.w, s1.h);
          ctx.drawImage(img2, 0, s1.h, s2.w, s2.h);
        } else {
          const width = s1.w + s2.w;
          const height = Math.max(s1.h, s2.h);
          canvas.width = width;
          canvas.height = height;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img1, 0, 0, s1.w, s1.h);
          ctx.drawImage(img2, s1.w, 0, s2.w, s2.h);
        }

        // Convertir a blob (evitar toDataURL)
        canvas.toBlob((blob) => {
          if (!blob) {
            try { canvas.width = 0; canvas.height = 0; } catch { /* ignore */ }
            img1.src = '';
            img2.src = '';
            return;
          }

          const objectUrl = URL.createObjectURL(blob);

          // Reemplazar imagen unida anterior y revocar si era blob
          setImagenUnida(prev => {
            try {
              if (prev && typeof prev === 'string' && prev.startsWith('blob:')) {
                URL.revokeObjectURL(prev);
              }
            } catch (e) { /* ignore */ }
            return objectUrl;
          });

          // NO revocar ni limpiar las previews comprimidas aquí:
          // las dejamos para permitir re-unir con otra orientación.
          // Si el usuario desea liberar memoria manualmente puede usar "Limpiar Todo".

          // Liberar canvas y referencias a imágenes para facilitar GC
          try { canvas.width = 0; canvas.height = 0; } catch { /* ignore */ }
          img1.src = '';
          img2.src = '';
        }, 'image/jpeg', 0.9);
      };

      if (imagen2.compressed) {
        img2.src = imagen2.compressed;
      }
    };

    if (imagen1.compressed) {
      img1.src = imagen1.compressed;
    }
  }, [imagen1.compressed, imagen2.compressed, orientacion]);

  // Helper para cambiar orientación — dejamos que el efecto que depende de `orientacion`
  // ejecute `unirImagenes` automáticamente (evita usar closures con valores desactualizados)
  const handleSetOrientacion = (o: 'vertical' | 'horizontal') => {
    setOrientacion(o);
  };

  // Efecto para unir imágenes automáticamente cuando cambian
  useEffect(() => {
    if (imagen1.compressed && imagen2.compressed) {
      unirImagenes();
    }
  }, [imagen1.compressed, imagen2.compressed, orientacion, unirImagenes]);

  // Función para limpiar una imagen
  const limpiarImagen = (tipo: 'img1' | 'img2') => {
    if (tipo === 'img1') {
      // Revocar URL de previsualización sólo si es object URL (blob:)
      try {
        if (imagen1.compressed && imagen1.compressed.startsWith('blob:')) {
          URL.revokeObjectURL(imagen1.compressed);
        }
      } catch (e) { /* ignore */ }

      setImagen1({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
      setCompressionStatus1({ status: 'idle', progress: 0, stage: '' });
      setFileSizes1({ original: 0, compressed: 0 });
      if (fileInputRef1.current) fileInputRef1.current.value = '';
    } else {
      // Revocar URL de previsualización sólo si es object URL (blob:)
      try {
        if (imagen2.compressed && imagen2.compressed.startsWith('blob:')) {
          URL.revokeObjectURL(imagen2.compressed);
        }
      } catch (e) { /* ignore */ }

      setImagen2({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
      setCompressionStatus2({ status: 'idle', progress: 0, stage: '' });
      setFileSizes2({ original: 0, compressed: 0 });
      if (fileInputRef2.current) fileInputRef2.current.value = '';
    }
    // No revocar imagenUnida aquí para evitar pérdida accidental si el usuario solo limpia una preview.
    setImagenUnida(null);
  };

  // Función para guardar la imagen unida
  const guardarImagen = () => {
    if (!imagenUnida) return;
    
    // Generar número aleatorio de 3 dígitos
    const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const filename = `imagen-unida-${randomNumber}.jpg`;
    
    const link = document.createElement('a');
    link.href = imagenUnida;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para compartir la imagen usando Web Share API
  const compartirImagen = async () => {
    if (!imagenUnida) return;
    
    // Helper to download if sharing with files is not available
    const descargar = (url: string, name: string) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    if (!navigator.share) {
      // Fall back: descargar
      descargar(imagenUnida, 'imagen-unida.jpg');
      return;
    }

    try {
      // Convertir data URL a blob
      const response = await fetch(imagenUnida);
      const blob = await response.blob();

      // Intentar compartir como File si es compatible
      let shareFile: File | null = null;
      if (typeof File === 'function') {
        shareFile = new File([blob], 'imagen-unida.jpg', { type: blob.type });
      }

      // Si el navegador soporta canShare, verificar compatibilidad
      const canShareWithFile = shareFile && (typeof navigator.canShare === 'function'
        ? navigator.canShare({ files: [shareFile] } as any)
        : true);

      if (shareFile && canShareWithFile) {
        await navigator.share({
          title: 'Imagen Unida',
          text: 'Imagen creada con la aplicación de unión de imágenes',
          files: [shareFile] as any
        });
      } else {
        // Fall back a descarga
        descargar(imagenUnida, 'imagen-unida.jpg');
      }
      
      console.log('Imagen compartida exitosamente');
    } catch (error) {
      console.error('Error al compartir la imagen:', error);
      // Fall back: permitir guardar manualmente si falla
      if ((error as Error).name !== 'AbortError') {
        alert('No se pudo compartir la imagen. Puedes guardarla y compartirla manualmente.');
      }
    }
  };
  
  // Función para limpiar todos los campos
  const limpiarCampos = () => {
    // Revocar sólo si son object URLs (blob:)
    try {
      if (imagen1.compressed && imagen1.compressed.startsWith('blob:')) {
        URL.revokeObjectURL(imagen1.compressed);
      }
    } catch (e) { /* ignore */ }
    try {
      if (imagen2.compressed && imagen2.compressed.startsWith('blob:')) {
        URL.revokeObjectURL(imagen2.compressed);
      }
    } catch (e) { /* ignore */ }
    try {
      if (imagenUnida && imagenUnida.startsWith('blob:')) {
        URL.revokeObjectURL(imagenUnida);
      }
    } catch (e) { /* ignore */ }

    // Limpiar estado de imágenes
    setImagen1({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
    setImagen2({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
    setImagenUnida(null);
    
    // Limpiar estados de compresión
    setCompressionStatus1({ status: 'idle', progress: 0, stage: '' });
    setCompressionStatus2({ status: 'idle', progress: 0, stage: '' });
    setFileSizes1({ original: 0, compressed: 0 });
    setFileSizes2({ original: 0, compressed: 0 });
  };
  
  // Efecto para limpiar URLs de imagen 1 cuando cambia
  useEffect(() => {
    // Este efecto se ejecuta cuando imagen1.compressed cambia
    // La función de limpieza revocará la URL anterior si es blob:
    return () => {
      try {
        if (imagen1.compressed && imagen1.compressed.startsWith('blob:')) {
          URL.revokeObjectURL(imagen1.compressed);
        }
      } catch (e) { /* ignore */ }
    };
  }, [imagen1.compressed]);
  
  // Efecto para limpiar URLs de imagen 2 cuando cambia
  useEffect(() => {
    // Este efecto se ejecuta cuando imagen2.compressed cambia
    // La función de limpieza revocará la URL anterior si es blob:
    return () => {
      try {
        if (imagen2.compressed && imagen2.compressed.startsWith('blob:')) {
          URL.revokeObjectURL(imagen2.compressed);
        }
      } catch (e) { /* ignore */ }
    };
  }, [imagen2.compressed]);
  
  // Efecto para limpiar URL de imagen unida cuando cambia
  useEffect(() => {
    // Este efecto se ejecuta cuando imagenUnida cambia
    // La función de limpieza revocará la URL anterior si es blob:
    return () => {
      try {
        if (imagenUnida && imagenUnida.startsWith('blob:')) {
          URL.revokeObjectURL(imagenUnida);
        }
      } catch (e) { /* ignore */ }
    };
  }, [imagenUnida]);
  
  // Efecto para limpiar URLs al desmontar el componente
  useEffect(() => {
    return () => {
      try {
        if (imagen1.compressed && imagen1.compressed.startsWith('blob:')) {
          URL.revokeObjectURL(imagen1.compressed);
        }
      } catch (e) { /* ignore */ }
      try {
        if (imagen2.compressed && imagen2.compressed.startsWith('blob:')) {
          URL.revokeObjectURL(imagen2.compressed);
        }
      } catch (e) { /* ignore */ }
      try {
        if (imagenUnida && imagenUnida.startsWith('blob:')) {
          URL.revokeObjectURL(imagenUnida);
        }
      } catch (e) { /* ignore */ }
    };
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden" style={{
      background: '#334d50',
      backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
    }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex justify-between items-center mb-6 md:mb-8 pt-6">
          <div className="relative">
            <h1 className="text-3xl font-bold text-white">Unir Imágenes</h1>
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
        
        {/* Controles */}
        <div className="bg-[#2a3347]/80 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-8 border border-[#3d4659]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => handleSetOrientacion('vertical')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  orientacion === 'vertical'
                    ? 'bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1e2538] shadow-lg font-medium'
                    : 'bg-[#3d4659] text-gray-300 hover:bg-[#4a5466]'
                }`}
              >
                Vertical
              </button>
              <button
                onClick={() => handleSetOrientacion('horizontal')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  orientacion === 'horizontal'
                    ? 'bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1e2538] shadow-lg font-medium'
                    : 'bg-[#3d4659] text-gray-300 hover:bg-[#4a5466]'
                }`}
              >
                Horizontal
              </button>

              <button
                onClick={() => { if (imagen1.compressed && imagen2.compressed) unirImagenes(); }}
                disabled={!(imagen1.compressed && imagen2.compressed)}
                className={`px-4 py-2 rounded-lg transition-all ml-2 ${
                  (imagen1.compressed && imagen2.compressed)
                    ? 'bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1e2538] shadow-md font-medium'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Reunir ahora
              </button>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Imagen 1 */}
          <div className="bg-[#2a3347]/80 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-[#3d4659]">
            <h2 className="text-xl font-bold mb-4 text-center text-white">Imagen 1</h2>
            
            {imagen1.compressed ? (
              <div className="space-y-4">
                <img
                  src={imagen1.compressed}
                  alt="Imagen 1"
                  className="w-full h-32 object-cover rounded-lg border border-[#3d4659]"
                />
                <button
                  onClick={() => limpiarImagen('img1')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg font-medium"
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
              <div className="border-2 border-dashed border-[#3d4659] rounded-lg p-4 text-center">
                <div className="space-y-3">
                  <div className="text-3xl">📸</div>
                  <p className="text-gray-300 text-sm">Selecciona una imagen</p>
                  <button
                    onClick={() => fileInputRef1.current?.click()}
                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1e2538] rounded-lg hover:from-[#d4b06a] hover:to-[#f5d399] transition-all shadow-md font-medium"
                  >
                    Seleccionar
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
          <div className="bg-[#2a3347]/80 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-[#3d4659]">
            <h2 className="text-xl font-bold mb-4 text-center text-white">Imagen 2</h2>
            
            {imagen2.compressed ? (
              <div className="space-y-4">
                <img
                  src={imagen2.compressed}
                  alt="Imagen 2"
                  className="w-full h-32 object-cover rounded-lg border border-[#3d4659]"
                />
                <button
                  onClick={() => limpiarImagen('img2')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg font-medium"
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
              <div className="border-2 border-dashed border-[#3d4659] rounded-lg p-4 text-center">
                <div className="space-y-3">
                  <div className="text-3xl">📸</div>
                  <p className="text-gray-300 text-sm">Selecciona una imagen</p>
                  <button
                    onClick={() => fileInputRef2.current?.click()}
                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1e2538] rounded-lg hover:from-[#d4b06a] hover:to-[#f5d399] transition-all shadow-md font-medium"
                  >
                    Seleccionar
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
          <div className="bg-[#2a3347]/80 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-8 border border-[#3d4659]">
            <h2 className="text-xl font-bold mb-4 text-center text-white">Imagen Unida</h2>
            <div className="flex justify-center mb-4">
              <img
                src={imagenUnida}
                alt="Imagen Unida"
                className="max-w-full h-auto rounded-lg shadow-lg border border-[#3d4659]"
              />
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <button
                onClick={guardarImagen}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Guardar Imagen
              </button>
              
              <button
                onClick={compartirImagen}
                disabled={!imagenUnida}
                className={`px-6 py-3 rounded-lg transition-all shadow-lg font-medium flex items-center justify-center gap-2 ${
                  imagenUnida
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                </svg>
                Compartir
              </button>
              
              <button
                onClick={limpiarCampos}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Limpiar Todo
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-8 pb-6">
          <button
            onClick={() => router.push('/')}
            className="text-[#c9a45c] hover:text-[#f0c987] transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Volver al inicio
          </button>
        </div>
        
        {/* Log de memoria */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm text-white p-2 text-xs font-mono border-t border-[#3d4659]">
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
    </main>
  );
}
