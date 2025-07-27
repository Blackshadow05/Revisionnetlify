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
  refetchRevision: () => Promise<void>;
  refetchSecondaryData: () => Promise<void>;
}

export const useRevisionData = (revisionId: string | string[]): UseRevisionDataReturn => {
  const [revision, setRevision] = useState<Revision | null>(null);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [registroEdiciones, setRegistroEdiciones] = useState<RegistroEdicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar solo datos críticos (información principal)
  const fetchCriticalData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        throw new Error('No se pudo conectar con la base de datos');
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

  // Función para cargar datos secundarios (notas e historial)
  const fetchSecondaryData = useCallback(async () => {
    try {
      setSecondaryLoading(true);
      
      if (!supabase) return;

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
      }

      if (edicionesError) {
        console.warn('Error al cargar historial:', edicionesError);
      } else {
        setRegistroEdiciones(edicionesData || []);
      }

    } catch (error: any) {
      console.warn('Error al cargar datos secundarios:', error);
    } finally {
      setSecondaryLoading(false);
    }
  }, [revisionId]);

  // Cargar datos críticos inmediatamente
  useEffect(() => {
    if (revisionId) {
      fetchCriticalData();
    }
  }, [revisionId, fetchCriticalData]);

  // Cargar datos secundarios después de los críticos
  useEffect(() => {
    if (revision && !secondaryLoading) {
      // Pequeño delay para priorizar el render de datos críticos
      const timer = setTimeout(() => {
        fetchSecondaryData();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [revision, fetchSecondaryData, secondaryLoading]);

  return {
    revision,
    notas,
    registroEdiciones,
    loading,
    secondaryLoading,
    error,
    refetchRevision: fetchCriticalData,
    refetchSecondaryData: fetchSecondaryData
  };
};