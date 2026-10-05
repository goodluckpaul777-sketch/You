import { FabricProduct, Product } from '../types';
import rawProducts from './products.json';

// Cast and export the permanent local backup catalog
export const PRODUCTS: FabricProduct[] = rawProducts as FabricProduct[];

// Export legacy Product[] alias for backward compatibility if needed
export const LEGACY_PRODUCTS: Product[] = (rawProducts as any[]).map(p => ({
  id: p.id,
  name: p.name,
  price: p.price || p.pricePerYard || 0,
  category: p.category || 'General',
  description: p.description || '',
  image: p.image || '/hero-logo.png',
  color: (p.colors && p.colors[0]) || 'Standard'
}));

export default PRODUCTS;

