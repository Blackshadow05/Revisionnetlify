'use client';

import { useState, useRef, useEffect } from 'react';
import { compressImageAdvanced } from '@/lib/imageUtils';

interface CompressionLog {
  timestamp: number;
  message: string;
  data?: Record<string, unknown>;
}

interface CompressionResult {
  originalFile: File;
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  timeElapsed: number;
  attempts: number;
}

export default function CompressionTester() {
  const [logs, setLogs] = useState<CompressionLog[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [compressedPreviewUrl, setCompressedPreviewUrl] = useState<string>('');
  const [config, setConfig] = useState({
    targetSizeKB: 200,
    maxResolution: 1600,
    maxQuality: 0.85,
    minQuality: 0.35,
    maxAttempts: 10,
    timeout: 30000,
    format: 'webp' as const
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string, data?: Record<string, unknown>) => {
    setLogs(prev => [...prev, {
      timestamp: Date.now(),
      message,
      data
    }]);
  };

  const clearLogs = () => {
    setLogs([]);
    setCompressionResult(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setCompressedPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      addLog('📁 Archivo seleccionado', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type,
        lastModified: new Date(file.lastModified).toLocaleString()
      });

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const compressImage = async () => {
    if (!selectedFile) return;

    setIsCompressing(true);
    const startTime = Date.now();
    
    try {
      addLog('🚀 Iniciando compresión...');
      
      addLog('⚙️ Configuración aplicada', config);

      const compressedFile = await compressImageAdvanced(
        selectedFile,
        config,
        (progress) => {
          addLog(`📊 Progreso - Intento ${progress.attempt}/${config.maxAttempts}`, {
            tamaño_actual: `${(progress.currentSize / 1024 / 1024).toFixed(2)} MB`,
            objetivo: `${(progress.targetSize / 1024).toFixed(0)} KB`,
            calidad: `${Math.round(progress.quality * 100)}%`,
            resolución: progress.resolution,
            estado: progress.status
          });
        }
      );

      const endTime = Date.now();
      const timeElapsed = endTime - startTime;
      const compressionRatio = ((selectedFile.size - compressedFile.size) / selectedFile.size) * 100;

      const result: CompressionResult = {
        originalFile: selectedFile,
        compressedFile,
        originalSize: selectedFile.size,
        compressedSize: compressedFile.size,
        compressionRatio,
        timeElapsed,
        attempts: 1
      };

      setCompressionResult(result);
      addLog('✅ Compresión completada', {
        tamaño_original: `${(result.originalSize / 1024 / 1024).toFixed(2)} MB`,
        tamaño_final: `${(result.compressedSize / 1024 / 1024).toFixed(2)} MB`,
        reducción: `${result.compressionRatio.toFixed(1)}%`,
        tiempo: `${result.timeElapsed}ms`
      });

      const compressedUrl = URL.createObjectURL(compressedFile);
      setCompressedPreviewUrl(compressedUrl);

    } catch (error) {
      addLog('❌ Error en compresión', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const copyLogsToClipboard = () => {
    const logText = logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      const dataStr = log.data ? JSON.stringify(log.data, null, 2) : '';
      return `[${time}] ${log.message}\n${dataStr ? dataStr + '\n' : ''}`;
    }).join('\n---\n');
    
    navigator.clipboard.writeText(logText);
    addLog('📋 Logs copiados al portapapeles');
  };

  const downloadCompressed = () => {
    if (!compressionResult) return;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressionResult.compressedFile);
    link.download = `comprimido_${compressionResult.compressedFile.name}`;
    link.click();
    
    addLog('💾 Archivo comprimido descargado');
  };

  const handleConfigChange = (key: string, value: string | number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    addLog('⚙️ Configuración actualizada', { [key]: value });
  };

  // Limpiar URLs al desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (compressedPreviewUrl) URL.revokeObjectURL(compressedPreviewUrl);
    };
  }, [previewUrl, compressedPreviewUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🧪 Laboratorio de Compresión
              </h1>
              <p className="text-gray-600">Pruebas exhaustivas de compresión de imágenes</p>
            </div>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🗑️ Limpiar Todo
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Panel de configuración */}
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">⚙️ Configuración</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Tamaño objetivo (KB)
                    </label>
                    <input
                      type="number"
                      value={config.targetSizeKB}
                      onChange={(e) => handleConfigChange('targetSizeKB', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-400 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Resolución máxima
                    </label>
                    <input
                      type="number"
                      value={config.maxResolution}
                      onChange={(e) => handleConfigChange('maxResolution', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-400 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Calidad máxima
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1"
                      value={config.maxQuality}
                      onChange={(e) => handleConfigChange('maxQuality', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-400 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Calidad mínima
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1"
                      value={config.minQuality}
                      onChange={(e) => handleConfigChange('minQuality', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-400 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      Intentos máximos
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={config.maxAttempts}
                      onChange={(e) => handleConfigChange('maxAttempts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-400 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      Timeout (ms)
                    </label>
                    <input
                      type="number"
                      min="5000"
                      max="60000"
                      step="5000"
                      value={config.timeout}
                      onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-400 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Formato
                    </label>
                    <select
                      value={config.format}
                      onChange={(e) => handleConfigChange('format', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-400 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="webp">WebP</option>
                      <option value="jpeg">JPEG</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white border p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">📁 Archivo</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                
                {selectedFile && (
                  <div className="mt-4 p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-green-800">
                      <strong>Seleccionado:</strong> {selectedFile.name}
                    </p>
                    <p className="text-sm text-green-800">
                      <strong>Tamaño:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
                
                {selectedFile && (
                  <button
                    onClick={compressImage}
                    disabled={isCompressing}
                    className="mt-4 w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors"
                  >
                    {isCompressing ? '⏳ Comprimiendo...' : '🚀 Iniciar Compresión'}
                  </button>
                )}
              </div>
            </div>

            {/* Panel de resultados */}
            <div className="xl:col-span-2 space-y-6">
              {/* Comparación de imágenes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {previewUrl && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">📸 Original</h3>
                    <img 
                      src={previewUrl} 
                      alt="Original" 
                      className="w-full rounded-lg border shadow-md"
                    />
                  </div>
                )}

                {compressedPreviewUrl && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">🎯 Comprimida</h3>
                    <img 
                      src={compressedPreviewUrl} 
                      alt="Comprimida" 
                      className="w-full rounded-lg border shadow-md"
                    />
                  </div>
                )}
              </div>

              {/* Resultados */}
              {compressionResult && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">📊 Resultados de Compresión</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white p-3 rounded-md shadow">
                      <p className="text-2xl font-bold text-gray-900">
                        {(compressionResult.originalSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-sm text-gray-600">Tamaño Original</p>
                    </div>
                    <div className="bg-white p-3 rounded-md shadow">
                      <p className="text-2xl font-bold text-green-600">
                        {(compressionResult.compressedSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-sm text-gray-600">Tamaño Final</p>
                    </div>
                    <div className="bg-white p-3 rounded-md shadow">
                      <p className="text-2xl font-bold text-blue-600">
                        {compressionResult.compressionRatio.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">Reducción</p>
                    </div>
                    <div className="bg-white p-3 rounded-md shadow">
                      <p className="text-2xl font-bold text-purple-600">
                        {compressionResult.timeElapsed}ms
                      </p>
                      <p className="text-sm text-gray-600">Tiempo</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={downloadCompressed}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                    >
                      💾 Descargar Comprimido
                    </button>
                  </div>
                </div>
              )}

              {/* Logs */}
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
                  <h3 className="text-white font-semibold">📝 Logs de Compresión</h3>
                  <button
                    onClick={copyLogsToClipboard}
                    disabled={logs.length === 0}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 transition-colors"
                  >
                    📋 Copiar
                  </button>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  <div className="font-mono text-sm space-y-2">
                    {logs.length === 0 ? (
                      <p className="text-gray-400 italic">No hay logs disponibles. Selecciona una imagen para comenzar.</p>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="text-gray-400 flex-shrink-0">
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>
                          <div className="flex-1">
                            <span className="text-green-400">{log.message}</span>
                            {log.data && (
                              <pre className="mt-1 text-gray-300 text-xs overflow-x-auto">
                                {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
