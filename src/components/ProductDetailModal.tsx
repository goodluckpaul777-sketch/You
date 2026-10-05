import React, { useState } from 'react';
import { FabricProduct, StoreSettings } from '../types';
import { ImageCarousel } from './ImageCarousel';
import { LightboxModal } from './LightboxModal';
import { safeOpenUrl } from '../utils/formatters';
import { X, MessageCircle, ArrowRight, ShieldCheck, Check, Star, Sparkles, Plus, Shirt, Footprints, Scissors, MapPin, Truck } from 'lucide-react';

interface ProductDetailModalProps {
  product: FabricProduct | null;
  itemNumber?: number;
  settings: StoreSettings;
  defaultQuantity?: number;
  onClose: () => void;
  onAddToCart: (product: FabricProduct, quantity: number, selectedColor?: string) => void;
  onBuyNow: (product: FabricProduct, quantity: number, selectedColor?: string) => void;
  onOpenYardGuide: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  itemNumber = 1,
  settings,
  defaultQuantity = 1,
  onClose,
  onAddToCart,
  onBuyNow,
  onOpenYardGuide,
}) => {
  if (!product) return null;

  const unit = product.unitLabel || (product.mainSection === 'cloths' ? 'yard' : product.mainSection === 'shoes' ? 'pair' : 'machine');
  const [quantity, setQuantity] = useState<number>(Math.max(product.minimumOrder || 1, defaultQuantity));
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || 'Original');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  const images = (product.galleryImages && product.galleryImages.length > 0)
    ? product.galleryImages
    : [product.image];

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedColor);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  const handleWhatsAppInquiry = () => {
    const company = settings.storeName || 'Ayobami SAM Ventures';

    const codeTag = product.productCode ? ` (Design Code: #${product.productCode})` : '';
    const message = `Hello, ${company}

- Type of Clothes: ${product.name}${codeTag}
- Item Number: #${itemNumber}

I want to place an order.`;

    const url = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`;
    safeOpenUrl(url);
  };

  const handleOpenLightbox = (index: number) => {
    setLightboxInitialIndex(index);
    setIsLightboxOpen(true);
  };

  const getSectionName = () => {
    if (product.mainSection === 'shoes') return 'Shoes & Bags';
    if (product.mainSection === 'tailoring-machine') return 'Tailoring Machine';
    return 'Cloths & Fabrics';
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex justify-center items-center p-3 sm:p-5 md:p-8 animate-fadeIn">
        
        <div 
          className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border-2 border-[#D4AF37]/40 overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="px-6 py-4 bg-[#0F2E22] text-white flex items-center justify-between border-b border-[#D4AF37]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#D4AF37] bg-white/10 border border-[#D4AF37] px-3 py-1 rounded-md shadow">
                Code: #{product.productCode || product.id.replace(/^asv-/, '').toUpperCase()}
              </span>
              <span className="text-xs text-gray-300 font-bold hidden sm:inline">
                {product.category}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-white text-[#0F2E22] font-black text-xs transition-colors shadow cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                <span>← Back to Home Page</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body (Spacious Two-Column Grid) */}
          <div className="p-6 sm:p-8 md:p-10 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              
              {/* Left Column: Jumia-Style Touch Carousel */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-[#FAF8F5] p-3 rounded-3xl border border-[#E8E2D9] shadow-inner">
                  <ImageCarousel
                    images={images}
                    altText={product.name}
                    variant="detail"
                    aspectRatio="square"
                    showThumbnails={true}
                    showArrows={true}
                    showIndicators={true}
                    showBadge={true}
                    onImageClick={(idx) => handleOpenLightbox(idx)}
                  />
                </div>

                <p className="text-center text-[11px] font-bold text-gray-400">
                  📱 Swipe left/right to browse all photos • Tap picture to enlarge fullscreen
                </p>
              </div>

              {/* Right Column: Information & WhatsApp Direct Quote */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Title & Section */}
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-[#D4AF37] block">
                      {product.category}
                    </span>
                    {product.isWholesaleAvailable && product.mainSection !== 'tailoring-machine' && (
                      <span className="text-[10px] sm:text-xs font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-md">
                        Wholesale & Retail Available
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0F2E22] tracking-tight mt-1 leading-tight">
                    {product.name}
                  </h2>
                </div>

                {/* Material / Machine Spec Box */}
                {product.fabricType && (
                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D9] space-y-1 text-xs">
                    <span className="text-[10.5px] uppercase font-black tracking-wider text-gray-400 block">
                      Specification / Material Grade
                    </span>
                    <p className="text-sm font-black text-[#0F2E22]">
                      {product.fabricType}
                    </p>
                    {product.origin && (
                      <p className="text-[11px] text-gray-500 font-semibold">
                        Origin: {product.origin}
                      </p>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
                    Product Description
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Colors / Variations */}
                {product.colors && product.colors.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#0F2E22] block">
                      Select Color / Style Option:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                            selectedColor === color
                              ? 'bg-[#0F2E22] text-white border-[#0F2E22] shadow'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-[#0F2E22] block">
                      Select Quantity ({unit}s):
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Wholesale cartons & single cuts available
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-300">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 font-black text-base flex items-center justify-center text-gray-800"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-black text-base text-[#0F2E22]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 font-black text-base flex items-center justify-center text-gray-800"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons (Direct WhatsApp & Inquiry Bag) */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppInquiry}
                    className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
                  >
                    <MessageCircle className="w-5 h-5 fill-current" />
                    <span>INQUIRE PRICE & ORDER ON WHATSAPP</span>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className={`py-3.5 px-4 rounded-xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                        addedSuccess
                          ? 'bg-emerald-100 border-emerald-600 text-emerald-800'
                          : 'border-[#0F2E22] text-[#0F2E22] hover:bg-[#0F2E22] hover:text-white'
                      }`}
                    >
                      {addedSuccess ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{addedSuccess ? 'Added to Bag!' : 'Add to Inquiry Bag'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleAddToCart();
                        onClose();
                      }}
                      className="py-3.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Review My Bag</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-3 text-xs font-semibold text-gray-600">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Authentic Stock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#D4AF37]" />
                    <span>Nationwide Park Courier & Doorstep</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Fullscreen Lightbox Modal */}
      <LightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={images}
        initialIndex={lightboxInitialIndex}
        productName={product.name}
      />
    </>
  );
};
