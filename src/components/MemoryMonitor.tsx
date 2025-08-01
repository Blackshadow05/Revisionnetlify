import React, { useState, useEffect } from 'react';
import { useMemoryLogger } from '@/lib/memoryLogger';

interface MemoryMonitorProps {
  className?: string;
}

export const MemoryMonitor: React.FC<MemoryMonitorProps> = ({ className = '' }) => {
  const memory = useMemoryLogger();
  const [stats, setStats] = useState(memory.getStats());
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState(memory.getLogs());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(memory.getStats());
      setLogs(memory.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, [memory]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMemoryColor = (memoryUsed: number) => {
    if (memoryUsed > 100) return 'text-red-500';
    if (memoryUsed > 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">🧠 Memoria</h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isExpanded ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">Memoria:</span>
              <span className={`font-mono ${getMemoryColor(stats.totalMemoryUsed)}`}>
                {stats.totalMemoryUsed}MB
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">URLs:</span>
              <span className="text-gray-400 font-mono">
                {stats.objectUrlsCount + stats.blobUrlsCount}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">Canvas:</span>
              <span className="text-gray-400 font-mono">{stats.canvasCount}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">Imágenes:</span>
              <span className="text-gray-400 font-mono">{stats.imageElementsCount}</span>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="max-h-48 overflow-y-auto">
                <h4 className="text-xs font-semibold text-gray-300 mb-2">Últimas acciones:</h4>
                <div className="space-y-1">
                  {logs.slice(-5).map((log, index) => (
                    <div key={index} className="text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={log.memoryDelta > 0 ? 'text-red-400' : 'text-green-400'}>
                          {log.memoryDelta > 0 ? '+' : ''}{log.memoryDelta}MB
                        </span>
                      </div>
                      <div className="text-gray-300 ml-3 truncate">
                        {log.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => memory.generateReport()}
                  className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                >
                  Reporte
                </button>
                <button
                  onClick={() => memory.cleanup()}
                  className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                >
                  Limpiar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alerta visual cuando la memoria es crítica */}
      {stats.totalMemoryUsed > 80 && (
        <div className="mt-2 p-2 bg-red-900/80 border border-red-600 rounded-lg">
          <div className="text-xs text-red-200">
            ⚠️ Memoria crítica: {stats.totalMemoryUsed}MB
          </div>
        </div>
      )}
    </div>
  );
};
