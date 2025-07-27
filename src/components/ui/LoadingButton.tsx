'use client';

import { memo, ReactNode } from 'react';

interface LoadingButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
}

const LoadingButton = memo(({
  onClick,
  loading = false,
  disabled = false,
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button'
}: LoadingButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-[#c9a45c] hover:bg-[#b8934d] text-[#1a1f35] focus:ring-[#c9a45c]/50',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500/50',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500/50',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/50'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      )}
      {children}
    </button>
  );
});

LoadingButton.displayName = 'LoadingButton';

export default LoadingButton;