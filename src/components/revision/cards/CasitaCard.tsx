'use client';

import { memo } from 'react';
import FadeIn from '@/components/ui/FadeIn';
import LoadingButton from '@/components/ui/LoadingButton';

interface CasitaCardProps {
  value: string;
  isEditing?: boolean;
  editedData?: any;
  onInputChange?: (value: string) => void;
  onSaveEdit?: () => void;
  isSubmitting?: boolean;
  user?: string | null;
}

const CasitaCard = memo(({ 
  value, 
  isEditing, 
  editedData, 
  onInputChange, 
  onSaveEdit, 
  isSubmitting, 
  user 
}: CasitaCardProps) => {
  return (
    <FadeIn delay={100}>
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xl shadow-gray-200/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-[#c9a45c]/10 rounded-full -translate-y-6 translate-x-6"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[#c9a45c] rounded-lg flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-gray-800">Casita</h3>
          </div>
          {isEditing && user ? (
            <>
              <input
                type="text"
                value={String(editedData?.casita ?? value ?? '')}
                onChange={(e) => onInputChange?.(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-950 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-[#c9a45c]/50 transition-colors"
                placeholder="Editar casita..."
              />
              <div className="flex justify-end mt-3">
                <LoadingButton onClick={onSaveEdit || (() => {})} loading={isSubmitting} variant="success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Actualizar
                </LoadingButton>
              </div>
            </>
          ) : (
            <p className="text-2xl sm:text-4xl font-black text-[#c9a45c]">
              {value || <span className="text-gray-500 italic text-lg">Sin información</span>}
            </p>
          )}
        </div>
      </div>
    </FadeIn>
  );
});

CasitaCard.displayName = 'CasitaCard';

export default CasitaCard;