'use client';

import React from 'react';

interface ViewToggleProps {
  currentView: 'table' | 'card';
  onViewChange: (view: 'table' | 'card') => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-gradient-to-br from-[#1e2538]/80 to-[#2a3347]/80 backdrop-blur-md rounded-xl border border-[#3d4659]/50 p-1">
      <button
        onClick={() => onViewChange('table')}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 font-medium text-sm
          ${currentView === 'table' 
            ? 'bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1a1f35] shadow-lg transform scale-[1.02]' 
            : 'text-gray-400 hover:text-white hover:bg-[#3d4659]/30'
          }
        `}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor" 
          className="w-4 h-4"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h17.25m0 0a1.125 1.125 0 001.125-1.125M3.375 19.5v-15.75m0 0a1.125 1.125 0 011.125-1.125h15.75m0 0a1.125 1.125 0 011.125 1.125v15.75m0 0H18.75m-2.25 0h.375a1.125 1.125 0 001.125-1.125V4.875a1.125 1.125 0 00-1.125-1.125H3.375A1.125 1.125 0 002.25 4.875v12.75a1.125 1.125 0 001.125 1.125zm10.5-1.125a.375.375 0 00.375-.375V8.25a.375.375 0 00-.375-.375h-3.75a.375.375 0 00-.375.375v8.625a.375.375 0 00.375.375h3.75z" 
          />
        </svg>
        Tabla
      </button>
      
      <button
        onClick={() => onViewChange('card')}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 font-medium text-sm
          ${currentView === 'card' 
            ? 'bg-gradient-to-r from-[#c9a45c] to-[#f0c987] text-[#1a1f35] shadow-lg transform scale-[1.02]' 
            : 'text-gray-400 hover:text-white hover:bg-[#3d4659]/30'
          }
        `}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor" 
          className="w-4 h-4"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m-15 0A2.25 2.25 0 002.25 12v6.75A2.25 2.25 0 004.5 20.25H9M15 20.25h4.5A2.25 2.25 0 0021.75 18v-6.75A2.25 2.25 0 0019.5 9.878v0M15 20.25v-5.25a1.5 1.5 0 00-1.5-1.5h-3a1.5 1.5 0 00-1.5 1.5v5.25m6 0h-6" 
          />
        </svg>
        Tarjetas
      </button>
    </div>
  );
}