import React from 'react';
import { CUSTOMER_TESTIMONIALS } from '../data/initialData';
import { Star, MapPin, Quote, ShieldCheck } from 'lucide-react';

export const CustomerReviews: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 bg-[#FAF8F5] border-b border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#B07D38] text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Customer Feedback</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1B4332] tracking-tight">
              CUSTOMER REVIEWS
            </h2>
            <p className="text-sm sm:text-base text-[#665645] mt-1 font-medium">
              See what our customers across Lagos, Abuja, Port Harcourt, and Ibadan say about our fabrics and delivery.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl border border-[#D8CFC4] self-start sm:self-auto shadow-xs">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="text-xs font-black text-[#1B4332]">4.9 / 5.0 Rating</span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {CUSTOMER_TESTIMONIALS.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-5 border border-[#E2D9CE] shadow-xs hover:border-[#1B4332] transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-500">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {review.date}
                  </span>
                </div>

                <div className="bg-[#FAF8F5] p-2 rounded-lg border border-[#EAE2D8] text-[11px] font-bold text-[#1B4332]">
                  🧵 {review.fabricBought}
                </div>

                <p className="text-xs sm:text-sm text-[#4A3E31] leading-relaxed font-medium italic">
                  "{review.comment}"
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#F0EAE1]">
                <h4 className="text-xs sm:text-sm font-black text-[#1E1B18]">
                  {review.customerName}
                </h4>
                <div className="flex items-center gap-1 text-[11px] text-[#735738] font-semibold mt-0.5">
                  <MapPin className="w-3 h-3 text-[#B07D38]" />
                  <span>{review.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
