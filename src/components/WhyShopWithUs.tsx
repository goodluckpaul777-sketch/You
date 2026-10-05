import React from 'react';
import { ShieldCheck, Ruler, Truck, MessageCircle, Award, Shirt, Footprints, Scissors } from 'lucide-react';

export const WhyShopWithUs: React.FC = () => {
  const points = [
    {
      icon: <Award className="w-7 h-7 text-[#D4AF37]" />,
      title: 'Guaranteed Authentic Quality',
      desc: '100% combed cotton Ankara, luxury Swiss voile lace, handcrafted Italian calfskin shoes, and heavy-duty direct-drive sewing machines.'
    },
    {
      icon: <Shirt className="w-7 h-7 text-[#D4AF37]" />,
      title: 'Cloths & Fabrics by the Yard',
      desc: 'Full 36-inch accurate yard measurements with zero short-cutting. Available for single outfit cuts or bulk Aso-Ebi rolls.'
    },
    {
      icon: <Footprints className="w-7 h-7 text-[#D4AF37]" />,
      title: 'Handcrafted Native Shoes',
      desc: 'Italian calfskin native loafers and sparkling crystal Owambe party heels with matching designer clutches.'
    },
    {
      icon: <Scissors className="w-7 h-7 text-[#D4AF37]" />,
      title: 'Commercial Sewing Machines',
      desc: 'Direct-drive industrial lockstitch and Butterfly domestic machines equipped with complete wooden tables, stands, and warranty.'
    },
    {
      icon: <MessageCircle className="w-7 h-7 text-[#D4AF37]" />,
      title: 'Instant WhatsApp Pricing Inquiry',
      desc: 'Chat directly on WhatsApp to get real-time price quotes, video inspections, custom yardage advice, and fast invoice confirmation.'
    },
    {
      icon: <Truck className="w-7 h-7 text-[#D4AF37]" />,
      title: 'Nationwide & Overseas Cargo',
      desc: 'Reliable dispatch to all 36 Nigerian states via park couriers, doorstep delivery in Lagos, and express air cargo for diaspora clients.'
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16 space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-[#0F2E22] bg-[#FAF8F5] border border-[#D4AF37]/50 px-4 py-1.5 rounded-full">
            EXPERIENCE & INTEGRITY
          </span>
          <h2 className="text-xl sm:text-3xl lg:text-5xl font-black text-[#0F2E22] tracking-tight">
            WHY AYOBAMI SAM VENTURES?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            A premier Nigerian commercial hub dedicated to superior textiles, footwear, and tailoring machinery.
          </p>
        </div>

        {/* 6 Feature Blocks (Spacious & Bold) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {points.map((pt, idx) => (
            <div
              key={idx}
              className="bg-[#FAF8F5] border-2 border-[#E8E2D9] rounded-3xl p-7 sm:p-8 hover:border-[#D4AF37] hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#0F2E22] flex items-center justify-center mb-5 shadow-md">
                  {pt.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#0F2E22] mb-2">
                  {pt.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                  {pt.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
