import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getConsistentImageUrl } from '@/lib/cloudinary';

// Logger no-op para silenciar toda salida en consola desde este componente
const ImageModalLogger = {
  log: (_action: string, _details?: any) => {},
  error: (_action: string, _details?: any) => {}
};

interface Props {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  casita?: string;
  evidenciaNumber?: number;
  onClose: () => void;
}
type Point = { x: number; y: number };

export default function ImageModal({ isOpen, images, initialIndex = 0, casita, evidenciaNumber, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentImageUrl = images && images.length > 0 ? images[currentIndex] || null : null;

  // Logging al montar y cambiar props
  useEffect(() => {
    ImageModalLogger.log('ImageModal renderizado', {
      isOpen,
      imagesCount: images?.length || 0,
      initialIndex,
      currentIndex,
      currentImageUrl: currentImageUrl ? 'URL_PRESENT' : 'URL_NULL'
    });
  }, [isOpen, images, initialIndex, currentIndex, currentImageUrl]);

  // Logging al cambiar de imagen
  useEffect(() => {
    if (currentImageUrl) {
      ImageModalLogger.log('Cambiando a imagen', {
        currentIndex,
        imageUrl: currentImageUrl.substring(0, 100) + '...'
      });
    }
  }, [currentImageUrl, currentIndex]);

  // Resetear el índice actual cuando se abren nuevas imágenes
  useEffect(() => {
    if (isOpen && images && images.length > 0) {
      ImageModalLogger.log('Modal abierto - reseteando índice', {
        imagesCount: images.length,
        initialIndex,
        currentIndex
      });
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, images, initialIndex]);

  // Navegar a la imagen anterior
  const goToPrevious = () => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
  };

  // Navegar a la siguiente imagen
  const goToNext = () => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
  };

  // Manejar las teclas de flecha para navegación
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images?.length]);
  const modalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgWrapperRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ distance: 0, startScale: 1, center: { x: 0, y: 0 } });
  const [panStart, setPanStart] = useState({ x: 0, y: 0, startImageX: 0, startImageY: 0 });
  // Controles siempre visibles: mantener true
  const [showControls, setShowControls] = useState(true);

  // sizes for bounds calculation
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  const [contentSize, setContentSize] = useState({ w: 0, h: 0 });

  // Detectar dispositivo móvil con más precisión
  const isMobile = typeof window !== 'undefined' && (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );

  // Utils
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const computeBounds = useCallback(
    (scale: number) => {
      const vw = viewportSize.w;
      const vh = viewportSize.h;
      const cw = contentSize.w * scale;
      const ch = contentSize.h * scale;

      // Half overflow allowed in each direction; if content is smaller than viewport, keep centered (bound = 0)
      const maxX = Math.max(0, (cw - vw) / 2);
      const maxY = Math.max(0, (ch - vh) / 2);
      return { minX: -maxX, maxX, minY: -maxY, maxY };
    },
    [viewportSize, contentSize]
  );

  const constrainPosition = useCallback(
    (pos: Point, scale: number) => {
      const b = computeBounds(scale);
      return { x: clamp(pos.x, b.minX, b.maxX), y: clamp(pos.y, b.minY, b.maxY) };
    },
    [computeBounds]
  );

  // medir viewport y contenido (imagen contenedora) para calcular límites
  const measureSizes = useCallback(() => {
    const viewport = containerRef.current;
    const imgEl = imgWrapperRef.current?.querySelector('img') as HTMLImageElement | null;
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      setViewportSize({ w: rect.width, h: rect.height });
    }
    if (imgEl) {
      // object-contain dentro del wrapper: usar natural ratio y viewport para estimar render size base
      const vw = containerRef.current?.getBoundingClientRect().width || 0;
      const vh = containerRef.current?.getBoundingClientRect().height || 0;
      const imgAR = imgEl.naturalWidth && imgEl.naturalHeight ? imgEl.naturalWidth / imgEl.naturalHeight : 1;
      const viewAR = vw / vh || 1;

      let baseW = 0;
      let baseH = 0;
      if (imgAR > viewAR) {
        // limitado por ancho
        baseW = Math.min(vw, window.innerWidth - 32);
        baseH = baseW / imgAR;
      } else {
        // limitado por alto
        baseH = Math.min(vh, window.innerHeight - 32);
        baseW = baseH * imgAR;
      }
      setContentSize({ w: baseW, h: baseH });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    measureSizes();
    window.addEventListener('resize', measureSizes);
    return () => window.removeEventListener('resize', measureSizes);
  }, [isOpen, measureSizes]);

  // Manejar cambios en el estado de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Forzar re-render para actualizar el estado del botón
      setImageScale(prev => prev);
      // re-medir tamaños
      setTimeout(measureSizes, 50);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [measureSizes]);

  // Resetear estado al cambiar de imagen
  useEffect(() => {
    if (currentImageUrl) {
      ImageModalLogger.log('Reset estado al cambiar imagen', {
        imageUrl: currentImageUrl.substring(0, 50) + '...'
      });
      setIsLoading(true);
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
      // medir tras carga
      setTimeout(measureSizes, 0);
    }
  }, [currentImageUrl, measureSizes]);

  // Controles siempre visibles: no auto-ocultar
  useEffect(() => {
    if (!isOpen) return;
    setShowControls(true);
  }, [isOpen]);

  // Controles siempre visibles: noop
  const handleScreenTouch = useCallback(() => {
    setShowControls(true);
    return;
  }, []);

  // Focus management para accesibilidad
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
      // Ocultar botón de Nueva Revisión
      document.body.classList.add('image-modal-open');
    } else {
      document.body.style.overflow = 'unset';
      // Mostrar botón de Nueva Revisión
      document.body.classList.remove('image-modal-open');
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('image-modal-open');
    };
  }, [isOpen]);

  // Manejo de tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // tap vs double-tap handling
  const lastTapRef = useRef(0);
  const TAP_DELAY = 250;

  // Mantener foco del gesto al hacer pinch (evitar "saltos")
  const screenToImageSpace = (screen: Point, scale: number) => {
    // respecto al centro del viewport
    const cx = viewportSize.w / 2;
    const cy = viewportSize.h / 2;
    // posición relativa desde el centro del viewport, corregido por translate actual
    const relX = screen.x - cx - imagePosition.x;
    const relY = screen.y - cy - imagePosition.y;
    // convertir a espacio de contenido base (antes de escalar)
    return { x: relX / scale, y: relY / scale };
  };

  const preserveFocalWhileZoom = (newScale: number, focalScreen: Point) => {
    // calcular donde está el punto focal en espacio imagen para el scale actual
    const oldImageSpace = screenToImageSpace(focalScreen, imageScale);
    // calcular el vector que debe tener con el newScale para que coincida en pantalla
    const cx = viewportSize.w / 2;
    const cy = viewportSize.h / 2;
    const newX = focalScreen.x - cx - oldImageSpace.x * newScale;
    const newY = focalScreen.y - cy - oldImageSpace.y * newScale;

    const constrained = constrainPosition({ x: newX, y: newY }, newScale);
    setImageScale(newScale);
    setImagePosition(constrained);
  };

  // Manejo de gestos táctiles para zoom y pan
  // Robustecer detección de pinch: usar scale del TouchEvent cuando exista (iOS)
  const handleTouchStart = (e: React.TouchEvent) => {
    ImageModalLogger.log('Touch start iniciado', {
      touchesLength: e.touches.length,
      imageScale,
      isMobile
    });

    // Si el navegador reporta gesture scale (Safari iOS), utilizarlo como pista de pinch
    const touchEvent = e as React.TouchEvent & { scale?: number };
    const isPinchGesture = touchEvent.scale && touchEvent.scale !== 1;

    if (e.touches.length === 2 || isPinchGesture) {
      // Zoom con dos dedos
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      const t1 = e.touches[0];
      const t2 = e.touches[1] ?? e.touches[0]; // fallback si solo reporta un touch pero hay scale
      const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      const center = e.touches.length === 2
        ? { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
        : { x: t1.clientX, y: t1.clientY };

      

      setDragStart({ distance, startScale: imageScale, center });
      return;
    }

    if (e.touches.length === 1) {
      // gestionar simple tap vs pan
      if (imageScale > 1) {
        handleTouchStartPan(e);
      } else {
        // registrar posible tap
        const now = Date.now();
        const dt = now - lastTapRef.current;
        lastTapRef.current = now;
        if (dt <= TAP_DELAY) {
          // double-tap zoom toggle (al punto tocado)
          const touch = e.touches[0];
          const targetScale = imageScale === 1 ? 2 : 1;
          preserveFocalWhileZoom(targetScale, { x: touch.clientX, y: touch.clientY });
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // usar también e.scale si está disponible (Safari iOS)
    const touchEvent = e as React.TouchEvent & { scale?: number };
    const hasGestureScale = touchEvent.scale && touchEvent.scale !== 1;

    if ((e.touches.length === 2 || hasGestureScale) && isDragging) {
      // Zoom con dos dedos
      e.preventDefault();
      e.stopPropagation();

      const t1 = e.touches[0];
      const t2 = e.touches[1] ?? e.touches[0];
      const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      const center = e.touches.length === 2
        ? { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
        : { x: t1.clientX, y: t1.clientY };

      // Si el navegador provee scale, combínalo con la métrica de distancia para mayor sensibilidad
      let ratio = currentDistance / Math.max(1, dragStart.distance);
      if (hasGestureScale) {
        const gestureScale = Number(touchEvent.scale);
        // suavizar: media ponderada
        ratio = (ratio * 0.6) + (gestureScale * 0.4);
      }

      let scale = dragStart.startScale * ratio;
      const newScale = clamp(scale, 1, 4);

      // mantener el punto central estable
      preserveFocalWhileZoom(newScale, center);
      return;
    }

    if (e.touches.length === 1 && isPanning && imageScale > 1) {
      // Pan con un dedo
      handleTouchMovePan(e);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
    }
    // terminar pinch si ya no hay dos dedos
    if (e.touches.length < 2) {
      setIsDragging(false);
    }
    if (e.touches.length <= 1) {
      setIsPanning(false);
      // asegurar límites al finalizar
      setImagePosition((pos) => constrainPosition(pos, imageScale));
    }
  };

  // Manejo de deslizamiento (pan) con mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageScale > 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        startImageX: imagePosition.x,
        startImageY: imagePosition.y
      });
      (e.currentTarget as HTMLDivElement).style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && imageScale > 1) {
      e.preventDefault();
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;

      const next = {
        x: panStart.startImageX + deltaX,
        y: panStart.startImageY + deltaY
      };
      setImagePosition(constrainPosition(next, imageScale));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setImagePosition((pos) => constrainPosition(pos, imageScale));
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    setImagePosition((pos) => constrainPosition(pos, imageScale));
  };

  // Manejo de deslizamiento (pan) táctil
  const handleTouchStartPan = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && imageScale > 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        startImageX: imagePosition.x,
        startImageY: imagePosition.y
      });
    }
  };

  const handleTouchMovePan = (e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1 && imageScale > 1) {
      e.preventDefault();
      e.stopPropagation();
      const deltaX = e.touches[0].clientX - panStart.x;
      const deltaY = e.touches[0].clientY - panStart.y;

      const next = {
        x: panStart.startImageX + deltaX,
        y: panStart.startImageY + deltaY
      };
      setImagePosition(constrainPosition(next, imageScale));
    }
  };

  const handleTouchEndPan = (e: React.TouchEvent) => {
    if (e.touches.length <= 1) {
      setIsPanning(false);
      setImagePosition((pos) => constrainPosition(pos, imageScale));
    }
  };

  // Zoom con doble clic/toque en desktop (centrado en cursor)
  const handleDoubleClick = (e?: React.MouseEvent) => {
    const targetScale = imageScale === 1 ? 2 : 1;
    if (e) {
      preserveFocalWhileZoom(targetScale, { x: e.clientX, y: e.clientY });
    } else {
      setImageScale(targetScale);
      if (targetScale === 1) setImagePosition({ x: 0, y: 0 });
    }
  };

  // Wheel pinch (trackpads)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomIntensity = -e.deltaY * 0.002; // sensible
      const next = clamp(imageScale * (1 + zoomIntensity), 1, 4);
      preserveFocalWhileZoom(next, { x: e.clientX, y: e.clientY });
    }
  };

  // Descargar imagen
  const handleDownload = async () => {
    if (!currentImageUrl) return;

    try {
      const response = await fetch(currentImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evidencia_${new Date().getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // silenciado
    }
  };

  // Compartir imagen (Web Share API)
  const handleShare = async () => {
    if (!currentImageUrl || !navigator.share) return;

    try {
      const response = await fetch(currentImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'evidencia.jpg', { type: 'image/jpeg' });

      await navigator.share({
        title: 'Evidencia',
        text: 'Imagen de evidencia',
        files: [file]
      });
    } catch (error) {
      // silenciado
    }
  };

  // Pantalla completa
  const toggleFullscreen = async () => {
    if (!modalRef.current) return;

    try {
      if (!document.fullscreenElement) {
        // Entrar en pantalla completa
        await modalRef.current.requestFullscreen().catch(() => {});
      } else {
        // Salir de pantalla completa
        await document.exitFullscreen();
      }
    } catch (error) {
      // silenciado
    }
  };

  // Verificar si estamos en pantalla completa
  const isFullscreen = typeof document !== 'undefined' && !!document.fullscreenElement;

  if (!isOpen || !currentImageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Imagen ampliada"
      ref={modalRef}
      tabIndex={-1}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        } else {
          handleScreenTouch();
        }
      }}
      onTouchStart={handleScreenTouch}
    >
      {/* Indicador de carga */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* Controles superiores - Auto-ocultables en móvil */}
      {showControls && (
        <div className={`fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${isMobile ? 'pt-12' : ''}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/20"
                title="Cerrar (Escape)"
                aria-label="Cerrar modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Información de casita y evidencia */}
              {casita && (
                <div className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1">
                  <span className="text-white text-sm font-medium">
                    C.# {casita} - Evidencia {currentIndex + 1}
                    {images && images.length > 1 && ` (${currentIndex + 1}/${images.length})`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {/* Botón de pantalla completa */}
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/20"
                title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              >
                {isFullscreen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-5.25l5.25 5.25" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5M3.75 3.75l5.25 5.25m0 0l-5.25 5.25m5.25-5.25l5.25 5.25m-5.25-5.25h4.5m-4.5 0V3.75" />
                  </svg>
                )}
              </button>

              {/* Botón de descarga */}
              <button
                onClick={handleDownload}
                className="w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/20"
                title="Descargar imagen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Botón de compartir (solo si está disponible) */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleShare}
                  className="w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/20"
                  title="Compartir imagen"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controles de navegación - solo mostrar si hay más de una imagen */}
      {images && images.length > 1 && (
        <>
          {/* Botón anterior */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/20 z-50"
            title="Imagen anterior"
            aria-label="Imagen anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Botón siguiente */}
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/20 z-50"
            title="Imagen siguiente"
            aria-label="Imagen siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Contenedor de imagen con soporte para zoom y pan */}
      <div className="relative" ref={containerRef} onWheel={handleWheel}>
        <div
          ref={imgWrapperRef}
          className={`inline-block select-none ${imageScale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
          style={{
            // aplicar translate primero y luego scale para que los límites sean consistentes
            transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageScale})`,
            transformOrigin: 'center center',
            transition: isPanning || isDragging ? 'none' : 'transform 0.15s ease-out',
            // Forzar desactivar el zoom nativo del navegador en móviles para que el pinch sea capturado por nosotros
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          <img
            key={currentImageUrl} // Removido Date.now() para evitar recargas innecesarias
            src={getConsistentImageUrl(currentImageUrl)}
            alt="Imagen ampliada"
            className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none pointer-events-none ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            style={{
              maxWidth: 'calc(100vw - 2rem)',
              maxHeight: 'calc(100vh - 2rem)'
            }}
            onLoad={() => {
              ImageModalLogger.log('Imagen cargada exitosamente', {
                imageUrl: currentImageUrl?.substring(0, 50) + '...',
                isMobile,
                timestamp: Date.now()
              });
              setIsLoading(false);
              measureSizes();
            }}
            onError={(e) => {
              ImageModalLogger.error('Error al cargar imagen', {
                imageUrl: currentImageUrl,
                error: e,
                imageElement: e.currentTarget,
                isMobile,
                timestamp: Date.now()
              });
              
              // Si falla la carga con la URL consistente, intentar con la URL normalizada
              const target = e.target as HTMLImageElement;
              const consistentUrl = getConsistentImageUrl(currentImageUrl);
              if (target.src !== consistentUrl) {
                target.src = consistentUrl;
              } else {
                // Como último recurso, intentar con la URL original
                if (target.src !== currentImageUrl) {
                  target.src = currentImageUrl;
                } else {
                  setIsLoading(false);
                }
              }
            }}
          />
        </div>
      </div>

      {/* Controles inferiores - Auto-ocultables en móvil */}
      {showControls && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300">
          <div className="flex justify-center items-center gap-4">
            {/* Botón de zoom OUT */}
            <button
              onClick={() => {
                const next = Math.max(1, imageScale - 0.25);
                // zoom al centro de la pantalla en botones
                preserveFocalWhileZoom(next, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
              }}
              disabled={imageScale <= 1}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm border ${
                imageScale <= 1
                  ? 'bg-gray-600/40 text-gray-400 border-gray-500/30 cursor-not-allowed'
                  : 'bg-black/60 hover:bg-black/80 text-white border-white/20'
              }`}
              title="Reducir zoom"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>

            {/* Indicador de zoom */}
            <div className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1">
              <span className="text-white text-sm font-medium">
                {Math.round(imageScale * 100)}%
              </span>
            </div>

            {/* Botón de zoom IN */}
            <button
              onClick={() => {
                const next = Math.min(4, imageScale + 0.25);
                preserveFocalWhileZoom(next, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
              }}
              disabled={imageScale >= 4}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm border ${
                imageScale >= 4
                  ? 'bg-gray-600/40 text-gray-400 border-gray-500/30 cursor-not-allowed'
                  : 'bg-black/60 hover:bg-black/80 text-white border-white/20'
              }`}
              title="Aumentar zoom"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Botón de reseteo de zoom */}
            <button
              onClick={() => {
                setImageScale(1);
                setImagePosition({ x: 0, y: 0 });
              }}
              className="w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/20"
              title="Restablecer zoom"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          </div>
      )}
    </div>
  );
}

