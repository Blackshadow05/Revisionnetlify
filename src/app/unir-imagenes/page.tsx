'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { compressImageAdvanced, createImagePreview, revokeImagePreview } from '@/lib/imageUtils';
import CompressionIndicator from '@/components/revision/CompressionIndicator';
import ImageModal from '@/components/revision/ImageModal';
import PageTitle from '@/components/ui/PageTitle';

interface ImageData {
  file: File | null;
  compressed: string | null;
  originalSize: number;
  compressedSize: number;
}

interface CompressionProgress {
  attempt: number;
  currentSize: number;
  targetSize: number;
  quality: number;
  resolution: string;
  status: 'compressing' | 'compressed' | 'timeout' | 'error';
}

export default function UnirImagenes() {

  // 📱 DETECCIÓN DE DISPOSITIVO MÓVIL (al inicio para evitar hoisting issues)
  const isMobile = typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );

  const [imagen1, setImagen1] = useState<ImageData>({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
  const [imagen2, setImagen2] = useState<ImageData>({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
  const [imagenUnida, setImagenUnida] = useState<string | null>(null);
  const [orientacion, setOrientacion] = useState<'vertical' | 'horizontal'>('vertical');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState<{ img1: boolean; img2: boolean }>({ img1: false, img2: false });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [modalImg, setModalImg] = useState<string | null>(null);

  // 🚀 NUEVOS ESTADOS PARA COMPRESIÓN AVANZADA
  const [compressionProgress1, setCompressionProgress1] = useState<CompressionProgress | null>(null);
  const [compressionProgress2, setCompressionProgress2] = useState<CompressionProgress | null>(null);
  const [isCompressing1, setIsCompressing1] = useState(false);
  const [isCompressing2, setIsCompressing2] = useState(false);

  // Efecto para manejar tecla ESC en modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modalVisible) {
        setModalVisible(false);
      }
    };

    if (modalVisible) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevenir scroll del fondo
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [modalVisible]);

  // 📱 MONITOR DE MEMORIA PARA MÓVILES
  const checkMemoryUsage = useCallback(() => {
    if (!isMobile || typeof window === 'undefined') return;
    
    try {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
        const percentUsed = (usedMB / limitMB) * 100;
        
        console.log(`📈 Memoria: ${usedMB}MB / ${limitMB}MB (${Math.round(percentUsed)}%)`);
        
        // Si se usa más del 80% de memoria, limpiar automáticamente
        if (percentUsed > 80) {
          console.warn('⚠️ MEMORIA CRÍTICA - Limpiando automáticamente...');
          
          // Limpiar imagen unida si existe
          if (imagenUnida) {
            if (imagenUnida.startsWith('blob:')) {
              URL.revokeObjectURL(imagenUnida);
            }
            setImagenUnida(null);
          }
          
          // Forzar garbage collection
          if ('gc' in window) {
            try {
              (window as any).gc();
              console.log('🗑️ Garbage collection de emergencia ejecutado');
            } catch (e) {
              // Silencioso
            }
          }
        }
      }
    } catch (error) {
      // Silencioso - no todos los navegadores soportan performance.memory
    }
  }, [isMobile, imagenUnida]);

  // 📱 EJECUTAR MONITOR DE MEMORIA CADA 5 SEGUNDOS EN MÓVILES
  useEffect(() => {
    if (!isMobile) return;
    
    const interval = setInterval(checkMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, [checkMemoryUsage, isMobile]);

  // 🧹 LIMPIEZA: Liberar URLs de objeto cuando cambien las imágenes
  useEffect(() => {
    return () => {
      if (imagen1.compressed) {
        revokeImagePreview(imagen1.compressed);
      }
    };
  }, [imagen1.compressed]);

  useEffect(() => {
    return () => {
      if (imagen2.compressed) {
        revokeImagePreview(imagen2.compressed);
      }
    };
  }, [imagen2.compressed]);

  // 🧹 LIMPIEZA: Liberar imagen unida cuando cambie
  useEffect(() => {
    return () => {
      if (imagenUnida && imagenUnida.startsWith('blob:')) {
        URL.revokeObjectURL(imagenUnida);
      }
    };
  }, [imagenUnida]);

  // 🧹 LIMPIEZA COMPLETA: Limpiar todos los campos al montar el componente
  useEffect(() => {
    limpiarCampos();
    
    // Cleanup al desmontar el componente
    return () => {
      console.log('🧹 Desmontando componente - Limpieza final');
      if (imagen1.compressed) revokeImagePreview(imagen1.compressed);
      if (imagen2.compressed) revokeImagePreview(imagen2.compressed);
      if (imagenUnida && imagenUnida.startsWith('blob:')) {
        URL.revokeObjectURL(imagenUnida);
      }
    };
  }, []);


  
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 🚀 FUNCIÓN REUTILIZABLE DE COMPRESIÓN AVANZADA
  const manejarArchivoSeleccionado = async (file: File, tipo: 'img1' | 'img2') => {
    console.log(`🔥 INICIO - Seleccionando archivo para ${tipo}:`, file.name, file.type, `${(file.size / 1024).toFixed(1)} KB`);
    
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // 🧹 LIMPIEZA PREVIA: Liberar URL anterior antes de crear nueva
    const imagenActual = tipo === 'img1' ? imagen1 : imagen2;
    if (imagenActual.compressed) {
      console.log(`🧹 Liberando URL anterior para ${tipo}:`, imagenActual.compressed);
      revokeImagePreview(imagenActual.compressed);
    }

    // Determinar estados según el tipo
    const setIsCompressing = tipo === 'img1' ? setIsCompressing1 : setIsCompressing2;
    const setCompressionProgress = tipo === 'img1' ? setCompressionProgress1 : setCompressionProgress2;
    const setImagenData = tipo === 'img1' ? setImagen1 : setImagen2;
  
    // ✨ CORRECCIÓN: Resetear el estado de compresión al iniciar
    setCompressionProgress(null);
    setLoading(prev => ({ ...prev, [tipo]: true }));
    setIsCompressing(true);
    console.log(`⏳ Iniciando compresión avanzada para ${tipo}`);
  
    try {
      // 🚀 PASO 1: Mostrar preview inmediato
      console.log(`⚡ PREVIEW INMEDIATO - Mostrando imagen original para ${tipo}...`);
      const previewUrl = URL.createObjectURL(file);
      
      const initialState = {
        file: file,
        compressed: previewUrl,
        originalSize: file.size,
        compressedSize: file.size // Temporal: mismo tamaño
      };
      
      setImagenData(initialState);
      console.log(`✅ Preview inmediato mostrado para ${tipo}`);
      
      // 🚀 PASO 2: Comprimir con sistema reutilizable avanzado
      console.log(`📱 COMPRESIÓN AVANZADA - Iniciando para ${tipo}...`);
      
      // 📱 CONFIGURACIÓN ADAPTATIVA PARA MÓVILES
      const mobileConfig = {
        targetSizeKB: isMobile ? 150 : 200,  // Más agresivo en móviles
        maxResolution: isMobile ? 1200 : 1600, // Menor resolución en móviles
        timeout: isMobile ? 20000 : 25000 // Menos tiempo en móviles
      };
      
      console.log(`📱 Configuración para ${tipo}:`, mobileConfig);
      
      const comprimida = await compressImageAdvanced(
        file, 
        mobileConfig,
        (progress: any) => {
          console.log(`📊 Progreso ${tipo}:`, progress);
          setCompressionProgress({
            attempt: progress.attempt,
            currentSize: progress.currentSize,
            targetSize: progress.targetSize,
            quality: progress.quality,
            resolution: progress.resolution,
            status: progress.status || 'compressing'
          });
        }
      );
      
      console.log(`✅ Compresión avanzada completada para ${tipo}:`, `${(comprimida.size / 1024).toFixed(1)} KB`);
      
      // 🚀 PASO 3: Reemplazar con imagen comprimida
      console.log(`🔄 Reemplazando con imagen comprimida para ${tipo}...`);
      
      // Limpiar URL original
      URL.revokeObjectURL(previewUrl);
      
      // Crear nueva URL para imagen comprimida
      const compressedDataURL = URL.createObjectURL(comprimida);
      
      const finalState = {
        file: comprimida,
        compressed: compressedDataURL,
        originalSize: file.size,
        compressedSize: comprimida.size
      };
      
      setImagenData(finalState);
      
      // 🎉 Actualizar estado final de compresión
      setCompressionProgress({
        attempt: 1,
        currentSize: comprimida.size,
        targetSize: comprimida.size,
        quality: 1,
        resolution: 'optimizada',
        status: 'compressed'
      });
      
      console.log(`🎉 ÉXITO COMPLETO - ${tipo}: ${(file.size/1024).toFixed(1)}KB → ${(comprimida.size/1024).toFixed(1)}KB`);
      
    } catch (error) {
      console.error(`❌ ERROR al procesar ${tipo}:`, error);
      
      // Si falla la compresión, mantener la imagen original
      console.log(`🔄 Manteniendo imagen original para ${tipo} debido a error de compresión`);
      
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.warn(`⚠️ Usando imagen original sin comprimir para ${tipo}:`, error.message);
      }
    } finally {
      console.log(`🏁 Finalizando proceso para ${tipo}`);
      setLoading(prev => ({ ...prev, [tipo]: false }));
      setIsCompressing(false);
      // ✨ CORRECCIÓN: No resetear el progreso aquí para que el estado final sea visible
    }
  };

  // Funcion para unir las imagenes manteniendo proporciones
  const unirImagenes = useCallback(async () => {
    if (!imagen1.compressed || !imagen2.compressed) return;

    console.log('📱 Dispositivo móvil detectado:', isMobile);
    console.log('📈 Memoria antes de unir:', (performance as any).memory ? `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB` : 'No disponible');

    // 🧹 LIMPIEZA PREVIA AGRESIVA: Liberar imagen unida anterior
    if (imagenUnida) {
      if (imagenUnida.startsWith('blob:')) {
        console.log('🧹 Liberando blob URL anterior');
        URL.revokeObjectURL(imagenUnida);
      }
      // Limpiar referencia inmediatamente
      setImagenUnida(null);
      
      // 📱 PAUSA PARA MÓVILES: Dar tiempo al GC
      if (isMobile) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let img1: HTMLImageElement | null = null;
    let img2: HTMLImageElement | null = null;

    try {
      canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('❌ No se pudo crear contexto de canvas');
        return;
      }

      img1 = new Image();
      img2 = new Image();

      // 📱 CONFIGURACIÓN PARA MÓVILES
      if (isMobile) {
        img1.crossOrigin = 'anonymous';
        img2.crossOrigin = 'anonymous';
      }

      await Promise.all([
        new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout cargando imagen 1')), 10000);
          img1!.onload = () => { clearTimeout(timeout); resolve(null); };
          img1!.onerror = () => { clearTimeout(timeout); reject(new Error('Error cargando imagen 1')); };
          img1!.src = imagen1.compressed!;
        }),
        new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout cargando imagen 2')), 10000);
          img2!.onload = () => { clearTimeout(timeout); resolve(null); };
          img2!.onerror = () => { clearTimeout(timeout); reject(new Error('Error cargando imagen 2')); };
          img2!.src = imagen2.compressed!;
        })
      ]);

      console.log(`🖼️ Imagen 1: ${img1.width}x${img1.height}`);
      console.log(`🖼️ Imagen 2: ${img2.width}x${img2.height}`);

      // 📱 LIMITACIÓN DE TAMAÑO PARA MÓVILES
      const maxCanvasSize = isMobile ? 2048 : 4096;
      let finalWidth: number, finalHeight: number;

      // Calcular dimensiones del canvas final segun orientacion
      if (orientacion === 'vertical') {
        const maxWidth = Math.max(img1.width, img2.width);
        finalWidth = Math.min(maxWidth, maxCanvasSize);
        finalHeight = Math.min(img1.height + img2.height, maxCanvasSize);
      } else {
        const maxHeight = Math.max(img1.height, img2.height);
        finalWidth = Math.min(img1.width + img2.width, maxCanvasSize);
        finalHeight = Math.min(maxHeight, maxCanvasSize);
      }

      // 📱 VERIFICAR TAMAÑO FINAL
      const totalPixels = finalWidth * finalHeight;
      if (isMobile && totalPixels > 4194304) { // 2048x2048
        console.warn('⚠️ Imagen muy grande para móvil, reduciendo...');
        const scale = Math.sqrt(4194304 / totalPixels);
        finalWidth = Math.floor(finalWidth * scale);
        finalHeight = Math.floor(finalHeight * scale);
      }

      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      console.log(`🎨 Canvas final: ${finalWidth}x${finalHeight}`);

      // Limpiar canvas
      ctx.clearRect(0, 0, finalWidth, finalHeight);
      
      // Calcular escalas si es necesario
      const scaleX = finalWidth / (orientacion === 'vertical' ? Math.max(img1.width, img2.width) : (img1.width + img2.width));
      const scaleY = finalHeight / (orientacion === 'vertical' ? (img1.height + img2.height) : Math.max(img1.height, img2.height));
      const scale = Math.min(scaleX, scaleY, 1); // No agrandar

      if (orientacion === 'vertical') {
        const scaledImg1Width = img1.width * scale;
        const scaledImg1Height = img1.height * scale;
        const scaledImg2Width = img2.width * scale;
        const scaledImg2Height = img2.height * scale;
        
        const x1 = (finalWidth - scaledImg1Width) / 2;
        const x2 = (finalWidth - scaledImg2Width) / 2;
        
        ctx.drawImage(img1, x1, 0, scaledImg1Width, scaledImg1Height);
        ctx.drawImage(img2, x2, scaledImg1Height, scaledImg2Width, scaledImg2Height);
      } else {
        const scaledImg1Width = img1.width * scale;
        const scaledImg1Height = img1.height * scale;
        const scaledImg2Width = img2.width * scale;
        const scaledImg2Height = img2.height * scale;
        
        const y1 = (finalHeight - scaledImg1Height) / 2;
        const y2 = (finalHeight - scaledImg2Height) / 2;
        
        ctx.drawImage(img1, 0, y1, scaledImg1Width, scaledImg1Height);
        ctx.drawImage(img2, scaledImg1Width, y2, scaledImg2Width, scaledImg2Height);
      }

      // 📱 COMPRESIÓN ADAPTATIVA
      const quality = isMobile ? 0.6 : 0.7; // Menor calidad en móviles
      const format = 'image/webp';
      
      console.log(`🗜️ Comprimiendo con calidad ${quality}`);
      
      const imagenUnidaData = canvas.toDataURL(format, quality);
      
      // 📱 VERIFICAR TAMAÑO DEL RESULTADO
      const resultSizeKB = Math.round((imagenUnidaData.length * 3) / 4 / 1024);
      console.log(`📄 Tamaño resultado: ${resultSizeKB}KB`);
      
      if (isMobile && resultSizeKB > 2048) { // Más de 2MB en móvil
        console.warn('⚠️ Resultado muy grande, recomprimiendo...');
        const newQuality = Math.max(0.3, quality * 0.7);
        const recompressed = canvas.toDataURL(format, newQuality);
        setImagenUnida(recompressed);
        console.log(`🔄 Recomprimido con calidad ${newQuality}`);
      } else {
        setImagenUnida(imagenUnidaData);
      }
      
      console.log('✅ Imágenes unidas exitosamente');
      
    } catch (error) {
      console.error('❌ Error al unir imágenes:', error);
      // En caso de error, limpiar todo
      setImagenUnida(null);
    } finally {
      // 🧹 LIMPIEZA AGRESIVA INMEDIATA
      if (img1) {
        img1.onload = null;
        img1.onerror = null;
        img1.src = '';
        img1 = null;
      }
      if (img2) {
        img2.onload = null;
        img2.onerror = null;
        img2.src = '';
        img2 = null;
      }
      if (canvas) {
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
        ctx = null;
      }
      
      // 📱 FORZAR LIMPIEZA EN MÓVILES
      if (isMobile) {
        // Pausa para permitir que el navegador libere memoria
        setTimeout(() => {
          if (typeof window !== 'undefined' && 'gc' in window) {
            try {
              (window as any).gc();
              console.log('🗑️ Garbage collection forzado');
            } catch (e) {
              // Silencioso
            }
          }
        }, 100);
      }
      
      console.log('📈 Memoria después de unir:', (performance as any).memory ? `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB` : 'No disponible');
    }
  }, [imagen1.compressed, imagen2.compressed, orientacion, imagenUnida, isMobile]);

  // Efecto para unir imagenes automaticamente
  useEffect(() => {
    if (imagen1.compressed && imagen2.compressed) {
      unirImagenes();
    }
  }, [imagen1.compressed, imagen2.compressed, orientacion, unirImagenes]);

  // Función optimizada para captura de cámara con menor uso de memoria
  const capturarDesdeCamara = async (tipo: 'img1' | 'img2'): Promise<void> => {
    let input: HTMLInputElement | null = document.createElement('input');
    
    try {
      return await new Promise((resolve, reject) => {
        if (!input) return reject(new Error('No se pudo crear input'));
        
        input.type = 'file';
        input.accept = 'image/*';
        input.setAttribute('capture', 'environment');
        
        // Handler para limpieza
        const cleanUp = () => {
          if (input && input.parentNode) {
            input.parentNode.removeChild(input);
          }
          input = null;
        };
        
        // Manejar selección
        input.onchange = async (e) => {
          try {
            const file = (e.target as HTMLInputElement)?.files?.[0];
            if (!file) {
              cleanUp();
              return resolve();
            }
            
            // Validación rápida de tamaño
            if (file.size > 5 * 1024 * 1024) {
              alert('Imagen demasiado grande (máx. 5MB)');
              cleanUp();
              return resolve();
            }
            
            await manejarArchivoSeleccionado(file, tipo);
            cleanUp();
            resolve();
          } catch (error) {
            cleanUp();
            reject(error);
          }
        };
        
        // Manejar cancelación
        const cancelHandler = () => {
          window.removeEventListener('focus', cancelHandler);
          cleanUp();
          resolve();
        };
        
        window.addEventListener('focus', cancelHandler, { once: true });
        
        // Disparar selección
        document.body.appendChild(input);
        input.click();
      });
    } catch (error) {
      if (input) {
        input.parentNode?.removeChild(input);
      }
      throw error;
    }
  };

  // Guardar imagen
  const guardarImagen = () => {
    if (!imagenUnida) return;

    const link = document.createElement('a');
    link.download = `imagenes-unidas-${Date.now()}.webp`;
    link.href = imagenUnida;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compartir imagen
  const compartirImagen = async () => {
    if (!imagenUnida) return;

    try {
      // Convertir data URL a blob
      const response = await fetch(imagenUnida);
      const blob = await response.blob();
      const file = new File([blob], `imagenes-unidas-${Date.now()}.webp`, { type: 'image/webp' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Imagenes Unidas',
          text: 'Imagen creada con el unificador de imagenes',
          files: [file]
        });
      } else {
        // Fallback: copiar al portapapeles si es posible
        if (navigator.clipboard && 'write' in navigator.clipboard) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/webp': blob })
          ]);
          alert('Imagen copiada al portapapeles');
        } else {
          // Ultimo fallback: descargar
          guardarImagen();
        }
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      alert('No se pudo compartir la imagen');
    }
  };

  // Restablecer imagen
  const restablecerImagen = (tipo: 'img1' | 'img2') => {
    if (tipo === 'img1') {
      // 🧹 LIMPIEZA: Liberar URL de objeto antes de restablecer
      if (imagen1.compressed) {
        revokeImagePreview(imagen1.compressed);
      }
      setImagen1({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
      setCompressionProgress1(null); // ✨ CORRECCIÓN: Limpiar progreso
      if (fileInputRef1.current) fileInputRef1.current.value = '';
    } else {
      // 🧹 LIMPIEZA: Liberar URL de objeto antes de restablecer
      if (imagen2.compressed) {
        revokeImagePreview(imagen2.compressed);
      }
      setImagen2({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
      setCompressionProgress2(null); // ✨ CORRECCIÓN: Limpiar progreso
      if (fileInputRef2.current) fileInputRef2.current.value = '';
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLImageElement>) => {
    e.preventDefault();
    const scaleChange = e.deltaY > 0 ? 1.25 : 0.8;
    const newZoom = Math.max(0.5, Math.min(5, zoom * scaleChange));
    setZoom(newZoom);
  };

  const handleMouseDownImage = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMoveImage = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isDragging) {
      e.preventDefault();
      const img = imgRef.current;
      if (img) {
        const rect = img.getBoundingClientRect();
        const scaledWidth = rect.width * zoom;
        const scaledHeight = rect.height * zoom;
        
        const maxX = (scaledWidth - rect.width) / 2;
        const maxY = (scaledHeight - rect.height) / 2;
        
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        setPosition({
          x: Math.min(Math.max(-maxX, newX), maxX),
          y: Math.min(Math.max(-maxY, newY), maxY)
        });
      }
    }
  };

  const handleMouseUpImage = () => {
    setIsDragging(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalImg(null); // 🧹 Limpiar imagen individual del modal
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // 🧹 Función global para limpiar todos los campos y liberar recursos
  const limpiarCampos = () => {
    console.log('🧹 INICIANDO limpieza completa de campos...');
    
    try {
      // Liberar URLs de objeto de imágenes individuales con manejo de errores
      if (imagen1.compressed) {
        console.log('🧹 Liberando imagen1:', imagen1.compressed.substring(0, 50) + '...');
        revokeImagePreview(imagen1.compressed);
      }
      if (imagen2.compressed) {
        console.log('🧹 Liberando imagen2:', imagen2.compressed.substring(0, 50) + '...');
        revokeImagePreview(imagen2.compressed);
      }

      // Revocar posible blob de la imagen unida
      if (imagenUnida && imagenUnida.startsWith('blob:')) {
        console.log('🧹 Liberando imagen unida:', imagenUnida.substring(0, 50) + '...');
        try {
          URL.revokeObjectURL(imagenUnida);
        } catch (error) {
          console.warn('⚠️ Error revocando imagen unida:', error);
        }
      }

      // Resetear estados de imágenes
      setImagen1({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
      setImagen2({ file: null, compressed: null, originalSize: 0, compressedSize: 0 });
      setImagenUnida(null);

      // Resetear progreso de compresión y controles
      setCompressionProgress1(null);
      setCompressionProgress2(null);
      setIsCompressing1(false);
      setIsCompressing2(false);
      setLoading({ img1: false, img2: false });

      // Resetear zoom, posición y orientación
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setDragStart({ x: 0, y: 0 });
      setOrientacion('vertical');

      // Limpiar inputs de archivo con manejo de errores
      try {
        if (fileInputRef1.current) fileInputRef1.current.value = '';
        if (fileInputRef2.current) fileInputRef2.current.value = '';
      } catch (error) {
        console.warn('⚠️ Error limpiando inputs:', error);
      }

      // Cerrar modal si estuviera abierto y limpiar referencia de imagen
      setModalVisible(false);
      setModalImg(null);

      // 🧹 FORZAR GARBAGE COLLECTION (si está disponible en desarrollo)
      if (typeof window !== 'undefined' && 'gc' in window) {
        try {
          (window as any).gc();
          console.log('🗑️ Garbage collection forzado');
        } catch (error) {
          // Silencioso - gc no siempre está disponible
        }
      }

      console.log('✅ Limpieza completa de campos finalizada exitosamente');
    } catch (error) {
      console.error('❌ Error durante la limpieza de campos:', error);
    }
  };

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{
        background: '#334d50',
        backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
      }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-white hover:text-[#c9a45c] transition-colors duration-300 relative overflow-hidden rounded-xl font-medium px-4 py-2 text-base"
          >
            {/* Efecto de brillo continuo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0cb35]/80 to-transparent animate-[slide_2s_ease-in-out_infinite] z-0"></div>
            <div className="relative z-10">
              <span className="font-medium">Volver</span>
            </div>
          </Link>
          
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
            {/* Efecto de resplandor de fondo */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#c9a45c]/15 via-[#f0c987]/15 to-[#c9a45c]/15 blur-2xl rounded-full transform scale-125"></div>
            
            {/* Título uniforme */}
            <PageTitle size="md">Unir Imágenes</PageTitle>
            
            {/* Línea decorativa animada */}
            <div className="relative mt-4 h-0.5 w-24 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c9a45c] to-transparent rounded-full"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0c987] to-transparent rounded-full animate-pulse"></div>
            </div>
          </div>
          {/* Botón pequeñito para limpiar campos y liberar memoria */}
          <button
            onClick={limpiarCampos}
            className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-xs font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md active:scale-95 absolute right-0 -top-3 sm:static sm:mt-0"
            title="Limpiar campos y memoria"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-xl p-6 border border-[#3d4659]/50">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-gradient-to-r from-[#c9a45c] to-[#f0c987] rounded-full flex items-center justify-center text-[#1a1f35] text-sm font-bold">1</span>
              Imagen 1
            </h3>
            
            {!imagen1.compressed ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => capturarDesdeCamara('img1')}
                    disabled={loading.img1}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.img1 ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                    )}
                    Capturar con camara
                  </button>
                  
                  <button
                    onClick={() => fileInputRef1.current?.click()}
                    disabled={loading.img1}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Elegir archivo
                  </button>
                </div>
                
                <input
                  ref={fileInputRef1}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) manejarArchivoSeleccionado(file, 'img1');
                  }}
                  className="hidden"
                />
                
                <div className="border-2 border-dashed border-[#3d4659] rounded-xl p-8 text-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  <p>No hay imagen seleccionada</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 🖼️ PREVISUALIZACIÓN de la imagen seleccionada */}
                <div className="relative group">
                  <img 
                    src={imagen1.compressed!} 
                    alt="Imagen 1 seleccionada" 
                    className="w-full h-48 object-cover rounded-xl shadow-lg cursor-pointer transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02]"
                    onClick={() => {
                      if (imagen1.compressed) {
                        setModalImg(imagen1.compressed);
                        setModalVisible(true);
                      }
                    }}
                    title="Clic para ver en pantalla completa con zoom"
                  />
                  
                  {/* Overlay de estado */}
                  <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Comprimida
                  </div>
                </div>

                {/* 🚀 INDICADOR DE COMPRESIÓN REUTILIZABLE */}
                <CompressionIndicator
                  status={{
                    status: isCompressing1 ? 'compressing' : (compressionProgress1?.status === 'compressed' ? 'completed' : 'idle'),
                    progress: compressionProgress1?.attempt ? (compressionProgress1.attempt / 10) * 100 : 0,
                    stage: compressionProgress1?.status === 'compressed' ? 'Compresión completada' : 'Comprimiendo...'
                  }}
                  fileSizes={{
                    original: imagen1.originalSize,
                    compressed: imagen1.compressedSize
                  }}
                  fieldName={imagen1.file?.name || 'imagen1'}
                />
                
                <button
                  onClick={() => restablecerImagen('img1')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300"
                >
                  Cambiar imagen
                </button>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-xl p-6 border border-[#3d4659]/50">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-gradient-to-r from-[#c9a45c] to-[#f0c987] rounded-full flex items-center justify-center text-[#1a1f35] text-sm font-bold">2</span>
              Imagen 2
            </h3>
            
            {!imagen2.compressed ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => capturarDesdeCamara('img2')}
                    disabled={loading.img2}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.img2 ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                    )}
                    Capturar con camara
                  </button>
                  
                  <button
                    onClick={() => fileInputRef2.current?.click()}
                    disabled={loading.img2}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Elegir archivo
                  </button>
                </div>
                
                <input
                  ref={fileInputRef2}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) manejarArchivoSeleccionado(file, 'img2');
                  }}
                  className="hidden"
                />
                
                <div className="border-2 border-dashed border-[#3d4659] rounded-xl p-8 text-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  <p>No hay imagen seleccionada</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 🖼️ PREVISUALIZACIÓN de la imagen seleccionada */}
                <div className="relative group">
                  <img 
                    src={imagen2.compressed!} 
                    alt="Imagen 2 seleccionada" 
                    className="w-full h-48 object-cover rounded-xl shadow-lg cursor-pointer transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02]"
                    onClick={() => {
                      if (imagen2.compressed) {
                        setModalImg(imagen2.compressed);
                        setModalVisible(true);
                      }
                    }}
                    title="Clic para ver en pantalla completa con zoom"
                  />
                  
                  {/* Overlay de estado */}
                  <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Comprimida
                  </div>
                </div>

                {/* 🚀 INDICADOR DE COMPRESIÓN REUTILIZABLE */}
                <CompressionIndicator
                  status={{
                    status: isCompressing2 ? 'compressing' : (compressionProgress2?.status === 'compressed' ? 'completed' : 'idle'),
                    progress: compressionProgress2?.attempt ? (compressionProgress2.attempt / 10) * 100 : 0,
                    stage: compressionProgress2?.status === 'compressed' ? 'Compresión completada' : 'Comprimiendo...'
                  }}
                  fileSizes={{
                    original: imagen2.originalSize,
                    compressed: imagen2.compressedSize
                  }}
                  fieldName={imagen2.file?.name || 'imagen2'}
                />
                
                <button
                  onClick={() => restablecerImagen('img2')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300"
                >
                  Cambiar imagen
                </button>
              </div>
            )}
          </div>
        </div>



        {imagenUnida && (
          <div className="bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-xl p-6 border border-[#3d4659]/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#c9a45c]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 713.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 713.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Imagen Unida
              </h3>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setModalVisible(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                  Ver completa
                </button>

                <button
                  onClick={compartirImagen}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  Compartir
                </button>

                <button
                  onClick={guardarImagen}
                  className="px-4 py-2 bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1a1f35] rounded-xl hover:from-[#f0c987] hover:to-[#c9a45c] transition-all duration-300 flex items-center gap-2 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Guardar
                </button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden bg-gray-900/50 p-4">
              <img
                src={imagenUnida}
                alt="Imagenes unidas"
                className="w-full h-auto rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                style={{ maxHeight: '400px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                onClick={() => {
                  setModalImg(imagenUnida);
                  setModalVisible(true);
                }}
                title="Clic para ver en pantalla completa"
              />
              
              {/* Indicador de que es clickeable */}
                            <div className="text-center mt-3">
                <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                    </svg>
                  Clic para ampliar y hacer zoom
                </p>
              </div>
            </div>
            
            {/* Selector de orientación debajo de la imagen unida */}
            <div className="flex flex-col items-center mt-6 mb-4">
              <button
                type="button"
                onClick={() => setOrientacion(orientacion === 'vertical' ? 'horizontal' : 'vertical')}
                style={{
                  background: orientacion === 'vertical'
                    ? 'linear-gradient(90deg, #c9a45c 0%, #f0c987 100%)'
                    : 'linear-gradient(90deg, #42a5f5 0%, #478ed1 100%)',
                  color: orientacion === 'vertical' ? '#1a1f35' : '#fff',
                  border: orientacion === 'vertical' ? '2px solid #ff8c42' : '2px solid #42a5f5',
                  boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10), 0 1.5px 6px 0 rgba(201,164,92,0.10)',
                  borderRadius: '1.5rem',
                  padding: '0.85rem 2.5rem',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
                  outline: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  position: 'relative',
                  marginBottom: '0.5rem',
                  boxSizing: 'border-box',
                  userSelect: 'none',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.045)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                aria-pressed={orientacion === 'vertical' ? 'true' : 'false'}
              >
                {orientacion === 'vertical' ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff8c42" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.5rem'}}>
                    <rect x="7" y="3" width="10" height="18" rx="3" fill="#fff"/>
                    <path d="M12 7v10" stroke="#ff8c42" strokeWidth="2.2"/>
                    <circle cx="12" cy="12" r="2.5" fill="#ff8c42"/>
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.5rem'}}>
                    <rect x="3" y="7" width="18" height="10" rx="3" fill="#42a5f5"/>
                    <path d="M7 12h10" stroke="#fff" strokeWidth="2.2"/>
                    <circle cx="12" cy="12" r="2.5" fill="#fff"/>
                  </svg>
                )}
                {orientacion === 'vertical' ? 'Modo Vertical' : 'Modo Horizontal'}
                <span style={{
                  display: 'block',
                  fontWeight: 400,
                  fontSize: '0.95rem',
                  color: orientacion === 'vertical' ? '#1a1f35' : '#e3f2fd',
                  marginLeft: '0.5rem',
                  opacity: 0.85
                }}>
                  {orientacion === 'vertical'
                    ? 'Las imágenes se unirán una debajo de la otra'
                    : 'Las imágenes se unirán una al lado de la otra'}
                </span>
              </button>
            </div>
        </div>
      )}

      {/* Modal de imagen reutilizable */}
      <ImageModal
        isOpen={modalVisible && !!modalImg}
        imageUrl={modalImg}
        onClose={() => {
          setModalVisible(false);
          setModalImg(null);
          setZoom(1);
          setPosition({ x: 0, y: 0 });
        }}
      />

      <canvas ref={canvasRef} className="hidden" />
    </div>
  </main>
);
}
