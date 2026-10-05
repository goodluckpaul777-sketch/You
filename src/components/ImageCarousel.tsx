import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Layers } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  altText: string;
  variant?: 'card' | 'detail';
  aspectRatio?: 'square' | 'portrait' | 'auto';
  onImageClick?: (index: number) => void;
  showThumbnails?: boolean;
  showArrows?: boolean;
  showIndicators?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  altText,
  variant = 'detail',
  aspectRatio = 'square',
  onImageClick,
  showThumbnails = true,
  showArrows = true,
  showIndicators = true,
  showBadge = true,
  className = '',
}) => {
  const safeImages = images && images.length > 0 && images.some(Boolean) 
    ? images.filter(Boolean) 
    : ['/hero-logo.png'];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync index if safeImages changes
  useEffect(() => {
    if (currentIndex >= safeImages.length) {
      setCurrentIndex(0);
    }
  }, [safeImages.length, currentIndex]);

  const goToIndex = (idx: number) => {
    const nextIdx = Math.max(0, Math.min(safeImages.length - 1, idx));
    setCurrentIndex(nextIdx);
    setDragOffset(0);
  };

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentIndex < safeImages.length - 1) {
      goToIndex(currentIndex + 1);
    } else {
      goToIndex(0); // loop
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    } else {
      goToIndex(safeImages.length - 1); // loop
    }
  };

  // Touch event handlers for mobile gliding
  const handleTouchStart = (e: React.TouchEvent) => {
    if (safeImages.length <= 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || safeImages.length <= 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    // Detect if this is horizontal intent vs vertical page scrolling
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 5) {
        isHorizontalSwipeRef.current = true;
      } else if (Math.abs(diffY) > 5) {
        isHorizontalSwipeRef.current = false;
      }
    }

    if (isHorizontalSwipeRef.current === true) {
      // Prevent browser default back/forward gestures when gliding
      if (e.cancelable) {
        // e.preventDefault();
      }
      // Apply rubber banding at extremes
      if ((currentIndex === 0 && diffX > 0) || (currentIndex === safeImages.length - 1 && diffX < 0)) {
        setDragOffset(diffX * 0.35);
      } else {
        setDragOffset(diffX);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (isHorizontalSwipeRef.current === true) {
      const containerWidth = containerRef.current?.offsetWidth || 300;
      const threshold = containerWidth * 0.18; // 18% drag triggers slide

      if (dragOffset < -threshold && currentIndex < safeImages.length - 1) {
        goToIndex(currentIndex + 1);
      } else if (dragOffset > threshold && currentIndex > 0) {
        goToIndex(currentIndex - 1);
      } else if (dragOffset < -threshold && currentIndex === safeImages.length - 1) {
        goToIndex(0); // loop
      } else if (dragOffset > threshold && currentIndex === 0) {
        goToIndex(safeImages.length - 1); // loop
      } else {
        setDragOffset(0);
      }
    } else {
      setDragOffset(0);
    }
    isHorizontalSwipeRef.current = null;
  };

  const handleMainClick = (e: React.MouseEvent) => {
    // If it was just a drag, don't trigger click
    if (Math.abs(dragOffset) > 5) return;
    if (onImageClick) {
      e.stopPropagation();
      onImageClick(currentIndex);
    }
  };

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'portrait'
      ? 'aspect-[4/5]'
      : 'aspect-auto min-h-[260px]';

  return (
    <div className={`flex flex-col select-none ${className}`}>
      {/* Carousel Main Stage */}
      <div
        ref={containerRef}
        className={`relative w-full ${aspectClass} overflow-hidden rounded-2xl bg-[#F8F5F0] border border-[#E2D9CE] group cursor-pointer`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleMainClick}
      >
        {/* Sliding Track */}
        <div
          className="flex w-full h-full"
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {safeImages.map((imgUrl, idx) => {
            if (!imgUrl) return null;
            return (
              <div
                key={idx}
                className="w-full h-full shrink-0 flex items-center justify-center bg-white relative overflow-hidden"
              >
                <img
                  src={imgUrl}
                  alt={`${altText} view ${idx + 1}`}
                  className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-300"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('hero-logo.png')) {
                      target.src = '/hero-logo.png';
                    }
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Hover / Tap Zoom Icon in Detail Mode */}
        {variant === 'detail' && onImageClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(currentIndex);
            }}
            className="absolute bottom-3 right-3 z-20 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs shadow-md opacity-90 transition-all flex items-center gap-1 text-[11px] font-bold"
            title="Tap for Fullscreen Fabric Inspection"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Tap to Zoom</span>
          </button>
        )}

        {/* Photo Count Pill */}
        {showBadge && safeImages.length > 1 && (
          <div className="absolute bottom-3 left-3 z-20 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm pointer-events-none">
            <Layers className="w-3 h-3 text-[#D4A373]" />
            <span>
              {currentIndex + 1}/{safeImages.length}
            </span>
          </div>
        )}

        {/* Desktop Navigation Chevrons */}
        {showArrows && safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#1B4332] shadow-md flex items-center justify-center transition-all ${
                variant === 'card' ? 'opacity-0 group-hover:opacity-100' : 'opacity-80 hover:opacity-100'
              }`}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={nextImage}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#1B4332] shadow-md flex items-center justify-center transition-all ${
                variant === 'card' ? 'opacity-0 group-hover:opacity-100' : 'opacity-80 hover:opacity-100'
              }`}
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dot Indicators on Card Overlay */}
        {variant === 'card' && showIndicators && safeImages.length > 1 && (
          <div 
            className="absolute bottom-2.5 inset-x-0 flex justify-center items-center gap-1.5 z-20 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {safeImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToIndex(idx);
                }}
                className={`transition-all rounded-full ${
                  currentIndex === idx
                    ? 'w-4 h-1.5 bg-[#E63946] shadow-xs'
                    : 'w-1.5 h-1.5 bg-white/80 hover:bg-white border border-black/20'
                }`}
                aria-label={`View photo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Mode: External Indicators ● ○ ○ ○ */}
      {variant === 'detail' && showIndicators && safeImages.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-3 mb-1">
          {safeImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goToIndex(idx)}
              className={`transition-all rounded-full ${
                currentIndex === idx
                  ? 'w-7 h-2 bg-[#E07A5F] shadow-xs'
                  : 'w-2 h-2 bg-[#D8CFC4] hover:bg-[#B07D38]'
              }`}
              aria-label={`Show picture ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Detail Mode: Thumbnails Bar (Jumia & Nigerian fabric roll browsing) */}
      {variant === 'detail' && showThumbnails && safeImages.length > 1 && (
        <div className="mt-2.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 px-0.5 no-scrollbar">
            {safeImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToIndex(idx);
                }}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                  currentIndex === idx
                    ? 'border-[#E07A5F] ring-2 ring-[#E07A5F]/30 scale-105 shadow-sm'
                    : 'border-[#E2D9CE] hover:border-[#1B4332] opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('hero-logo.png')) {
                      target.src = '/hero-logo.png';
                    }
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
