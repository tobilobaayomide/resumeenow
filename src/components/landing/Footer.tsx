import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTwitter, FiLinkedin, FiInstagram, FiGithub, FiArrowRight } from 'react-icons/fi';
import {
  LANDING_FOOTER_COMPANY_LINKS,
  LANDING_FOOTER_LEGAL_LINKS,
  LANDING_FOOTER_PRODUCT_LINKS,
  LANDING_FOOTER_SOCIAL_LINKS,
} from '../../data/landing';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const socialIconMap = {
    twitter: FiTwitter,
    linkedin: FiLinkedin,
    instagram: FiInstagram,
    github: FiGithub,
  } as const;

  return (
    <footer className="relative overflow-hidden bg-[#0D1015] opacity-90 text-white pt-18 md:pt-24 pb-8 md:pb-10 border-t border-white/5">
      <div className="max-w-360 mx-auto px-6 relative z-10">
        <div className="hidden md:block rounded-[28px] border border-white/10 bg-white/3 backdrop-blur-md p-6 md:p-8 mb-12 md:mb-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-10">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-3">
                Stay in the loop
              </p>
              <h3 className="text-2xl md:text-4xl tracking-tight mb-3">
                Get resume strategy updates
              </h3>
              <p className="text-white/70 font-light text-sm md:text-base">
                Product updates, hiring insights, and practical tips delivered once a week.
              </p>
            </div>
            <div className="w-full md:w-auto md:min-w-95">
              <form className="group flex items-center gap-2 rounded-full border border-white/20 bg-black/20 pl-4 pr-2 py-2 focus-within:border-white/45 transition-colors duration-300">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-transparent border-none text-white placeholder:text-white/45 w-full text-sm focus:outline-none"
                />
                <button
                  type="button"
                  className="h-10 w-12 rounded-full bg-white/12 text-white/80 hover:text-white hover:bg-white/20 transition-colors duration-300 inline-flex items-center justify-center"
                  aria-label="Submit email"
                >
                  <FiArrowRight size={18} />
                </button>
              </form>
              <p className="mt-2 pl-1 text-xs text-white/50">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-10 gap-x-8 mb-10 md:mb-16">
          <div className="col-span-1 md:col-span-5 flex flex-col gap-6 md:pr-14">
            <div
              className="flex items-center gap-3 cursor-pointer group opacity-90 hover:opacity-100 transition-opacity"
              onClick={() => navigate('/')}
            >
              <img
                src="/resumeenowlogo.png"
                alt="Logo"
                className="h-6 w-6 object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
              />
              <span className="text-lg font-medium tracking-tight text-white/95">
                Resume<span className="text-zinc-500">Now.</span>
              </span>
            </div>
            <p className="text-white/60 font-light leading-relaxed text-sm max-w-sm">
              Resume building, AI optimization, and export workflows in one focused workspace.
            </p>
            <div className="flex flex-wrap gap-3">
              {LANDING_FOOTER_SOCIAL_LINKS.map((item) => {
                const Icon = socialIconMap[item.iconKey];
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:border-white/35 hover:bg-white/10 transition-all duration-300"
                  >
                    <Icon size={17} />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 md:col-start-7">
            <h4 className="text-[11px] uppercase tracking-[0.2em] mb-4 text-white/60">Product</h4>
            <ul className="space-y-2.5">
              {LANDING_FOOTER_PRODUCT_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-white/65 font-light hover:text-white text-sm transition-[color,transform] hover:translate-x-1 inline-block duration-200"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block col-span-1 md:col-span-2">
            <h4 className="text-[11px] uppercase tracking-[0.2em] mb-4 text-white/60">Company</h4>
            <ul className="space-y-2.5">
              {LANDING_FOOTER_COMPANY_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-white/65 font-light hover:text-white text-sm transition-[color,transform] hover:translate-x-1 inline-block duration-200"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block col-span-2 md:col-span-2">
            <h4 className="text-[11px] uppercase tracking-[0.2em] mb-4 text-white/60">Legal</h4>
            <ul className="space-y-2.5">
              {LANDING_FOOTER_LEGAL_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-white/65 font-light hover:text-white text-sm transition-[color,transform] hover:translate-x-1 inline-block duration-200"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-6 border-t border-white/10">
          <p className="text-white/45 text-xs">
            &copy; {new Date().getFullYear()} ResumeNow Inc. All rights reserved.
          </p>
          <div className="hidden md:flex gap-5">
            <a href="#" className="text-white/45 hover:text-white text-xs transition-colors">Sitemap</a>
            <a href="#" className="text-white/45 hover:text-white text-xs transition-colors">Cookies</a>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0 opacity-[0.07]">
        <h1 className="text-[17vw] font-extrabold text-white tracking-tight text-center whitespace-nowrap translate-y-[22%] select-none">
          RESUMENOW
        </h1>
      </div>
    </footer>
  );
};

export default Footer;
