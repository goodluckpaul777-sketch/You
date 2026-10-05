import React, { useState, useRef } from 'react';
import { FabricProduct, StoreSettings, InquiryRecord, MainSectionType, SectionCategoryInfo } from '../types';
import { MAIN_SECTIONS, OFFICIAL_LOGO_URL } from '../data/initialData';
import { compressImage } from '../utils/imageCompressor';
import {
  syncAllProductsToDatabase,
  removeAllProductImages,
  deleteAllProducts,
  isSupabaseConfigured,
  getSupabaseConfig,
  saveSupabaseConfig,
  uploadImageToSupabaseStorage
} from '../services/catalogService';
import { safeOpenUrl } from '../utils/formatters';
import { 
  Plus, Edit, Trash2, Package, Truck, Settings, ShoppingBag, 
  Check, RefreshCw, Upload, Star, ArrowLeft, ArrowRight, Image as ImageIcon, Eye,
  LogOut, Shield, Phone, MessageCircle, Layers, CheckCircle2, AlertCircle, Sparkles,
  Search, Filter, ExternalLink, Scissors, Footprints, Shirt, Lock, EyeOff, KeyRound,
  Download, UploadCloud, Database, Cloud
} from 'lucide-react';
import { FacebookIcon, TikTokIcon } from './SocialIcons';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  products: FabricProduct[];
  settings: StoreSettings;
  inquiries: InquiryRecord[];
  onSaveProduct: (product: FabricProduct) => Promise<void> | void;
  onDeleteProduct: (id: string) => Promise<void> | void;
  onUpdateSettings: (newSettings: StoreSettings) => Promise<void> | void;
  onUpdateInquiryStatus: (inquiryId: string, status: InquiryRecord['status']) => void;
  onResetToDefaults: () => void;
}

