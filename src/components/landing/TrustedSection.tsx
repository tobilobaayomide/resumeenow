import React from 'react';
import { LANDING_TRUSTED_LOGOS } from "../../data/landing";

const TrustedSection: React.FC = () => {
  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Premium Editorial Header */}
        <p className="text-center text-xs md:text-sm font-bold tracking-[0.2em] text-black uppercase mb-10">
          Featured in top publications
        </p>

        {/* Logos Grid */}
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24">
          {LANDING_TRUSTED_LOGOS.map((logo, index) => (
            <div 
              key={index} 
              className="text-gray-300 hover:text-gray-900 transition-colors duration-500 cursor-pointer"
              title={logo.name}
            >
              {logo.svg}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TrustedSection;
