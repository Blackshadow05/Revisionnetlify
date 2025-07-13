'use client';

import dynamic from 'next/dynamic';
import React from 'react';

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

export default function Puesto01Page() {
  return <Puesto01Client />;
}