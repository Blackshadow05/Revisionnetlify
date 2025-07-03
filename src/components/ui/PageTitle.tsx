'use client'

import React from 'react';

interface PageTitleProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses: Record<NonNullable<PageTitleProps['size']>, string> = {
  sm: 'text-2xl sm:text-3xl md:text-4xl',
  md: 'text-3xl sm:text-5xl lg:text-6xl',
  lg: 'text-4xl sm:text-6xl lg:text-7xl',
};

export default function PageTitle({ children, size = 'md', className = '' }: PageTitleProps) {
  return (
    <h1
      className={`${sizeClasses[size]} font-extrabold text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] leading-tight ${className}`}
    >
      {children}
    </h1>
  );
} 