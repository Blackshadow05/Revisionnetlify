import { getWeek } from 'date-fns';

export const uploadToCloudinary = async (file: File, customFolder?: string): Promise<string> => {
  let folder: string;
  
  if (customFolder) {
    folder = customFolder;
  } else {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const week = `semana_${getWeek(now, { weekStartsOn: 1 })}`;
    folder = `prueba-imagenes/${month}/${week}`;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default');
  formData.append('cloud_name', 'dhd61lan4');
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dhd61lan4/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Error al subir la imagen a Cloudinary');
    }

    const data = await response.json();
    
    // Extraer solo la ruta relativa (carpeta + nombre de archivo)
    // La URL tiene formato: https://res.cloudinary.com/cloud_name/image/upload/vTIMESTAMP/folder/file.ext
    // Queremos devolver: folder/file.ext
    const originalUrl = data.secure_url;
    const urlParts = originalUrl.split('/image/upload/');
    
    if (urlParts.length >= 2) {
      // Extraer la parte después de /image/upload/
      const pathWithTimestamp = urlParts[1];
      // Remover el timestamp (vXXXXXXXXXX/) para obtener la ruta relativa limpia
      const relativePath = pathWithTimestamp.replace(/^v\d+\//, '');
      return relativePath;
    }
    
    // Fallback: devolver la URL completa si no se puede procesar
    return originalUrl;
  } catch (error) {
    console.error('Error en uploadToCloudinary:', error);
    throw error;
  }
};

/**
 * Función específica para subir notas a la carpeta "notas"
 * @param file - Archivo a subir
 * @returns URL optimizada de Cloudinary
 */
export const uploadNotaToCloudinary = async (file: File): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const folder = `notas/${year}/${month}`;

  return uploadToCloudinary(file, folder);
};

/**
 * Función específica para subir evidencias a la carpeta "Evidencias"
 * @param file - Archivo a subir
 * @param fieldName - Nombre del campo (evidencia_01, evidencia_02, evidencia_03)
 * @returns Ruta relativa en formato: Evidencias/Mes Año/evidencia_N_timestamp
 */
export const uploadEvidenciaToCloudinary = async (file: File, fieldName?: string): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  
  // Array con nombres de meses en español
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const mesNombre = meses[now.getMonth()];
  const folder = `Evidencias/${mesNombre} ${year}`;
  
  // Generar nombre personalizado usando el nombre del campo
  const timestamp = Date.now();
  const customFileName = `evidencia_${fieldName ? fieldName.replace('evidencia_', '') : '1'}_${timestamp}`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default');
  formData.append('cloud_name', 'dhd61lan4');
  formData.append('folder', folder);
  formData.append('public_id', customFileName);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dhd61lan4/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Error al subir la imagen a Cloudinary');
    }

    const data = await response.json();
    
    // Devolver ruta relativa en el formato deseado
    return `${folder}/${customFileName}`;
  } catch (error) {
    console.error('Error en uploadEvidenciaToCloudinary:', error);
    throw error;
  }
};

/**
 * Optimiza una URL de Cloudinary existente agregando f_auto,q_auto
 * @param url - URL de Cloudinary sin optimizaciones
 * @returns URL optimizada con f_auto,q_auto
 */
export const optimizeCloudinaryUrl = (url: string): string => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }
  
  // Si ya tiene optimizaciones, no las duplicamos
  if (url.includes('f_auto') || url.includes('q_auto')) {
    return url;
  }
  
  // Agregar f_auto,q_auto después de /upload/
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
};

/**
 * Convierte una URL de Cloudinary optimizada de vuelta a la original
 * @param url - URL de Cloudinary optimizada
 * @returns URL original sin optimizaciones
 */
export const getOriginalCloudinaryUrl = (url: string): string => {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }
  
  // Remover f_auto,q_auto y otras transformaciones comunes
  return url.replace(/\/upload\/[^/]*\//, '/upload/');
};

/**
 * Genera una URL de Cloudinary optimizada para miniaturas con dimensiones específicas
 * @param url - URL original de Cloudinary
 * @param width - Ancho deseado en píxeles
 * @param height - Alto deseado en píxeles (opcional)
 * @returns URL optimizada con dimensiones y compresión automática
 */
