'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  className?: string;
  label?: string;
  href?: string; // Si se proporciona, navega a esta ruta en lugar de history.back()
  iconOnly?: boolean; // Si true, renderiza solo la flecha (compacto)
  ariaLabel?: string; // Etiqueta accesible cuando es iconOnly
}

const BackButton = memo(({ className = '', label = 'Volver', href, iconOnly = false, ariaLabel }: BackButtonProps) => {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (href) {
          router.push(href);
        } else {
          router.back();
        }
      }}
      aria-label={ariaLabel || label}
      className={`group flex items-center ${iconOnly ? 'gap-0 p-2 rounded-lg' : 'gap-3 px-4 py-2 rounded-xl'} bg-[#c9a45c] hover:bg-[#b8934d] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${className}`}
    >
      <div className={iconOnly ? 'w-6 h-6 flex items-center justify-center' : 'w-8 h-8 flex items-center justify-center'}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`${iconOnly ? 'h-5 w-5' : 'h-5 w-5'} text-[#1a1f35] transition-transform duration-200 group-hover:-translate-x-0.5`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </div>
      {!iconOnly && <span className="text-[#1a1f35] font-semibold">{label}</span>}
    </button>
  );
});

BackButton.displayName = 'BackButton';

export default BackButton;