import React, { useState, useEffect } from 'react';
import {
  FabricProduct,
  InquiryItem,
  StoreSettings,
  InquiryRecord,
  MainSectionType,
} from './types';
import {
  CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_STORE_SETTINGS,
  MAIN_SECTIONS,
  OFFICIAL_LOGO_URL,
} from './data/initialData';
import {
  subscribeToProducts,
  saveProductToDatabase,
  deleteProductFromDatabase,
  subscribeToSettings,
  saveSettingsToDatabase,
  subscribeToInquiries,
  saveInquiryToDatabase,
  subscribeToQuotaExceeded,
  normalizeImageUrl,
} from './services/catalogService';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryGrid } from './components/CategoryGrid';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { YardEstimatorModal } from './components/YardEstimatorModal';
import { AdminPortal } from './components/AdminPortal';
import { WhyShopWithUs } from './components/WhyShopWithUs';
import { HowToOrder } from './components/HowToOrder';
import { CustomerReviews } from './components/CustomerReviews';
import { DeliverySection } from './components/DeliverySection';
import { ContactSection } from './components/ContactSection';
import { AboutUsSection } from './components/AboutUsSection';
import { Footer } from './components/Footer';
import { MessageCircle, Sparkles, Filter, SlidersHorizontal, Shirt, Footprints, Scissors, Search, Shield, ShoppingBag, Palette, ArrowLeft, ChevronLeft, ChevronRight, Layers, Package } from 'lucide-react';

const STORAGE_KEYS = {
  PRODUCTS: 'asv_products_v6_cleared',
  SETTINGS: 'asv_settings_v3_luxury',
  CART: 'asv_inquiry_cart_v3',
  ORDERS: 'asv_inquiries_v3',
};

// Safe localStorage helper that never mutates or replaces user product images
function safeSetLocalStorage(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`LocalStorage quota reached for key ${key}. Full image data preserved in memory and database.`);
  }
}

