'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import LoadingButton from '@/components/ui/LoadingButton';

// Definir los tipos para los datos de la tabla revisiones_casitas
interface RevisionCasita {
  id: string;
  casita: string;
  quien_revisa: string;
  caja_fuerte: string | null;
  puertas_ventanas: string | null;
  chromecast: string | null;
  binoculares: string | null;
  trapo_binoculares: string | null;
  speaker: string | null;
  usb_speaker: string | null;
  controles_tv: string | null;
  secadora: string | null;
  accesorios_secadora: string | null;
  faltantes: string | null;
  steamer: string | null;
  bolsa_vapor: string | null;
  plancha_cabello: string | null;
  bulto: string | null;
  sombrero: string | null;
  bolso_yute: string | null;
  evidencia_01: string | null;
  evidencia_02: string | null;
  evidencia_03: string | null;
  camas_ordenadas: string | null;
  cola_caballo: string | null;
  notas: string | null;
  created_at: string | null;
}

export default function ReportesPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Campos disponibles para el reporte (excluyendo id, evidencia_01, evidencia_02, evidencia_03, faltantes)
  const availableFields = [
    { key: 'created_at', label: 'Fecha de Creación' },
    { key: 'casita', label: 'Casita' },
    { key: 'quien_revisa', label: 'Quien Revisa' },
    { key: 'caja_fuerte', label: 'Caja Fuerte' },
    { key: 'puertas_ventanas', label: 'Puertas Ventanas' },
    { key: 'chromecast', label: 'Chromecast' },
    { key: 'binoculares', label: 'Binoculares' },
    { key: 'trapo_binoculares', label: 'Trapo Binoculares' },
    { key: 'speaker', label: 'Speaker' },
    { key: 'usb_speaker', label: 'USB Speaker' },
    { key: 'controles_tv', label: 'Controles TV' },
    { key: 'secadora', label: 'Secadora' },
    { key: 'accesorios_secadora', label: 'Accesorios Secadora' },
    { key: 'steamer', label: 'Steamer' },
    { key: 'bolsa_vapor', label: 'Bolsa Vapor' },
    { key: 'plancha_cabello', label: 'Plancha Cabello' },
    { key: 'bulto', label: 'Bulto' },
    { key: 'sombrero', label: 'Sombrero' },
    { key: 'bolso_yute', label: 'Bolso Yute' },
    { key: 'camas_ordenadas', label: 'Camas Ordenadas' },
    { key: 'cola_caballo', label: 'Cola Caballo' },
    { key: 'notas', label: 'Notas' }
  ];
  
  // Campos seleccionados por defecto
  const [selectedFields, setSelectedFields] = useState<string[]>(
    availableFields.map(field => field.key)
  );

  // Función para obtener todos los datos de la tabla revisiones_casitas
  const fetchRevisionesData = async (startDate?: string, endDate?: string): Promise<RevisionCasita[]> => {
    // Cargar todos los registros en lotes para evitar límites
    let allData: RevisionCasita[] = [];
    let start = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    // Ajustar la fecha de fin para incluir todo el día
    let adjustedEndDate = endDate;
    if (endDate) {
      const date = new Date(endDate);
      date.setDate(date.getDate() + 1);
      adjustedEndDate = date.toISOString().split('T')[0];
    }
    
    while (hasMore) {
      let query = supabase
        .from('revisiones_casitas')
        .select('*')
        .range(start, start + batchSize - 1);
      
      // Aplicar filtro de fechas si se proporcionan
      if (startDate && adjustedEndDate) {
        query = query.gte('created_at', startDate).lt('created_at', adjustedEndDate);
      } else if (startDate) {
        query = query.gte('created_at', startDate);
      } else if (adjustedEndDate) {
        query = query.lt('created_at', adjustedEndDate);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error al obtener datos: ${error.message}`);
      }
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        start += batchSize;
        // Si el lote tiene menos registros que el tamaño del lote, ya no hay más datos
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }
    
    return allData;
  };

  // Función para obtener el último registro por casita
  const fetchUltimoRegistroPorCasita = async (): Promise<RevisionCasita[]> => {
    try {
      // Usar una consulta RPC para ejecutar el SQL personalizado
      const { data, error } = await supabase
        .rpc('get_ultimo_registro_por_casita');
      
      if (error) {
        // Si la función RPC no existe, intentar con una consulta alternativa
        console.warn('La función RPC no existe, usando consulta alternativa');
        
        // Obtener todos los datos y procesarlos en el cliente
        const { data: allData, error: fetchError } = await supabase
          .from('revisiones_casitas')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fetchError) {
          throw new Error(`Error al obtener datos: ${fetchError.message}`);
        }
        
        if (!allData) {
          return [];
        }
        
        // Filtrar para obtener solo casitas que son números
        const numericCasitas = allData.filter(item =>
          item.casita && /^\d+$/.test(item.casita)
        );
        
        // Agrupar por casita y obtener el registro más reciente de cada una
        const latestByCasita: Record<string, RevisionCasita> = {};
        
        numericCasitas.forEach(item => {
          if (!latestByCasita[item.casita] ||
              new Date(item.created_at || '') > new Date(latestByCasita[item.casita].created_at || '')) {
            latestByCasita[item.casita] = item;
          }
        });
        
        // Convertir a array y ordenar por casita (numéricamente)
        return Object.values(latestByCasita)
          .sort((a, b) => parseInt(a.casita || '0') - parseInt(b.casita || '0'));
      }
      
      return data as RevisionCasita[];
    } catch (err) {
      throw new Error(`Error al obtener último registro por casita: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  // Función para manejar la selección/deselección de campos
  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey)
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    );
  };
  
  // Función para seleccionar todos los campos
  const selectAllFields = () => {
    setSelectedFields(availableFields.map(field => field.key));
  };
  
  // Función para deseleccionar todos los campos
  const deselectAllFields = () => {
    setSelectedFields([]);
  };

  // Función para verificar si la Web Share API está disponible
  const isWebShareAvailable = () => {
    return typeof navigator !== 'undefined' &&
           typeof navigator.share === 'function' &&
           typeof navigator.canShare === 'function';
  };

  // Función para generar y descargar un archivo CSV
  const generateCSV = async () => {
    if (selectedFields.length === 0) {
      setError('Debe seleccionar al menos un campo para el reporte');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Obtener los datos de la tabla con el filtro de fechas
      const data = await fetchRevisionesData(startDate || undefined, endDate || undefined);
      
      if (data.length === 0) {
        setError('No hay datos disponibles para generar el reporte con los filtros seleccionados');
        setLoading(false);
        return;
      }

      // Obtener las etiquetas de los campos seleccionados
      const headers = selectedFields.map(fieldKey => {
        const field = availableFields.find(f => f.key === fieldKey);
        return field ? field.label : fieldKey;
      });

      // Crear el contenido del CSV
      let csvContent = headers.join(',') + '\n';
      
      data.forEach(row => {
        const values = selectedFields.map(fieldKey => {
          // Formatear la fecha si es el campo created_at
          if (fieldKey === 'created_at' && row[fieldKey]) {
            const date = new Date(row[fieldKey] as string);
            return `"${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString('es-ES')}"`;
          }
          return `"${row[fieldKey as keyof RevisionCasita] || ''}"`;
        });
        csvContent += values.join(',') + '\n';
      });

      // Crear un blob con el contenido CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Crear una URL para el blob
      const url = URL.createObjectURL(blob);
      
      // Crear un nombre de archivo con la fecha actual
      const today = new Date().toISOString().split('T')[0];
      let fileName = `reporte_revisiones_casitas_${today}`;
      
      // Añadir información de fechas al nombre del archivo si se aplicó un filtro
      if (startDate && endDate) {
        fileName += `_${startDate}_a_${endDate}`;
      } else if (startDate) {
        fileName += `_desde_${startDate}`;
      } else if (endDate) {
        fileName += `_hasta_${endDate}`;
      }
      
      fileName += '.csv';
      
      // Crear un enlace para descargar el archivo
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      
      // Agregar el enlace al documento y hacer clic en él
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('Reporte generado y descargado exitosamente');
      
      // Verificar si la Web Share API está disponible y ofrecer compartir el archivo
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], fileName, { type: 'text/csv' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Reporte de Revisiones de Casitas',
              text: 'Reporte generado desde el sistema de revisiones de casitas',
              files: [file]
            });
            setSuccess('Reporte generado y compartido exitosamente');
          }
        } catch (shareErr) {
          // El usuario canceló el compartir o hubo un error, pero el archivo ya se descargó
          console.log('Error al compartir:', shareErr);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  // Función para generar y descargar un archivo CSV del último registro por casita
  const generateUltimoRegistroPorCasitaCSV = async () => {
    if (selectedFields.length === 0) {
      setError('Debe seleccionar al menos un campo para el reporte');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Obtener los datos del último registro por casita
      const data = await fetchUltimoRegistroPorCasita();
      
      if (data.length === 0) {
        setError('No hay datos disponibles para generar el reporte');
        setLoading(false);
        return;
      }

      // Obtener las etiquetas de los campos seleccionados
      const headers = selectedFields.map(fieldKey => {
        const field = availableFields.find(f => f.key === fieldKey);
        return field ? field.label : fieldKey;
      });

      // Crear el contenido del CSV
      let csvContent = headers.join(',') + '\n';
      
      data.forEach(row => {
        const values = selectedFields.map(fieldKey => {
          // Formatear la fecha si es el campo created_at
          if (fieldKey === 'created_at' && row[fieldKey]) {
            const date = new Date(row[fieldKey] as string);
            return `"${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString('es-ES')}"`;
          }
          return `"${row[fieldKey as keyof RevisionCasita] || ''}"`;
        });
        csvContent += values.join(',') + '\n';
      });

      // Crear un blob con el contenido CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Crear una URL para el blob
      const url = URL.createObjectURL(blob);
      
      // Crear un nombre de archivo con la fecha actual
      const today = new Date().toISOString().split('T')[0];
      const fileName = `ultimo_registro_por_casita_${today}.csv`;
      
      // Crear un enlace para descargar el archivo
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      
      // Agregar el enlace al documento y hacer clic en él
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('Reporte de último registro por casita generado y descargado exitosamente');
      
      // Verificar si la Web Share API está disponible y ofrecer compartir el archivo
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], fileName, { type: 'text/csv' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Último Registro por Casita',
              text: 'Reporte generado desde el sistema de revisiones de casitas',
              files: [file]
            });
            setSuccess('Reporte de último registro por casita generado y compartido exitosamente');
          }
        } catch (shareErr) {
          // El usuario canceló el compartir o hubo un error, pero el archivo ya se descargó
          console.log('Error al compartir:', shareErr);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-green-500">Reportes de Revisiones de Casitas</h1>
      
      <div className="bg-gray-800 shadow-md rounded-lg p-6 mb-6 border border-green-700">
        <h2 className="text-xl font-semibold mb-4 text-green-400">Generar Reporte CSV</h2>
        <p className="text-gray-300 mb-4">
          Esta opción generará un archivo CSV con los datos seleccionados de la tabla de revisiones de casitas.
        </p>
        
        {/* Filtro de fechas */}
        <div className="mb-6 bg-gray-900 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium mb-3 text-green-400">Filtrar por Fecha</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-gray-800 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Fecha de Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-gray-800 text-white"
              />
            </div>
          </div>
        </div>
        
        {/* Selección de campos */}
        <div className="mb-6 bg-gray-900 p-4 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-green-400">Seleccionar Campos</h3>
            <div className="space-x-2">
              <button
                type="button"
                onClick={selectAllFields}
                className="px-3 py-1 text-sm bg-green-700 hover:bg-green-600 text-white rounded"
              >
                Seleccionar Todos
              </button>
              <button
                type="button"
                onClick={deselectAllFields}
                className="px-3 py-1 text-sm bg-red-700 hover:bg-red-600 text-white rounded"
              >
                Deseleccionar Todos
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableFields.map((field) => (
              <div key={field.key} className="flex items-center">
                <input
                  type="checkbox"
                  id={field.key}
                  checked={selectedFields.includes(field.key)}
                  onChange={() => handleFieldToggle(field.key)}
                  className="h-4 w-4 text-green-500 focus:ring-green-500 border-gray-600 rounded bg-gray-800"
                />
                <label htmlFor={field.key} className="ml-2 text-sm text-gray-300">
                  {field.label}
                </label>
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Campos seleccionados: {selectedFields.length} de {availableFields.length}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <LoadingButton
              onClick={generateCSV}
              disabled={loading || selectedFields.length === 0}
              loading={loading}
              variant="primary"
              className="flex-1 bg-green-700 hover:bg-green-600 text-white"
            >
              {loading ? 'Generando...' : 'Generar Reporte CSV'}
            </LoadingButton>
            
            {isWebShareAvailable() && (
              <button
                onClick={generateCSV}
                disabled={loading || selectedFields.length === 0}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center justify-center"
                title="Compartir Reporte CSV"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <LoadingButton
              onClick={generateUltimoRegistroPorCasitaCSV}
              disabled={loading || selectedFields.length === 0}
              loading={loading}
              variant="secondary"
              className="flex-1 bg-blue-700 hover:bg-blue-600 text-white"
            >
              {loading ? 'Generando...' : 'Último Registro por Casita'}
            </LoadingButton>
            
            {isWebShareAvailable() && (
              <button
                onClick={generateUltimoRegistroPorCasitaCSV}
                disabled={loading || selectedFields.length === 0}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center justify-center"
                title="Compartir Último Registro por Casita"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-900 text-red-200 rounded border border-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mt-4 p-3 bg-green-900 text-green-200 rounded border border-green-700">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}