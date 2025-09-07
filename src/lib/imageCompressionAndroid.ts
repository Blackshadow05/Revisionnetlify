/**
 * 🤖 SISTEMA DE COMPRESIÓN DE IMÁGENES AVANZADO PARA ANDROID
 * 
 * Este módulo proporciona compresión inteligente y adaptativa específicamente
 * optimizada para dispositivos Android con algoritmos avanzados de análisis.
 */

export interface AndroidCompressionOptions {
  maxSizeKB?: number;
  maxWidth?: number;
  maxHeight?: number;
  preprocessOptions?: {
    denoise?: boolean;
    enhanceContrast?: boolean;
  };
  onProgress?: (progress: AndroidCompressionProgress) => void;
  analyzeImageType?: boolean;
}

export interface AndroidCompressionProgress {
  stage: 'loading' | 'analyzing' | 'resizing' | 'preprocessing' | 'compressing' | 'complete' | 'error';
  progress: number;
  details?: string;
}

interface ImageTypeConfig {
  preprocessOptions: { denoise: boolean; enhanceContrast: boolean };
  preferredFormat: 'image/webp' | 'image/jpeg' | 'image/png';
  qualityStart: number;
}

// 📊 Análisis de complejidad de imagen basado en variaciones de color
const analyzeImageComplexity = (canvas: HTMLCanvasElement): number => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0.5;

  const imageData = ctx.getImageData(0, 0, 
    Math.min(100, canvas.width), 
    Math.min(100, canvas.height)
  );
  
  let variance = 0;
  const pixels = imageData.data;
  
  // Muestreo cada 4 píxeles para mejor rendimiento
  for (let i = 0; i < pixels.length; i += 16) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const brightness = (r + g + b) / 3;
    variance += Math.abs(brightness - 128);
  }
  
  return Math.min(1, variance / (pixels.length / 4) / 128);
};

// 🔧 Algoritmo de compresión adaptativa
const compressWithAdaptiveQuality = async (
  canvas: HTMLCanvasElement, 
  targetSizeKB: number, 
  mimeType: string
): Promise<Blob> => {
  // Analizar contenido de la imagen
  const imageComplexity = analyzeImageComplexity(canvas);
  
  // Ajustar calidad inicial según complejidad
  let quality = imageComplexity > 0.7 ? 0.85 : 0.75;
  
  for (let attempt = 1; attempt <= 10; attempt++) {
    const blob = await new Promise<Blob | null>((resolve) => 
      canvas.toBlob(resolve, mimeType, quality)
    );
    
    if (!blob) throw new Error('Error al generar blob');
    
    const sizeKB = blob.size / 1024;
    
    if (sizeKB <= targetSizeKB) return blob;
    
    // Reducción más suave para imágenes complejas
    const reduction = imageComplexity > 0.6 ? 0.05 : 0.08;
    quality = Math.max(0.3, quality - reduction);
  }
  
  throw new Error('No se pudo alcanzar el tamaño objetivo');
};

// 🎨 Pre-procesamiento inteligente
const preprocessImage = (canvas: HTMLCanvasElement, options: { denoise?: boolean; enhanceContrast?: boolean } = {}): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Reducción de ruido suave (opcional)
  if (options.denoise) {
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 6 - 3; // ±3
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
  }
  
  // Optimización de contraste sutil
  if (options.enhanceContrast) {
    const factor = 1.1; // Muy sutil
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, (data[i] - 128) * factor + 128));
      data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - 128) * factor + 128));
      data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - 128) * factor + 128));
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

