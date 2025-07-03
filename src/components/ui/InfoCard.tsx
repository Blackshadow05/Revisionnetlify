'use client'

import React from 'react';

interface InfoCardProps {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  editable?: boolean;
  accent?: 'default' | 'success' | 'error';
  onChange?: (val: string) => void;
  placeholder?: string;
}

const accentText: Record<NonNullable<InfoCardProps['accent']>, string> = {
  default: 'text-gray-300',
  success: 'text-green-400',
  error: 'text-red-400',
};

export default function InfoCard({
  icon,
  label,
  value,
  editable = false,
  accent = 'default',
  onChange,
  placeholder = 'Sin información',
}: InfoCardProps) {
  return (
    <div className="bg-gradient-to-br from-[#1e2538]/70 to-[#2a3347]/70 p-4 rounded-xl border border-[#3d4659]/40 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 motion-safe:transition-transform">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-gradient-to-br from-[#c9a45c] to-[#f0c987] rounded-lg flex items-center justify-center shadow">
          {icon ?? (
            <svg aria-hidden="true" className="w-4 h-4 text-[#1a1f35]" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="6" />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-[#c9a45c] to-[#f0c987] bg-clip-text text-transparent">
          {label}
        </h3>
      </div>
      {editable ? (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full px-3 py-2 bg-[#1e2538]/80 border border-[#3d4659]/60 rounded-lg text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/40 focus:border-[#c9a45c]/40 transition-all"
          placeholder={placeholder}
        />
      ) : (
        <p className={`font-medium break-words ${accentText[accent]}`}>
          {value ? value : <span className="text-gray-500 italic">{placeholder}</span>}
        </p>
      )}
    </div>
  );
} 