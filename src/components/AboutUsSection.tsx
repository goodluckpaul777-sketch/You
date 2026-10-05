import React from 'react';
import { StoreSettings } from '../types';
import { ShieldCheck, Ruler, Users, HeartHandshake, MapPin, Shirt, Footprints, Scissors } from 'lucide-react';
import { OFFICIAL_LOGO_URL } from '../data/initialData';

interface AboutUsSectionProps {
  settings: StoreSettings;
  onShopClick: () => void;
}

export const AboutUsSection: React.FC<AboutUsSectionProps> = ({ settings, onShopClick }) => {
  const logoSrc = settings.logoUrl || OFFICIAL_LOGO_URL;

  return (
    <section className="py-16 sm:py-24 bg-[#FAF8F5] border-b border-[#E8E2D9]" id="about-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left Column with ASV Brand Visual & Shop Location Photo */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative py-6 px-6 flex flex-col items-center text-center bg-white rounded-3xl border-2 border-[#D4AF37]/40 shadow-xl overflow-hidden">
              {/* Subtle Gold Ambient Halo Glow */}
              <div className="absolute inset-0 bg-radial from-[#D4AF37]/20 via-transparent to-transparent blur-2xl pointer-events-none"></div>

              {/* Physical Shop Location Photo Card with Logo Overlay */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-[#E2D9CE] shadow-md group">
                <img
                  src="/shop-location.jpg"
                  alt="Ayobami SAM Ventures Shop Location - Balogun West, Lagos"
                  className="w-full h-48 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('hero-logo.png')) {
                      target.src = '/hero-logo.png';
                      target.className = 'w-full h-48 sm:h-64 object-contain p-8 bg-gray-50 opacity-40';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 text-left">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#D4AF37] text-[#0F2E22] text-[10px] font-black uppercase tracking-wider self-start shadow-xs">
                    <MapPin className="w-3 h-3" />
                    <span>Physical Shop Location</span>
                  </span>
                  <p className="text-white font-black text-xs sm:text-sm mt-1">
                    37/39 Balogun West, Molake House, Lagos
                  </p>
                </div>

                {/* Floating Brand Logo Badge in Top Right */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-white/60 shadow-lg">
                  <img
                    src={logoSrc}
                    alt="Ayobami SAM Ventures Logo"
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

              <div className="relative mt-4 pt-3 border-t border-[#D4AF37]/40 w-full">
                <h3 className="text-lg sm:text-xl font-black text-[#0F2E22] tracking-tight">{settings.storeName}</h3>
                <p className="text-[10px] sm:text-xs font-black text-[#D4AF37] uppercase tracking-wider mt-0.5">Direct Retail & Wholesale Hub</p>
              </div>
            </div>

            {/* 3 Core Departments Summary */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-[#E2D9CE] shadow-xs">
                <Shirt className="w-5 h-5 text-emerald-800 mx-auto mb-1" />
                <span className="font-black text-[#0F2E22] block">Cloths</span>
                <span className="text-[10px] text-gray-500">Native Wear</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-[#E2D9CE] shadow-xs">
                <Footprints className="w-5 h-5 text-amber-800 mx-auto mb-1" />
                <span className="font-black text-[#0F2E22] block">Shoes</span>
                <span className="text-[10px] text-gray-500">Native & Heels</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-[#E2D9CE] shadow-xs">
                <Scissors className="w-5 h-5 text-blue-900 mx-auto mb-1" />
                <span className="font-black text-[#0F2E22] block">Machines</span>
                <span className="text-[10px] text-gray-500">Industrial</span>
              </div>
            </div>
          </div>

          {/* Right Column (Spacious Copy & Pillars) */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-[#0F2E22] bg-white px-4 py-1.5 rounded-full border border-[#D4AF37]/50 shadow-xs inline-block">
              ABOUT AYOBAMI SAM VENTURES
            </span>

            <h2 className="text-xl sm:text-3xl lg:text-5xl font-black text-[#0F2E22] tracking-tight leading-tight">
              YOUR TRUSTED RETAIL & WHOLESALE HUB IN LAGOS
            </h2>

            <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
              Located at the historic market center at <strong>{settings.address}</strong>, <strong>{settings.storeName}</strong> stands as a foremost Nigerian enterprise specializing in <strong>three essential departments: Cloths, Shoes, and Tailoring Machines</strong>.
            </p>

            <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
              We cater directly to individual clients, fashion designers, corporate tailors, boutique owners, and diaspora customers across all 36 Nigerian states and worldwide. Whether you need 1 machine or 50 rolls of Ankara, we deliver guaranteed quality with honest business ethics.
            </p>

            {/* Core Values */}
            <div className="space-y-3 pt-2 text-xs sm:text-sm font-semibold text-[#0F2E22]">
              <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-[#E8E2D9]">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block">Retail & Wholesale Flexibility</span>
                  <span className="text-gray-500 text-xs">Buy single pieces or bulk wholesale bundles with swift countrywide dispatch.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-[#E8E2D9]">
                <MapPin className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block">Physical Lagos Market Storefront</span>
                  <span className="text-gray-500 text-xs">Visit 37/39 Balogun West, Molake House, Lagos for direct in-person inspection and pickup.</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={onShopClick}
                className="px-8 py-4 rounded-2xl bg-[#0F2E22] hover:bg-[#1B4332] text-white text-xs sm:text-sm font-black shadow-lg transition-all"
              >
                Browse All 3 Departments
              </button>
              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="px-6 py-4 rounded-2xl border-2 border-[#0F2E22] text-[#0F2E22] hover:bg-[#0F2E22] hover:text-white text-xs sm:text-sm font-black transition-all"
              >
                Call: {settings.phone}
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
