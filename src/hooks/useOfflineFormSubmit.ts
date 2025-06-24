'use client';

import { useState, useCallback, useEffect } from 'react';
import { useConnectionStatus } from './useConnectionStatus';
import { useToast } from '@/context/ToastContext';

// Tipos para el sistema offline
interface OfflineFormData {
  id: string;
  formType: 'revision' | 'nota';
  data: any;
  images?: { [key: string]: File };
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  lastError?: string;
}

interface OfflineFormQueue {
  pending: OfflineFormData[];
  completed: OfflineFormData[];
  error: OfflineFormData[];
  total: number;
}

// Configuración IndexedDB para formularios offline
const OFFLINE_DB_NAME = 'OfflineFormsDB';
const OFFLINE_DB_VERSION = 1;
const OFFLINE_STORE_NAME = 'offlineForms';

export function useOfflineFormSubmit() {
  const { isOnline, wasOffline } = useConnectionStatus();
  const { showSuccess, showError, showInfo } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queueStatus, setQueueStatus] = useState<OfflineFormQueue>({
    pending: [],
    completed: [],
    error: [],
    total: 0
  });

  // Abrir IndexedDB
  const openOfflineDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
          const store = db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('formType', 'formType', { unique: false });
        }
      };
    });
  }, []);

  // Guardar formulario en IndexedDB
  const saveOfflineForm = useCallback(async (
    formType: 'revision' | 'nota',
    data: any,
    images?: { [key: string]: File }
  ): Promise<string> => {
    try {
      const db = await openOfflineDB();
      const transaction = db.transaction([OFFLINE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORE_NAME);
      
      const formData: OfflineFormData = {
        id: `offline_${formType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        formType,
        data,
        images,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'pending'
      };
      
      await new Promise<void>((resolve, reject) => {
        const request = store.add(formData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      db.close();
      
      // Registrar Background Sync si está disponible
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        try {
          const registration = await navigator.serviceWorker.ready;
          // @ts-ignore - Background Sync API no está completamente tipado
          await registration.sync.register('offline-form-sync');
          console.log('🔄 Background sync registrado para formularios');
        } catch (error) {
          console.log('⚠️ Background sync no disponible:', error);
        }
      }
      
      return formData.id;
    } catch (error) {
      console.error('Error guardando formulario offline:', error);
      throw error;
    }
  }, [openOfflineDB]);

  // Obtener estado de la cola
  const getQueueStatus = useCallback(async (): Promise<OfflineFormQueue> => {
    try {
      const db = await openOfflineDB();
      const transaction = db.transaction([OFFLINE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(OFFLINE_STORE_NAME);
      
      const allForms = await new Promise<OfflineFormData[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      db.close();
      
      const pending = allForms.filter(form => form.status === 'pending');
      const completed = allForms.filter(form => form.status === 'completed');
      const error = allForms.filter(form => form.status === 'error');
      
      return {
        pending,
        completed,
        error,
        total: allForms.length
      };
    } catch (error) {
      console.error('Error obteniendo estado de cola:', error);
      return { pending: [], completed: [], error: [], total: 0 };
    }
  }, [openOfflineDB]);

  // Actualizar estado de formulario
  const updateFormStatus = useCallback(async (
    id: string, 
    status: OfflineFormData['status'], 
    lastError?: string
  ) => {
    try {
      const db = await openOfflineDB();
      const transaction = db.transaction([OFFLINE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORE_NAME);
      
      const form = await new Promise<OfflineFormData>((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      if (form) {
        form.status = status;
        if (lastError) form.lastError = lastError;
        if (status === 'pending') form.retryCount = (form.retryCount || 0) + 1;
        
        await new Promise<void>((resolve, reject) => {
          const request = store.put(form);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      db.close();
    } catch (error) {
      console.error('Error actualizando estado de formulario:', error);
    }
  }, [openOfflineDB]);

  // Enviar formulario (online o guardar offline)
  const submitForm = useCallback(async (
    formType: 'revision' | 'nota',
    data: any,
    onlineSubmitFunction: (data: any) => Promise<void>,
    images?: { [key: string]: File }
  ) => {
    setIsSubmitting(true);
    
    try {
      if (isOnline) {
        // Envío online directo
        console.log('🌐 Enviando formulario online...');
        await onlineSubmitFunction(data);
        showSuccess(`${formType === 'revision' ? 'Revisión' : 'Nota'} guardada exitosamente`);
      } else {
        // Guardar offline
        console.log('📱 Guardando formulario offline...');
        const offlineId = await saveOfflineForm(formType, data, images);
        showInfo(`${formType === 'revision' ? 'Revisión' : 'Nota'} guardada offline. Se enviará automáticamente cuando vuelva la conexión.`);
        
        // Actualizar estado de la cola
        const newStatus = await getQueueStatus();
        setQueueStatus(newStatus);
      }
    } catch (error) {
      console.error('Error enviando formulario:', error);
      
      if (isOnline) {
        // Si falló online, guardar offline como respaldo
        try {
          console.log('💾 Guardando como respaldo offline...');
          await saveOfflineForm(formType, data, images);
          showError(`Error al enviar ${formType}. Guardado offline como respaldo.`);
        } catch (offlineError) {
          showError(`Error al guardar ${formType}`);
        }
      } else {
        showError(`Error al guardar ${formType} offline`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isOnline, saveOfflineForm, getQueueStatus, showSuccess, showError, showInfo]);

  // Procesar cola de formularios pendientes
  const processOfflineQueue = useCallback(async () => {
    if (!isOnline) return;
    
    try {
      const status = await getQueueStatus();
      const pendingForms = status.pending;
      
      if (pendingForms.length === 0) return;
      
      console.log(`🔄 Procesando ${pendingForms.length} formularios offline pendientes...`);
      
      for (const form of pendingForms) {
        try {
          await updateFormStatus(form.id, 'uploading');
          
          // Aquí iría la lógica específica de envío según el tipo
          if (form.formType === 'revision') {
            // Lógica específica para revisiones
            // await submitRevision(form.data);
          } else if (form.formType === 'nota') {
            // Lógica específica para notas
            // await submitNota(form.data);
          }
          
          await updateFormStatus(form.id, 'completed');
          console.log(`✅ Formulario ${form.id} enviado exitosamente`);
                 } catch (error) {
           console.error(`❌ Error procesando formulario ${form.id}:`, error);
           const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
           await updateFormStatus(form.id, 'error', errorMessage);
        }
      }
      
      // Actualizar estado final
      const finalStatus = await getQueueStatus();
      setQueueStatus(finalStatus);
      
      if (finalStatus.pending.length === 0) {
        showSuccess('Todos los formularios offline han sido enviados');
      }
    } catch (error) {
      console.error('Error procesando cola offline:', error);
    }
  }, [isOnline, getQueueStatus, updateFormStatus, showSuccess]);

  // Limpiar formularios completados antiguos
  const cleanCompletedForms = useCallback(async (daysOld: number = 7) => {
    try {
      const db = await openOfflineDB();
      const transaction = db.transaction([OFFLINE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORE_NAME);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const allForms = await new Promise<OfflineFormData[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const toDelete = allForms.filter(form => 
        form.status === 'completed' && 
        new Date(form.timestamp) < cutoffDate
      );
      
      for (const form of toDelete) {
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(form.id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      db.close();
      console.log(`🗑️ Limpiados ${toDelete.length} formularios completados antiguos`);
    } catch (error) {
      console.error('Error limpiando formularios completados:', error);
    }
  }, [openOfflineDB]);

  // Efectos
  useEffect(() => {
    // Actualizar estado de la cola al montar
    getQueueStatus().then(setQueueStatus);
  }, [getQueueStatus]);

  useEffect(() => {
    // Procesar cola cuando vuelve la conexión
    if (isOnline && wasOffline) {
      console.log('🌐 Conexión restaurada, procesando cola offline...');
      processOfflineQueue();
    }
  }, [isOnline, wasOffline, processOfflineQueue]);

  useEffect(() => {
    // Limpiar formularios antiguos periódicamente
    const cleanupInterval = setInterval(() => {
      cleanCompletedForms();
    }, 24 * 60 * 60 * 1000); // Cada 24 horas
    
    return () => clearInterval(cleanupInterval);
  }, [cleanCompletedForms]);

  return {
    isSubmitting,
    isOnline,
    queueStatus,
    submitForm,
    processOfflineQueue,
    getQueueStatus,
    cleanCompletedForms
  };
} 