'use client';

import { memo } from 'react';
import FadeIn from '@/components/ui/FadeIn';

interface FechaCardProps {
  value: string;
  formatearFechaParaMostrar: (fechaISO: string) => string;
}

const FechaCard = memo(({ value, formatearFechaParaMostrar }: FechaCardProps) => {
  return (
    <FadeIn delay={200}>
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xl shadow-gray-200/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-6 translate-x-6"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-gray-800">Fecha de Revisión</h3>
          </div>
          <p className="text-lg sm:text-xl font-black text-blue-700">
            {value ? formatearFechaParaMostrar(value) : <span className="text-gray-500 italic text-base">Sin información</span>}
          </p>
        </div>
      </div>
    </FadeIn>
  );
});

FechaCard.displayName = 'FechaCard';

export default FechaCard;