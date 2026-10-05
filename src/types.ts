export type MainSectionType = 'cloths' | 'shoes' | 'tailoring-machine';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image?: string;
  color: string;
}

export interface FabricProduct {
  id: string;
  name: string;
  mainSection: MainSectionType; // 'cloths' | 'shoes' | 'tailoring-machine'
  category: string; // e.g. "Ankara Prints", "Swiss Lace", "Men's Native Loafers", "Industrial Sewing Machine"
  categorySlug: string;
  description: string;
  availableStock?: number; // Stock quantity in units / yards
  minimumOrder?: number; // Minimum order quantity (e.g. 1 yard or 1 machine or 1 pair)
  unitLabel?: string; // 'yard' | 'yards' | 'machine' | 'pair' | 'piece' | 'set' | 'pack'
  image: string;
  galleryImages?: string[];
  colors: string[];
  fabricType: string; // Material / Machine specification / Texture
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  inStock?: boolean;
  rating?: number;
  reviewCount?: number;
  suitableFor: string[];
  textureNote?: string;
  origin?: string;
  isWholesaleAvailable?: boolean;
  wholesaleNote?: string;
  badge?: string;
  designGroupId?: string; // Grouping ID for products sharing the exact same structural design in different colors
  designGroupName?: string; // Display title of the matching design line
  colorVariant?: string; // Color name of this specific variant
  isMatchingSet?: boolean; // True if item is a matching 2-in-1 shoe and bag set
  designType?: 'matching-group' | 'distinct-design'; // 'matching-group' or 'distinct-design'
  productCode?: string; // e.g. "019004-1" design code for admin identification
  pricePerYard?: number;
  price?: number;
}

export interface InquiryItem {
  product: FabricProduct;
  quantity: number;
  selectedColor?: string;
  customNotes?: string;
}

// Backward compatibility alias for CartItem
export type CartItem = InquiryItem;

export interface SectionCategoryInfo {
  id: MainSectionType;
  name: string;
  slug: MainSectionType;
  subtitle: string;
  description: string;
  image: string;
  subcategories: string[];
  features: string[];
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  section: MainSectionType;
  description: string;
  tagline: string;
  image: string;
  popularUses: string;
}

export interface NigerianStateDelivery {
  name: string;
  rate: number;
  deliveryDays: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  mainSection: MainSectionType;
  description: string;
  itemCount?: number;
}

export interface CustomerTestimonial {
  id: string;
  customerName: string;
  location: string;
  title: string;
  comment: string;
  rating: number;
  date: string;
  verifiedBuyer: boolean;
  fabricBought?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logoUrl?: string;
  phone: string;
  phoneNumbers?: string[];
  secondaryPhone?: string;
  whatsapp: string;
  email: string;
  facebook?: string;
  tiktok?: string;
  shopNameLocation?: string;
  address: string;
  marketLocation: string;
  city: string;
  state: string;
  country?: string;
  businessType?: string;
  customerReach?: string;
  openingHours: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  stateDeliveryRates: Record<string, NigerianStateDelivery>;
  freeDeliveryThreshold?: number;
  announcement?: string;
  themeColor?: string;
  aboutText?: string;
  enableWhatsAppDirect?: boolean;
}

export interface CustomerInquiryInfo {
  fullName: string;
  phone: string;
  whatsapp: string;
  state: string;
  city: string;
  address?: string;
  inquiryType: 'retail' | 'wholesale' | 'general_question' | 'machine_quotation';
  notes?: string;
}

export interface InquiryRecord {
  id: string;
  inquiryNumber: string;
  createdAt: string;
  customer: CustomerInquiryInfo;
  items: {
    productId: string;
    productName: string;
    category: string;
    mainSection: MainSectionType;
    quantity: number;
    unitLabel?: string;
    image: string;
    selectedColor?: string;
  }[];
  status: 'New Inquiry' | 'Contacted on WhatsApp' | 'Quotation Sent' | 'Order Confirmed' | 'Dispatched' | 'Completed';
}

// OrderRecord alias for backward compatibility
export type OrderRecord = InquiryRecord;

export interface TailoringYardGuide {
  outfitName: string;
  gender: 'Men' | 'Women' | 'Kids' | 'General';
  recommendedYards: number;
  yardRange: string;
  suggestedFabrics: string[];
  description: string;
}
