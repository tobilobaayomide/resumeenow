import React from "react";
import { FiCheck, FiUploadCloud } from "react-icons/fi";
import dashboard from "../../assets/dashboard-hero.jpg";
import {
  HERO_PROOF_CARDS,
  HERO_QUICK_VALUE_POINTS,
} from "../../data/landing";

const HeroSection: React.FC = () => (
  <section className="relative overflow-hidden bg-white pt-28 pb-14 md:pt-32 md:pb-20">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(17,24,39,0.11),transparent_56%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(115,115,115,0.11),transparent_62%)]" />
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(15,23,42,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.4)_1px,transparent_1px)] bg-size-[44px_44px]" />
    </div>

    <div className="max-w-360 mx-auto top-12 md:top-0 px-6 relative z-10 grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
      <div className="lg:col-span-5">
        <div className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-1.5 text-sm text-black/70 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500">
          AI workflows + live resume controls
        </div>

        <h1 className="mt-6 text-4xl md:text-6xl lg:text-[64px] tracking-[-0.03em] leading-[1.02] text-gray-900 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          From rough draft to
          <br />
          <span className="text-zinc-400 ">
            interview-ready fast.
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-600 font-light max-w-lg leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          Start from your existing PDF or from scratch, then refine every section with live preview
          and focused AI tools built directly into the editor.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <a
            href="#get-started"
            className="group w-full sm:w-auto text-center bg-black text-white px-8 py-4 rounded-full text-lg font-medium border border-black transition-all duration-300 hover:bg-zinc-900 hover:-translate-y-0.5 shadow-[0_16px_36px_rgba(0,0,0,0.30)]"
          >
            <span className="inline-flex items-center gap-2">
              Start Free Workspace
            </span>
          </a>
          <a
            href="#templates"
            className="w-full sm:w-auto text-center bg-white text-black border border-black/15 px-7 py-4 rounded-full text-lg font-medium transition-all duration-300 hover:bg-zinc-50 hover:-translate-y-0.5 shadow-[0_10px_22px_rgba(0,0,0,0.08)]"
          >
            Explore Templates
          </a>
        </div>
        <p className="mt-3 text-sm text-gray-500 animate-in fade-in duration-700 delay-300">
          No credit card required to start.
        </p>

        <ul className="mt-8 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {HERO_QUICK_VALUE_POINTS.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm md:text-base text-gray-600">
              <span className="w-5 h-5 rounded-full bg-zinc-100 text-black inline-flex items-center justify-center">
                <FiCheck size={13} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-7 lg:-mr-50">
        <div className="relative hidden md:flex mx-auto w-full max-w-none lg:w-[112%] lg:translate-x-5 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
          <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.18),transparent_62%)] blur-2xl" />
          <div className="relative rounded-4xl border border-black/10 bg-white/75 backdrop-blur-xl p-3 md:p-4 lg:p-5 shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
            <img
              src={dashboard}
              alt="Resume builder interface"
              className="w-full h-auto rounded-3xl border border-slate-200/70 shadow-xl"
            />
          </div>

          <div className="absolute -left-2 md:-left-6 lg:-left-12 top-6 md:top-10 lg:top-14 max-w-55 lg:max-w-60 rounded-2xl border border-black/10 bg-white/92 shadow-xl px-3.5 py-3 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <span className="w-14 h-9 rounded-full bg-black text-white inline-flex items-center justify-center">
                <FiUploadCloud size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Upload + Parse</p>
                <p className="text-xs text-gray-500 mt-1">Map your PDF into editable resume sections.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="relative z-10 max-w-360 mx-auto px-6 mt-25">
      <div className="grid sm:grid-cols-3 gap-3 md:gap-10">
        {HERO_PROOF_CARDS.map((card, index) => (
          <div
            key={card.title}
            className={`rounded-2xl px-4 md:px-5 py-4 backdrop-blur-sm shadow-sm border ${
              index === 0 ? "bg-black text-white border-black" : "bg-white/90 text-slate-900 border-slate-200"
            }`}
          >
            <p className={`text-sm font-semibold ${index === 0 ? "text-white" : "text-slate-900"}`}>{card.title}</p>
            <p className={`text-xs md:text-sm mt-1.5 ${index === 0 ? "text-zinc-300" : "text-slate-600"}`}>{card.detail}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HeroSection;
