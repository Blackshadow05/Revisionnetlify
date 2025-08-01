/**
 * Sistema de logging detallado para monitorear uso de memoria
 * Especialmente diseñado para detectar fugas de memoria en dispositivos móviles
 */

export interface MemoryLogEntry {
  timestamp: number;
  action: string;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
  objectUrls: string[];
  blobUrls: string[];
  canvasCount: number;
  imageElements: number;
  stackTrace?: string;
}

export interface MemoryStats {
  totalMemoryUsed: number;
  objectUrlsCount: number;
  blobUrlsCount: number;
  canvasCount: number;
  imageElementsCount: number;
  lastLogEntry?: MemoryLogEntry;
}

class MemoryLogger {
  private logs: MemoryLogEntry[] = [];
  private maxLogs = 100;
  private isActive = false;
  private objectUrls: Set<string> = new Set();
  private blobUrls: Set<string> = new Set();
  private canvasElements: Set<HTMLCanvasElement> = new Set();
  private imageElements: Set<HTMLImageElement> = new Set();

  /**
   * Inicia el monitoreo de memoria
   */
  start() {
    this.isActive = true;
    console.log('🧠 MemoryLogger iniciado');
    this.log('init', 'Inicio de monitoreo de memoria');
  }

  /**
   * Detiene el monitoreo
   */
  stop() {
    this.isActive = false;
    console.log('🧠 MemoryLogger detenido');
  }

  /**
   * Registra una acción con detalles de memoria
   */
  log(action: string, details?: string) {
    if (!this.isActive && typeof window === 'undefined') return;

    try {
      const memoryBefore = this.getCurrentMemoryUsage();
      const objectUrlsBefore = Array.from(this.objectUrls);
      const blobUrlsBefore = Array.from(this.blobUrls);
      const canvasCountBefore = this.canvasElements.size;
      const imageElementsBefore = this.imageElements.size;

      // Pequeño delay para permitir que GC se ejecute
      setTimeout(() => {
        const memoryAfter = this.getCurrentMemoryUsage();
        const entry: MemoryLogEntry = {
          timestamp: Date.now(),
          action: `${action}${details ? `: ${details}` : ''}`,
          memoryBefore,
          memoryAfter,
          memoryDelta: memoryAfter - memoryBefore,
          objectUrls: objectUrlsBefore,
          blobUrls: blobUrlsBefore,
          canvasCount: canvasCountBefore,
          imageElements: imageElementsBefore,
          stackTrace: new Error().stack?.split('\n').slice(2, 5).join('\n') || ''
        };

        this.logs.push(entry);
        
        // Mantener solo los últimos logs
        if (this.logs.length > this.maxLogs) {
          this.logs.shift();
        }

        this.printLogEntry(entry);
      }, 100);

    } catch (error) {
      console.error('Error al registrar memoria:', error);
    }
  }

  /**
   * Registra la creación de un Object URL
   */
  trackObjectUrl(url: string, type: 'object' | 'blob' = 'object') {
    if (type === 'object') {
      this.objectUrls.add(url);
    } else {
      this.blobUrls.add(url);
    }
    this.log('object-url-created', `${type} URL: ${url}`);
  }

  /**
   * Registra la liberación de un Object URL
   */
  untrackObjectUrl(url: string, type: 'object' | 'blob' = 'object') {
    if (type === 'object') {
      this.objectUrls.delete(url);
    } else {
      this.blobUrls.delete(url);
    }
    this.log('object-url-revoked', `${type} URL: ${url}`);
  }

  /**
   * Registra un canvas element
   */
  trackCanvas(canvas: HTMLCanvasElement) {
    this.canvasElements.add(canvas);
    this.log('canvas-created', `Canvas ${canvas.width}x${canvas.height}`);
  }

  /**
   * Registra la eliminación de un canvas
   */
  untrackCanvas(canvas: HTMLCanvasElement) {
    this.canvasElements.delete(canvas);
    this.log('canvas-removed', `Canvas ${canvas.width}x${canvas.height}`);
  }

  /**
   * Registra un elemento imagen
   */
  trackImageElement(img: HTMLImageElement) {
    this.imageElements.add(img);
    this.log('image-element-created', `Image ${img.naturalWidth}x${img.naturalHeight}`);
  }

  /**
   * Registra la eliminación de un elemento imagen
   */
  untrackImageElement(img: HTMLImageElement) {
    this.imageElements.delete(img);
    this.log('image-element-removed', `Image ${img.naturalWidth}x${img.naturalHeight}`);
  }

