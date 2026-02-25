import React from 'react';
import { FiArrowRight } from 'react-icons/fi';

const CTASection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Architectural Grey Container */}
        <div className="relative rounded-2xl md:rounded-[3rem] bg-[#F3F4F6] overflow-hidden">
            
          {/* Subtle Noise Texture */}
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
          </div>

          {/* Soft Ambient Light */}
          <div className="absolute top-0 right-0 w-75 h-75 md:w-159 md:h-150 bg-linear-to-br from-white/60 to-transparent opacity-50 blur-2xl md:blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3"></div>
            
          <div className="relative z-10 px-4 py-12 md:px-8 md:py-24 flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-12">
            
            {/* Left Side: Typography */}
            <div className="max-w-xl mx-auto md:mx-0 mb-8 md:mb-0">
              <h2 className="text-3xl md:text-5xl lg:text-7xl text-gray-900 tracking-tighter leading-tight md:leading-[0.95] mb-6">
                Stop formatting.<br />
                <span className="text-gray-400">Start applying.</span>
              </h2>
            </div>
            
            {/* Right Side: Button */}
            <div className="shrink-0 w-full -mt-15 md:mt-0 md:w-auto">
               <button className="group relative inline-flex items-center justify-center gap-4 bg-black opacity-80 text-white w-full md:w-auto px-6 md:px-10 py-5 md:py-8 rounded-full text-lg md:text-2xl font-semibold transition-all duration-500 hover:bg-black hover:scale-[1.02] shadow-xl hover:shadow-gray-900/20">
                  <span className="relative z-10">Build My Resume</span>
                  <div className="relative z-10 w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-2 group-hover:-rotate-45">
                    <FiArrowRight size={22} color="currentColor" />
                  </div>
               </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default CTASection;