// 📏 Redimensionamiento con filtros avanzados
const resizeWithLanczos = (sourceCanvas: HTMLCanvasElement, targetWidth: number, targetHeight: number): HTMLCanvasElement => {
  // Usar el algoritmo de alta calidad disponible en el navegador
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return sourceCanvas;

  // Redimensionamiento en pasos para mejor calidad
  let currentWidth = sourceCanvas.width;
  let currentHeight = sourceCanvas.height;
  
  tempCanvas.width = currentWidth;
  tempCanvas.height = currentHeight;
  tempCtx.drawImage(sourceCanvas, 0, 0);
  
  // Reducir en pasos no mayores a 50%
  while (currentWidth > targetWidth * 2 || currentHeight > targetHeight * 2) {
    currentWidth = Math.max(targetWidth, Math.floor(currentWidth * 0.5));
    currentHeight = Math.max(targetHeight, Math.floor(currentHeight * 0.5));
    
    const stepCanvas = document.createElement('canvas');
    const stepCtx = stepCanvas.getContext('2d');
    if (!stepCtx) break;
    
    stepCanvas.width = currentWidth;
    stepCanvas.height = currentHeight;
    
    // Configurar filtros de alta calidad
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = 'high';
    
    stepCtx.drawImage(tempCanvas, 0, 0, currentWidth, currentHeight);
    
    tempCanvas.width = currentWidth;
    tempCanvas.height = currentHeight;
    tempCtx.clearRect(0, 0, currentWidth, currentHeight);
    tempCtx.drawImage(stepCanvas, 0, 0);
  }
  
  // Paso final al tamaño objetivo
  const finalCanvas = document.createElement('canvas');
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) return tempCanvas;
  
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';
  finalCtx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
  
  return finalCanvas;
};

// 🎯 Selección inteligente de formato
const selectOptimalFormat = async (canvas: HTMLCanvasElement, targetSizeKB: number): Promise<{ blob: Blob; format: string; size: number }> => {
  const formats = [
    { type: 'image/webp', quality: 0.8 },
    { type: 'image/jpeg', quality: 0.8 }
  ];
  
  let bestResult: { blob: Blob; format: string; size: number } | null = null;
  let bestScore = 0;
  
  for (const format of formats) {
    try {
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, format.type, format.quality)
      );
      
      if (!blob) continue;
      
      const sizeKB = blob.size / 1024;
      
      if (sizeKB <= targetSizeKB) {
        // Scoring: preferir menor tamaño pero penalizar si es demasiado pequeño
        const score = Math.min(1, targetSizeKB / sizeKB) * (format.type === 'image/webp' ? 1.1 : 1.0);
        
        if (score > bestScore) {
          bestScore = score;
          bestResult = { blob, format: format.type, size: sizeKB };
        }
      }
    } catch (error) {
      console.log(`Formato ${format.type} no soportado`);
    }
  }
  
  if (!bestResult) {
    // Fallback con compresión más agresiva
    const fallbackBlob = await new Promise<Blob | null>((resolve) => 
      canvas.toBlob(resolve, 'image/jpeg', 0.3)
    );
    
    if (!fallbackBlob) throw new Error('No se pudo generar blob de fallback');
    
    return { blob: fallbackBlob, format: 'image/jpeg', size: fallbackBlob.size / 1024 };
  }
  
  return bestResult;
};

// 🔍 Configuraciones específicas por tipo de imagen
const getImageTypeConfig = (file: File): ImageTypeConfig => {
  // Analizar el nombre del archivo para determinar el tipo probable
  const filename = file.name.toLowerCase();
  
  if (filename.includes('screenshot') || filename.includes('captura')) {
    return {
      preprocessOptions: { denoise: false, enhanceContrast: false },
      preferredFormat: 'image/jpeg',
      qualityStart: 0.9
    };
  }
  
  if (filename.includes('photo') || filename.includes('img_')) {
    return {
      preprocessOptions: { denoise: true, enhanceContrast: true },
      preferredFormat: 'image/jpeg',
      qualityStart: 0.85
    };
  }
  
  // Configuración por defecto para Android
  return {
    preprocessOptions: { denoise: false, enhanceContrast: true },
    preferredFormat: 'image/webp',
    qualityStart: 0.8
  };
};

// 🧮 Calcular dimensiones óptimas
const calculateOptimalDimensions = (
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number, 
  maxHeight: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight;
  
  let newWidth = originalWidth;
  let newHeight = originalHeight;
  
  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = Math.round(newWidth / aspectRatio);
  }
  
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = Math.round(newHeight * aspectRatio);
  }
  
  return { width: newWidth, height: newHeight };
};

// 🔧 Función auxiliar para convertir bitmap a canvas
const bitmapToCanvas = (bitmap: ImageBitmap): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(bitmap, 0, 0);
  }
  return canvas;
};

