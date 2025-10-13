'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LazyInViewProps {
  children: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
  className?: string;
  placeholder?: React.ReactNode;
}

const DefaultPlaceholder: React.FC = () => (
  <div className="bg-[#2a3347] rounded-xl border border-[#c9a45c]/20 p-6 shadow-2xl h-96 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-[#c9a45c] border-t-transparent rounded-full animate-spin"></div>
      <span className="text-[#c9a45c] font-medium">Cargando...</span>
    </div>
  </div>
);

const LazyInView: React.FC<LazyInViewProps> = ({
  children,
  rootMargin = '150px',
  threshold = 0.1,
  once = true,
  className,
  placeholder,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let observer: IntersectionObserver | null = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setInView(true);
          if (once && observer) {
            observer.disconnect();
          }
        } else if (!once) {
          setInView(false);
        }
      },
      { root: null, rootMargin, threshold }
    );

    observer.observe(node);
    return () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };
  }, [rootMargin, threshold, once]);

  return (
    <div ref={ref} className={className}>
      {inView ? children : (placeholder ?? <DefaultPlaceholder />)}
    </div>
  );
};

export default LazyInView;