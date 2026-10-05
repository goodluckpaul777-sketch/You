import React, { useState } from 'react';
import { Menu, X, MessageCircle, Settings, Search, Footprints, Scissors, Shirt, Shield, ShoppingBag } from 'lucide-react';
import { StoreSettings, InquiryItem, MainSectionType } from '../types';
import { FacebookIcon, TikTokIcon } from './SocialIcons';
import { OFFICIAL_LOGO_URL } from '../data/initialData';

interface HeaderProps {
  settings: StoreSettings;
  inquiryItems: InquiryItem[];
  onOpenInquiryBag: () => void;
  onOpenAdmin: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSection: 'all' | MainSectionType;
  setActiveSection: (section: 'all' | MainSectionType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  inquiryItems,
  onOpenInquiryBag,
  onOpenAdmin,
  activeTab,
  setActiveTab,
  activeSection,
  setActiveSection,
  searchQuery,
  setSearchQuery,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalInquiryCount = inquiryItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleNavClick = (tab: string, section?: 'all' | MainSectionType) => {
    setActiveTab(tab);
    if (section !== undefined) {
      setActiveSection(section);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logoSrc = settings.logoUrl || OFFICIAL_LOGO_URL;

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-[#E8E2D9] shadow-md">
      {/* Main Brand & Identity Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-2.5 sm:py-3 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => handleNavClick('home', 'all')}
            className="cursor-pointer flex items-center gap-2.5 sm:gap-4 group"
          >
            <div className="relative">
              {logoSrc && (
                <img
                  src={logoSrc}
                  alt="Ayobami SAM Ventures Official Logo"
                  className="w-10 h-10 sm:w-14 sm:h-14 object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('hero-logo.png')) {
                      target.src = '/hero-logo.png';
                    }
                  }}
                />
              )}
            </div>
            <div>
              <h1 className="text-base sm:text-xl lg:text-2xl font-black tracking-tight text-[#0F2E22] group-hover:text-[#2D6A4F] transition-colors leading-tight">
                {settings.storeName}
              </h1>
              <p className="text-[9px] sm:text-[11px] font-black text-[#D4AF37] uppercase tracking-wider mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
                <span>37/39 Balogun West, Molake House, Lagos</span>
              </p>
            </div>
          </div>

          {/* Desktop Search Bar with Larger, Prominent Search Button */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-4 xl:mx-6">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setActiveTab('catalog');
                }
              }}
              className="relative w-full flex items-center gap-2"
            >
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Design Code (e.g. 019004-1), Lace, Shoes..."
                  className="w-full pl-11 pr-10 py-3 rounded-2xl border-2 border-[#E8E2D9] bg-[#FAF8F5] text-sm text-[#0F2E22] placeholder-gray-400 focus:outline-none focus:border-[#0F2E22] focus:bg-white transition-all font-semibold shadow-xs"
                />
                <Search className="w-5 h-5 text-[#0F2E22]/60 absolute left-3.5 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 w-5 h-5 rounded-full flex items-center justify-center font-black transition-all cursor-pointer"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Bigger, High-Contrast Search Action Button */}
              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-[#0F2E22] hover:bg-[#1B4332] active:bg-[#081B14] text-[#D4AF37] border-2 border-[#D4AF37]/60 font-black text-sm flex items-center gap-2 shadow-md hover:scale-[1.03] active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
                title="Search Store"
              >
                <Search className="w-5 h-5 text-[#D4AF37]" />
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Right Header Controls (Inquiry Bag & Admin Portal) */}
          <div className="flex items-center gap-3">
            
            {/* Inquiry Bag Button */}
            <button
              onClick={onOpenInquiryBag}
              className="relative p-3 rounded-2xl bg-[#FAF8F5] hover:bg-[#F0EAE1] text-[#0F2E22] border-2 border-[#E8E2D9] flex items-center gap-2 font-black text-xs sm:text-sm transition-all shadow-xs"
              title="View Inquiry Bag"
            >
              <ShoppingBag className="w-5 h-5 text-[#0F2E22]" />
              <span className="hidden sm:inline">Inquiry Bag</span>
              {totalInquiryCount > 0 && (
                <span className="bg-[#D4AF37] text-[#0F2E22] font-black text-xs px-2 py-0.5 rounded-full shadow">
                  {totalInquiryCount}
                </span>
              )}
            </button>

            {/* Admin Portal Button */}
            <button
              onClick={onOpenAdmin}
              className="px-4 py-3 rounded-2xl bg-[#0F2E22] hover:bg-[#1B4332] text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <Shield className="w-4 h-4 text-[#D4AF37]" />
              <span className="hidden md:inline">Admin Portal</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>

        </div>

        {/* Mobile Search Bar (Always visible on mobile with prominent Search button) */}
        <div className="lg:hidden pb-3 px-1">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                setActiveTab('catalog');
              }
            }} 
            className="flex items-center gap-2 w-full"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Design Code (e.g. 019004-1)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border-2 border-[#E8E2D9] bg-[#FAF8F5] text-xs font-semibold text-[#0F2E22] placeholder-gray-400 focus:outline-none focus:border-[#0F2E22] shadow-xs"
              />
              <Search className="w-4.5 h-4.5 text-[#0F2E22]/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 w-5 h-5 rounded-full flex items-center justify-center font-black"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#0F2E22] active:bg-[#1B4332] text-[#D4AF37] font-black text-xs border border-[#D4AF37]/50 flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#D4AF37]" />
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* 3 Core Main Section Navigation Tabs (Desktop) */}
        <nav className="hidden lg:flex items-center justify-between border-t border-[#E8E2D9] py-3 text-xs sm:text-sm font-black tracking-wide">
          <div className="flex items-center gap-2">
            
            <button
              onClick={() => handleNavClick('catalog', 'all')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'catalog' && activeSection === 'all'
                  ? 'bg-[#0F2E22] text-white shadow'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Collections
            </button>

            {/* SECTION 1: CLOTHS */}
            <button
              onClick={() => handleNavClick('catalog', 'cloths')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                activeSection === 'cloths' && activeTab === 'catalog'
                  ? 'bg-[#0F2E22] text-white shadow'
                  : 'text-[#0F2E22] hover:bg-emerald-50'
              }`}
            >
              <Shirt className="w-4 h-4 text-[#D4AF37]" />
              <span>1. Cloths & Fabrics</span>
            </button>

            {/* SECTION 2: SHOES */}
            <button
              onClick={() => handleNavClick('catalog', 'shoes')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                activeSection === 'shoes' && activeTab === 'catalog'
                  ? 'bg-amber-800 text-white shadow'
                  : 'text-amber-900 hover:bg-amber-50'
              }`}
            >
              <Footprints className="w-4 h-4 text-[#D4AF37]" />
              <span>2. Shoes & Bags</span>
            </button>

            {/* SECTION 3: TAILORING MACHINES */}
            <button
              onClick={() => handleNavClick('catalog', 'tailoring-machine')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                activeSection === 'tailoring-machine' && activeTab === 'catalog'
                  ? 'bg-blue-900 text-white shadow'
                  : 'text-blue-900 hover:bg-blue-50'
              }`}
            >
              <Scissors className="w-4 h-4 text-[#D4AF37]" />
              <span>3. Tailoring Machines</span>
            </button>

          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
            <button
              onClick={() => handleNavClick('about')}
              className={`hover:text-[#0F2E22] uppercase ${activeTab === 'about' ? 'text-[#0F2E22] font-black underline' : ''}`}
            >
              About ASV
            </button>

            <button
              onClick={() => handleNavClick('contact')}
              className={`hover:text-[#0F2E22] uppercase ${activeTab === 'contact' ? 'text-[#0F2E22] font-black underline' : ''}`}
            >
              Contact & Address
            </button>
          </div>
        </nav>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF8F5] border-t-2 border-[#D4AF37] px-5 py-6 shadow-2xl space-y-4 animate-fadeIn">
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                handleNavClick('catalog', 'all');
              }
            }} 
            className="flex items-center gap-2 w-full mb-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Cloths, Shoes, Machines..."
                className="w-full pl-10 pr-3 py-3 rounded-xl border-2 border-gray-300 text-xs font-semibold text-[#0F2E22] bg-white focus:outline-none focus:border-[#0F2E22]"
              />
              <Search className="w-4.5 h-4.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="px-4 py-3 rounded-xl bg-[#0F2E22] text-[#D4AF37] font-black text-xs border border-[#D4AF37]/50 flex items-center gap-1.5 shrink-0 shadow cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </form>

          <div className="space-y-2 font-black text-sm text-[#0F2E22]">
            
            <button
              onClick={() => handleNavClick('home', 'all')}
              className="w-full text-left p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>🏠 Home Overview</span>
            </button>

            {/* 3 SECTIONS */}
            <button
              onClick={() => handleNavClick('catalog', 'cloths')}
              className="w-full text-left p-3.5 rounded-xl bg-emerald-900 text-white flex items-center justify-between shadow"
            >
              <div className="flex items-center gap-2.5">
                <Shirt className="w-5 h-5 text-[#D4AF37]" />
                <span>1. Cloths & Fabrics</span>
              </div>
              <span className="text-xs text-[#D4AF37]">Ankara, Lace, Senator</span>
            </button>

            <button
              onClick={() => handleNavClick('catalog', 'shoes')}
              className="w-full text-left p-3.5 rounded-xl bg-amber-900 text-white flex items-center justify-between shadow"
            >
              <div className="flex items-center gap-2.5">
                <Footprints className="w-5 h-5 text-[#D4AF37]" />
                <span>2. Shoes & Bags</span>
              </div>
              <span className="text-xs text-[#D4AF37]">Loafers, Heels, Bags</span>
            </button>

            <button
              onClick={() => handleNavClick('catalog', 'tailoring-machine')}
              className="w-full text-left p-3.5 rounded-xl bg-blue-950 text-white flex items-center justify-between shadow"
            >
              <div className="flex items-center gap-2.5">
                <Scissors className="w-5 h-5 text-[#D4AF37]" />
                <span>3. Tailoring Machines</span>
              </div>
              <span className="text-xs text-[#D4AF37]">Industrial & Domestic</span>
            </button>

            <button
              onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }}
              className="w-full text-left p-3.5 rounded-xl bg-[#0F2E22] text-white flex items-center justify-between border-2 border-[#D4AF37]"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#D4AF37]" />
                <span>Admin Portal</span>
              </div>
              <span className="text-xs text-[#D4AF37]">Manage Store</span>
            </button>

            <button
              onClick={() => handleNavClick('about')}
              className="w-full text-left p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>ℹ️ About Our Store</span>
            </button>

            <button
              onClick={() => handleNavClick('contact')}
              className="w-full text-left p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-between"
            >
              <span>📞 Contact & Store Address</span>
            </button>

          </div>

          <div className="pt-4 border-t border-[#D8CFC4] space-y-2">
            <a
              href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hello, ${settings.storeName || 'Ayobami SAM Ventures'}, I want to place an order.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-[#25D366] text-white font-black text-center flex items-center justify-center gap-2 shadow"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>ORDER ON WHATSAPP: {settings.phone}</span>
            </a>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={settings.facebook || 'https://www.facebook.com/share/1BeLmWzV8P/'}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-[#1877F2]/15 text-[#1877F2] font-black text-xs flex items-center justify-center gap-1.5 border border-[#1877F2]/30"
              >
                <FacebookIcon className="w-4 h-4 fill-current" />
                <span>Facebook</span>
              </a>
              <a
                href={settings.tiktok || 'https://www.tiktok.com/@ayobami.samuel31'}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-black/10 text-[#0F2E22] font-black text-xs flex items-center justify-center gap-1.5 border border-gray-300"
              >
                <TikTokIcon className="w-4 h-4 fill-current" />
                <span>TikTok</span>
              </a>
            </div>
          </div>

        </div>
      )}
    </header>
  );
};