  /**
   * Obtiene el uso actual de memoria
   */
  private getCurrentMemoryUsage(): number {
    if (typeof window === 'undefined') return 0;
    
    try {
      const memory = (performance as any).memory;
      if (memory && memory.usedJSHeapSize) {
        return Math.round(memory.usedJSHeapSize / 1024 / 1024);
      }
    } catch (error) {
      console.warn('No se puede acceder a performance.memory');
    }
    
    return 0;
  }

  /**
   * Imprime una entrada de log formateada
   */
  private printLogEntry(entry: MemoryLogEntry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const color = entry.memoryDelta > 0 ? '\x1b[31m' : '\x1b[32m';
    const sign = entry.memoryDelta > 0 ? '+' : '';
    
    console.log(
      `🧠 [${timestamp}] ${entry.action}\n` +
      `   Memoria: ${entry.memoryBefore}MB → ${entry.memoryAfter}MB (${sign}${entry.memoryDelta}MB)\n` +
      `   URLs: ${entry.objectUrls.length} object, ${entry.blobUrls.length} blob\n` +
      `   Canvas: ${entry.canvasCount}, Images: ${entry.imageElements}`
    );

    if (entry.memoryDelta > 10) {
      console.warn(`⚠️  Posible fuga de memoria detectada: ${entry.memoryDelta}MB`);
    }
  }

  /**
   * Obtiene estadísticas actuales de memoria
   */
  getStats(): MemoryStats {
    return {
      totalMemoryUsed: this.getCurrentMemoryUsage(),
      objectUrlsCount: this.objectUrls.size,
      blobUrlsCount: this.blobUrls.size,
      canvasCount: this.canvasElements.size,
      imageElementsCount: this.imageElements.size,
      lastLogEntry: this.logs[this.logs.length - 1]
    };
  }

  /**
   * Obtiene todos los logs
   */
  getLogs(): MemoryLogEntry[] {
    return [...this.logs];
  }

  /**
   * Limpia todos los recursos trackeados
   */
  cleanup() {
    // Liberar todos los Object URLs pendientes
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.blobUrls.forEach(url => URL.revokeObjectURL(url));
    
    // Limpiar canvas
    this.canvasElements.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    // Limpiar elementos de imagen
    this.imageElements.forEach(img => {
      img.src = '';
    });

    this.log('cleanup', 'Liberación forzada de recursos');
    
    // Limpiar sets
    this.objectUrls.clear();
    this.blobUrls.clear();
    this.canvasElements.clear();
    this.imageElements.clear();
  }

  /**
   * Genera reporte detallado de fugas de memoria
   */
  generateLeakReport(): string {
    const stats = this.getStats();
    const report = [
      '🧠 REPORTE DE FUGAS DE MEMORIA',
      '================================',
      `Memoria total usada: ${stats.totalMemoryUsed}MB`,
      `Object URLs sin liberar: ${stats.objectUrlsCount}`,
      `Blob URLs sin liberar: ${stats.blobUrlsCount}`,
      `Canvas sin liberar: ${stats.canvasCount}`,
      `Imágenes sin liberar: ${stats.imageElementsCount}`,
      '',
      'Últimas acciones:',
      ...this.logs.slice(-5).map(log => 
        `- ${new Date(log.timestamp).toLocaleTimeString()}: ${log.action} (${log.memoryDelta}MB)`
      )
    ].join('\n');

    console.log(report);
    return report;
  }
}

// Exportar instancia única
export const memoryLogger = new MemoryLogger();

/**
 * Hook personalizado para usar el memory logger en componentes React
 */
export function useMemoryLogger() {
  return {
    start: () => memoryLogger.start(),
    stop: () => memoryLogger.stop(),
    log: (action: string, details?: string) => memoryLogger.log(action, details),
    trackObjectUrl: (url: string) => memoryLogger.trackObjectUrl(url),
    untrackObjectUrl: (url: string) => memoryLogger.untrackObjectUrl(url),
    trackCanvas: (canvas: HTMLCanvasElement) => memoryLogger.trackCanvas(canvas),
    untrackCanvas: (canvas: HTMLCanvasElement) => memoryLogger.untrackCanvas(canvas),
    trackImageElement: (img: HTMLImageElement) => memoryLogger.trackImageElement(img),
    untrackImageElement: (img: HTMLImageElement) => memoryLogger.untrackImageElement(img),
    getStats: () => memoryLogger.getStats(),
    getLogs: () => memoryLogger.getLogs(),
    cleanup: () => memoryLogger.cleanup(),
    generateReport: () => memoryLogger.generateLeakReport()
  };
}
