'use client';

import { useState, useRef } from 'react';
import { compressImageAdvancedAndroid, testAndroidCompression } from '@/lib/imageCompressionAndroid';
import { AndroidCompressionProgress } from '@/lib/imageCompressionAndroid';

export default function PruebasCompresionAndroid() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<any>(null);
  const [progress, setProgress] = useState<AndroidCompressionProgress | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
      addLog(`Archivo seleccionado: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
      
      // Crear preview original
      const originalUrl = URL.createObjectURL(file);
      setOriginalPreview(originalUrl);
      
      // Limpiar preview anterior
      if (compressedPreview) {
        URL.revokeObjectURL(compressedPreview);
        setCompressedPreview(null);
      }
      setCompressedFile(null);
      setCompressionResult(null);
      setProgress(null);
    }
  };

  const handleCompress = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona una imagen primero');
      return;
    }

    setIsCompressing(true);
    setLogs([]);
    addLog('Iniciando compresión Android con algoritmos avanzados...');

    try {
      const startTime = Date.now();
      
      const compressed = await compressImageAdvancedAndroid(selectedFile, {
        maxSizeKB: 600,
        maxWidth: 1000,
        maxHeight: 1000,
        preprocessOptions: { 
          denoise: true, 
          enhanceContrast: true 
        },
        onProgress: (prog) => {
          setProgress(prog);
          addLog(`${prog.stage}: ${prog.progress}% - ${prog.details || ''}`);
        },
        analyzeImageType: true
      });

      const endTime = Date.now();
      const compressionTime = endTime - startTime;

      // Crear preview comprimido
      const compressedUrl = URL.createObjectURL(compressed);
      setCompressedPreview(compressedUrl);
      setCompressedFile(compressed);

      const result = {
        originalSize: selectedFile.size,
        compressedSize: compressed.size,
        reduction: ((selectedFile.size - compressed.size) / selectedFile.size * 100),
        compressionTime,
        format: compressed.type,
        name: compressed.name
      };

      setCompressionResult(result);
      addLog(`✅ Compresión completada en ${compressionTime}ms`);
      addLog(`📊 Reducción: ${result.reduction.toFixed(1)}% (${(selectedFile.size / 1024).toFixed(1)}KB → ${(compressed.size / 1024).toFixed(1)}KB)`);

    } catch (error) {
      console.error('Error en compresión:', error);
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleTestCompression = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona una imagen primero');
      return;
    }

    setIsCompressing(true);
    setLogs([]);
    addLog('Iniciando prueba detallada de compresión Android...');

    try {
      const testResult = await testAndroidCompression(selectedFile);
      
      addLog('📋 Resultados del análisis:');
      addLog(`   - Tamaño original: ${(testResult.original.size / 1024).toFixed(1)}KB`);
      addLog(`   - Tamaño comprimido: ${(testResult.compressed.size / 1024).toFixed(1)}KB`);
      addLog(`   - Reducción: ${testResult.compressed.reduction.toFixed(1)}%`);
      addLog(`   - Formato final: ${testResult.details.format}`);
      addLog(`   - Complejidad: ${(testResult.details.complexity * 100).toFixed(1)}%`);
      addLog(`   - Pre-procesamiento: ${testResult.details.preprocessing.join(', ') || 'ninguno'}`);

      // Mostrar resultados en formato tabla
      console.table({
        'Métrica': ['Tamaño Original', 'Tamaño Comprimido', 'Reducción', 'Formato', 'Complejidad'],
        'Valor': [
          `${(testResult.original.size / 1024).toFixed(1)}KB`,
          `${(testResult.compressed.size / 1024).toFixed(1)}KB`,
          `${testResult.compressed.reduction.toFixed(1)}%`,
          testResult.details.format,
          `${(testResult.details.complexity * 100).toFixed(1)}%`
        ]
      });

    } catch (error) {
      console.error('Error en prueba:', error);
      addLog(`❌ Error en prueba: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsCompressing(false);
    }
  };

  const clearAll = () => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (compressedPreview) URL.revokeObjectURL(compressedPreview);
    
    setSelectedFile(null);
    setCompressedFile(null);
    setOriginalPreview(null);
    setCompressedPreview(null);
    setCompressionResult(null);
    setProgress(null);
    setLogs([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Limpiar URLs al desmontar
  useState(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (compressedPreview) URL.revokeObjectURL(compressedPreview);
    };
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          🤖 Compresión Android Avanzada
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Control */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🎛️</span>
              Panel de Control
            </h2>

            {/* Selector de Archivo */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Seleccionar Imagen:</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700
                  cursor-pointer"
              />
            </div>

            {/* Botones de Acción */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleCompress}
                disabled={!selectedFile || isCompressing}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isCompressing ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Comprimiendo...
                  </>
                ) : (
                  <>
                    <span>🗜️</span>
                    Comprimir con Android AI
                  </>
                )}
              </button>

              <button
                onClick={handleTestCompression}
                disabled={!selectedFile || isCompressing}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>🧪</span>
                Prueba Detallada
              </button>

              <button
                onClick={clearAll}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                🗑️ Limpiar Todo
              </button>
            </div>

            {/* Barra de Progreso */}
            {progress && isCompressing && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>{progress.stage}</span>
                  <span>{progress.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  ></div>
                </div>
                {progress.details && (
                  <p className="text-xs text-gray-400 mt-1">{progress.details}</p>
                )}
              </div>
            )}

            {/* Resultados */}
            {compressionResult && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span>📊</span>
                  Resultados de Compresión
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tamaño Original:</span>
                    <span className="font-mono">{(compressionResult.originalSize / 1024).toFixed(1)}KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tamaño Comprimido:</span>
                    <span className="font-mono">{(compressionResult.compressedSize / 1024).toFixed(1)}KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reducción:</span>
                    <span className="font-mono text-green-400">{compressionResult.reduction.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiempo:</span>
                    <span className="font-mono">{compressionResult.compressionTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Formato:</span>
                    <span className="font-mono">{compressionResult.format}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vista Previa */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">👁️</span>
              Vista Previa
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Imagen Original */}
              <div>
                <h3 className="text-lg font-medium mb-2 text-center">Original</h3>
                <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {originalPreview ? (
                    <img 
                      src={originalPreview} 
                      alt="Original" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-500 text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-sm">Selecciona una imagen</p>
                    </div>
                  )}
                </div>
                {selectedFile && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    {(selectedFile.size / 1024).toFixed(1)}KB
                  </p>
                )}
              </div>

              {/* Imagen Comprimida */}
              <div>
                <h3 className="text-lg font-medium mb-2 text-center">Comprimida</h3>
                <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {compressedPreview ? (
                    <img 
                      src={compressedPreview} 
                      alt="Comprimida" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-500 text-center">
                      <div className="text-4xl mb-2">🗜️</div>
                      <p className="text-sm">Esperando compresión</p>
                    </div>
                  )}
                </div>
                {compressedFile && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    {(compressedFile.size / 1024).toFixed(1)}KB
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Consola de Logs */}
        {logs.length > 0 && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              Consola de Logs
            </h2>
            <div className="bg-black rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-green-400 mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información de Características */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Características del Sistema Android
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-400">🧠 Inteligencia Artificial</h3>
              <ul className="space-y-2 text-sm">
                <li>• Análisis de complejidad de imagen</li>
                <li>• Calidad adaptativa según contenido</li>
                <li>• Detección automática de tipo de imagen</li>
                <li>• Compresión personalizada por categoría</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">🔧 Procesamiento Avanzado</h3>
              <ul className="space-y-2 text-sm">
                <li>• Redimensionamiento con filtros Lanczos</li>
                <li>• Pre-procesamiento inteligente</li>
                <li>• Selección óptima de formato</li>
                <li>• Optimización específica para Android</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-yellow-400">⚡ Rendimiento</h3>
              <ul className="space-y-2 text-sm">
                <li>• Compresión asíncrona sin bloqueos</li>
                <li>• Gestión eficiente de memoria</li>
                <li>• Progreso en tiempo real</li>
                <li>• Timeout de seguridad (30s)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-purple-400">🛡️ Robustez</h3>
              <ul className="space-y-2 text-sm">
                <li>• Manejo de errores específicos</li>
                <li>• Fallback automáticos</li>
                <li>• Limpieza de recursos</li>
                <li>• Logs detallados para debugging</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}