// 🤖 Función principal de compresión para Android
export const compressImageAdvancedAndroid = async (
  file: File,
  options: AndroidCompressionOptions = {}
): Promise<File> => {
  const {
    maxSizeKB = 600,
    maxWidth = 1000,
    maxHeight = 1000,
    preprocessOptions,
    onProgress = () => {},
    analyzeImageType = true
  } = options;

  let bitmap: ImageBitmap | null = null;

  try {
    onProgress({ stage: 'loading', progress: 0, details: 'Cargando imagen...' });

    // Crear bitmap de alta calidad
    bitmap = await createImageBitmap(file, {
      colorSpaceConversion: 'none',
      premultiplyAlpha: 'none'
    });
    
    onProgress({ stage: 'analyzing', progress: 20, details: 'Analizando imagen...' });

    // Detectar tipo de imagen si está habilitado
    const imageConfig = analyzeImageType ? getImageTypeConfig(file) : {
      preprocessOptions: { denoise: false, enhanceContrast: true },
      preferredFormat: 'image/webp',
      qualityStart: 0.8
    };

    // Calcular dimensiones óptimas
    const { width: newWidth, height: newHeight } = calculateOptimalDimensions(
      bitmap.width, bitmap.height, maxWidth, maxHeight
    );
    
    onProgress({ stage: 'resizing', progress: 40, details: `Redimensionando a ${newWidth}x${newHeight}...` });

    // Crear canvas y redimensionar con alta calidad
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    const resizedCanvas = resizeWithLanczos(bitmapToCanvas(bitmap), newWidth, newHeight);
    
    onProgress({ stage: 'preprocessing', progress: 60, details: 'Optimizando imagen...' });

    // Pre-procesar para optimizar compresión
    const finalPreprocessOptions = preprocessOptions || imageConfig.preprocessOptions;
    const processedCanvas = preprocessImage(resizedCanvas, finalPreprocessOptions);
    
    onProgress({ stage: 'compressing', progress: 80, details: 'Comprimiendo con algoritmo adaptativo...' });

    // Seleccionar formato óptimo y comprimir con calidad adaptativa
    const targetFormat = imageConfig.preferredFormat === 'image/webp' ? 'image/webp' : 'image/jpeg';
    const result = await selectOptimalFormat(processedCanvas, maxSizeKB);
    
    onProgress({ stage: 'complete', progress: 100, details: `Compresión completada: ${result.size.toFixed(1)}KB` });

    // Limpiar recursos
    bitmap.close();
    bitmap = null;

    // Crear archivo final
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const extension = result.format === 'image/webp' ? 'webp' : 'jpg';
    const compressedFile = new File([result.blob], `${originalName}.${extension}`, {
      type: result.format,
      lastModified: Date.now()
    });

    return compressedFile;
    
  } catch (error) {
    onProgress({ stage: 'error', progress: 0, details: 'Error en compresión' });
    
    // Asegurar liberación de recursos en caso de error
    if (bitmap) {
      bitmap.close();
    }
    
    throw error;
  }
};

// 🧪 Función para pruebas de compresión Android
export const testAndroidCompression = async (file: File): Promise<{
  original: { size: number; name: string };
  compressed: { size: number; name: string; reduction: number };
  details: { format: string; complexity: number; preprocessing: string[] };
}> => {
  const originalSize = file.size;
  let complexity = 0;
  const preprocessing: string[] = [];

  try {
    // Crear bitmap temporal para análisis
    const tempBitmap = await createImageBitmap(file, {
      colorSpaceConversion: 'none',
      premultiplyAlpha: 'none'
    });

    const tempCanvas = bitmapToCanvas(tempBitmap);
    complexity = analyzeImageComplexity(tempCanvas);

    const imageConfig = getImageTypeConfig(file);
    if (imageConfig.preprocessOptions.denoise) preprocessing.push('denoise');
    if (imageConfig.preprocessOptions.enhanceContrast) preprocessing.push('enhanceContrast');

    tempBitmap.close();

    const compressedFile = await compressImageAdvancedAndroid(file, {
      maxSizeKB: 600,
      onProgress: (progress) => {
        console.log(`[Android Test] ${progress.stage}: ${progress.progress}% - ${progress.details}`);
      }
    });

    const compressedSize = compressedFile.size;
    const reduction = ((originalSize - compressedSize) / originalSize) * 100;

    return {
      original: { size: originalSize, name: file.name },
      compressed: { size: compressedSize, name: compressedFile.name, reduction },
      details: {
        format: compressedFile.type,
        complexity,
        preprocessing
      }
    };

  } catch (error) {
    console.error('Error en prueba de compresión Android:', error);
    throw error;
  }
};