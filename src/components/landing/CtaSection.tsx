import React from 'react';
import { FiArrowRight } from 'react-icons/fi';
import type { CtaSectionProps } from '../../types/landing';

const CTASection: React.FC<CtaSectionProps> = ({ onPrimaryClick }) => {
  return (
    <section id="get-started" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-[28px] md:rounded-[44px] border border-black/5 bg-[#F5F6F8] shadow-[0_18px_60px_rgba(15,17,21,0.10)] transition-[transform,box-shadow] duration-300 ease-out md:hover:-translate-y-0.5 md:hover:shadow-[0_24px_70px_rgba(15,17,21,0.14)] motion-reduce:transition-none motion-reduce:transform-none">
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
            }}
          />
          <div className="pointer-events-none absolute -top-18 -right-12 h-62 w-62 rounded-full bg-white/80 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-14 h-68 w-68 rounded-full blur-3xl bg-[#DDE6F8]/55" />

          <div className="relative z-10 px-5 py-12 md:px-10 md:py-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-10">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-4">
                Ready to launch your next application?
              </p>
              <h2 className="text-4xl md:text-6xl lg:text-[68px] text-gray-900 leading-[0.96] tracking-[-0.02em]">
                Build free today.
                <br />
                <span className="text-gray-400">Upgrade when ready.</span>
              </h2>
              <p className="mt-4 text-sm md:text-base text-gray-600 max-w-xl">
                No card required. Start with templates and live editing instantly.
              </p>
            </div>

            <div className="w-full md:w-auto md:min-w-[320px]">
              <button
                onClick={onPrimaryClick}
                className="group w-full md:w-auto h-14 md:h-16 px-7 md:px-10 rounded-full bg-[#0F1115] text-white inline-flex items-center justify-center gap-3 text-base md:text-lg font-semibold shadow-[0_12px_30px_rgba(15,17,21,0.28)] transition-[transform,box-shadow,background-color] duration-300 ease-out hover:-translate-y-px hover:bg-[#11141a] hover:shadow-[0_15px_36px_rgba(15,17,21,0.30)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:transform-none"
              >
                <span>Start Building Now</span>
                <span className="w-9 h-9 md:w-10.5 md:h-10.5 rounded-full bg-white/16 inline-flex items-center justify-center transition-transform duration-300 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:transform-none">
                  <FiArrowRight size={20} color="currentColor" />
                </span>
              </button>
              <p className="mt-3 text-xs text-gray-500 text-left md:text-right">
                Takes less than 2 minutes to start.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
