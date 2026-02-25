import React from 'react';
import { FiTwitter, FiLinkedin, FiInstagram, FiGithub, FiArrowRight } from 'react-icons/fi';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0f1115] text-white pt-20 pb-10 opacity-90 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Top Section: Newsletter & Brand */}
        <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-20 border-b border-gray-800 pb-16">
            <div className="max-w-lg">
                <h3 className="text-3xl md:text-4xl tracking-tight mb-4">
                    Join The Newsletter
                </h3>
                <p className="text-gray-400 font-extralight">
                    Get career tips and resume hacks delivered to your inbox.
                </p>
            </div>
            
            {/* Classy Input Field */}
            <div className="w-full md:w-auto">
                <form className="flex items-center gap-2 border-b border-gray-700  focus-within:border-white transition-colors duration-300 w-full md:w-80">
                    <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="bg-transparent border-none font-extralight text-white placeholder-gray-500 w-full focus:ring-0 px-0 py-2 outline-none"
                    />
                    <button type="button" className="text-gray-400 hover:text-white transition-colors">
                        <FiArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>

        {/* Middle Section: Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8 mb-24">
          
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 flex flex-col gap-6 pr-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-sm"></div>
              <span className="text-xl tracking-tight text-white">ResumeeNow</span>
            </div>
            <p className="text-gray-500 font-extralight leading-relaxed text-sm max-w-xs">
              Design your career path with precision tools used by professionals at top companies worldwide.
            </p>
            
            {/* Social Icons (Real Components) */}
            <div className="flex gap-4 mt-4">
                {[FiTwitter, FiLinkedin, FiInstagram, FiGithub].map((Icon, i) => (
                    <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300">
                        <Icon size={18} />
                    </a>
                ))}
            </div>
          </div>

          {/* Links Columns (Cleaner Typography) */}
         {/* Links Columns (Cleaner Typography) */}
<div className="hidden md:block col-span-1 md:col-span-2 md:col-start-7">
  <h4 className="text-xs uppercase tracking-[0.2em] mb-6">Product</h4>
  <ul className="space-y-3">
    {['Templates', 'AI Writer', 'Cover Letter', 'Pricing'].map((item) => (
      <li key={item}>
        <a href="#" className="text-gray-400 font-extralight hover:text-white text-sm transition-colors hover:translate-x-1 inline-block duration-200">
          {item}
        </a>
      </li>
    ))}
  </ul>
</div>

<div className="hidden md:block col-span-1 md:col-span-2">
  <h4 className="text-xs uppercase tracking-[0.2em] mb-6">Company</h4>
  <ul className="space-y-3">
    {['About', 'Careers', 'Blog', 'Contact'].map((item) => (
      <li key={item}>
        <a href="#" className="text-gray-400 font-extralight hover:text-white text-sm transition-colors hover:translate-x-1 inline-block duration-200">
          {item}
        </a>
      </li>
    ))}
  </ul>
</div>

<div className="hidden md:block col-span-1 md:col-span-2">
  <h4 className="text-xs uppercase tracking-[0.2em] mb-6">Legal</h4>
  <ul className="space-y-3">
    {['Privacy', 'Terms', 'Security'].map((item) => (
      <li key={item}>
        <a href="#" className="text-gray-400 font-extralight hover:text-white text-sm transition-colors hover:translate-x-1 inline-block duration-200">
          {item}
        </a>
      </li>
    ))}
  </ul>
</div>
</div>
        {/* Bottom Bar: Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800/50">
          <p className="text-gray-600 text-xs ">
            &copy; {new Date().getFullYear()} ResumeeNow Inc. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
             <a href="#" className="text-gray-600 hover:text-white text-xs transition-colors">Sitemap</a>
             <a href="#" className="text-gray-600 hover:text-white text-xs transition-colors">Cookies</a>
          </div>
        </div>
      </div>

      {/* The Watermark (Subtler, more texture-like) */}
           {/* The Watermark (More visible and premium) */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0 opacity-10">
        <h1 className="text-[18vw] font-extrabold text-white/50 tracking-tight text-center whitespace-nowrap translate-y-[20%] select-none drop-shadow-[0_4px_32px_rgba(255,255,255,0.18)]">
          resumeenow
        </h1>
      </div>

    </footer>
  );
};

export default Footer;