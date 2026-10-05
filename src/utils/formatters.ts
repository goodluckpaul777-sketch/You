import { FabricProduct, InquiryItem, CustomerInquiryInfo } from '../types';

/**
 * Format any number as Nigerian Naira currency (if needed)
 */
export function formatNaira(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₦0';
  }
  const formatted = Math.round(amount).toLocaleString('en-NG');
  return `₦${formatted}`;
}

/**
 * Clean phone number for WhatsApp international standard format (234...)
 */
export function cleanNigerianPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.slice(1);
  } else if (!cleaned.startsWith('234')) {
    cleaned = '234' + cleaned;
  }
  return cleaned;
}

/**
 * Generate a pre-filled WhatsApp link for a single item
 */
export function generateWhatsAppProductLink(
  phone: string,
  product: FabricProduct,
  itemNumber: number = 1,
  storeName: string = 'Ayobami SAM Ventures'
): string {
  const targetPhone = cleanNigerianPhone(phone);
  const company = storeName || 'Ayobami SAM Ventures';
  const productCode = product.productCode || product.id.toUpperCase();
  
  const text = `Hello, ${company}

- Company: ${company}
- Type of Clothes: ${product.name}
- Item Number: #${itemNumber}
- Product Code: ${productCode}

I want to place an order.`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generate a pre-filled WhatsApp link for multiple items (Cart/Inquiry Bag)
 */
export function generateWhatsAppCartLink(
  phone: string,
  items: InquiryItem[],
  storeName: string = 'Ayobami SAM Ventures'
): string {
  const targetPhone = cleanNigerianPhone(phone);
  const company = storeName || 'Ayobami SAM Ventures';
  
  if (!items || items.length === 0) {
    const defaultText = `Hello, ${company}, I want to place an order.`;
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(defaultText)}`;
  }

  const itemLines = items.map((item, index) => {
    const code = item.product.productCode || item.product.id.toUpperCase();
    return `- Type of Clothes: ${item.product.name} (Item #${index + 1}, Code: ${code})`;
  }).join('\n');

  const text = `Hello, ${company}

- Company: ${company}
${itemLines}

I want to place an order.`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Safely opens a URL without triggering window.open security exceptions in sandboxed iframes
 */
export function safeOpenUrl(url: string) {
  if (typeof window === 'undefined' || !url) return;
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = url;
    }
  }
}

