'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  className?: string;
  label?: string;
}

const BackButton = memo(({ className = '', label = 'Volver' }: BackButtonProps) => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={`group flex items-center gap-3 px-4 py-2 bg-[#c9a45c] hover:bg-[#b8934d] rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${className}`}
    >
      <div className="w-8 h-8 flex items-center justify-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-[#1a1f35] transition-transform duration-200 group-hover:-translate-x-0.5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </div>
      <span className="text-[#1a1f35] font-semibold">{label}</span>
    </button>
  );
});

BackButton.displayName = 'BackButton';

export default BackButton;