'use client';

import { memo, ReactNode, useEffect, useState } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

const FadeIn = memo(({
  children,
  delay = 0,
  duration = 300,
  className = ''
}: FadeInProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar si el usuario prefiere reducir el movimiento
    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (shouldReduceMotion) {
      // Si prefiere reducir el movimiento, mostrar inmediatamente sin animación
      setIsVisible(true);
    } else {
      // Si no, aplicar la animación con el retraso especificado
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [delay]);

  return (
    <div
      className={`transition-all ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
});

FadeIn.displayName = 'FadeIn';

export default FadeIn;