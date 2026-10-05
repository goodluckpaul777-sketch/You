import React, { useState } from 'react';
import { InquiryItem, StoreSettings } from '../types';
import { safeOpenUrl } from '../utils/formatters';
import { X, Trash2, Plus, Minus, MessageCircle, ArrowRight, CheckCircle2, ShoppingBag, ShieldCheck, AlertCircle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: InquiryItem[];
  settings: StoreSettings;
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onSubmitInquiry: (customerName: string, phone: string, state: string, city: string, notes: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitInquiry,
}) => {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerState, setCustomerState] = useState('Lagos');
  const [customerCity, setCustomerCity] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSendWhatsAppInquiry = () => {
    if (cart.length === 0) return;

    const company = settings.storeName || 'Ayobami SAM Ventures';
    const whatsappNum = (settings.whatsapp && settings.whatsapp.length >= 10 && !settings.whatsapp.includes('1234567'))
      ? settings.whatsapp.replace(/\D/g, '')
      : '2348033810865';

    const itemLines = cart.map((item, idx) => {
      const codeStr = item.product.productCode ? ` [Code: #${item.product.productCode}]` : '';
      return `- Type of Clothes: ${item.product.name}${codeStr} (Item #${idx + 1})`;
    }).join('\n');

    const message = `Hello, ${company}

${itemLines}

I want to place an order.`;

    const url = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(message)}`;
    safeOpenUrl(url);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('Please enter your name and phone number');
      return;
    }
    setFormError('');

    onSubmitInquiry(customerName, customerPhone, customerState, customerCity, customerNotes);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClearCart();
      onClose();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-6">
        <div className="w-screen max-w-full sm:max-w-md bg-white shadow-2xl border-l-2 border-[#D4AF37] flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#0F2E22] text-white flex items-center justify-between border-b border-[#D4AF37]">
            <div className="flex items-center gap-2.5 min-w-0">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" />
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase truncate">
                  Product Inquiry Bag
                </h2>
                <p className="text-[10px] sm:text-[11px] text-emerald-300 font-semibold truncate">
                  {totalItemsCount} item{totalItemsCount === 1 ? '' : 's'} selected for pricing quotation
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 ml-2"
              title="Close Inquiry Bag"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body List */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {isSubmitted ? (
              <div className="bg-emerald-50 border-2 border-emerald-600 rounded-2xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-black text-emerald-950">Inquiry Sent Successfully!</h3>
                <p className="text-xs text-emerald-800 font-medium">
                  Our sales team at Ayobami SAM Ventures will contact you via WhatsApp/Phone shortly.
                </p>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[#FAF8F5] border border-gray-200 flex items-center justify-center mx-auto text-gray-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-gray-800">Your Inquiry Bag is Empty</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Browse our Cloths, Shoes, and Tailoring Machine departments and add items you want to inquire about.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-[#0F2E22] text-white text-xs font-black"
                >
                  Start Exploring
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                    <span>SELECTED ITEMS ({cart.length})</span>
                    <button
                      onClick={onClearCart}
                      className="text-red-600 hover:underline text-[11px]"
                    >
                      Clear All
                    </button>
                  </div>

                  {cart.map((item) => {
                    const unit = item.product.unitLabel || (item.product.mainSection === 'cloths' ? 'yard' : item.product.mainSection === 'shoes' ? 'pair' : 'machine');
                    return (
                      <div key={item.product.id} className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9] flex items-center gap-3">
                        <img
                          src={item.product.image || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase text-[#D4AF37] block">
                            {item.product.category}
                          </span>
                          <h4 className="text-xs font-black text-[#0F2E22] truncate">
                            {item.product.name}
                          </h4>
                          <span className="text-[11px] text-gray-500 block">
                            Variation: {item.selectedColor || 'Standard'}
                          </span>
                        </div>

                        {/* Qty controls */}
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className="w-6 h-6 rounded bg-gray-100 font-black text-xs flex items-center justify-center text-gray-700"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-xs text-[#0F2E22]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-gray-100 font-black text-xs flex items-center justify-center text-gray-700"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Send Direct Message to Admin Portal Form - Only shown when user clicks the button */}
                {showAdminForm && (
                  <form onSubmit={handleFormSubmit} className="pt-4 border-t-2 border-[#D4AF37] space-y-3 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D9] animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-[#0F2E22] block">
                        Send Direct Message to Admin Portal
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAdminForm(false)}
                        className="text-xs text-gray-500 hover:text-gray-800 font-bold px-2 py-0.5 rounded bg-gray-200"
                      >
                        ✕ Close Form
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-600 font-semibold leading-snug">
                      Enter your Name and Phone Number below to send this inquiry directly into our Admin Portal.
                    </p>

                    {formError && (
                      <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 animate-fadeIn flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{formError}</span>
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Your Full Name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-[#0F2E22] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">
                          Phone / WhatsApp Number *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 08033810865"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-[#0F2E22] bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={customerState}
                        onChange={(e) => setCustomerState(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white"
                      >
                        {['Lagos', 'Abuja (FCT)', 'Ogun', 'Oyo', 'Rivers', 'Anambra', 'Enugu', 'Kano', 'Kaduna', 'Edo', 'Delta', 'Other States', 'International / Diaspora'].map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="City / Location"
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold bg-white"
                      />
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Optional notes or questions..."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white"
                    />

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-[#0F2E22] hover:bg-[#1B4332] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                      <span>SEND MESSAGE TO ADMIN</span>
                    </button>
                  </form>
                )}
              </>
            )}

          </div>

          {/* Bottom Actions */}
          {cart.length > 0 && !isSubmitted && (
            <div className="p-6 bg-[#FAF8F5] border-t border-[#E8E2D9] space-y-3">
              <button
                type="button"
                onClick={handleSendWhatsAppInquiry}
                className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>SEND INQUIRY LIST ON WHATSAPP</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAdminForm(!showAdminForm)}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-emerald-50 text-[#0F2E22] font-black text-xs border-2 border-[#0F2E22] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>{showAdminForm ? 'Hide Admin Message Form' : 'Submit Direct Message to Admin Portal'}</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
