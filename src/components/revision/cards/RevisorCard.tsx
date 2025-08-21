'use client';

import { memo } from 'react';
import FadeIn from '@/components/ui/FadeIn';

interface RevisorCardProps {
  value: string;
}

const RevisorCard = memo(({ value }: RevisorCardProps) => {
  return (
    <FadeIn delay={300}>
      <div className="bg-[#1e2538]/90 p-6 rounded-xl border border-[#3d4659]/50 shadow-lg hover:shadow-xl transform transition-transform duration-200 hover:scale-[1.01] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -translate-y-6 translate-x-6"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-green-400">Revisado por</h3>
          </div>
          <p className="text-xl font-bold text-white drop-shadow-lg">
            {value || <span className="text-gray-400 italic text-base">Sin información</span>}
          </p>
        </div>
      </div>
    </FadeIn>
  );
});

RevisorCard.displayName = 'RevisorCard';

export default RevisorCard;