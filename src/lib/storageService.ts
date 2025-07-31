/**
 * Servicio de almacenamiento local para imágenes usando IndexedDB
 * Optimizado para PWA en Android
 */

interface StoredImage {
  id: string;
  data: string; // Base64
  originalSize: number;
  compressedSize: number;
  timestamp: number;
  type: string;
  folder: string;
  imageType: 'img1' | 'img2' | 'unida';
}

class StorageService {
  private dbName = 'PWAImageStorage';
  private storeName = 'unir-imagenes-ram'; // Store específica para esta función
  private version = 1;
  private db: IDBDatabase | null = null;

  // Inicializar la base de datos
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('type', 'type');
          store.createIndex('folder', 'folder');
          store.createIndex('imageType', 'imageType');
        }
      };
    });
  }

  // Convertir archivo a base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  // Guardar imagen en la carpeta específica de unir-imagenes
  async saveImage(file: File, type: 'img1' | 'img2' | 'unida'): Promise<string> {
    const db = await this.initDB();
    const base64 = await this.fileToBase64(file);
    const id = `unir-imagenes/${type}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ 
        id, 
        data: base64, 
        originalSize: file.size,
        compressedSize: file.size,
        timestamp: Date.now(), 
        type: file.type,
        folder: 'unir-imagenes-ram',
        imageType: type 
      });

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  // Limpiar toda la carpeta unir-imagenes-ram
  async clearAll(): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    await store.clear();
    console.log('🧹 Carpeta unir-imagenes-ram limpiada completamente');
  }

  // Obtener imagen por ID
  async getImage(id: string): Promise<string | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Actualizar imagen comprimida
  async updateCompressedImage(id: string, compressedFile: File): Promise<void> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const image = getRequest.result;
          if (image) {
            image.data = base64;
            image.compressedSize = compressedFile.size;
            const updateRequest = store.put(image);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
          } else {
            reject(new Error('Imagen no encontrada'));
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(compressedFile);
    });
  }

  // Eliminar imagen específica
  async deleteImage(id: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    await store.delete(id);
    console.log(`🧹 Imagen eliminada de IndexedDB: ${id}`);
  }

  // Eliminar todas las imágenes de un tipo específico
  async deleteImagesByType(type: 'img1' | 'img2' | 'unida'): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result;
      items.forEach(item => {
        if (item.id.startsWith(`unir-imagenes/${type}/`)) {
          store.delete(item.id);
        }
      });
    };
  }

  // Obtener estadísticas
  async getStats(): Promise<{ count: number; totalSize: number }> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const images = request.result;
        const stats = {
          count: images.length,
          totalSize: images.reduce((sum, img) => sum + (img.compressedSize || 0), 0)
        };
        resolve(stats);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Limpiar imágenes antiguas (más de 24 horas)
  async cleanupOldImages(): Promise<void> {
    const db = await this.initDB();
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Exportar instancia única
export const storageService = new StorageService();
