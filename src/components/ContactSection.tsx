import React, { useState } from 'react';
import { StoreSettings } from '../types';
import { Phone, MessageCircle, MapPin, Clock, Truck, X, ExternalLink } from 'lucide-react';
import { FacebookIcon, TikTokIcon } from './SocialIcons';
import { OFFICIAL_LOGO_URL } from '../data/initialData';

interface ContactSectionProps {
  settings: StoreSettings;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings }) => {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const facebookUrl = settings.facebook || 'https://www.facebook.com/share/1BeLmWzV8P/';
  const tiktokUrl = settings.tiktok || 'https://www.tiktok.com/@ayobami.samuel31';
  const whatsappUrl = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hello, ${settings.storeName || 'Ayobami SAM Ventures'}, I want to place an order.`)}`;
  const logoSrc = settings.logoUrl || OFFICIAL_LOGO_URL;

  return (
    <section className="py-6 sm:py-8 bg-[#FAF8F5] border-b border-[#E8E2D9]" id="contact-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Compact Single Straight Line of Icon Stickers */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2D9CE] shadow-sm flex flex-col items-center justify-center gap-3">
          
          <div className="flex items-center justify-center gap-3 sm:gap-6 overflow-x-auto whitespace-nowrap scrollbar-none max-w-full py-1 px-2">
            
            {/* Sticker 1: WhatsApp (Inquiries & Price) */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Product Price & WhatsApp Inquiries"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#25D366] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-md group shrink-0"
              aria-label="WhatsApp Price & Product Inquiries"
            >
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-6 transition-transform" />
            </a>

            {/* Sticker 2: Phone Call (Price & Orders) */}
            <a
              href="tel:08033810865"
              title="Direct Phone Inquiry Line"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1B4332] text-[#D4AF37] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-md group shrink-0"
              aria-label="Direct Phone Inquiry Line"
            >
              <Phone className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-6 transition-transform" />
            </a>

            {/* Sticker 3: Facebook Profile */}
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Official Facebook Store Profile"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-md group shrink-0"
              aria-label="Facebook Profile"
            >
              <FacebookIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:rotate-6 transition-transform" />
            </a>

            {/* Sticker 4: TikTok Channel */}
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="TikTok Videos & Profile"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black text-[#25F4EE] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-md group shrink-0"
              aria-label="TikTok Profile"
            >
              <TikTokIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#25F4EE] group-hover:rotate-6 transition-transform" />
            </a>

            {/* Sticker 5: Store Location Photo & Address */}
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              title="View Physical Shop Location Photo & Address"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#B07D38] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-md group shrink-0 cursor-pointer relative overflow-hidden"
              aria-label="Store Location & Balogun Market Address"
            >
              <img 
                src="/shop-location.jpg" 
                alt="Shop" 
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-opacity" 
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('hero-logo.png')) {
                    target.src = '/hero-logo.png';
                    target.className = 'absolute inset-0 w-8 h-8 object-contain m-auto opacity-40';
                  }
                }}
              />
              <MapPin className="w-6 h-6 sm:w-7 sm:h-7 relative z-10 group-hover:rotate-6 transition-transform text-white drop-shadow" />
            </button>

            {/* Sticker 6: Delivery & Dispatch */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Nationwide & International Delivery"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-md group shrink-0"
              aria-label="Delivery & Shipping Information"
            >
              <Truck className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-6 transition-transform" />
            </a>

            {/* Sticker 7: 24/7 Service Schedule */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="24/7 Ordering & Open Hours"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#F3E8D6] text-[#B07D38] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-md group shrink-0"
              aria-label="24/7 Open Hours"
            >
              <Clock className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-6 transition-transform" />
            </a>

          </div>

        </div>

      </div>

      {/* SHOP LOCATION PHOTO & MAP LIGHTBOX MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-[#D4AF37] relative">
            
            <button
              onClick={() => setShowLocationModal(false)}
              className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Location Image with Brand Overlay */}
            <div className="relative">
              <img
                src="/shop-location.jpg"
                alt="Ayobami SAM Ventures Shop Location in Balogun Market, Lagos"
                className="w-full h-64 sm:h-72 object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('hero-logo.png')) {
                    target.src = '/hero-logo.png';
                    target.className = 'w-full h-64 sm:h-72 object-contain p-12 bg-gray-50 opacity-40';
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded bg-[#D4AF37] text-[#0F2E22] text-[10px] font-black uppercase tracking-wider">
                    Official Physical Storefront
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">
                  {settings.storeName}
                </h3>
                <p className="text-xs text-amber-200 font-bold mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>37/39 Balogun West, Molake House, Lagos Island, Nigeria</span>
                </p>
              </div>

              {/* Floating Logo Badge */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white">
                <img 
                  src={logoSrc} 
                  alt="ASV Logo" 
                  className="w-10 h-10 object-contain" 
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('hero-logo.png')) {
                      target.src = '/hero-logo.png';
                    }
                  }}
                />
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Visit our storefront at Balogun Market, Lagos for direct retail purchases, wholesale carton bookings, fabric inspection, and industrial sewing machine testing.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-xl bg-[#0F2E22] hover:bg-[#1B4332] text-white font-black text-xs text-center flex items-center justify-center gap-1.5 shadow"
                >
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs text-center flex items-center justify-center gap-1.5 shadow"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat Store Manager</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};

