/**
 * 🚀 SISTEMA DE COMPRESIÓN DE IMÁGENES AVANZADO
 * 
 * Este módulo proporciona funciones reutilizables para compresión de imágenes
 * optimizadas para dispositivos móviles y conexiones lentas.
 */

// 📱 Detección de dispositivo móvil
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// ⚙️ Configuración de compresión por dispositivo
export interface CompressionConfig {
  targetSizeKB: number;
  maxResolution: number;
  minQuality: number;
  maxQuality: number;
  maxAttempts: number;
  timeout: number;
  format: 'webp' | 'jpeg';
}

export const getCompressionConfig = (customConfig?: Partial<CompressionConfig>): CompressionConfig => {
  const isMobile = isMobileDevice();
  const defaultConfig: CompressionConfig = {
    targetSizeKB: isMobile ? 200 : 250,
    maxResolution: isMobile ? 1400 : 1600,
    minQuality: 0.50,
    maxQuality: 0.85,
    maxAttempts: 5,
    timeout: isMobile ? 25000 : 20000,
    format: 'webp'
  };
  return { ...defaultConfig, ...customConfig };
};

/**
 * Función de compresión básica. Usa un ancho máximo fijo y calidad estándar.
 * Es menos eficiente en memoria que la versión avanzada.
 */
export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Error al cargar la imagen."));
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxWidth = 1200;
      let { width, height } = img;

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        return reject(new Error('No se pudo obtener el contexto del canvas'));
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (!blob) {
          return reject(new Error('Error al comprimir la imagen'));
        }
        const originalName = file.name.replace(/\.[^/.]+$/, '');
        const webpName = `${originalName}.webp`;
        const compressedFile = new File([blob], webpName, {
          type: 'image/webp',
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      }, 'image/webp', 0.70);
    };
  });
};

/**
 * 🎯 Función principal de compresión avanzada y eficiente en memoria.
 * Utiliza createImageBitmap para redimensionar imágenes grandes antes de cargarlas
 * en un canvas, previniendo el consumo excesivo de RAM en móviles.
 */
export const compressImageAdvanced = (
  file: File,
  customConfig?: Partial<CompressionConfig>,
  onProgress?: (progress: {
    attempt: number;
    currentSize: number;
    targetSize: number;
    quality: number;
    resolution: string;
    status: 'compressing' | 'compressed' | 'timeout' | 'error' | 'pre-processing';
  }) => void
): Promise<File> => {
  const config = getCompressionConfig(customConfig);
  const targetSizeBytes = config.targetSizeKB * 1024;

  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      onProgress?.({ attempt: config.maxAttempts, currentSize: file.size, targetSize: targetSizeBytes, quality: 0, resolution: 'N/A', status: 'timeout' });
      reject(new Error(`La compresión excedió el tiempo límite de ${config.timeout / 1000}s`));
    }, config.timeout);

    let imageBitmap: ImageBitmap | null = null;

    try {
      onProgress?.({ attempt: 0, currentSize: file.size, targetSize: targetSizeBytes, quality: 1, resolution: 'N/A', status: 'pre-processing' });

      // 1. Redimensionar eficientemente con createImageBitmap
      imageBitmap = await createImageBitmap(file);
      let { width, height } = imageBitmap;

      // Calcular nuevas dimensiones si exceden el máximo
      if (width > config.maxResolution) {
        const ratio = config.maxResolution / width;
        height = Math.round(height * ratio);
        width = config.maxResolution;
      }

      // Crear nuevo bitmap redimensionado
      const resizedBitmap = await createImageBitmap(imageBitmap, {
        sx: 0,
        sy: 0,
        sw: imageBitmap.width,
        sh: imageBitmap.height,
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: 'high'
      } as any); // TypeScript workaround
      
      // Liberar el bitmap original inmediatamente
      imageBitmap.close();
      imageBitmap = resizedBitmap;

      // 2. Preparar el canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No se pudo obtener el contexto del canvas');
      }

      // Dibujar el bitmap redimensionado
      ctx.drawImage(imageBitmap, 0, 0, width, height);
      
      // 3. Liberar recursos del bitmap redimensionado
      imageBitmap.close();
      imageBitmap = null;

      // 4. Bucle de compresión iterativa
      let currentQuality = config.maxQuality;
      let attempt = 1;
      let bestResult: File | null = null;

      while (attempt <= config.maxAttempts) {
        const blob = await new Promise<Blob | null>((resolve) => 
          canvas.toBlob(resolve, `image/${config.format}`, currentQuality)
        );

        if (!blob) {
          throw new Error('Error al generar el blob de imagen');
        }

        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.' + config.format, {
          type: `image/${config.format}`
        });

        onProgress?.({ 
          attempt,
          currentSize: compressedFile.size,
          targetSize: targetSizeBytes,
          quality: currentQuality,
          resolution: `${width}x${height}`,
          status: 'compressing'
        });

        // Verificar si cumple con el tamaño objetivo
        if (compressedFile.size <= targetSizeBytes) {
          bestResult = compressedFile;
          break;
        }

        // Reducir calidad para el siguiente intento
        currentQuality = Math.max(
          config.minQuality, 
          currentQuality - 0.1
        );
        
        attempt++;
      }

      if (bestResult) {
        onProgress?.({ 
          attempt: attempt - 1, 
          currentSize: bestResult.size, 
          targetSize: targetSizeBytes, 
          quality: currentQuality, 
          resolution: `${width}x${height}`, 
          status: 'compressed'
        });
        resolve(bestResult);
      } else {
        throw new Error('No se pudo comprimir la imagen al tamaño objetivo');
      }
    } catch (error) {
      onProgress?.({ 
        attempt: 0, 
        currentSize: file.size, 
        targetSize: targetSizeBytes, 
        quality: 0, 
        resolution: 'N/A', 
        status: 'error'
      });
      reject(error);
    } finally {
      clearTimeout(timeoutId);
      // Asegurar liberación de recursos en caso de error
      if (imageBitmap) {
        imageBitmap.close();
      }
    }
  });
};

/**
 * 🎨 Función helper para preview de imagen comprimida
 */
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

/**
 * 🧹 Función para limpiar URLs de preview
 */
export const revokeImagePreview = (url: string): void => {
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.warn('⚠️ Error revocando URL:', error);
  }
}; 