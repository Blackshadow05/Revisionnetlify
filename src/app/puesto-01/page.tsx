'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const Puesto01Client = dynamic(
  () => import('@/components/puesto/Puesto01Client'),
  { 
    ssr: false,
    loading: () => (
    <div className="min-h-screen p-4 md:p-8" style={{
      background: '#334d50',
      backgroundImage: 'linear-gradient(to left, #cbcaa5, #334d50)'
    }}>
      <main className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a45c]"></div>
            <span className="ml-3 text-white">Cargando Interfaz...</span>
          </div>
      </main>
    </div>
    )
  }
  );

function formateaFechaAmigable(fechaStr: string) {
  // Espera formato: YYYY-MM-DD HH:mm:ss
  const [fecha, hora] = fechaStr.split(' ');
  if (!fecha || !hora) return fechaStr;
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio} ${hora}`;
}

export default function Puesto01Page() {
  const [ultimaHora, setUltimaHora] = useState<string | null>(null);
  const nombrePagina = 'puesto-01';

  // Función para obtener la última hora guardada
  const obtenerUltimoGuardado = async () => {
    const { data, error } = await supabase
      .from('Ultimos_guardados')
      .select('Fecha')
      .eq('id', 1)
      .single();
    if (!error && data?.Fecha) setUltimaHora(data.Fecha);
  };

  // Función para guardar la hora local y nombre de página
  const guardarUltimoGuardado = async () => {
    const ahora = new Date();
    // Formato: YYYY-MM-DD HH:mm:ss
    const fechaISO = ahora.toISOString().slice(0, 19).replace('T', ' ');
    await supabase
      .from('Ultimos_guardados')
      .upsert([
        { id: 1, Fecha: fechaISO, Dato_guardado: nombrePagina }
      ], { onConflict: 'id' });
    setUltimaHora(fechaISO);
  };

  useEffect(() => {
    obtenerUltimoGuardado();
  }, []);

  return <Puesto01Client />;
}