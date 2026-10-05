import React, { useState } from 'react';
import { FabricProduct, StoreSettings } from '../types';
import { ImageCarousel } from './ImageCarousel';
import { safeOpenUrl } from '../utils/formatters';
import { MessageCircle, Eye, Check, Star, ShieldCheck, Sparkles, Plus, Shirt, Footprints, Scissors } from 'lucide-react';

interface ProductCardProps {
  product: FabricProduct;
  itemNumber?: number;
  settings: StoreSettings;
  onOpenDetail: (product: FabricProduct, defaultQuantity?: number, itemNumber?: number) => void;
  onAddToCart: (product: FabricProduct, quantity: number, selectedColor?: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  itemNumber = 1,
  settings,
  onOpenDetail,
  onAddToCart,
}) => {
  const unit = product.unitLabel || (product.mainSection === 'cloths' ? 'yard' : product.mainSection === 'shoes' ? 'pair' : 'machine');
  const [selectedQty, setSelectedQty] = useState<number>(product.minimumOrder || 1);
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || 'Original');
  const [addedAnimation, setAddedAnimation] = useState(false);

  const images = (product.galleryImages && product.galleryImages.length > 0)
    ? product.galleryImages
    : [product.image];

  const handleAddToInquiry = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedQty, selectedColor);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleDirectWhatsAppInquiry = (e: React.MouseEvent) => {
    e.stopPropagation();
    const company = settings.storeName || 'Ayobami SAM Ventures';

    const codeTag = product.productCode ? ` (Design Code: #${product.productCode})` : '';
    const message = `Hello, ${company}

- Type of Clothes: ${product.name}${codeTag}
- Item Number: #${itemNumber}

I want to place an order.`;

    const url = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`;
    safeOpenUrl(url);
  };

  const getSectionIcon = () => {
    if (product.mainSection === 'shoes') return <Footprints className="w-3.5 h-3.5 text-[#D4AF37]" />;
    if (product.mainSection === 'tailoring-machine') return <Scissors className="w-3.5 h-3.5 text-[#D4AF37]" />;
    return <Shirt className="w-3.5 h-3.5 text-[#D4AF37]" />;
  };

  const getSectionName = () => {
    if (product.mainSection === 'shoes') return 'Shoes & Bags';
    if (product.mainSection === 'tailoring-machine') return 'Tailoring Machine';
    return 'Cloths & Fabrics';
  };

  return (
    <div 
      onClick={() => onOpenDetail(product, selectedQty, itemNumber)}
      className="group bg-white rounded-3xl border-2 border-[#E8E2D9] hover:border-[#D4AF37] shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer relative transform hover:-translate-y-1"
      id={`product-card-${product.id}`}
    >
      {/* Top Image Section with Swipeable Jumia Carousel */}
      <div>
        <div className="relative overflow-hidden bg-[#FAF8F5] rounded-t-3xl p-2 sm:p-3">
          <div className="rounded-2xl overflow-hidden shadow-inner">
            <ImageCarousel
              images={images}
              altText={product.name}
              variant="card"
              aspectRatio="square"
              showThumbnails={false}
              showArrows={true}
              showIndicators={true}
              showBadge={true}
              onImageClick={() => onOpenDetail(product, selectedQty, itemNumber)}
            />
          </div>

          {/* Design Code Overlay */}
          <div className="absolute top-5 left-5 z-20 pointer-events-none flex flex-col gap-1 items-start">
            <span className="bg-[#0F2E22] text-[#D4AF37] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-[#D4AF37] shadow">
              Code: #{product.productCode || product.id.replace(/^asv-/, '').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Card Content & Details (Compact & Sleek Tablet Style) */}
        <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3.5">
          
          {/* Header & Title */}
          <div>
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="text-[9.5px] sm:text-xs font-black uppercase tracking-wider text-[#D4AF37] block">
                {product.category}
              </span>
              {/* Wholesale & Retail Label (Moved Down, Excluded for Tailoring Machines) */}
              {product.isWholesaleAvailable && product.mainSection !== 'tailoring-machine' && (
                <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md">
                  Wholesale & Retail
                </span>
              )}
            </div>
            <h3 className="text-xs sm:text-base font-black text-[#0F2E22] group-hover:text-[#2D6A4F] transition-colors leading-snug mt-0.5 line-clamp-2">
              {product.name}
            </h3>
          </div>

          {/* Material / Spec Highlight */}
          {product.fabricType && (
            <div className="bg-[#FAF8F5] p-2 sm:p-2.5 rounded-xl border border-[#E8E2D9] text-[11px] sm:text-xs">
              <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-gray-400 block">
                Specification / Material
              </span>
              <span className="font-bold text-[#2D2A26] block mt-0.5 line-clamp-1">
                {product.fabricType}
              </span>
            </div>
          )}

          {/* Color / Variant Selector (if multi-color) */}
          {product.colors && product.colors.length > 1 && (
            <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 block">Colors / Variations:</span>
              <div className="flex flex-wrap gap-1">
                {product.colors.slice(0, 3).map((col, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md font-bold border transition-all ${
                      selectedColor === col
                        ? 'bg-[#0F2E22] text-white border-[#0F2E22]'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10.5px] sm:text-xs font-bold text-gray-600 truncate">
              Qty ({unit}s):
            </span>
            <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-lg border border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-white hover:bg-gray-200 font-black text-xs sm:text-sm flex items-center justify-center text-gray-700 shadow-xs"
              >
                -
              </button>
              <span className="w-6 sm:w-8 text-center font-black text-xs sm:text-sm text-[#0F2E22]">
                {selectedQty}
              </span>
              <button
                type="button"
                onClick={() => setSelectedQty(selectedQty + 1)}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-white hover:bg-gray-200 font-black text-xs sm:text-sm flex items-center justify-center text-gray-700 shadow-xs"
              >
                +
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Action Buttons (Sleek Touch Targets) */}
      <div className="p-3 sm:p-5 pt-0 space-y-2">
        <button
          type="button"
          onClick={handleDirectWhatsAppInquiry}
          className="w-full py-2.5 sm:py-3 px-3 rounded-xl sm:rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
          <span className="truncate">INQUIRE ON WHATSAPP</span>
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={handleAddToInquiry}
            className={`py-2 px-2.5 rounded-lg sm:rounded-xl border-2 font-bold text-[10.5px] sm:text-xs flex items-center justify-center gap-1 transition-all ${
              addedAnimation
                ? 'bg-emerald-100 border-emerald-600 text-emerald-800'
                : 'border-[#0F2E22] text-[#0F2E22] hover:bg-[#0F2E22] hover:text-white'
            }`}
          >
            {addedAnimation ? <Check className="w-3 h-3 shrink-0" /> : <Plus className="w-3 h-3 shrink-0" />}
            <span className="truncate">{addedAnimation ? 'Added!' : 'Add Bag'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDetail(product, selectedQty)}
            className="py-2 px-2.5 rounded-lg sm:rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[10.5px] sm:text-xs flex items-center justify-center gap-1 transition-colors"
          >
            <Eye className="w-3 h-3 shrink-0" />
            <span className="truncate">Photos</span>
          </button>
        </div>
      </div>

    </div>
  );
};
