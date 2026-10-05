import React from 'react';
import { MainSectionType } from '../types';
import { MAIN_SECTIONS } from '../data/initialData';
import { Shirt, Footprints, Scissors, ArrowRight, CheckCircle2 } from 'lucide-react';

import { resolveProductImage } from '../utils/fabricImages';

interface CategoryGridProps {
  selectedSection: 'all' | MainSectionType;
  onSelectSection: (section: MainSectionType) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedSection,
  onSelectSection,
}) => {
  return (
    <section className="py-10 sm:py-20 bg-white border-b border-[#E8E2D9]" id="departments-section">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-16 space-y-2 sm:space-y-3">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#0F2E22] bg-[#FAF8F5] border border-[#D4AF37]/50 px-3 py-1 rounded-full">
            OUR THREE CORE SPECIALTIES
          </span>
          <h2 className="text-lg sm:text-3xl lg:text-4xl font-black text-[#0F2E22] tracking-tight">
            EXPLORE BY DEPARTMENT
          </h2>
          <p className="text-xs sm:text-base text-gray-600 font-medium">
            Whether you need authentic Nigerian fabrics, luxury handcrafted shoes, or commercial sewing machines, Ayobami SAM Ventures has you covered.
          </p>
        </div>

        {/* 3 Main Section Showcases */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-10">
          {MAIN_SECTIONS.map((sec, idx) => {
            const isCloths = sec.id === 'cloths';
            const isShoes = sec.id === 'shoes';
            const isMachine = sec.id === 'tailoring-machine';

            return (
              <div
                key={sec.id}
                onClick={() => onSelectSection(sec.id)}
                className={`group rounded-3xl overflow-hidden border-2 transition-all duration-300 flex flex-col justify-between cursor-pointer bg-white shadow-md hover:shadow-2xl transform hover:-translate-y-2 ${
                  selectedSection === sec.id
                    ? 'border-[#D4AF37] ring-4 ring-[#D4AF37]/20'
                    : 'border-[#E8E2D9] hover:border-[#D4AF37]'
                }`}
              >
                {/* Visual Header with Image */}
                <div className="relative aspect-16/10 overflow-hidden bg-gray-100">
                  <img
                    src={resolveProductImage(sec.image, sec.name, sec.id)}
                    alt={sec.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('hero-logo.png')) {
                        target.src = '/hero-logo.png';
                        target.className = 'w-24 h-24 sm:w-32 sm:h-32 object-contain mx-auto my-auto p-4 opacity-40';
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6">
                    <div className="text-white space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#D4AF37]">
                        DEPARTMENT 0{idx + 1}
                      </span>
                      <h3 className="text-2xl font-black text-white">
                        {sec.name}
                      </h3>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg">
                    {isCloths && <Shirt className="w-6 h-6 text-[#0F2E22]" />}
                    {isShoes && <Footprints className="w-6 h-6 text-amber-800" />}
                    {isMachine && <Scissors className="w-6 h-6 text-blue-900" />}
                  </div>
                </div>

                {/* Body Content (Spacious & Crisp) */}
                <div className="p-6 sm:p-8 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                      {sec.description}
                    </p>

                    {/* Features List */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <span className="text-[10.5px] font-black uppercase text-gray-400 block tracking-wider">
                        Key Offerings:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {sec.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-1.5 text-xs font-bold text-[#0F2E22]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-4 border-t border-[#E8E2D9] flex items-center justify-between font-black text-xs sm:text-sm text-[#0F2E22]">
                    <span>Browse {sec.name}</span>
                    <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#D4AF37]/50 flex items-center justify-center group-hover:bg-[#0F2E22] group-hover:text-white transition-colors">
                      <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:text-white" />
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
