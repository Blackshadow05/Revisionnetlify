/**
 * 🚀 SISTEMA DE COMPRESIÓN DE IMÁGENES AVANZADO
 * 
 * Este módulo proporciona funciones reutilizables para compresión de imágenes
 * optimizadas para dispositivos móviles y conexiones lentas.
 * 
 * FUNCIONES PRINCIPALES:
 * 
 * 1. compressImage() - Función básica de compresión (compatibilidad)
 * 2. compressImageAdvanced() - Función avanzada con timeouts, reintentos y progreso
 * 3. createImagePreview() - Crear URL de preview para imágenes
 * 4. revokeImagePreview() - Limpiar URLs de preview (gestión de memoria)
 * 
 * EJEMPLO DE USO BÁSICO:
 * 
 * ```typescript
 * import { compressImageAdvanced } from '@/lib/imageUtils';
 * 
 * const handleFileUpload = async (file: File) => {
 *   try {
 *     const compressedFile = await compressImageAdvanced(file);
 *     console.log('Compresión exitosa:', compressedFile);
 *   } catch (error) {
 *     console.error('Error en compresión:', error);
 *   }
 * };
 * ```
 * 
 * EJEMPLO CON CONFIGURACIÓN PERSONALIZADA:
 * 
 * ```typescript
 * const customConfig = {
 *   targetSizeKB: 150,      // Objetivo de 150KB
 *   maxResolution: 1200,    // Máximo 1200px
 *   maxQuality: 0.80,       // Calidad máxima 80%
 *   timeout: 20000          // 20 segundos timeout
 * };
 * 
 * const compressedFile = await compressImageAdvanced(file, customConfig);
 * ```
 * 
 * EJEMPLO CON CALLBACK DE PROGRESO:
 * 
 * ```typescript
 * const onProgress = (progress) => {
 *   console.log(`Intento ${progress.attempt}: ${progress.currentSize / 1024}KB`);
 *   // Actualizar UI con progreso
 * };
 * 
 * const compressedFile = await compressImageAdvanced(file, {}, onProgress);
 * ```
 * 
 * CONFIGURACIÓN POR DISPOSITIVO:
 * - Móviles: Objetivo 200KB, resolución 1400px, timeout 25s
 * - Desktop: Objetivo 250KB, resolución 1600px, timeout 20s
 * 
 * FORMATOS SOPORTADOS:
 * - Entrada: JPG, PNG, WebP, cualquier formato de imagen válido
 * - Salida: WebP (recomendado) o JPEG
 * 
 * MANEJO DE ERRORES:
 * - Timeout: La compresión tardó más del tiempo límite
 * - Load Error: No se pudo cargar la imagen
 * - Compression Error: Error durante el proceso de compresión
 * 
 * GESTIÓN DE MEMORIA:
 * - Usar createImagePreview() para mostrar previews
 * - Llamar revokeImagePreview() para limpiar URLs cuando no se necesiten
 * - Las funciones manejan automáticamente la limpieza interna
 */

export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Mantener proporción original, limitando el ancho máximo a 1920px (configuración estándar)
      const maxWidth = 1200;
      let { width, height } = img;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        // Configurar contexto para mejor calidad (configuración estándar)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Dibujar imagen manteniendo su proporción original
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a blob WebP con calidad 70% (configuración estándar)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Error al comprimir la imagen'));
            return;
          }
          
          // Crear nombre con extensión .webp
          const originalName = file.name.replace(/\.[^/.]+$/, '');
          const webpName = `${originalName}.webp`;
          
          const compressedFile = new File([blob], webpName, {
            type: 'image/webp',
            lastModified: Date.now()
          });
          
          resolve(compressedFile);
        }, 'image/webp', 0.70); // Calidad 70% - configuración estándar
      } else {
        reject(new Error('No se pudo obtener el contexto del canvas'));
      }
    };
    
    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = URL.createObjectURL(file);
  });
};

// 🚀 ===== NUEVA FUNCIÓN DE COMPRESIÓN AVANZADA REUTILIZABLE =====

// 📱 Detección de dispositivo móvil
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

// ⚙️ Configuración de compresión por dispositivo
interface CompressionConfig {
  targetSizeKB: number;
  maxResolution: number;
  minQuality: number;
  maxQuality: number;
  maxAttempts: number;
  timeout: number;
  format: 'webp' | 'jpeg';
}

const getCompressionConfig = (customConfig?: Partial<CompressionConfig>): CompressionConfig => {
  const isMobile = isMobileDevice();
  
  const defaultConfig: CompressionConfig = {
    targetSizeKB: isMobile ? 200 : 250,        // Objetivo de tamaño
    maxResolution: isMobile ? 1400 : 1600,     // Resolución máxima
    minQuality: 0.35,                          // Calidad mínima (35%)
    maxQuality: isMobile ? 0.80 : 0.85,        // Calidad máxima
    maxAttempts: isMobile ? 8 : 10,            // Intentos máximos
    timeout: isMobile ? 25000 : 20000,         // Timeout en ms
    format: 'webp'                             // Formato de salida
  };

  return { ...defaultConfig, ...customConfig };
};