export function formatPhoneForWhatsApp(rawPhone: string): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  // Nigerian 11-digit local format: 08033810865 -> 2348033810865
  if (digits.length === 11 && digits.startsWith('0')) {
    return '234' + digits.slice(1);
  }

  // Double country code prefix format: 23408033810865 -> 2348033810865
  if (digits.startsWith('2340') && digits.length === 14) {
    return '234' + digits.slice(4);
  }

  // 10-digit format starting with 8, 7, 9 (e.g. 8033810865) -> 2348033810865
  if (digits.length === 10 && (digits.startsWith('8') || digits.startsWith('7') || digits.startsWith('9'))) {
    return '234' + digits;
  }

  // Standard 13-digit Nigerian format with 234 (e.g. 2348033810865)
  if (digits.startsWith('234') && digits.length === 13) {
    return digits;
  }

  return digits;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  products,
  settings,
  inquiries,
  onSaveProduct,
  onDeleteProduct,
  onUpdateSettings,
  onUpdateInquiryStatus,
  onResetToDefaults,
}) => {
  if (!isOpen) return null;

  // Password Protection State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const ADMIN_PASSWORD = '2006';

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('Incorrect password! Please enter the valid admin password.');
    }
  };

  const handleExitPortal = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
    setPasswordError('');
    onClose();
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'inquiries' | 'settings' | 'delivery'>('dashboard');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<'all' | MainSectionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<FabricProduct | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<FabricProduct | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [supabaseConfig, setSupabaseConfigState] = useState(() => getSupabaseConfig());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getSupabaseConfig()?.url || '');
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState(() => getSupabaseConfig()?.anonKey || '');
  const [supabaseConfigMsg, setSupabaseConfigMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const handleSyncAllToCloud = async () => {
    setIsSyncing(true);
    setSaveErrorMsg('');
    try {
      const count = await syncAllProductsToDatabase(products);
      setSaveSuccessMsg(`Successfully migrated ${count} products & custom images to live Supabase online database! All devices will now see these items.`);
      setTimeout(() => setSaveSuccessMsg(''), 7000);
    } catch (err: any) {
      setSaveErrorMsg('Error syncing to Supabase: ' + (err.message || String(err)));
      setTimeout(() => setSaveErrorMsg(''), 7000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = () => {
    const jsonString = JSON.stringify(products, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `asv_catalog_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const item of parsed) {
            onSaveProduct(item);
          }
          setSaveSuccessMsg(`Restored ${parsed.length} products from backup file!`);
          setTimeout(() => setSaveSuccessMsg(''), 6000);
        } else {
          setSaveSuccessMsg('Invalid backup file format');
          setTimeout(() => setSaveSuccessMsg(''), 6000);
        }
      } catch (err) {
        setSaveSuccessMsg('Failed to read backup file: ' + String(err));
        setTimeout(() => setSaveSuccessMsg(''), 6000);
      }
    };
    reader.readAsText(file);
    if (backupFileInputRef.current) {
      backupFileInputRef.current.value = '';
    }
  };

  const handleRemoveAllProductImagesAcrossCatalog = async () => {
    if (!window.confirm('Are you sure you want to completely remove all uploaded images from every product in the catalog?')) {
      return;
    }
    try {
      const count = await removeAllProductImages();
      setSaveSuccessMsg(`Completely removed images from all ${count} products.`);
      setTimeout(() => setSaveSuccessMsg(''), 5000);
      onResetToDefaults();
    } catch (err) {
      setSaveSuccessMsg('Failed to remove images: ' + String(err));
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    }
  };

  const handleDeleteAllProductsCollection = async () => {
    if (!window.confirm('Are you sure you want to completely delete ALL items in the collection? This will remove every product from the store.')) {
      return;
    }
    try {
      await deleteAllProducts();
      for (const p of products) {
        onDeleteProduct(p.id);
      }
      setSaveSuccessMsg('All items in the collection have been deleted.');
      setTimeout(() => setSaveSuccessMsg(''), 5000);
      onResetToDefaults();
    } catch (err) {
      setSaveSuccessMsg('Failed to delete items: ' + String(err));
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    }
  };

  // Editable settings draft
  const [draftSettings, setDraftSettings] = useState<StoreSettings>(settings);

  // Product Form State
  const [productForm, setProductForm] = useState<Partial<FabricProduct>>({
    name: '',
    mainSection: 'cloths',
    category: '',
    categorySlug: 'ankara',
    description: '',
    availableStock: 50,
    minimumOrder: 1,
    unitLabel: '',
    image: '',
    galleryImages: [],
    colors: ['Multi-Color'],
    fabricType: '',
    isNewArrival: true,
    isFeatured: true,
    inStock: true,
    suitableFor: ['Retail & Wholesale'],
    isWholesaleAvailable: true,
    wholesaleNote: 'Bulk wholesale inquiry available.'
  });

  const clothsCount = products.filter(p => p.mainSection === 'cloths').length;
  const shoesCount = products.filter(p => p.mainSection === 'shoes').length;
  const machinesCount = products.filter(p => p.mainSection === 'tailoring-machine').length;

  const handleStartEdit = (prod: FabricProduct) => {
    setEditingProduct(prod);
    const initialGallery = (prod.galleryImages && prod.galleryImages.length > 0)
      ? [...prod.galleryImages]
      : (prod.image ? [prod.image] : []);
    
    setProductForm({
      ...prod,
      galleryImages: initialGallery,
    });
    setIsCreatingNew(false);
  };

  const handleStartCreate = (defaultSection: MainSectionType = 'cloths') => {
    setEditingProduct(null);
    setProductForm({
      id: `prod-${Date.now()}`,
      name: '',
      mainSection: defaultSection,
      category: '',
      categorySlug: defaultSection,
      description: '',
      availableStock: 50,
      minimumOrder: 1,
      unitLabel: '',
      image: '',
      galleryImages: [],
      colors: ['Standard Original'],
      fabricType: '',
      isNewArrival: true,
      isFeatured: true,
      inStock: true,
      suitableFor: ['Retail & Wholesale'],
      isWholesaleAvailable: true,
      wholesaleNote: 'Contact on WhatsApp for wholesale cartons & bundle rates.'
    });
    setIsCreatingNew(true);
  };

  const currentGalleryImages = (productForm.galleryImages && productForm.galleryImages.length > 0)
    ? productForm.galleryImages
    : (productForm.image ? [productForm.image] : []);

  const handleAddImageUrl = async () => {
    if (!newImageUrl.trim()) return;
    try {
      const compressed = await compressImage(newImageUrl.trim(), 800, 0.75);
      const updated = [...currentGalleryImages, compressed];
      setProductForm({
        ...productForm,
        galleryImages: updated,
        image: updated[0] || productForm.image,
      });
      setNewImageUrl('');
    } catch {
      const updated = [...currentGalleryImages, newImageUrl.trim()];
      setProductForm({
        ...productForm,
        galleryImages: updated,
        image: updated[0] || productForm.image,
      });
      setNewImageUrl('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setSaveErrorMsg('');

    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImage(file, 800, 0.75);
        let finalImageUrl = compressed;

        // If Supabase Storage is configured, upload directly to the bucket 'product-images'
        if (isSupabaseConfigured()) {
          try {
            finalImageUrl = await uploadImageToSupabaseStorage(
              compressed,
              `${productForm.name || 'product'}_${Date.now()}`
            );
          } catch (storageErr: any) {
            console.warn('[Supabase Storage] Upload notice:', storageErr);
            setSaveErrorMsg(`Note on image storage: ${storageErr.message || 'Image stored as preview'}`);
          }
        }

        setProductForm((prev) => {
          const existing = prev.galleryImages || (prev.image ? [prev.image] : []);
          const updated = [...existing, finalImageUrl];
          return {
            ...prev,
            galleryImages: updated,
            image: updated[0] || prev.image,
          };
        });
      } catch (err) {
        console.error('Image upload compression error:', err);
      }
    }

    setIsUploadingImage(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMoveImage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= currentGalleryImages.length) return;
    const copy = [...currentGalleryImages];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    setProductForm({
      ...productForm,
      galleryImages: copy,
      image: copy[0] || productForm.image,
    });
  };

  const handleRemoveImage = (index: number) => {
    const updated = currentGalleryImages.filter((_, idx) => idx !== index);
    setProductForm({
      ...productForm,
      galleryImages: updated,
      image: updated[0] || '',
    });
  };

  const handleRemoveAllImages = () => {
    setProductForm({
      ...productForm,
      galleryImages: [],
      image: '',
    });
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name?.trim()) {
      setSaveErrorMsg('Please enter a product name');
      setTimeout(() => setSaveErrorMsg(''), 4000);
      return;
    }

    setIsSavingProduct(true);
    setSaveErrorMsg('');

    try {
      const rawGallery = (productForm.galleryImages && productForm.galleryImages.length > 0)
        ? productForm.galleryImages
        : (productForm.image ? [productForm.image] : []);

      // Compress all images in gallery asynchronously
      const compressedGallery = await Promise.all(
        rawGallery.map(img => compressImage(img, 800, 0.75))
      );

      // If Supabase Storage is configured, convert any remaining data URLs to Supabase Storage URLs
      let uploadedGallery = compressedGallery;
      if (isSupabaseConfigured()) {
        uploadedGallery = await Promise.all(
          compressedGallery.map(async (img, idx) => {
            if (img.startsWith('data:')) {
              try {
                return await uploadImageToSupabaseStorage(img, `${productForm.name || 'product'}_${idx}`);
              } catch (upErr) {
                console.warn('[Supabase Storage] Failed to upload image to bucket:', upErr);
                return img;
              }
            }
            return img;
          })
        );
      }

      const autoGeneratedCode = productForm.productCode?.trim() || `019${String(products.length + 1).padStart(3, '0')}-1`;

      const productToSave: FabricProduct = {
        ...productForm,
        id: productForm.id || `prod-${Date.now()}`,
        name: productForm.name.trim(),
        mainSection: (productForm.mainSection as MainSectionType) || 'cloths',
        category: productForm.category || '',
        categorySlug: productForm.categorySlug || 'general',
        description: productForm.description || '',
        availableStock: Number(productForm.availableStock) || 50,
        minimumOrder: Number(productForm.minimumOrder) || 1,
        unitLabel: productForm.unitLabel || '',
        image: uploadedGallery[0] || productForm.image || '/hero-logo.png',
        galleryImages: uploadedGallery,
        colors: Array.isArray(productForm.colors) ? productForm.colors : ['Standard Original'],
        fabricType: productForm.fabricType || '',
        isNewArrival: !!productForm.isNewArrival,
        isFeatured: !!productForm.isFeatured,
        inStock: productForm.inStock !== false,
        rating: productForm.rating || 4.9,
        reviewCount: productForm.reviewCount || 20,
        suitableFor: productForm.suitableFor || ['Retail & Wholesale'],
        textureNote: productForm.textureNote || '',
        origin: productForm.origin || 'Lagos, Nigeria',
        isWholesaleAvailable: productForm.isWholesaleAvailable !== false,
        wholesaleNote: productForm.wholesaleNote || 'Contact on WhatsApp for wholesale inquiry.',
        badge: productForm.badge || '',
        productCode: autoGeneratedCode,
        price: Number(productForm.price) || Number(productForm.pricePerYard) || 0,
        pricePerYard: Number(productForm.pricePerYard) || Number(productForm.price) || 0,
      };

      await onSaveProduct(productToSave);
      setSaveSuccessMsg(`Saved "${productToSave.name}" permanently to Supabase database!`);
      setTimeout(() => setSaveSuccessMsg(''), 5000);
      setEditingProduct(null);
      setIsCreatingNew(false);
    } catch (err: any) {
      console.error('Failed to save product to Supabase:', err);
      setSaveErrorMsg(`Error saving to Supabase: ${err.message || String(err)}`);
      setTimeout(() => setSaveErrorMsg(''), 7000);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(draftSettings);
    setSaveSuccessMsg('Store profile and social handles updated successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleDeliveryRateChange = (stateKey: string, newRate: number, newDays: string) => {
    setDraftSettings(prev => ({
      ...prev,
      stateDeliveryRates: {
        ...prev.stateDeliveryRates,
        [stateKey]: {
          ...prev.stateDeliveryRates[stateKey],
          rate: newRate,
          deliveryDays: newDays,
        }
      }
    }));
  };

  const filteredProducts = products.filter(p => {
    const matchesSection = selectedSectionFilter === 'all' || p.mainSection === selectedSectionFilter;
    const matchesQuery = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fabricType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesQuery;
  });

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-[#D4AF37] space-y-6 text-center relative overflow-hidden">
          
          <div className="w-16 h-16 rounded-2xl bg-[#0F2E22] text-[#D4AF37] flex items-center justify-center mx-auto shadow-lg border border-[#D4AF37]/40">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#B07D38] bg-[#F3E8D6] px-3 py-1 rounded-full">
              RESTRICTED ADMIN ACCESS
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#0F2E22] tracking-tight mt-2">
              Enter Admin Password
            </h2>
            <p className="text-xs text-gray-600 mt-1 font-medium">
              Authorized access only. Enter password to unlock the store manager portal.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="Enter password"
                autoFocus
                className="w-full px-4 py-3.5 pr-12 rounded-2xl border-2 border-[#E2D9CE] focus:border-[#0F2E22] text-center text-lg font-black tracking-widest text-[#0F2E22] placeholder-gray-400 focus:outline-none transition-all bg-[#FAF8F5]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0F2E22] p-1 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {passwordError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 animate-fadeIn flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleExitPortal}
                className="flex-1 py-3.5 rounded-2xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 rounded-2xl bg-[#0F2E22] hover:bg-[#1B4332] text-white font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                <span>Unlock Portal</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex flex-col justify-start items-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      
      {/* Main Admin Portal Window */}
      <div className="bg-[#FAF8F5] w-full max-w-7xl rounded-3xl shadow-2xl border-2 border-[#D4AF37]/50 overflow-hidden flex flex-col min-h-[90vh] my-auto">
        
        {/* Top Header Bar with ASV Logo */}
        <div className="bg-[#0F2E22] text-white px-6 py-5 border-b-2 border-[#D4AF37] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={settings.logoUrl || OFFICIAL_LOGO_URL || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}
              alt="Ayobami SAM Ventures Logo"
              className="w-16 h-16 object-contain drop-shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#D4AF37] bg-white/10 px-2.5 py-0.5 rounded-md border border-[#D4AF37]/30">
                  ADMIN PORTAL
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Store Manager
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                {settings.storeName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              isSupabaseConfigured()
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{isSupabaseConfigured() ? 'Supabase: Live Connected' : 'Supabase: Offline Cache'}</span>
            </span>
            <button
              onClick={handleExitPortal}
              className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#c49b29] text-[#0F2E22] font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit & Lock Portal</span>
            </button>
          </div>
        </div>

        {/* Error Alert Banner */}
        {saveErrorMsg && (
          <div className="bg-red-600 text-white px-6 py-3 font-bold text-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{saveErrorMsg}</span>
            </div>
            <button onClick={() => setSaveErrorMsg('')} className="text-white/80 hover:text-white font-black text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="bg-emerald-700 text-white px-6 py-3 font-bold text-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg('')} className="text-white/80 hover:text-white font-black text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs - Single Horizontal Straight Line of Icon Stickers */}
        <div className="bg-white border-b border-[#E8E2D9] px-4 sm:px-6 py-2.5 flex items-center justify-center sm:justify-start gap-3 sm:gap-4 overflow-x-auto whitespace-nowrap scrollbar-none">
          
          {/* Sticker 1: Dashboard */}
          <button
            onClick={() => { setActiveTab('dashboard'); setEditingProduct(null); setIsCreatingNew(false); }}
            title="Dashboard Overview"
            aria-label="Dashboard Overview"
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#0F2E22] text-[#D4AF37] shadow-md scale-105 border-2 border-[#D4AF37]'
                : 'bg-[#FAF8F5] hover:bg-[#F0EAE1] text-gray-700 border border-gray-200'
            }`}
          >
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Sticker 2: Products Catalog */}
          <button
            onClick={() => { setActiveTab('products'); setEditingProduct(null); setIsCreatingNew(false); }}
            title={`Products Catalog (${products.length} items)`}
            aria-label="Products Catalog"
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl transition-all flex items-center justify-center shrink-0 relative cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#0F2E22] text-[#D4AF37] shadow-md scale-105 border-2 border-[#D4AF37]'
                : 'bg-[#FAF8F5] hover:bg-[#F0EAE1] text-gray-700 border border-gray-200'
            }`}
          >
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="absolute -top-1 -right-1 bg-emerald-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white">
              {products.length}
            </span>
          </button>

          {/* Sticker 3: Price & Order Inquiries */}
          {(() => {
            const newInquiriesCount = inquiries.filter(i => i.status === 'New Inquiry').length;
            return (
              <button
                onClick={() => { setActiveTab('inquiries'); setEditingProduct(null); setIsCreatingNew(false); }}
                title={`Price & Order Inquiries (${newInquiriesCount} new, ${inquiries.length} total)`}
                aria-label="Price & Order Inquiries"
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl transition-all flex items-center justify-center shrink-0 relative cursor-pointer ${
                  activeTab === 'inquiries'
                    ? 'bg-[#0F2E22] text-[#D4AF37] shadow-md scale-105 border-2 border-[#D4AF37]'
                    : 'bg-[#FAF8F5] hover:bg-[#F0EAE1] text-gray-700 border border-gray-200'
                }`}
              >
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                {newInquiriesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white animate-pulse shadow">
                    {newInquiriesCount}
                  </span>
                )}
              </button>
            );
          })()}

          {/* Sticker 4: Store Profile & Social Links */}
          <button
            onClick={() => { setActiveTab('settings'); setEditingProduct(null); setIsCreatingNew(false); }}
            title="Store Profile & Social Links"
            aria-label="Store Profile & Social Links"
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#0F2E22] text-[#D4AF37] shadow-md scale-105 border-2 border-[#D4AF37]'
                : 'bg-[#FAF8F5] hover:bg-[#F0EAE1] text-gray-700 border border-gray-200'
            }`}
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Sticker 5: Delivery & Shipping Rates */}
          <button
            onClick={() => { setActiveTab('delivery'); setEditingProduct(null); setIsCreatingNew(false); }}
            title="Delivery & Shipping Rates"
            aria-label="Delivery & Shipping Rates"
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
              activeTab === 'delivery'
                ? 'bg-[#0F2E22] text-[#D4AF37] shadow-md scale-105 border-2 border-[#D4AF37]'
                : 'bg-[#FAF8F5] hover:bg-[#F0EAE1] text-gray-700 border border-gray-200'
            }`}
          >
            <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

        </div>

        {/* Tab Content Body */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                
                {/* Section 1: Cloths */}
                <div className="bg-white p-6 rounded-2xl border-2 border-emerald-800/20 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-gray-400 block tracking-wider">Section 1</span>
                    <h3 className="text-2xl font-black text-[#0F2E22] mt-1">{clothsCount} Products</h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">Cloths & Fabrics</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Shirt className="w-6 h-6" />
                  </div>
                </div>

                {/* Section 2: Shoes */}
                <div className="bg-white p-6 rounded-2xl border-2 border-amber-600/20 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-gray-400 block tracking-wider">Section 2</span>
                    <h3 className="text-2xl font-black text-amber-800 mt-1">{shoesCount} Products</h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">Shoes & Bags</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Footprints className="w-6 h-6" />
                  </div>
                </div>

                {/* Section 3: Tailoring Machines */}
                <div className="bg-white p-6 rounded-2xl border-2 border-blue-900/20 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-gray-400 block tracking-wider">Section 3</span>
                    <h3 className="text-2xl font-black text-blue-950 mt-1">{machinesCount} Products</h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">Tailoring Machines</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                    <Scissors className="w-6 h-6" />
                  </div>
                </div>

                {/* Cloud Database Status */}
                <div className="bg-white p-6 rounded-2xl border-2 border-emerald-600/20 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-emerald-600 block tracking-wider">Cloud Database</span>
                    <h3 className="text-2xl font-black text-emerald-900 mt-1">Database Connected</h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">Real-time sync to all devices</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                    <Shield className="w-6 h-6" />
                  </div>
                </div>

                {/* Total Customer Inquiries */}
                <div className="bg-[#0F2E22] text-white p-6 rounded-2xl border-2 border-[#D4AF37]/50 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-[#D4AF37] block tracking-wider">Direct WhatsApp</span>
                    <h3 className="text-2xl font-black text-white mt-1">{inquiries.length} Inquiries</h3>
                    <p className="text-xs text-emerald-200 font-semibold mt-0.5">Price & Quote Requests</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#D4AF37] text-[#0F2E22] flex items-center justify-center font-black">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* Cloud Synchronization & Catalog Backup Card */}
              <div className="bg-gradient-to-r from-[#0F2E22] to-[#1B4332] text-white p-6 rounded-2xl border-2 border-[#D4AF37]/50 shadow-md space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#0F2E22] bg-[#D4AF37] px-2.5 py-0.5 rounded shadow-xs">
                        Hosted Website (Vercel) Sync
                      </span>
                      <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        {products.length} Products in Store
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                      Publish & Sync All Products to Live Cloud
                    </h3>
                    <p className="text-xs text-[#E0D6C8] font-medium max-w-2xl leading-relaxed mt-0.5">
                      Ensure all products, descriptions, and custom pictures you've added show on your live hosted Vercel website for all public visitors.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSyncAllToCloud}
                      disabled={isSyncing}
                      className="px-5 py-3 rounded-xl bg-[#D4AF37] hover:bg-[#c49b29] text-[#0F2E22] font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      <UploadCloud className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing to Cloud...' : 'Push All Products to Cloud Now'}</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
                      title="Download a backup file with all products and images"
                    >
                      <Download className="w-4 h-4 text-[#D4AF37]" />
                      <span>Backup JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => backupFileInputRef.current?.click()}
                      className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
                      title="Restore products from a previously downloaded backup file"
                    >
                      <Upload className="w-4 h-4 text-emerald-300" />
                      <span>Restore JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveAllProductImagesAcrossCatalog}
                      className="px-4 py-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-200 font-bold text-xs flex items-center gap-2 border border-red-500/30 transition-all cursor-pointer"
                      title="Completely remove all uploaded images from all products in catalog"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span>Remove All Upload Images</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteAllProductsCollection}
                      className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                      title="Permanently delete all items from your collection"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                      <span>Delete All Items Collection</span>
                    </button>
                    <input
                      type="file"
                      ref={backupFileInputRef}
                      onChange={handleImportBackup}
                      accept=".json"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2D9CE] shadow-sm space-y-4">
                <h3 className="text-base font-black text-[#0F2E22]">
                  Quick Inventory Actions for Ayobami SAM Ventures
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      setActiveTab('products');
                      handleStartCreate('cloths');
                    }}
                    className="p-4 rounded-xl bg-[#0F2E22] hover:bg-[#1B4332] text-white text-left flex items-center gap-3 transition-all"
                  >
                    <Shirt className="w-6 h-6 text-[#D4AF37]" />
                    <div>
                      <span className="text-xs font-black block">Add New Fabric / Cloth</span>
                      <span className="text-[11px] text-emerald-200">Ankara, Lace, Senator, Atiku</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('products');
                      handleStartCreate('shoes');
                    }}
                    className="p-4 rounded-xl bg-[#735738] hover:bg-[#5C452C] text-white text-left flex items-center gap-3 transition-all"
                  >
                    <Footprints className="w-6 h-6 text-[#D4AF37]" />
                    <div>
                      <span className="text-xs font-black block">Add New Shoes / Bag</span>
                      <span className="text-[11px] text-amber-200">Loafers, Heels, Matching Sets</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('products');
                      handleStartCreate('tailoring-machine');
                    }}
                    className="p-4 rounded-xl bg-[#1E3A8A] hover:bg-[#1E293B] text-white text-left flex items-center gap-3 transition-all"
                  >
                    <Scissors className="w-6 h-6 text-[#D4AF37]" />
                    <div>
                      <span className="text-xs font-black block">Add Tailoring Machine</span>
                      <span className="text-[11px] text-blue-200">Industrial & Domestic Sewing Machines</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Store Identity Box */}
              <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#D8CFC4] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <img
                    src={settings.logoUrl || OFFICIAL_LOGO_URL || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}
                    alt="Store Logo"
                    className="w-20 h-20 rounded-2xl object-contain bg-white p-2 border border-[#D4AF37]/50 shadow-md"
                  />
                  <div>
                    <h4 className="text-lg font-black text-[#0F2E22]">{settings.storeName}</h4>
                    <p className="text-xs text-gray-600 font-medium">{settings.tagline}</p>
                    <p className="text-xs text-gray-500 mt-1">📍 {settings.address}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-bold text-[#0F2E22]">
                      <span>📞 {settings.phone}</span>
                      <span>•</span>
                      <span>💬 WhatsApp: {settings.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-5 py-2.5 rounded-xl bg-white border border-[#D8CFC4] hover:bg-[#EAE2D8] text-xs font-black text-[#0F2E22] transition-colors"
                  >
                    Edit Store Details
                  </button>
                  <a
                    href={`https://wa.me/${settings.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Open WhatsApp</span>
                  </a>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PRODUCT MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              
              {/* Product Form (Create / Edit) */}
              {(isCreatingNew || editingProduct) ? (
                <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-[#0F2E22]/20 shadow-md space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4">
                    <div>
                      <span className="text-xs font-black uppercase text-[#D4AF37] block tracking-wider">
                        {isCreatingNew ? 'Create New Item' : 'Edit Inventory Item'}
                      </span>
                      <h3 className="text-xl font-black text-[#0F2E22]">
                        {isCreatingNew ? 'Add Product to 3 Main Sections' : `Editing: ${editingProduct?.name}`}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setEditingProduct(null); setIsCreatingNew(false); }}
                      className="text-xs font-black px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Cancel & Return
                    </button>
                  </div>

                  <form onSubmit={handleSaveProductSubmit} className="space-y-6">
                    
                    {/* Section Selector */}
                    <div>
                      <label className="block text-xs font-black uppercase text-[#0F2E22] mb-2">
                        Select Main Section (Required)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, mainSection: 'cloths', unitLabel: 'yard' })}
                          className={`p-4 rounded-xl border-2 text-left font-black text-xs sm:text-sm flex items-center gap-3 transition-all ${
                            productForm.mainSection === 'cloths'
                              ? 'border-[#0F2E22] bg-[#0F2E22] text-white shadow-md'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                          }`}
                        >
                          <Shirt className="w-5 h-5 text-[#D4AF37]" />
                          <span>1. Cloths & Fabrics</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, mainSection: 'shoes', unitLabel: 'pair' })}
                          className={`p-4 rounded-xl border-2 text-left font-black text-xs sm:text-sm flex items-center gap-3 transition-all ${
                            productForm.mainSection === 'shoes'
                              ? 'border-amber-800 bg-amber-800 text-white shadow-md'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                          }`}
                        >
                          <Footprints className="w-5 h-5 text-[#D4AF37]" />
                          <span>2. Shoes & Bags</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, mainSection: 'tailoring-machine', unitLabel: 'machine' })}
                          className={`p-4 rounded-xl border-2 text-left font-black text-xs sm:text-sm flex items-center gap-3 transition-all ${
                            productForm.mainSection === 'tailoring-machine'
                              ? 'border-blue-900 bg-blue-900 text-white shadow-md'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                          }`}
                        >
                          <Scissors className="w-5 h-5 text-[#D4AF37]" />
                          <span>3. Tailoring Machines</span>
                        </button>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={productForm.name || ''}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          placeholder="e.g. Supreme Dutch Wax Ankara / Men's Italian Loafers"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:ring-2 focus:ring-[#0F2E22]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Category / Fabric Type
                        </label>
                        <input
                          type="text"
                          value={productForm.category || ''}
                          onChange={(e) => setProductForm({ ...productForm, category: e.target.value, fabricType: e.target.value })}
                          placeholder="e.g. Ankara Prints, Swiss Lace, Senator Cashmere, Industrial Machine"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold focus:ring-2 focus:ring-[#0F2E22]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Price in Naira (₦)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={productForm.price !== undefined ? productForm.price : (productForm.pricePerYard || 0)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setProductForm({ ...productForm, price: val, pricePerYard: val });
                          }}
                          placeholder="e.g. 15000"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:ring-2 focus:ring-[#0F2E22]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Available Stock Quantity
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={productForm.availableStock !== undefined ? productForm.availableStock : 50}
                          onChange={(e) => setProductForm({ ...productForm, availableStock: Number(e.target.value) })}
                          placeholder="50"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold focus:ring-2 focus:ring-[#0F2E22]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Design / Product Code
                        </label>
                        <input
                          type="text"
                          value={productForm.productCode || ''}
                          onChange={(e) => setProductForm({ ...productForm, productCode: e.target.value })}
                          placeholder="e.g. 019001-1"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold focus:ring-2 focus:ring-[#0F2E22]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Product Description & Material Details
                        </label>
                        <textarea
                          rows={2}
                          value={productForm.description || ''}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          placeholder="Provide details about texture, authenticity, origin, recommended usage..."
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-[#0F2E22]"
                        />
                      </div>
                    </div>



                    {/* MULTI-IMAGE GALLERY (Jumia style swipeable photos) */}
                    <div className="p-5 bg-[#FAF8F5] rounded-2xl border-2 border-dashed border-[#D8CFC4] space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-black text-[#0F2E22] flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
                            <span>Product Photos & Carousel Gallery ({currentGalleryImages.length} images)</span>
                          </h4>
                          <p className="text-xs text-gray-500 font-medium">
                            The first image is the main photo. Customers can swipe horizontally through all pictures like on Jumia.
                          </p>
                        </div>

                        <div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 rounded-xl bg-[#0F2E22] hover:bg-[#1B4332] text-white text-xs font-black flex items-center gap-1.5 shadow"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Upload from Phone / PC</span>
                          </button>
                        </div>
                      </div>

                      {/* Add by Image URL */}
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="Or paste image web link (https://...)"
                          className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="px-4 py-2 rounded-xl bg-[#0F2E22] hover:bg-[#1B4332] text-white font-bold text-xs shadow-xs"
                        >
                          Add URL
                        </button>
                      </div>

                      {/* Thumbnail Reorder Grid - Only rendered when images are selected */}
                      {currentGalleryImages.length > 0 ? (
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700">Uploaded Photos ({currentGalleryImages.length})</span>
                            <button
                              type="button"
                              onClick={handleRemoveAllImages}
                              className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove All Images</span>
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {currentGalleryImages.map((imgUrl, idx) => (
                              <div key={idx} className="relative group bg-white rounded-xl border border-[#D8CFC4] overflow-hidden p-1 shadow-xs">
                                <img
                                  src={imgUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}
                                  alt={`Gallery ${idx + 1}`}
                                  className="w-full aspect-square object-cover rounded-lg"
                                />
                                {idx === 0 && (
                                  <span className="absolute top-2 left-2 bg-[#D4AF37] text-[#0F2E22] text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                    MAIN
                                  </span>
                                )}
                                <div className="mt-1 flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-gray-400">#{idx + 1}</span>
                                  <div className="flex items-center gap-1">
                                    {idx > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveImage(idx, idx - 1)}
                                        className="p-1 hover:bg-gray-200 rounded"
                                        title="Move Left"
                                      >
                                        <ArrowLeft className="w-3 h-3 text-gray-700" />
                                      </button>
                                    )}
                                    {idx < currentGalleryImages.length - 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveImage(idx, idx + 1)}
                                        className="p-1 hover:bg-gray-200 rounded"
                                        title="Move Right"
                                      >
                                        <ArrowRight className="w-3 h-3 text-gray-700" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(idx)}
                                      className="p-1 hover:bg-red-100 text-red-600 rounded"
                                      title="Delete Photo"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-xs text-gray-400">
                          No photos added yet. Upload or paste image links above.
                        </div>
                      )}
                    </div>

                    {/* Stock & Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Stock Availability
                        </label>
                        <select
                          value={productForm.inStock ? 'true' : 'false'}
                          onChange={(e) => setProductForm({ ...productForm, inStock: e.target.value === 'true' })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold"
                        >
                          <option value="true">In Stock & Available</option>
                          <option value="false">Out of Stock (Pre-order)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Wholesale Availability
                        </label>
                        <select
                          value={productForm.isWholesaleAvailable ? 'true' : 'false'}
                          onChange={(e) => setProductForm({ ...productForm, isWholesaleAvailable: e.target.value === 'true' })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold"
                        >
                          <option value="true">Wholesale & Retail Active</option>
                          <option value="false">Retail Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Promotional Badge Text
                        </label>
                        <input
                          type="text"
                          value={productForm.badge || ''}
                          onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                          placeholder="e.g. BESTSELLER, HOT DROP, 100% COTTON"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold"
                        />
                      </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E2D9]">
                      <button
                        type="button"
                        onClick={() => { setEditingProduct(null); setIsCreatingNew(false); }}
                        className="px-6 py-3 rounded-xl border border-gray-300 font-bold text-xs hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProduct || isUploadingImage}
                        className="px-8 py-3 rounded-xl bg-[#0F2E22] hover:bg-[#1B4332] text-white font-black text-sm shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingProduct ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
                            <span>Saving to Supabase...</span>
                          </>
                        ) : isUploadingImage ? (
                          <>
                            <Upload className="w-4 h-4 animate-bounce text-[#D4AF37]" />
                            <span>Uploading Photos...</span>
                          </>
                        ) : (
                          <span>Save Product to Supabase</span>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              ) : (
                <>
                  {/* Products Header Bar with Filters */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2D9CE] shadow-xs">
                    
                    {/* Section Segmented Control */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedSectionFilter('all')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                          selectedSectionFilter === 'all'
                            ? 'bg-[#0F2E22] text-white shadow'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All Sections ({products.length})
                      </button>

                      <button
                        onClick={() => setSelectedSectionFilter('cloths')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                          selectedSectionFilter === 'cloths'
                            ? 'bg-[#0F2E22] text-white shadow'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Shirt className="w-3.5 h-3.5" />
                        <span>Cloths ({clothsCount})</span>
                      </button>

                      <button
                        onClick={() => setSelectedSectionFilter('shoes')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                          selectedSectionFilter === 'shoes'
                            ? 'bg-amber-800 text-white shadow'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Footprints className="w-3.5 h-3.5" />
                        <span>Shoes ({shoesCount})</span>
                      </button>

                      <button
                        onClick={() => setSelectedSectionFilter('tailoring-machine')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                          selectedSectionFilter === 'tailoring-machine'
                            ? 'bg-blue-900 text-white shadow'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Machines ({machinesCount})</span>
                      </button>
                    </div>

                    {/* Actions & Search */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 relative w-full sm:w-60">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search items..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-[#0F2E22] text-xs font-semibold focus:outline-none"
                          />
                          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <button
                          type="button"
                          className="px-3.5 py-2.5 rounded-xl bg-[#0F2E22] text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-black flex items-center gap-1 shrink-0 shadow-sm"
                        >
                          <Search className="w-4 h-4" />
                          <span className="hidden md:inline">Search</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleStartCreate(selectedSectionFilter === 'all' ? 'cloths' : selectedSectionFilter)}
                        className="px-4 py-2.5 rounded-xl bg-[#0F2E22] hover:bg-[#1B4332] text-white text-xs font-black flex items-center gap-1.5 shadow shrink-0"
                      >
                        <Plus className="w-4 h-4 text-[#D4AF37]" />
                        <span>Add Product</span>
                      </button>
                    </div>

                  </div>

                  {/* Inventory Table */}
                  <div className="bg-white rounded-2xl border border-[#E2D9CE] overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF8F5] border-b border-[#E2D9CE] text-[#0F2E22] font-black uppercase">
                          <tr>
                            <th className="p-4">Photo & Product Name</th>
                            <th className="p-4">Main Section</th>
                            <th className="p-4">Material / Spec</th>
                            <th className="p-4">Stock Status</th>
                            <th className="p-4">Gallery</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAE2D8]">
                          {filteredProducts.map((p) => {
                            const pImages = (p.galleryImages && p.galleryImages.length > 0) ? p.galleryImages : [p.image];
                            return (
                              <tr key={p.id} className="hover:bg-[#FAF8F5]">
                                <td className="p-4 flex items-center gap-3">
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="w-12 h-12 rounded-xl object-cover border border-[#D8CFC4] shrink-0"
                                  />
                                  <div>
                                    <span className="font-bold text-[#1E1B18] text-sm block">{p.name}</span>
                                    <span className="text-[11px] text-gray-500">{p.category}</span>
                                  </div>
                                </td>

                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-md font-black text-[10px] uppercase ${
                                    p.mainSection === 'cloths'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : p.mainSection === 'shoes'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {p.mainSection === 'cloths' ? 'Cloths' : p.mainSection === 'shoes' ? 'Shoes' : 'Tailoring Machine'}
                                  </span>
                                </td>

                                <td className="p-4 font-semibold text-gray-700">
                                  {p.fabricType}
                                </td>

                                <td className="p-4">
                                  <span className={`font-bold ${p.inStock ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {p.inStock ? '✓ In Stock' : '✕ Out of Stock'}
                                  </span>
                                </td>

                                <td className="p-4">
                                  <span className="bg-[#FAF0CA] text-[#705300] px-2.5 py-1 rounded-md font-bold text-[11px]">
                                    {pImages.length} {pImages.length === 1 ? 'photo' : 'photos'}
                                  </span>
                                </td>

                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(p)}
                                      className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold transition-colors cursor-pointer"
                                      title="Edit product"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmProduct(p);
                                      }}
                                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg font-bold transition-colors cursor-pointer"
                                      title="Delete product"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

            </div>
          )}

          {/* TAB 3: CUSTOMER INQUIRIES & PRICE REQUESTS */}
          {activeTab === 'inquiries' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-[#E2D9CE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-[#0F2E22]">
                    Customer Inquiries & Price Quotations ({inquiries.length})
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Customers inquiry list submitted from the store. You can reply instantly via direct WhatsApp.
                  </p>
                </div>
              </div>

              {inquiries.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-[#E2D9CE] text-sm text-gray-500 space-y-3">
                  <MessageCircle className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="font-bold text-gray-700">No customer inquiries submitted yet.</p>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    When customers browse Cloths, Shoes, or Tailoring Machines and tap "Inquire for Price" or submit an inquiry bag, their requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inq) => (
                    <div key={inq.id} className="bg-white p-5 rounded-2xl border border-[#E2D9CE] shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE2D8] pb-3">
                        <div>
                          <span className="font-black text-sm text-[#0F2E22]">Inquiry #{inq.inquiryNumber || inq.id}</span>
                          <span className="text-xs text-gray-400 ml-3">{new Date(inq.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-black px-3 py-1 rounded-full ${
                            inq.status === 'Order Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                            inq.status === 'Contacted on WhatsApp' ? 'bg-blue-100 text-blue-800' :
                            inq.status === 'Quotation Sent' ? 'bg-purple-100 text-purple-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {inq.status}
                          </span>

                          <select
                            value={inq.status}
                            onChange={(e) => onUpdateInquiryStatus(inq.id, e.target.value as InquiryRecord['status'])}
                            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold"
                          >
                            <option value="New Inquiry">New Inquiry</option>
                            <option value="Contacted on WhatsApp">Contacted on WhatsApp</option>
                            <option value="Quotation Sent">Quotation Sent</option>
                            <option value="Order Confirmed">Order Confirmed</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <p><strong>Customer Name:</strong> {inq.customer?.fullName || 'Customer'}</p>
                          <p><strong>Phone:</strong> {inq.customer?.phone}</p>
                          <p><strong>Location:</strong> {inq.customer?.city}, {inq.customer?.state} State</p>
                          <p><strong>Inquiry Type:</strong> <span className="uppercase font-bold text-[#D4AF37]">{inq.customer?.inquiryType}</span></p>
                        </div>

                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (inq.status === 'New Inquiry') {
                                onUpdateInquiryStatus(inq.id, 'Contacted on WhatsApp');
                              }
                              const rawPhone = inq.customer?.whatsapp || inq.customer?.phone || '';
                              const formattedPhone = formatPhoneForWhatsApp(rawPhone);
                              const text = `Hello ${inq.customer?.fullName || 'Customer'}, thank you for contacting ${settings.storeName || 'Ayobami SAM Ventures'} regarding your inquiry #${inq.inquiryNumber || inq.id}.`;
                              safeOpenUrl(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs flex items-center gap-2 shadow transition-transform hover:scale-105 cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Reply Customer on WhatsApp</span>
                          </button>
                        </div>
                      </div>

                      {inq.items && inq.items.length > 0 && (
                        <div className="pt-3 border-t border-[#EAE2D8]">
                          <span className="text-[11px] font-black uppercase text-gray-500 block mb-2">
                            Requested Products ({inq.items.length})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {inq.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2.5 p-2 bg-[#FAF8F5] rounded-xl border border-[#EAE2D8]">
                                {item.image && (
                                  <img src={item.image} alt={item.productName} className="w-10 h-10 rounded-lg object-cover" />
                                )}
                                <div className="text-xs">
                                  <p className="font-bold text-[#0F2E22] line-clamp-1">{item.productName}</p>
                                  <p className="text-[11px] text-gray-500">Qty: {item.quantity} {item.unitLabel || 'unit'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STORE PROFILE & SOCIAL SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2D9CE] space-y-6">
              <div>
                <h3 className="text-lg font-black text-[#0F2E22]">
                  Store Identity, Social Media & Contact Details
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Update your official company branding, WhatsApp number, physical shop address, and social links.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Store / Company Name
                  </label>
                  <input
                    type="text"
                    value={draftSettings.storeName}
                    onChange={(e) => setDraftSettings({ ...draftSettings, storeName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Store Tagline
                  </label>
                  <input
                    type="text"
                    value={draftSettings.tagline}
                    onChange={(e) => setDraftSettings({ ...draftSettings, tagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Direct WhatsApp Number (with country code)
                  </label>
                  <input
                    type="text"
                    value={draftSettings.whatsapp}
                    onChange={(e) => setDraftSettings({ ...draftSettings, whatsapp: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold"
                    placeholder="2348033810865"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Phone Numbers (Display)
                  </label>
                  <input
                    type="text"
                    value={draftSettings.phone}
                    onChange={(e) => setDraftSettings({ ...draftSettings, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold"
                    placeholder="08033810865 / 09150996348"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Official Shop Location / Address
                  </label>
                  <input
                    type="text"
                    value={draftSettings.address}
                    onChange={(e) => setDraftSettings({ ...draftSettings, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold"
                    placeholder="37/39 Balogun West, Molake House, Lagos, Lagos State, Nigeria"
                  />
                </div>

                {/* Social Media Links */}
                <div>
                  <label className="block text-xs font-bold text-[#1877F2] mb-1 flex items-center gap-1.5">
                    <FacebookIcon className="w-4 h-4" />
                    <span>Facebook Profile / Page Link</span>
                  </label>
                  <input
                    type="url"
                    value={draftSettings.facebook || ''}
                    onChange={(e) => setDraftSettings({ ...draftSettings, facebook: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm"
                    placeholder="https://www.facebook.com/share/1BeLmWzV8P/"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                    <TikTokIcon className="w-4 h-4 text-cyan-600" />
                    <span>TikTok Handle / Link (@ayobami.samuel31)</span>
                  </label>
                  <input
                    type="url"
                    value={draftSettings.tiktok || ''}
                    onChange={(e) => setDraftSettings({ ...draftSettings, tiktok: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm"
                    placeholder="https://www.tiktok.com/@ayobami.samuel31"
                  />
                </div>

                {/* Bank Account */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={draftSettings.bankDetails?.bankName || ''}
                    onChange={(e) => setDraftSettings({ 
                      ...draftSettings, 
                      bankDetails: { ...draftSettings.bankDetails, bankName: e.target.value } 
                    })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Account Number (NUBAN)
                  </label>
                  <input
                    type="text"
                    value={draftSettings.bankDetails?.accountNumber || ''}
                    onChange={(e) => setDraftSettings({ 
                      ...draftSettings, 
                      bankDetails: { ...draftSettings.bankDetails, accountNumber: e.target.value } 
                    })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-5 border-t border-[#E8E2D9] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset store data back to default demo items?')) {
                      onResetToDefaults();
                      onClose();
                    }
                  }}
                  className="text-xs text-red-600 hover:underline font-bold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset All to Default Data</span>
                </button>

                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl bg-[#0F2E22] hover:bg-[#1B4332] text-white text-xs sm:text-sm font-black shadow-md cursor-pointer"
                >
                  Save Store Profile
                </button>
              </div>

            </form>

            {/* Supabase Cloud Connection & Sync Settings Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-[#0F2E22]/20 shadow-md space-y-6 max-w-4xl mx-auto mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2D9] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-[#D4AF37] block tracking-wider">
                      PRIMARY DATABASE & REALTIME SYNC
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isSupabaseConfigured()
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                      {isSupabaseConfigured() ? 'Connected to Supabase' : 'Offline / Setup Required'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#0F2E22] mt-0.5">
                    Supabase Cloud Database & Storage
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    All product updates, images, and categories are saved directly to Supabase and synced automatically to every customer device.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncAllToCloud}
                    disabled={isSyncing}
                    className="px-4 py-2.5 rounded-xl bg-[#0F2E22] hover:bg-[#1B4332] text-white font-black text-xs flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Migrating...' : 'Push 55 Products to Supabase'}</span>
                  </button>
                </div>
              </div>

              {/* Status & Project Details */}
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E2D9CE] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                  <span className="font-bold text-gray-600">Active Supabase Project URL:</span>
                  <span className="font-mono font-semibold text-[#0F2E22] bg-white px-3 py-1 rounded-md border border-gray-200">
                    {supabaseConfig?.url || 'Not configured in environment'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                  <span className="font-bold text-gray-600">Product Images Bucket:</span>
                  <span className="font-mono font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                    product-images (Public Storage)
                  </span>
                </div>
              </div>

              {/* Quick Config Form for Local Testing or Direct Setup */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">
                  Update Supabase Project Credentials
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Supabase Project URL (VITE_SUPABASE_URL)
                    </label>
                    <input
                      type="text"
                      value={supabaseUrlInput}
                      onChange={(e) => setSupabaseUrlInput(e.target.value)}
                      placeholder="https://your-project.supabase.co"
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Supabase Anon Key (VITE_SUPABASE_ANON_KEY)
                    </label>
                    <input
                      type="password"
                      value={supabaseAnonKeyInput}
                      onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
                      placeholder="eyJhbGciOi..."
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {supabaseConfigMsg ? (
                    <span className="text-xs font-bold text-emerald-700">{supabaseConfigMsg}</span>
                  ) : <span />}

                  <button
                    type="button"
                    onClick={() => {
                      if (!supabaseUrlInput.trim() || !supabaseAnonKeyInput.trim()) {
                        setSupabaseConfigMsg('Please enter both Supabase URL and Anon Key');
                        setTimeout(() => setSupabaseConfigMsg(''), 4000);
                        return;
                      }
                      saveSupabaseConfig({
                        url: supabaseUrlInput.trim(),
                        anonKey: supabaseAnonKeyInput.trim()
                      });
                      setSupabaseConfigState(getSupabaseConfig());
                      setSupabaseConfigMsg('Supabase configuration saved! Reloading live sync...');
                      setTimeout(() => {
                        setSupabaseConfigMsg('');
                        window.location.reload();
                      }, 1500);
                    }}
                    className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c49b29] text-[#0F2E22] font-black text-xs shadow-sm cursor-pointer"
                  >
                    Save & Connect Supabase
                  </button>
                </div>
              </div>

              {/* Vercel Environment Instructions */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Vercel Deployment Instructions:</span>
                </p>
                <p className="leading-relaxed">
                  In your Vercel Project Dashboard, navigate to <strong>Settings → Environment Variables</strong> and add:
                </p>
                <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px] pt-1">
                  <li><strong>VITE_SUPABASE_URL</strong>: e.g. <span className="text-emerald-700">https://xyzcompany.supabase.co</span></li>
                  <li><strong>VITE_SUPABASE_ANON_KEY</strong>: your Supabase publishable anon public key</li>
                </ul>
                <p className="text-[11px] pt-1">
                  Run the <strong>supabase-schema.sql</strong> script in your Supabase SQL Editor to initialize all tables, RLS policies, and storage buckets.
                </p>
              </div>
            </div>
          </div>
          )}

          {/* TAB 5: DELIVERY RATES */}
          {activeTab === 'delivery' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-white p-5 rounded-2xl border border-[#E2D9CE]">
                <h3 className="text-base font-black text-[#0F2E22]">
                  Delivery Rates Across Nigeria (36 States & FCT)
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Set standard logistics rates in Naira (₦) and estimated transit days for customer reference.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2D9CE] overflow-hidden">
                <div className="max-h-[50vh] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-[#E2D9CE] text-[#0F2E22] font-black uppercase sticky top-0">
                      <tr>
                        <th className="p-3.5">State / Region</th>
                        <th className="p-3.5">Estimated Transit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE2D8]">
                      {Object.entries(draftSettings.stateDeliveryRates).map(([stateKey, rateInfo]) => (
                        <tr key={stateKey} className="hover:bg-[#FAF8F5]">
                          <td className="p-3.5 font-bold text-[#1E1B18] capitalize">
                            {stateKey.replace('_', ' ')}
                          </td>
                          <td className="p-3.5">
                            <input
                              type="text"
                              value={rateInfo.deliveryDays}
                              onChange={(e) => handleDeliveryRateChange(stateKey, rateInfo.rate, e.target.value)}
                              className="w-48 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-6 py-2.5 rounded-xl bg-[#0F2E22] hover:bg-[#1B4332] text-white text-xs font-black shadow"
                >
                  Save Delivery Rates
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* CUSTOM IN-APP DELETE CONFIRMATION MODAL */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border-2 border-red-500">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Confirm Product Deletion</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">
                Are you sure you want to delete <span className="font-black text-gray-900">"{deleteConfirmProduct.name}"</span>?
              </p>
              <p className="text-[11px] text-red-600 font-bold mt-1">
                This item will be permanently removed from your storefront and database.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="flex-1 py-3 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(deleteConfirmProduct.id);
                  setSaveSuccessMsg(`Deleted "${deleteConfirmProduct.name}" successfully!`);
                  setTimeout(() => setSaveSuccessMsg(''), 4000);
                  setDeleteConfirmProduct(null);
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg transition-colors cursor-pointer"
              >
                Yes, Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
