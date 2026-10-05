import { normalizeImageUrl } from '../services/catalogService';

/**
 * Resolves a product image URL, ensuring it is correctly formatted and normalized.
 * Returns a fallback if the URL is empty or invalid.
 */
export function resolveProductImage(url: string, _name?: string, _id?: string): string {
  if (!url) return '/hero-logo.png';
  return normalizeImageUrl(url);
}