// 🎯 Función principal de compresión avanzada
export const compressImageAdvanced = async (
  file: File, 
  customConfig?: Partial<CompressionConfig>,
  onProgress?: (progress: { 
    attempt: number; 
    currentSize: number; 
    targetSize: number; 
    quality: number;
    resolution: string;
    status: 'compressing' | 'compressed' | 'timeout' | 'error';
  }) => void
): Promise<File> => {
  const config = getCompressionConfig(customConfig);
  const targetSizeBytes = config.targetSizeKB * 1024;
  
  console.log('🚀 Iniciando compresión avanzada:', {
    archivo: file.name,
    tamaño_original: `${(file.size / 1024).toFixed(1)}KB`,
    objetivo: `${config.targetSizeKB}KB`,
    dispositivo_móvil: isMobileDevice(),
    config
  });

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // ⏱️ Timeout para evitar bloqueos
    const timeoutId = setTimeout(() => {
      onProgress?.({
        attempt: 0,
        currentSize: file.size,
        targetSize: targetSizeBytes,
        quality: 0,
        resolution: 'N/A',
        status: 'timeout'
      });
      reject(new Error(`Timeout: La compresión tardó más de ${config.timeout / 1000}s`));
    }, config.timeout);

    img.onload = async () => {
      try {
        if (!ctx) {
          throw new Error('No se pudo obtener el contexto del canvas');
        }

        // 📐 Calcular dimensiones optimizadas
        let { width, height } = img;
        const aspectRatio = width / height;
        
        if (width > config.maxResolution) {
          width = config.maxResolution;
          height = width / aspectRatio;
        }
        
        if (height > config.maxResolution) {
          height = config.maxResolution;
          width = height * aspectRatio;
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        // 🎨 Configurar contexto para máxima calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 🔄 Algoritmo iterativo de compresión
        let currentQuality = config.maxQuality;
        let attempt = 1;
        let bestResult: { file: File; size: number } | null = null;

        const attemptCompression = async (quality: number): Promise<File> => {
          return new Promise((resolveBlob) => {
            canvas.toBlob((blob) => {
              if (!blob) {
                throw new Error('Error generando blob en la compresión');
              }

              const originalName = file.name.replace(/\.[^/.]+$/, '');
              const extension = config.format === 'webp' ? '.webp' : '.jpg';
              const compressedFile = new File([blob], `${originalName}${extension}`, {
                type: `image/${config.format}`,
                lastModified: Date.now()
              });

              resolveBlob(compressedFile);
            }, `image/${config.format}`, quality);
          });
        };

        // 🎯 Bucle de optimización
        while (attempt <= config.maxAttempts && currentQuality >= config.minQuality) {
          const compressedFile = await attemptCompression(currentQuality);
          const currentSize = compressedFile.size;

          console.log(`📊 Intento ${attempt}/${config.maxAttempts}:`, {
            calidad: `${Math.round(currentQuality * 100)}%`,
            tamaño: `${(currentSize / 1024).toFixed(1)}KB`,
            objetivo: `${config.targetSizeKB}KB`,
            resolución: `${canvas.width}x${canvas.height}`,
            diferencia: `${((currentSize - targetSizeBytes) / 1024).toFixed(1)}KB`
          });

          // 📈 Callback de progreso
          onProgress?.({
            attempt,
            currentSize,
            targetSize: targetSizeBytes,
            quality: currentQuality,
            resolution: `${canvas.width}x${canvas.height}`,
            status: 'compressing'
          });

          // ✅ Guardar el mejor resultado hasta ahora
          if (!bestResult || currentSize < bestResult.size) {
            bestResult = { file: compressedFile, size: currentSize };
          }

          // 🎯 ¿Alcanzamos el objetivo?
          if (currentSize <= targetSizeBytes) {
            console.log(`✅ ¡Objetivo alcanzado en ${attempt} intentos!`);
            onProgress?.({
              attempt,
              currentSize,
              targetSize: targetSizeBytes,
              quality: currentQuality,
              resolution: `${canvas.width}x${canvas.height}`,
              status: 'compressed'
            });
            
            clearTimeout(timeoutId);
            resolve(compressedFile);
            return;
          }

          // 📉 Ajustar calidad para el siguiente intento
          const sizeRatio = currentSize / targetSizeBytes;
          const qualityReduction = Math.min(0.15, sizeRatio * 0.1);
          currentQuality = Math.max(config.minQuality, currentQuality - qualityReduction);
          attempt++;
        }

        // 🏁 Si no alcanzamos el objetivo, usar el mejor resultado
        if (bestResult) {
          console.log(`⚠️ No se alcanzó el objetivo exacto. Usando mejor resultado:`, {
            tamaño_final: `${(bestResult.size / 1024).toFixed(1)}KB`,
            objetivo: `${config.targetSizeKB}KB`,
            intentos_usados: attempt - 1
          });

          onProgress?.({
            attempt: attempt - 1,
            currentSize: bestResult.size,
            targetSize: targetSizeBytes,
            quality: currentQuality,
            resolution: `${canvas.width}x${canvas.height}`,
            status: 'compressed'
          });

          clearTimeout(timeoutId);
          resolve(bestResult.file);
        } else {
          throw new Error('No se pudo generar ninguna compresión válida');
        }

      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Error en compresión avanzada:', error);
        onProgress?.({
          attempt: 0,
          currentSize: file.size,
          targetSize: targetSizeBytes,
          quality: 0,
          resolution: 'N/A',
          status: 'error'
        });
        reject(error);
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      const error = new Error('Error al cargar la imagen para compresión');
      console.error('❌', error);
      onProgress?.({
        attempt: 0,
        currentSize: file.size,
        targetSize: targetSizeBytes,
        quality: 0,
        resolution: 'N/A',
        status: 'error'
      });
      reject(error);
    };

    img.src = URL.createObjectURL(file);
  });
};

// 🎨 Función helper para preview de imagen comprimida
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      resolve(url);
    } catch (error) {
      reject(error);
    }
  });
};

// 🧹 Función para limpiar URLs de preview
export const revokeImagePreview = (url: string): void => {
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.warn('⚠️ Error revocando URL:', error);
  }
}; 