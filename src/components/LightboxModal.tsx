import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { resolveProductImage } from '../utils/fabricImages';

interface LightboxModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  productName: string;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  images,
  initialIndex = 0,
  productName,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomLevel(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  const nextImage = () => {
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 40) {
      nextImage();
    } else if (diff < -40) {
      prevImage();
    }
    setTouchStartX(null);
  };

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fadeIn">
      {/* Top Bar */}
      <div className="p-4 flex items-center justify-between text-white border-b border-white/10 bg-black/40 z-20">
        <div>
          <h4 className="text-sm font-bold text-gray-200 line-clamp-1">{productName}</h4>
          <p className="text-xs text-gray-400">
            Fabric Detail Inspection • Image {currentIndex + 1} of {images.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <button
            onClick={() => setZoomLevel((prev) => Math.min(prev + 0.5, 3))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoomLevel((prev) => Math.max(prev - 0.5, 1))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          {zoomLevel > 1 && (
            <button
              onClick={() => setZoomLevel(1)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-2"
            title="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport with Touch Handling */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden p-2 sm:p-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Chevrons on Desktop */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all active:scale-95"
              aria-label="Previous fabric photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all active:scale-95"
              aria-label="Next fabric photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Scaled Image */}
        <div 
          className="w-full h-full flex items-center justify-center cursor-zoom-in"
          onClick={toggleZoom}
        >
          <img
            src={images[currentIndex] || '/hero-logo.png'}
            alt={`${productName} view ${currentIndex + 1}`}
            style={{
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.25s ease-out',
            }}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('hero-logo.png')) {
                target.src = '/hero-logo.png';
              }
            }}
          />
        </div>
      </div>

      {/* Bottom Thumbnail Strip & Indicator */}
      <div className="p-4 bg-black/60 border-t border-white/10 z-20 flex flex-col items-center gap-3">
        {/* Dot Indicators */}
        <div className="flex items-center gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setZoomLevel(1);
                setCurrentIndex(idx);
              }}
              className={`transition-all rounded-full ${
                currentIndex === idx
                  ? 'w-6 h-2 bg-[#E07A5F]'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
              title={`Jump to photo ${idx + 1}`}
            />
          ))}
        </div>

        {/* Thumbnail Preview Row */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 px-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setZoomLevel(1);
                  setCurrentIndex(idx);
                }}
                className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                  currentIndex === idx
                    ? 'border-[#E07A5F] scale-105 shadow-md'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img 
                  src={resolveProductImage(img, productName)} 
                  alt={`Thumb ${idx + 1}`} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('hero-logo.png')) {
                      target.src = '/hero-logo.png';
                      target.className = 'w-full h-full object-contain p-1 opacity-50';
                    }
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