export const getCloudinaryThumbnailUrl = (url: string, width: number, height?: number): string => {
  if (!url) return url;
  
  // Primero normalizar la URL si es relativa
  const normalizedUrl = getFullImageUrl(url);
  
  // Si después de normalizar no es una URL de Cloudinary, devolverla tal cual
  if (!normalizedUrl.includes('cloudinary.com')) {
    return normalizedUrl;
  }
  
  // Si ya tiene transformaciones, no las duplicamos
  if (normalizedUrl.includes('/upload/f_auto') || normalizedUrl.includes('/upload/q_auto')) {
    // Extraer la parte base de la URL
    const baseUrl = normalizedUrl.replace(/\/upload\/[^/]*\//, '/upload/');
    const sizeParam = height ? `w_${width},h_${height},c_fill` : `w_${width}`;
    return baseUrl.replace('/upload/', `/upload/${sizeParam},f_auto,q_auto/`);
  }
  
  // Agregar dimensiones y optimizaciones a la URL original
  const sizeParam = height ? `w_${width},h_${height},c_fill` : `w_${width}`;
  return normalizedUrl.replace('/upload/', `/upload/${sizeParam},f_auto,q_auto/`);
};

/**
 * Migra todas las URLs de Cloudinary existentes en Supabase para agregar f_auto,q_auto
 * @returns Número de URLs actualizadas
 */
export const migrateExistingCloudinaryUrls = async (): Promise<number> => {
  try {
    const { supabase } = await import('@/lib/supabase');
    
    // Obtener todos los registros que tienen URLs de evidencia
    const { data: records, error: fetchError } = await supabase
      .from('revisiones_casitas')
      .select('id, evidencia_01, evidencia_02, evidencia_03')
      .or('evidencia_01.neq.,evidencia_02.neq.,evidencia_03.neq.');

    if (fetchError) {
      console.error('Error fetching records:', fetchError);
      return 0;
    }

    if (!records || records.length === 0) {
      console.log('No records found to migrate');
      return 0;
    }

    let updatedCount = 0;

    // Procesar cada registro
    for (const record of records) {
      const updates: any = {};
      let hasUpdates = false;

      // Verificar y optimizar evidencia_01
      if (record.evidencia_01 && record.evidencia_01.includes('cloudinary.com') && !record.evidencia_01.includes('f_auto')) {
        updates.evidencia_01 = optimizeCloudinaryUrl(record.evidencia_01);
        hasUpdates = true;
      }

      // Verificar y optimizar evidencia_02
      if (record.evidencia_02 && record.evidencia_02.includes('cloudinary.com') && !record.evidencia_02.includes('f_auto')) {
        updates.evidencia_02 = optimizeCloudinaryUrl(record.evidencia_02);
        hasUpdates = true;
      }

      // Verificar y optimizar evidencia_03
      if (record.evidencia_03 && record.evidencia_03.includes('cloudinary.com') && !record.evidencia_03.includes('f_auto')) {
        updates.evidencia_03 = optimizeCloudinaryUrl(record.evidencia_03);
        hasUpdates = true;
      }

      // Actualizar el registro si hay cambios
      if (hasUpdates) {
        const { error: updateError } = await supabase
          .from('revisiones_casitas')
          .update(updates)
          .eq('id', record.id);

        if (updateError) {
          console.error(`Error updating record ${record.id}:`, updateError);
        } else {
          updatedCount++;
          console.log(`Updated record ${record.id}:`, updates);
        }
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} records.`);
    return updatedCount;

  } catch (error) {
    console.error('Error in migration:', error);
    return 0;
  }
};

/**
 * Normaliza URLs de imágenes para manejar tanto URLs relativas como absolutas de Cloudinary
 * @param imageUrl - URL de la imagen (puede ser relativa o absoluta)
 * @returns URL completa válida para mostrar la imagen
 */
export const normalizeImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return imageUrl;
  
  // Si ya es una URL completa de Cloudinary, devolverla tal cual
  if (imageUrl.startsWith('https://res.cloudinary.com/')) {
    return imageUrl;
  }
  
  // Si es una ruta relativa (empieza con el nombre de la carpeta), construir la URL completa
  if (imageUrl.startsWith('Evidencias/') || imageUrl.startsWith('notas/') || imageUrl.includes('/')) {
    // Para URLs relativas, necesitamos construir la URL base de Cloudinary
    const cloudName = 'dhd61lan4';
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/`;
    
    // Extraer timestamp si existe en la ruta relativa
    const timestampMatch = imageUrl.match(/v(\d+)/);
    if (timestampMatch) {
      // Si ya tiene timestamp, usarlo
      return `${baseUrl}${imageUrl}`;
    } else {
      // Si no tiene timestamp, no agregar uno dinámico para evitar parpadeo
      // En su lugar, usar un timestamp fijo o ninguno
      return `${baseUrl}${imageUrl}`;
    }
  }
  
  // Si no coincide con ningún patrón conocido, devolver la URL original
  return imageUrl;
};

/**
 * Obtiene la URL completa para mostrar una imagen, manejando ambos formatos
 * @param imageUrl - URL de la imagen (relativa o absoluta)
 * @returns URL completa válida para mostrar
 */
export const getFullImageUrl = (imageUrl: string): string => {
  return normalizeImageUrl(imageUrl);
};

/**
 * Genera una URL completa para una imagen relativa con un timestamp consistente
 * @param imageUrl - URL relativa de la imagen
 * @param useTimestamp - Si se debe usar timestamp (default: false para evitar parpadeo)
 * @returns URL completa válida para mostrar
 */
export const getConsistentImageUrl = (imageUrl: string, useTimestamp: boolean = false): string => {
  if (!imageUrl) return imageUrl;
  
  // Si ya es una URL completa, devolverla tal cual
  if (imageUrl.startsWith('https://res.cloudinary.com/')) {
    return imageUrl;
  }
  
  // Si es una ruta relativa, construir la URL completa
  if (imageUrl.startsWith('Evidencias/') || imageUrl.startsWith('notas/') || imageUrl.includes('/')) {
    const cloudName = 'dhd61lan4';
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/`;
    
    // Extraer timestamp si existe
    const timestampMatch = imageUrl.match(/v(\d+)/);
    if (timestampMatch) {
      return `${baseUrl}${imageUrl}`;
    } else if (useTimestamp) {
      // Usar un timestamp fijo basado en la fecha actual para consistencia
      const today = new Date();
      const fixedTimestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      return `${baseUrl}v${Math.floor(fixedTimestamp / 1000)}/${imageUrl}`;
    } else {
      // No agregar timestamp para máxima consistencia
      return `${baseUrl}${imageUrl}`;
    }
  }
  
  return imageUrl;
};