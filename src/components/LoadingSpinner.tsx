import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
  showText?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = 'h-10 w-10', showText = true }) => {
  return (
    <div className="flex justify-center items-center h-full">
      <svg 
        className={`animate-spin -ml-1 mr-3 text-white ${className}`}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        ></circle>
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {showText && <span className="text-lg text-white">Cargando datos...</span>}
    </div>
  );
};

export default LoadingSpinner; 