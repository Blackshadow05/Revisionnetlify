// 🚀 CODE SPLITTING: Skeleton optimizado para componentes lazy
import { memo } from 'react';

interface ComponentSkeletonProps {
  type?: 'card' | 'button' | 'text' | 'image';
  className?: string;
}

const ComponentSkeleton = memo(({ type = 'card', className = '' }: ComponentSkeletonProps) => {
  const baseClasses = 'animate-pulse';
  
  switch (type) {
    case 'card':
      return (
        <div className={`bg-gray-800/60 p-4 rounded-lg border border-gray-600/50 ${baseClasses} ${className}`}>
          <div className="h-4 bg-gray-600/20 rounded w-24 mb-2"></div>
          <div className="h-6 bg-gray-600/10 rounded w-32"></div>
        </div>
      );
    
    case 'button':
      return (
        <div className={`h-10 bg-gray-600/20 rounded-lg w-24 ${baseClasses} ${className}`}></div>
      );
    
    case 'text':
      return (
        <div className={`space-y-2 ${className}`}>
          <div className={`h-4 bg-gray-600/20 rounded w-full ${baseClasses}`}></div>
          <div className={`h-4 bg-gray-600/20 rounded w-3/4 ${baseClasses}`}></div>
        </div>
      );
    
    case 'image':
      return (
        <div className={`h-48 bg-gray-600/20 rounded-lg ${baseClasses} ${className}`}></div>
      );
    
    default:
      return (
        <div className={`h-4 bg-gray-600/20 rounded ${baseClasses} ${className}`}></div>
      );
  }
});

ComponentSkeleton.displayName = 'ComponentSkeleton';

export default ComponentSkeleton;