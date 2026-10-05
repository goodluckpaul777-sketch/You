import React from 'react';
import { Layers, MessageSquare, CheckCircle2, Truck, Eye } from 'lucide-react';

export const HowToOrder: React.FC = () => {
  const steps = [
    {
      num: '1',
      icon: <Layers className="w-6 h-6 text-[#D4AF37]" />,
      title: 'Browse Our 3 Departments',
      desc: 'Explore Cloths (Ankara, Lace, Senator), Shoes (Native Loafers, Owambe Heels), and Tailoring Machines.'
    },
    {
      num: '2',
      icon: <Eye className="w-6 h-6 text-[#D4AF37]" />,
      title: 'Swipe Photos & Select Options',
      desc: 'Glide through multi-angle pictures like on Jumia. Choose your preferred quantity, color, or machine model.'
    },
    {
      num: '3',
      icon: <MessageSquare className="w-6 h-6 text-[#D4AF37]" />,
      title: 'Inquire Price on WhatsApp',
      desc: 'Tap "Inquire Price & Order on WhatsApp" to connect directly with our Balogun West sales desk.'
    },
    {
      num: '4',
      icon: <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />,
      title: 'Receive Instant Quote & Confirm',
      desc: 'Get your customized retail or bulk wholesale quotation, inspect video proof, and confirm your order.'
    },
    {
      num: '5',
      icon: <Truck className="w-6 h-6 text-[#D4AF37]" />,
      title: 'Fast Dispatch to Your Location',
      desc: 'Your goods are safely packed and dispatched across Nigeria (doorstep/park courier) or international air cargo.'
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-[#FAF8F5] border-b border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16 space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-[#0F2E22] bg-white px-4 py-1.5 rounded-full border border-[#D4AF37]/50 shadow-xs inline-block">
            FAST & SIMPLE WORKFLOW
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F2E22] tracking-tight">
            HOW TO INQUIRE & ORDER
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Shopping from Ayobami SAM Ventures is fast, personal, and trustworthy.
          </p>
        </div>

        {/* Steps Display (Spacious and Bold) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-6">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border-2 border-[#E8E2D9] hover:border-[#D4AF37] shadow-sm hover:shadow-xl transition-all duration-300 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#0F2E22] text-[#D4AF37] font-black text-base flex items-center justify-center shadow-sm">
                    {s.num}
                  </div>
                  <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-gray-100">
                    {s.icon}
                  </div>
                </div>

                <h3 className="text-base font-black text-[#0F2E22] mb-2 leading-snug">
                  {s.title}
                </h3>
                
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 text-[11px] font-black text-[#D4AF37] uppercase tracking-wider">
                Step 0{s.num} of 05
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
