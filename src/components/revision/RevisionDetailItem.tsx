'use client';

import { memo, useState } from 'react';
import FadeIn from '@/components/ui/FadeIn';
import ClickableImage from '@/components/ui/ClickableImage';

interface RevisionDetailItemProps {
  fieldKey: string;
  value: any;
  label: string;
  delay: number;
}

const isImageUrl = (value: any) => 
  typeof value === 'string' && value.startsWith('https');

const RevisionDetailItem = memo<RevisionDetailItemProps>(({ fieldKey, value, label, delay }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);
  
  const handleImageClick = () => {
    if (isImageUrl(value)) {
      setModalImg(value);
      setModalOpen(true);
    }
  };
  const renderValue = () => {
    if (isImageUrl(value)) {
      return (
        <>
          <ClickableImage 
            src={value} 
            alt={`Evidencia de ${label}`}
            onClick={handleImageClick}
          />
          {modalOpen && modalImg && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setModalOpen(false)}>
              <div className="relative max-w-3xl max-h-[90vh] overflow-auto">
                <img src={modalImg} alt={`Evidencia de ${label} ampliada`} className="max-w-full h-auto" />
                <button 
                  className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2"
                  onClick={() => setModalOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      );
    }
    return (
      <p className="text-gray-300 break-words">
        {value || <span className="text-gray-500 italic">No especificado</span>}
      </p>
    );
  };

  return (
    <FadeIn delay={delay}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center border-b border-[#3d4659]/30 pb-4 last:border-0">
        <div className="md:col-span-1">
          <p className="font-semibold text-white capitalize">{label.replace(/_/g, ' ')}:</p>
        </div>
        <div className="md:col-span-2">
          <div className="bg-[#2a3347] p-2 rounded-md">
            {renderValue()}
          </div>
        </div>
      </div>
    </FadeIn>
  );
});

RevisionDetailItem.displayName = 'RevisionDetailItem';

export default RevisionDetailItem;
