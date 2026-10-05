import React, { useState } from 'react';
import { TAILORING_YARD_GUIDES } from '../data/initialData';
import { Ruler, X, ArrowRight, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';
import { TailoringYardGuide } from '../types';

interface YardEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSuggestedFabric: (fabricKeyword: string) => void;
}

export const YardEstimatorModal: React.FC<YardEstimatorModalProps> = ({
  isOpen,
  onClose,
  onSelectSuggestedFabric,
}) => {
  if (!isOpen) return null;

  const [selectedGender, setSelectedGender] = useState<'All' | 'Men' | 'Women' | 'Kids'>('All');
  const [selectedGuide, setSelectedGuide] = useState<TailoringYardGuide>(TAILORING_YARD_GUIDES[0]);

  const filteredGuides = TAILORING_YARD_GUIDES.filter(
    g => selectedGender === 'All' || g.gender === selectedGender
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fadeIn">
      <div className="bg-[#FAF8F5] w-full max-w-3xl rounded-2xl shadow-2xl border border-[#D8CFC4] overflow-hidden relative max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E8E2D9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1B4332] text-[#D4A373] rounded-lg">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#1B4332]">
                Tailor Yardage Guide & Calculator
              </h2>
              <p className="text-xs text-[#735738] font-semibold">
                How many yards of fabric do you need for your outfit?
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-5">
          
          {/* Gender Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-3 overflow-x-auto">
            {(['All', 'Men', 'Women', 'Kids'] as const).map((gender) => (
              <button
                key={gender}
                onClick={() => setSelectedGender(gender)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  selectedGender === gender
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'bg-white border border-[#D8CFC4] text-[#4A3E31] hover:bg-[#F3E8D6]'
                }`}
              >
                {gender === 'All' ? 'All Outfits' : `${gender}'s Wear`}
              </button>
            ))}
          </div>

          {/* Outfit List & Selection */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Outfits List Column */}
            <div className="md:col-span-5 space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredGuides.map((guide, idx) => {
                const isSelected = selectedGuide.outfitName === guide.outfitName;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedGuide(guide)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[#1B4332] bg-[#F0F7F3] shadow-xs'
                        : 'border-[#E2D9CE] bg-white hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#1E1B18] leading-tight">
                        {guide.outfitName}
                      </h4>
                      <span className="text-[11px] text-[#B07D38] font-bold block mt-0.5">
                        Recommended: {guide.yardRange}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#1B4332] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Outfit Detailed Yard Advice */}
            <div className="md:col-span-7 bg-white rounded-2xl p-5 border border-[#E2D9CE] shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#B07D38] bg-[#F3E8D6] px-2.5 py-0.5 rounded">
                    {selectedGuide.gender} Traditional Outfit
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    Nigerian Tailoring Standard
                  </span>
                </div>

                <h3 className="text-lg font-black text-[#1B4332] mt-2">
                  {selectedGuide.outfitName}
                </h3>

                <p className="text-xs sm:text-sm text-[#524436] mt-1 font-medium leading-relaxed">
                  {selectedGuide.description}
                </p>

                {/* Big Yard Recommendation Card */}
                <div className="mt-4 bg-[#F8F5F0] border border-[#DDD5CA] rounded-xl p-4 text-center">
                  <span className="text-xs font-bold text-[#735738] uppercase tracking-wider block">
                    Tailor Recommended Quantity:
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-[#1B4332] my-1">
                    {selectedGuide.yardRange}
                  </div>
                  <p className="text-xs text-[#524436] font-medium">
                    (Standard adult size: ~{selectedGuide.recommendedYards} yards)
                  </p>
                </div>

                {/* Recommended Materials */}
                <div className="mt-4">
                  <span className="text-xs font-black text-[#4A3E31] uppercase tracking-wide block mb-1.5">
                    Best Materials For This Outfit:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedGuide.suggestedFabrics.map((fab, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onClose();
                          onSelectSuggestedFabric(fab);
                        }}
                        className="bg-[#EBF7EE] hover:bg-[#D8F3E2] text-[#1B4332] text-xs font-bold px-2.5 py-1 rounded-md border border-[#52B788]/30 transition-colors flex items-center gap-1"
                      >
                        <span>{fab}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  onClose();
                  onSelectSuggestedFabric(selectedGuide.suggestedFabrics[0] || 'all');
                }}
                className="w-full py-3 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-sm shadow transition-colors flex items-center justify-center gap-2"
              >
                <span>Browse Materials for {selectedGuide.outfitName}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Sizing & Tailor Tip Box */}
          <div className="bg-[#FFF9EB] border border-[#F4D35E] rounded-xl p-3.5 text-xs text-[#705300] space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-[#B07D38]" />
              <span>Tailor Advice from Adebisi Fabrics:</span>
            </div>
            <p>
              If the wearer is taller than 6 feet, has broad shoulders, or desires dramatic flair/sleeves, we recommend adding an extra <strong>0.5 to 1 yard</strong> to ensure your tailor has sufficient fabric for pattern matching and deep hems.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
