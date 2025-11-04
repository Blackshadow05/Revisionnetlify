'use client';

import { memo } from 'react';
import { getConsistentImageUrl } from '@/lib/cloudinary';

interface ClickableImageProps {
  src: string;
  alt: string;
  onClick: () => void;
  className?: string;
  containerClassName?: string;
  showZoomIcon?: boolean;
}

const ClickableImage = memo(({
  src,
  alt,
  onClick,
  className = "w-full h-48 object-cover rounded-lg",
  containerClassName = "relative group cursor-pointer",
  showZoomIcon = true
}: ClickableImageProps) => {
  if (!src) {
    return (
      <div className={`${containerClassName} bg-gray-700/40 flex items-center justify-center`}>
        <div className="text-gray-500 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Sin imagen</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName} onClick={onClick}>
      <img
        src={getConsistentImageUrl(src)}
        alt={alt}
        loading="lazy"
        decoding="async"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        fetchPriority="low"
        className={`${className} transform transition-transform duration-200 group-hover:scale-[1.02]`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          // Si falla la carga con la URL consistente, intentar con la URL normalizada
          const consistentUrl = getConsistentImageUrl(src);
          if (target.src !== consistentUrl) {
            target.src = consistentUrl;
          } else {
            // Como último recurso, intentar con la URL original
            if (target.src !== src) {
              target.src = src;
            } else {
              // Reemplazar con un SVG placeholder en base64
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBWODBIODBWNjBaIiBmaWxsPSIjNEI1NTYzIi8+CjxwYXRoIGQ9Ik04MCA4OEgxMjBWMTA4SDgwVjg4WiIgZmlsbD0iIzRCNTU2MyIvPgo8cGF0aCBkPSJNODAgMTE2SDEyMFYxMzZIODBWMTE2WiIgZmlsbD0iIzRCNTU2MyIvPgo8L3N2Zz4K';
            }
          }
        }}
      />
      
      {showZoomIcon && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
});

ClickableImage.displayName = 'ClickableImage';

export default ClickableImage;