export default function App() {
  // Persistence state loaders
  const [products, setProducts] = useState<FabricProduct[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved !== null) {
        const parsed: FabricProduct[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isOutdatedAddress = !parsed.address || parsed.address.includes('Main Market Plaza') || parsed.address.includes('Shop 14') || parsed.address.includes('Ibadan');
        return {
          ...INITIAL_STORE_SETTINGS,
          ...parsed,
          whatsapp: (parsed.whatsapp && parsed.whatsapp.length >= 10 && !parsed.whatsapp.includes('1234567') && !parsed.whatsapp.includes('0000000')) ? parsed.whatsapp.replace(/\D/g, '') : INITIAL_STORE_SETTINGS.whatsapp,
          phone: (parsed.phone && parsed.phone.length >= 10) ? parsed.phone : INITIAL_STORE_SETTINGS.phone,
          address: isOutdatedAddress ? '37/39 Balogun West, Molake House, Lagos Island, Nigeria' : parsed.address,
          marketLocation: isOutdatedAddress ? '37/39 Balogun West, Molake House, Lagos Island' : (parsed.marketLocation || '37/39 Balogun West, Molake House, Lagos Island'),
          logoUrl: (parsed.logoUrl && !parsed.logoUrl.includes('logo.jpg') && !parsed.logoUrl.includes('logo_bold.jpg')) ? parsed.logoUrl : OFFICIAL_LOGO_URL,
          facebook: parsed.facebook || INITIAL_STORE_SETTINGS.facebook,
          tiktok: parsed.tiktok || INITIAL_STORE_SETTINGS.tiktok,
        };
      }
      return INITIAL_STORE_SETTINGS;
    } catch {
      return INITIAL_STORE_SETTINGS;
    }
  });

  const [inquiryItems, setInquiryItems] = useState<InquiryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [inquiries, setInquiries] = useState<InquiryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  // UI States
  const [activeTab, setActiveTab] = useState<string>('home');
  const [activeSection, setActiveSection] = useState<'all' | MainSectionType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');

  // Pagination State (10 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Reset page when department section or subcategory changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSection, selectedSubcategory]);

  // When search query is entered, auto-switch to catalog & scroll directly to top matched item
  useEffect(() => {
    if (searchQuery.trim()) {
      setActiveTab('catalog');
      setCurrentPage(1);
      setTimeout(() => {
        const catElement = document.getElementById('catalog-section');
        if (catElement) {
          catElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [searchQuery]);

  // Modals
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<FabricProduct | null>(null);
  const [selectedDetailItemNumber, setSelectedDetailItemNumber] = useState<number>(1);
  const [detailDefaultQty, setDetailDefaultQty] = useState<number>(1);
  const [isInquiryBagOpen, setIsInquiryBagOpen] = useState(false);
  const [isYardGuideOpen, setIsYardGuideOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const [quotaWarning, setQuotaWarning] = useState<{ isExceeded: boolean; link: string } | null>(null);

  useEffect(() => {
    const unsubQuota = subscribeToQuotaExceeded((isExceeded, link) => {
      if (isExceeded) {
        setQuotaWarning({ isExceeded: true, link });
      }
    });
    return () => unsubQuota();
  }, []);

  // Sync to localStorage safely with quota fallback
  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.PRODUCTS, products);
  }, [products]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.CART, inquiryItems);
  }, [inquiryItems]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.ORDERS, inquiries);
  }, [inquiries]);

  // Live real-time catalog listeners for all store visitors
  useEffect(() => {
    const unsubProducts = subscribeToProducts((liveProducts) => {
      if (Array.isArray(liveProducts) && liveProducts.length > 0) {
        setProducts(liveProducts);
      }
    });

    const unsubSettings = subscribeToSettings((liveSettings) => {
      if (liveSettings) {
        const isOutdatedAddress = !liveSettings.address || liveSettings.address.includes('Main Market Plaza') || liveSettings.address.includes('Shop 14') || liveSettings.address.includes('Ibadan');
        setSettings({
          ...INITIAL_STORE_SETTINGS,
          ...liveSettings,
          address: isOutdatedAddress ? '37/39 Balogun West, Molake House, Lagos Island, Nigeria' : liveSettings.address,
          marketLocation: isOutdatedAddress ? '37/39 Balogun West, Molake House, Lagos Island' : (liveSettings.marketLocation || '37/39 Balogun West, Molake House, Lagos Island'),
        });
      }
    });

    const unsubInquiries = subscribeToInquiries((liveInquiries) => {
      if (liveInquiries) {
        setInquiries(liveInquiries);
      }
    });

    return () => {
      unsubProducts();
      unsubSettings();
      unsubInquiries();
    };
  }, []);

  // Inquiry operations
  const handleAddToCart = (product: FabricProduct, quantity: number, selectedColor?: string) => {
    setInquiryItems(prev => {
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && item.selectedColor === selectedColor
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity, selectedColor }];
    });
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    setInquiryItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleRemoveInquiryItem = (productId: string) => {
    setInquiryItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearInquiryBag = () => {
    setInquiryItems([]);
  };

  const handleSubmitInquiry = (fullName: string, phone: string, state: string, city: string, notes: string) => {
    const newInquiry: InquiryRecord = {
      id: `INQ-${Date.now().toString().slice(-6)}`,
      inquiryNumber: `ASV-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      customer: {
        fullName,
        phone,
        whatsapp: phone,
        state,
        city,
        inquiryType: 'retail',
        notes,
      },
      items: inquiryItems.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        category: i.product.category,
        mainSection: i.product.mainSection,
        quantity: i.quantity,
        unitLabel: i.product.unitLabel,
        image: i.product.image,
        selectedColor: i.selectedColor,
      })),
      status: 'New Inquiry',
    };

    setInquiries(prev => [newInquiry, ...prev]);
    saveInquiryToDatabase(newInquiry).catch(console.error);
  };

  // Product Filter with Automatic Code Assignment, Code Priority Sorting & 10-Item Pagination
  const normalizeSearch = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  const filteredProducts = products.map((prod, idx) => {
    if (!prod.productCode) {
      const codeNum = String(1001 + idx).padStart(3, '0');
      return { ...prod, productCode: `019${codeNum.slice(-3)}-1` };
    }
    return prod;
  }).filter(prod => {
    const matchesSection = activeSection === 'all' || prod.mainSection === activeSection;
    const matchesSubcat = selectedSubcategory === 'all' || prod.categorySlug === selectedSubcategory;
    
    if (!searchQuery.trim()) {
      return matchesSection && matchesSubcat;
    }

    const q = searchQuery.trim().toLowerCase();
    const normQ = normalizeSearch(q);
    const code = prod.productCode || '';
    const normCode = normalizeSearch(code);
    const id = prod.id || '';
    const normId = normalizeSearch(id);

    const matchesCode =
      code.toLowerCase().includes(q) ||
      (normQ.length >= 2 && normCode.includes(normQ)) ||
      (normQ.length >= 2 && normId.includes(normQ));

    const matchesText =
      prod.name.toLowerCase().includes(q) ||
      prod.category.toLowerCase().includes(q) ||
      prod.fabricType.toLowerCase().includes(q) ||
      prod.description.toLowerCase().includes(q);

    const matchesSearch = matchesCode || matchesText;

    return matchesSection && matchesSubcat && matchesSearch;
  }).sort((a, b) => {
    if (!searchQuery.trim()) return 0;
    const q = searchQuery.trim().toLowerCase();
    const normQ = normalizeSearch(q);

    const aCodeNorm = normalizeSearch(a.productCode || '');
    const bCodeNorm = normalizeSearch(b.productCode || '');

    const aExactCode = aCodeNorm === normQ || (a.productCode || '').toLowerCase() === q;
    const bExactCode = bCodeNorm === normQ || (b.productCode || '').toLowerCase() === q;

    if (aExactCode && !bExactCode) return -1;
    if (!aExactCode && bExactCode) return 1;

    const aCodeMatch = normQ.length >= 2 && aCodeNorm.includes(normQ);
    const bCodeMatch = normQ.length >= 2 && bCodeNorm.includes(normQ);

    if (aCodeMatch && !bCodeMatch) return -1;
    if (!aCodeMatch && bCodeMatch) return 1;

    return 0;
  });

  const clothsCount = products.filter(p => p.mainSection === 'cloths').length;
  const shoesCount = products.filter(p => p.mainSection === 'shoes').length;
  const machinesCount = products.filter(p => p.mainSection === 'tailoring-machine').length;

  // Pagination Math (10 items per page)
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E1B18] font-sans antialiased flex flex-col selection:bg-[#D4AF37] selection:text-[#0F2E22]">
      
      {/* Top Main Navigation Header */}
      <Header
        settings={settings}
        inquiryItems={inquiryItems}
        onOpenInquiryBag={() => setIsInquiryBagOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSection={activeSection}
        setActiveSection={(sec) => {
          setActiveSection(sec);
          setSelectedSubcategory('all');
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Global Back To Home Banner when viewing any specific department or section */}
      {(activeTab !== 'home' || activeSection !== 'all') && (
        <div className="bg-[#0F2E22] text-white py-1 px-3 sm:px-6 border-b border-[#D4AF37]/40 flex items-center justify-between gap-2 text-[10px] sm:text-xs">
          <button
            onClick={() => {
              setActiveTab('home');
              setActiveSection('all');
              setSelectedSubcategory('all');
              setSearchQuery('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#D4AF37] hover:bg-white text-[#0F2E22] font-black text-[10px] sm:text-xs transition-all shadow-xs cursor-pointer group shrink-0"
          >
            <ArrowLeft className="w-3 h-3 text-[#0F2E22] group-hover:-translate-x-0.5 transition-transform" />
            <span className="sm:hidden">← Home</span>
            <span className="hidden sm:inline">← Back to Home Page</span>
          </button>

          <div className="flex items-center gap-1 text-[9px] sm:text-xs font-bold text-[#E0D6C8] truncate">
            <span className="hidden sm:inline">Section:</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[#D4AF37] font-black uppercase tracking-wider truncate text-[9px] sm:text-xs">
              {activeTab === 'catalog' 
                ? (activeSection === 'cloths' ? 'Cloths' : activeSection === 'shoes' ? 'Shoes & Bags' : activeSection === 'tailoring-machine' ? 'Machines' : 'Catalogue')
                : activeTab === 'about' ? 'About'
                : activeTab === 'contact' ? 'Contact'
                : 'Store'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      <main className="flex-1">
        
        {/* VIEW 1: HOME PAGE */}
        {activeTab === 'home' && (
          <>
            {/* Hero Section */}
            <Hero
              settings={settings}
              onSelectSection={(sec) => {
                setActiveSection(sec);
                setActiveTab('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onExploreAll={() => {
                setActiveSection('all');
                setActiveTab('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onContactClick={() => {
                setActiveTab('contact');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* 3 Core Departments Showcase */}
            <CategoryGrid
              selectedSection={activeSection}
              onSelectSection={(sec) => {
                setActiveSection(sec);
                setActiveTab('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Featured Product Highlights from all 3 Sections */}
            <section className="py-10 sm:py-20 bg-[#FAF8F5] border-b border-[#E8E2D9]">
              <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-12">
                  <div className="space-y-1.5 sm:space-y-2">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#0F2E22] bg-white px-3 py-1 rounded-full border border-[#D4AF37]/50 shadow-xs inline-block">
                      AUTHENTIC LAGOS INVENTORY
                    </span>
                    <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#0F2E22] tracking-tight">
                      FEATURED COLLECTIONS
                    </h2>
                    <p className="text-xs sm:text-base text-gray-600 font-medium">
                      Explore top-selling Cloths, Handcrafted Shoes, and Tailoring Machines ready for immediate dispatch.
                    </p>
                  </div>

                  {/* Section Segmented Filter Buttons - Horizontally Scrollable Bar */}
                  <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-1 max-w-full">
                    <button
                      onClick={() => setActiveSection('all')}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all shrink-0 ${
                        activeSection === 'all'
                          ? 'bg-[#0F2E22] text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      All Items ({products.length})
                    </button>

                    <button
                      onClick={() => setActiveSection('cloths')}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                        activeSection === 'cloths'
                          ? 'bg-emerald-900 text-white shadow-md'
                          : 'bg-white text-emerald-900 border border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <Shirt className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Cloths ({clothsCount})</span>
                    </button>

                    <button
                      onClick={() => setActiveSection('shoes')}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                        activeSection === 'shoes'
                          ? 'bg-amber-800 text-white shadow-md'
                          : 'bg-white text-amber-900 border border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <Footprints className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Shoes ({shoesCount})</span>
                    </button>

                    <button
                      onClick={() => setActiveSection('tailoring-machine')}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                        activeSection === 'tailoring-machine'
                          ? 'bg-blue-900 text-white shadow-md'
                          : 'bg-white text-blue-900 border border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <Scissors className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Machines ({machinesCount})</span>
                    </button>
                  </div>
                </div>

                {/* Product Cards Grid (Split 2-Column Grid on Mobile) */}
                {filteredProducts.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-3xl border border-[#E8E2D9] space-y-3">
                    <Package className="w-10 h-10 text-gray-300 mx-auto" />
                    <h3 className="text-base font-black text-gray-800">
                      {products.length === 0 ? 'Your item collection is currently empty' : 'No items found in this section'}
                    </h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      {products.length === 0 
                        ? 'All items in your collection have been deleted. You can add new products anytime via the Admin Portal.' 
                        : 'Select another department above to view available products.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        settings={settings}
                        onOpenDetail={(prod, defQty) => {
                          setSelectedDetailProduct(prod);
                          setDetailDefaultQty(defQty || 1);
                        }}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                )}

                {/* View Full Catalog CTA */}
                <div className="mt-14 text-center">
                  <button
                    onClick={() => {
                      setActiveTab('catalog');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-8 py-4 rounded-2xl bg-[#0F2E22] hover:bg-[#1B4332] text-white font-black text-sm sm:text-base shadow-xl transition-all"
                  >
                    Explore Complete Department Catalog ({products.length} Items)
                  </button>
                </div>

              </div>
            </section>

            {/* Why Shop With Us */}
            <WhyShopWithUs />

            {/* How to Inquire & Order */}
            <HowToOrder />

            {/* Customer Testimonials */}
            <CustomerReviews />

            {/* Delivery & Logistics Info */}
            <DeliverySection settings={settings} />

            {/* About Store Section */}
            <AboutUsSection
              settings={settings}
              onShopClick={() => {
                setActiveTab('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Contact & Physical Address */}
            <ContactSection settings={settings} />
          </>
        )}

        {/* VIEW 2: CATALOG VIEW (3 SECTIONS FILTERABLE WITH 10-ITEM PAGINATION) */}
        {activeTab === 'catalog' && (
          <section className="py-12 sm:py-16 bg-[#FAF8F5]" id="catalog-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              
              {/* Header Title */}
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <span className="text-xs font-black uppercase tracking-widest text-[#0F2E22] bg-white px-4 py-1.5 rounded-full border border-[#D4AF37]/50 shadow-xs inline-block">
                  AYOBAMI SAM VENTURES STORE CATALOGUE
                </span>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#0F2E22] tracking-tight">
                  {activeSection === 'cloths' ? 'CLOTHS & FABRICS' :
                   activeSection === 'shoes' ? 'SHOES & BAGS' :
                   activeSection === 'tailoring-machine' ? 'TAILORING MACHINES' :
                   'COMPLETE INVENTORY CATALOG'}
                </h1>
                <p className="text-xs sm:text-base text-gray-600 font-medium">
                  Select any item to view swipeable multi-angle pictures and tap "Inquire Price on WhatsApp" for live quotes.
                </p>
              </div>

              {/* Department Category Quick-Select Filter Bar with Rich Icons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Option 1: All Items */}
                <button
                  type="button"
                  onClick={() => { setActiveSection('all'); setSelectedSubcategory('all'); setCurrentPage(1); }}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-left cursor-pointer ${
                    activeSection === 'all'
                      ? 'bg-[#0F2E22] text-white border-[#D4AF37] shadow-md ring-2 ring-[#D4AF37]/30'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-[#0F2E22] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeSection === 'all' ? 'bg-[#D4AF37] text-[#0F2E22]' : 'bg-[#FAF8F5] text-[#0F2E22]'
                  }`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#D4AF37] block">Overview</span>
                    <h4 className="text-xs sm:text-sm font-black truncate">All Products</h4>
                    <span className="text-[11px] opacity-80 font-bold block">{products.length} Items</span>
                  </div>
                </button>

                {/* Option 2: Cloths & Fabrics */}
                <button
                  type="button"
                  onClick={() => { setActiveSection('cloths'); setSelectedSubcategory('all'); setCurrentPage(1); }}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-left cursor-pointer ${
                    activeSection === 'cloths'
                      ? 'bg-[#0F2E22] text-white border-[#D4AF37] shadow-md ring-2 ring-[#D4AF37]/30'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-emerald-700 hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeSection === 'cloths' ? 'bg-[#D4AF37] text-[#0F2E22]' : 'bg-emerald-50 text-emerald-800'
                  }`}>
                    <Shirt className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#D4AF37] block">Department 01</span>
                    <h4 className="text-xs sm:text-sm font-black truncate">Cloths & Fabrics</h4>
                    <span className="text-[11px] opacity-80 font-bold block">{clothsCount} Items</span>
                  </div>
                </button>

                {/* Option 3: Shoes & Bags */}
                <button
                  type="button"
                  onClick={() => { setActiveSection('shoes'); setSelectedSubcategory('all'); setCurrentPage(1); }}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-left cursor-pointer ${
                    activeSection === 'shoes'
                      ? 'bg-[#0F2E22] text-white border-[#D4AF37] shadow-md ring-2 ring-[#D4AF37]/30'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-amber-700 hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeSection === 'shoes' ? 'bg-[#D4AF37] text-[#0F2E22]' : 'bg-amber-50 text-amber-800'
                  }`}>
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#D4AF37] block">Department 02</span>
                    <h4 className="text-xs sm:text-sm font-black truncate">Shoes & Bags</h4>
                    <span className="text-[11px] opacity-80 font-bold block">{shoesCount} Items</span>
                  </div>
                </button>

                {/* Option 4: Tailoring Machines */}
                <button
                  type="button"
                  onClick={() => { setActiveSection('tailoring-machine'); setSelectedSubcategory('all'); setCurrentPage(1); }}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-left cursor-pointer ${
                    activeSection === 'tailoring-machine'
                      ? 'bg-[#0F2E22] text-white border-[#D4AF37] shadow-md ring-2 ring-[#D4AF37]/30'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-blue-700 hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeSection === 'tailoring-machine' ? 'bg-[#D4AF37] text-[#0F2E22]' : 'bg-blue-50 text-blue-800'
                  }`}>
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#D4AF37] block">Department 03</span>
                    <h4 className="text-xs sm:text-sm font-black truncate">Tailoring Machines</h4>
                    <span className="text-[11px] opacity-80 font-bold block">{machinesCount} Items</span>
                  </div>
                </button>
              </div>

              {/* SEARCH CODE RESULT NOTIFICATION BANNER (if searchQuery active) */}
              {searchQuery.trim() && (
                <div className="bg-[#0F2E22] text-white p-4 rounded-2xl border-2 border-[#D4AF37] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3 text-center sm:text-left">
                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#0F2E22] flex items-center justify-center font-black shrink-0">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] block">
                        Search Results Priority View
                      </span>
                      <p className="text-xs font-bold text-white">
                        Showing matches for <span className="underline text-[#D4AF37]">"{searchQuery}"</span> — Matched items displayed right at the top!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {/* Standard Product Cards Grid for All Sections */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white p-16 text-center rounded-3xl border border-[#E8E2D9] space-y-4">
                  <Package className="w-12 h-12 text-gray-300 mx-auto" />
                  <h3 className="text-lg font-black text-gray-800">
                    {products.length === 0 ? 'Your item collection is currently empty' : 'No products match your search criteria'}
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    {products.length === 0
                      ? 'All items in your collection have been deleted. You can create new items anytime through the Admin Portal.'
                      : 'Try searching with another code or selecting a department from above.'}
                  </p>
                  {products.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setIsAdminOpen(true)}
                      className="px-6 py-2.5 rounded-xl bg-[#0F2E22] hover:bg-[#1B4332] text-white font-black text-xs cursor-pointer shadow-md"
                    >
                      Open Admin Portal to Add Products
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setActiveSection('all'); setSearchQuery(''); setSelectedSubcategory('all'); setCurrentPage(1); }}
                      className="px-6 py-2.5 rounded-xl bg-[#0F2E22] text-white font-black text-xs cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Grid Layout: 2 Columns on Mobile / Split Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {paginatedProducts.map((product, idx) => {
                      const globalIndex = startIndex + idx + 1;
                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          itemNumber={globalIndex}
                          settings={settings}
                          onOpenDetail={(prod, defQty, itemNum) => {
                            setSelectedDetailProduct(prod);
                            setDetailDefaultQty(defQty || 1);
                            setSelectedDetailItemNumber(itemNum || globalIndex);
                          }}
                          onAddToCart={handleAddToCart}
                        />
                      );
                    })}
                  </div>

                    {/* Numbered Pagination Control Bar (10 Items Per Page) */}
                    {totalPages > 1 && (
                      <div className="pt-8 border-t border-[#E8E2D9] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs font-bold text-gray-600">
                          Showing <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + itemsPerPage, filteredProducts.length)}</strong> of <strong>{filteredProducts.length}</strong> items (Page <strong>{safeCurrentPage}</strong> of <strong>{totalPages}</strong>)
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (safeCurrentPage > 1) {
                                setCurrentPage(safeCurrentPage - 1);
                                document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            disabled={safeCurrentPage === 1}
                            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 border ${
                              safeCurrentPage === 1
                                ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                                : 'bg-white text-[#0F2E22] hover:bg-[#0F2E22] hover:text-white border-[#0F2E22] shadow-xs cursor-pointer'
                            }`}
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Previous</span>
                          </button>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => {
                                setCurrentPage(pageNum);
                                document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                safeCurrentPage === pageNum
                                  ? 'bg-[#0F2E22] text-[#D4AF37] shadow-md border-2 border-[#D4AF37] scale-105'
                                  : 'bg-white text-gray-700 hover:bg-[#FAF8F5] border border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => {
                              if (safeCurrentPage < totalPages) {
                                setCurrentPage(safeCurrentPage + 1);
                                document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            disabled={safeCurrentPage === totalPages}
                            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 border ${
                              safeCurrentPage === totalPages
                                ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                                : 'bg-white text-[#0F2E22] hover:bg-[#0F2E22] hover:text-white border-[#0F2E22] shadow-xs cursor-pointer'
                            }`}
                          >
                            <span>Next</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

            </div>
          </section>
        )}

        {/* VIEW 3: ABOUT US VIEW */}
        {activeTab === 'about' && (
          <>
            <AboutUsSection
              settings={settings}
              onShopClick={() => {
                setActiveTab('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            <WhyShopWithUs />
            <CustomerReviews />
          </>
        )}

        {/* VIEW 4: CONTACT US VIEW */}
        {activeTab === 'contact' && (
          <>
            <ContactSection settings={settings} />
            <DeliverySection settings={settings} />
          </>
        )}

      </main>

      {/* Footer Removed */}

      {/* PRODUCT DETAIL MODAL (No Price Tags, Touch Jumia Carousel) */}
      <ProductDetailModal
        product={selectedDetailProduct}
        itemNumber={selectedDetailItemNumber}
        settings={settings}
        defaultQuantity={detailDefaultQty}
        onClose={() => setSelectedDetailProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={(prod, qty, col) => {
          handleAddToCart(prod, qty, col);
          setSelectedDetailProduct(null);
          setIsInquiryBagOpen(true);
        }}
        onOpenYardGuide={() => setIsYardGuideOpen(true)}
      />

      {/* INQUIRY BAG DRAWER */}
      <CartDrawer
        isOpen={isInquiryBagOpen}
        onClose={() => setIsInquiryBagOpen(false)}
        cart={inquiryItems}
        settings={settings}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveInquiryItem}
        onClearCart={handleClearInquiryBag}
        onSubmitInquiry={handleSubmitInquiry}
      />

      {/* TAILOR YARD CALCULATOR MODAL */}
      <YardEstimatorModal
        isOpen={isYardGuideOpen}
        onClose={() => setIsYardGuideOpen(false)}
        onSelectSuggestedFabric={(fab: string) => {
          setSearchQuery(fab);
          setActiveTab('catalog');
          setIsYardGuideOpen(false);
        }}
      />

      {/* DEDICATED STORE ADMIN PORTAL */}
      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        settings={settings}
        inquiries={inquiries}
        onSaveProduct={(prod) => {
          setProducts(prev => {
            const idx = prev.findIndex(p => p.id === prod.id);
            let updated: FabricProduct[];
            if (idx > -1) {
              updated = [...prev];
              updated[idx] = prod;
            } else {
              updated = [prod, ...prev];
            }
            safeSetLocalStorage(STORAGE_KEYS.PRODUCTS, updated);
            return updated;
          });
          saveProductToDatabase(prod).catch(console.error);
        }}
        onDeleteProduct={(id) => {
          setProducts(prev => {
            const updated = prev.filter(p => p.id !== id);
            safeSetLocalStorage(STORAGE_KEYS.PRODUCTS, updated);
            return updated;
          });
          deleteProductFromDatabase(id).catch(console.error);
        }}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
          saveSettingsToDatabase(newSettings).catch(console.error);
        }}
        onUpdateInquiryStatus={(inqId, status) => {
          setInquiries(prev => {
            const updated = prev.map(inq => inq.id === inqId ? { ...inq, status } : inq);
            const target = updated.find(i => i.id === inqId);
            if (target) saveInquiryToDatabase(target).catch(console.error);
            return updated;
          });
        }}
        onResetToDefaults={() => {
          setProducts(INITIAL_PRODUCTS);
          setSettings(INITIAL_STORE_SETTINGS);
          try {
            localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);
          } catch {
            // ignore
          }
        }}
      />

      {/* Floating WhatsApp Quick Action Button */}
      <a
        href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hello, ${settings.storeName || 'Ayobami SAM Ventures'}, I want to place an order.`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#1EBE5D] text-white p-4 rounded-full shadow-2xl flex items-center gap-2.5 group hover:scale-110 transition-all duration-300 border-2 border-white"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
        <span className="hidden sm:inline font-black text-xs pr-1">Chat on WhatsApp</span>
      </a>

    </div>
  );
}
