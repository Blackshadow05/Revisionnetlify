'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Revision {
  id: number;
  casita: string;
  quien_revisa: string;
  caja_fuerte: string;
  puertas_ventanas: string;
  chromecast: string;
  binoculares: string;
  trapo_binoculares: string;
  speaker: string;
  usb_speaker: string;
  controles_tv: string;
  secadora: string;
  accesorios_secadora: string;
  steamer: string;
  bolsa_vapor: string;
  plancha_cabello: string;
  bulto: string;
  sombrero: string;
  bolso_yute: string;
  camas_ordenadas: string;
  cola_caballo: string;
  evidencia_01: string;
  evidencia_02: string;
  evidencia_03: string;
  notas: string;
  created_at: string;
}

interface Nota {
  id: string;
  fecha: string;
  Casita: string;
  revision_id: string;
  nota: string;
  Evidencia: string;
  Usuario: string;
  created_at: string;
}

interface RegistroEdicion {
  id?: string;
  created_at?: string;
  "Usuario que Edito": string;
  Dato_anterior: string;
  Dato_nuevo: string;
}

interface UseRevisionDataReturn {
  revision: Revision | null;
  notas: Nota[];
  registroEdiciones: RegistroEdicion[];
  loading: boolean;
  secondaryLoading: boolean;
  error: string | null;
  hasNotas: boolean;
  hasRegistroEdiciones: boolean;
  loadSecondaryData: () => Promise<void>;
  refetchRevision: () => Promise<void>;
  refetchSecondaryData: () => Promise<void>;
}

export const useRevisionData = (revisionId: string | string[] | undefined): UseRevisionDataReturn => {
  const [revision, setRevision] = useState<Revision | null>(null);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [registroEdiciones, setRegistroEdiciones] = useState<RegistroEdicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNotas, setHasNotas] = useState(false);
  const [hasRegistroEdiciones, setHasRegistroEdiciones] = useState(false);
  const [secondaryDataLoaded, setSecondaryDataLoaded] = useState(false);

  // Función para cargar solo datos críticos (información principal)
  const fetchCriticalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase || !revisionId) {
        throw new Error('No se pudo conectar con la base de datos o ID de revisión no válido');
      }

      const { data: revisionData, error: revisionError } = await supabase
        .from('revisiones_casitas')
        .select('*')
        .eq('id', revisionId)
        .single();

      if (revisionError) throw revisionError;

      setRevision(revisionData);
    } catch (error: any) {
      console.error('Error al cargar datos críticos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [revisionId]);

  // Función para verificar si existen datos secundarios (solo conteo)
  const checkSecondaryDataExists = useCallback(async () => {
    try {
      if (!supabase || !revisionId) return;

      // Solo verificar si existen datos, no cargarlos
      const [
        { count: notasCount, error: notasError },
        { count: edicionesCount, error: edicionesError }
      ] = await Promise.all([
        supabase
          .from('Notas')
          .select('*', { count: 'exact', head: true })
          .eq('revision_id', String(revisionId)),

        supabase
          .from('Registro_ediciones')
          .select('*', { count: 'exact', head: true })
          .or(`Dato_anterior.like.[${revisionId}]%,Dato_nuevo.like.[${revisionId}]%`)
      ]);

      if (!notasError) {
        setHasNotas((notasCount || 0) > 0);
      }

      if (!edicionesError) {
        setHasRegistroEdiciones((edicionesCount || 0) > 0);
      }

    } catch (error: any) {
      console.warn('Error al verificar datos secundarios:', error);
    }
  }, [revisionId]);

  // Función para cargar datos secundarios (notas e historial) - solo cuando se necesiten
  const fetchSecondaryData = useCallback(async () => {
    try {
      setSecondaryLoading(true);
      
      if (!supabase || !revisionId) return;

      // Cargar datos no críticos en paralelo
      const [
        { data: notasData, error: notasError },
        { data: edicionesData, error: edicionesError }
      ] = await Promise.all([
        supabase
          .from('Notas')
          .select('*')
          .eq('revision_id', String(revisionId))
          .order('id', { ascending: false }),

        supabase
          .from('Registro_ediciones')
          .select('*')
          .or(`Dato_anterior.like.[${revisionId}]%,Dato_nuevo.like.[${revisionId}]%`)
          .order('created_at', { ascending: false })
      ]);

      if (notasError) {
        console.warn('Error al cargar notas:', notasError);
      } else {
        setNotas(notasData || []);
        setHasNotas((notasData || []).length > 0);
      }

      if (edicionesError) {
        console.warn('Error al cargar historial:', edicionesError);
      } else {
        setRegistroEdiciones(edicionesData || []);
        setHasRegistroEdiciones((edicionesData || []).length > 0);
      }

      setSecondaryDataLoaded(true);

    } catch (error: any) {
      console.warn('Error al cargar datos secundarios:', error);
    } finally {
      setSecondaryLoading(false);
    }
  }, [revisionId]);

  // Cargar datos críticos inmediatamente
  useEffect(() => {
    if (revisionId && revisionId !== undefined) {
      fetchCriticalData();
    }
  }, [revisionId, fetchCriticalData]);

  // Solo verificar si existen datos secundarios después de cargar datos críticos
  useEffect(() => {
    if (revision && !secondaryDataLoaded) {
      // Pequeño delay para priorizar el render de datos críticos
      const timer = setTimeout(() => {
        checkSecondaryDataExists();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [revision, checkSecondaryDataExists, secondaryDataLoaded]);

  return {
    revision,
    notas,
    registroEdiciones,
    loading,
    secondaryLoading,
    error,
    hasNotas,
    hasRegistroEdiciones,
    loadSecondaryData: fetchSecondaryData,
    refetchRevision: fetchCriticalData,
    refetchSecondaryData: fetchSecondaryData
  };
};