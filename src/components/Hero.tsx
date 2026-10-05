import React from 'react';
import { StoreSettings, MainSectionType } from '../types';
import { Shirt, Footprints, Scissors, MessageCircle, ShieldCheck, ArrowRight, Star, Sparkles, MapPin } from 'lucide-react';
import { OFFICIAL_LOGO_URL } from '../data/initialData';

interface HeroProps {
  settings: StoreSettings;
  onSelectSection: (section: MainSectionType) => void;
  onExploreAll: () => void;
  onContactClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  settings,
  onSelectSection,
  onExploreAll,
  onContactClick,
}) => {
  const logoSrc = settings.logoUrl || OFFICIAL_LOGO_URL;

  return (
    <div className="relative bg-[#0F2E22] text-white pt-6 sm:pt-12 pb-10 sm:pb-20 overflow-hidden border-b-2 border-[#D4AF37]">
      
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] z-1"></div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10">
        
        {/* Open, Bold Top Royal Logo Presentation */}
        <div className="flex flex-col items-center justify-center text-center pt-1 pb-6 sm:pb-10">
          
          <div className="relative group flex flex-col items-center mb-3 sm:mb-5">
            {/* Ambient Gold Halo Glow */}
            <div className="absolute -inset-4 sm:-inset-8 bg-gradient-to-r from-[#D4AF37]/30 via-[#52B788]/20 to-[#D4AF37]/30 rounded-full blur-xl sm:blur-2xl opacity-70 group-hover:opacity-100 transition duration-700 pointer-events-none"></div>
            
            {/* Open, Frameless Royal Logo */}
            <img
              src={logoSrc || '/hero-logo.png'}
              alt="Ayobami SAM Ventures Royal Logo"
              className="relative w-16 h-16 sm:w-36 sm:h-36 lg:w-48 lg:h-48 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('hero-logo.png')) {
                  target.src = '/hero-logo.png';
                }
              }}
            />

            <div className="mt-1.5 space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-[#D4AF37]/60 text-[#D4AF37] text-[9px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg max-w-[90vw] truncate">
                <Sparkles className="w-3 h-3 text-[#D4AF37] shrink-0" />
                <span className="truncate">Ayobami SAM Ventures • 37/39 Balogun West, Lagos</span>
              </span>
            </div>
          </div>

          {/* Bold Centered Headline & Description */}
          <div className="max-w-4xl space-y-2.5 sm:space-y-4">
            <h1 className="text-sm sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight px-1">
              PREMIER NIGERIAN HUB FOR <span className="text-[#D4AF37]">CLOTHS</span>, <span className="text-[#E0A96D]">SHOES</span> & <span className="text-[#95D5B2]">TAILORING MACHINES</span>
            </h1>

            <p className="text-[10px] sm:text-xs text-[#E0D6C8] font-medium leading-relaxed max-w-2xl mx-auto px-1">
              Welcome to <strong>{settings.storeName}</strong> at <strong>37/39 Balogun West, Molake House, Lagos</strong>. Authentic native wear, handcrafted Italian leather shoes, and industrial sewing machines.
            </p>

            {/* Action Buttons */}
            <div className="pt-1.5 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <a
                href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hello, ${settings.storeName || 'Ayobami SAM Ventures'}, I want to place an order.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-[11px] sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                <span>INQUIRE & ORDER ON WHATSAPP</span>
              </a>

              <button
                type="button"
                onClick={onExploreAll}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-[11px] sm:text-sm border-2 border-[#D4AF37]/60 flex items-center justify-center gap-2 transition-all backdrop-blur-md"
              >
                <span>Browse Catalogue</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="pt-4 grid grid-cols-3 gap-2 max-w-lg mx-auto border-t border-white/15 text-center text-[10px] sm:text-xs">
              <div className="p-1">
                <span className="text-xs sm:text-base font-black text-[#D4AF37] block">100%</span>
                <span className="text-gray-300 font-bold">Genuine Quality</span>
              </div>
              <div className="p-1 border-x border-white/15">
                <span className="text-xs sm:text-base font-black text-[#D4AF37] block">24/7</span>
                <span className="text-gray-300 font-bold">Inquiry Support</span>
              </div>
              <div className="p-1">
                <span className="text-xs sm:text-base font-black text-[#D4AF37] block">Direct</span>
                <span className="text-gray-300 font-bold">Retail & Wholesale</span>
              </div>
            </div>

          </div>

        </div>

        {/* 3 CORE SECTIONS INTERACTIVE CARDS */}
        <div className="pt-4 sm:pt-6">
          <div className="text-center mb-4">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#D4AF37] bg-white/10 px-3 py-0.5 rounded-full border border-[#D4AF37]/30">
              OUR 3 MAIN DEPARTMENTS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            
            {/* SECTION 1: CLOTHS */}
            <div
              onClick={() => onSelectSection('cloths')}
              className="group bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border-2 border-emerald-900/20 hover:border-emerald-700 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform">
                  <Shirt className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-800" />
                </div>
                <div>
                  <span className="text-[9.5px] sm:text-xs font-black uppercase text-[#D4AF37] tracking-wider block">Department 01</span>
                  <h3 className="text-base sm:text-xl font-black text-[#0F2E22] mt-0.5">
                    CLOTHS & FABRICS
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-600 font-medium leading-relaxed">
                  Authentic native wear, crisp Senator materials, polished Atiku, and royal Aso-Oke by the yard.
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-black text-emerald-900">
                <span>View Cloths</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
            </div>

            {/* SECTION 2: SHOES */}
            <div
              onClick={() => onSelectSection('shoes')}
              className="group bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border-2 border-amber-800/20 hover:border-amber-700 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform">
                  <Footprints className="w-5 h-5 sm:w-6 sm:h-6 text-amber-800" />
                </div>
                <div>
                  <span className="text-[9.5px] sm:text-xs font-black uppercase text-[#D4AF37] tracking-wider block">Department 02</span>
                  <h3 className="text-base sm:text-xl font-black text-amber-950 mt-0.5">
                    SHOES & BAGS
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-600 font-medium leading-relaxed">
                  Handcrafted Italian leather native loafers, heels, slippers, and matching bag sets.
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-black text-amber-900">
                <span>View Shoes</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
            </div>

            {/* SECTION 3: TAILORING MACHINES */}
            <div
              onClick={() => onSelectSection('tailoring-machine')}
              className="group bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border-2 border-blue-900/20 hover:border-blue-800 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform">
                  <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-blue-800" />
                </div>
                <div>
                  <span className="text-[9.5px] sm:text-xs font-black uppercase text-[#D4AF37] tracking-wider block">Department 03</span>
                  <h3 className="text-base sm:text-xl font-black text-blue-950 mt-0.5">
                    TAILORING MACHINES
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-600 font-medium leading-relaxed">
                  Industrial direct-drive lockstitch machines, high-speed overlockers, and Butterfly machines.
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-black text-blue-900">
                <span>View Machines</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
