import React from 'react';
import { StoreSettings, MainSectionType } from '../types';
import { Phone, MessageCircle, MapPin, Clock, ArrowUp, ExternalLink, Shirt, Footprints, Scissors, Shield } from 'lucide-react';
import { FacebookIcon, TikTokIcon } from './SocialIcons';
import { OFFICIAL_LOGO_URL } from '../data/initialData';

interface FooterProps {
  settings: StoreSettings;
  onSelectSection: (section: MainSectionType) => void;
  onNavigate: (tab: string) => void;
  onOpenYardGuide: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onSelectSection,
  onNavigate,
  onOpenYardGuide,
  onOpenAdmin,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const facebookUrl = settings.facebook || 'https://www.facebook.com/share/1BeLmWzV8P/';
  const tiktokUrl = settings.tiktok || 'https://www.tiktok.com/@ayobami.samuel31';
  const logoSrc = settings.logoUrl || OFFICIAL_LOGO_URL;

  return (
    <footer className="bg-[#0F2E22] text-[#E0D6C8] pt-16 pb-12 border-t-4 border-[#D4AF37]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-[#245842]">
          
          {/* Brand & Official Logo Column (Open & Bold) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-4">
              {logoSrc && (
                <img
                  src={logoSrc}
                  alt="Ayobami SAM Ventures"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('hero-logo.png')) {
                      target.src = '/hero-logo.png';
                    }
                  }}
                />
              )}
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {settings.storeName}
                </h3>
                <p className="text-xs sm:text-sm font-black text-[#D4AF37] uppercase tracking-wider mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                  <span>Cloths • Shoes • Tailoring Machines</span>
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#C4B7A5] font-medium leading-relaxed max-w-md">
              Your premier retail and wholesale store based at 37/39 Balogun West, Molake House, Lagos. Delivering guaranteed quality fabrics, handcrafted shoes, and industrial tailoring machines across Nigeria and internationally.
            </p>

            {/* Direct Contact Links */}
            <div className="pt-2 flex flex-col gap-2.5 text-xs font-bold text-white">
              <a
                href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hello, ${settings.storeName || 'Ayobami SAM Ventures'}, I want to place an order.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#52B788] hover:text-white"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>WhatsApp: {settings.phone}</span>
              </a>
              <div className="inline-flex flex-wrap items-center gap-2 text-[#D4AF37]">
                <Phone className="w-4 h-4" />
                <a href="tel:08033810865" className="hover:text-white">08033810865</a>
                <span>/</span>
                <a href="tel:09150996348" className="hover:text-white">09150996348</a>
              </div>
            </div>

            {/* Social Media Channels */}
            <div className="pt-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#D4AF37] block mb-2.5">
                Official Social Media Handles:
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2] text-white border border-[#1877F2]/40 transition-all font-bold text-xs"
                >
                  <FacebookIcon className="w-4 h-4 text-[#1877F2] hover:text-white" />
                  <span>Facebook Profile</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black text-white border border-white/20 transition-all font-bold text-xs"
                >
                  <TikTokIcon className="w-4 h-4 text-[#25F4EE]" />
                  <span>TikTok (@ayobami.samuel31)</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>

          </div>

          {/* 3 Core Departments Navigation */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-[#245842] pb-2 text-[#D4AF37]">
              Our 3 Main Departments
            </h4>
            <div className="space-y-3">
              
              <button
                onClick={() => {
                  onSelectSection('cloths');
                  onNavigate('catalog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-3 rounded-xl bg-[#143D2E] hover:bg-[#1B4E3B] border border-[#245842] transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Shirt className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-black text-white text-xs sm:text-sm">1. Cloths & Fabrics</span>
                </div>
                <span className="text-[11px] text-gray-400">Ankara, Lace, Senator</span>
              </button>

              <button
                onClick={() => {
                  onSelectSection('shoes');
                  onNavigate('catalog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-3 rounded-xl bg-[#143D2E] hover:bg-[#1B4E3B] border border-[#245842] transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Footprints className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-black text-white text-xs sm:text-sm">2. Shoes & Bags</span>
                </div>
                <span className="text-[11px] text-gray-400">Sets, Loafers, Heels, Bags</span>
              </button>

              <button
                onClick={() => {
                  onSelectSection('tailoring-machine');
                  onNavigate('catalog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-3 rounded-xl bg-[#143D2E] hover:bg-[#1B4E3B] border border-[#245842] transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Scissors className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-black text-white text-xs sm:text-sm">3. Tailoring Machines</span>
                </div>
                <span className="text-[11px] text-gray-400">Industrial & Butterfly</span>
              </button>

            </div>
          </div>

          {/* Quick Links & Location */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-[#245842] pb-2 text-[#D4AF37]">
              Store & Admin Portal
            </h4>
            <div className="space-y-2.5 text-xs text-[#C4B7A5]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>{settings.openingHours}</span>
              </div>
            </div>

            <div className="pt-3 space-y-2">
              <button
                onClick={onOpenAdmin}
                className="w-full py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#c49b29] text-[#0F2E22] font-black text-xs flex items-center justify-center gap-2 shadow"
              >
                <Shield className="w-4 h-4" />
                <span>Store Owner Admin Portal</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A89A88]">
          <p className="font-medium text-center sm:text-left">
            © {new Date().getFullYear()} {settings.storeName}. All Rights Reserved. Lagos, Nigeria.
          </p>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-white hover:text-[#D4AF37] font-black bg-[#143D2E] px-4 py-2 rounded-xl transition-colors border border-[#245842]"
          >
            <span>Back to top</span>
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

      </div>
    </footer>
  );
};
