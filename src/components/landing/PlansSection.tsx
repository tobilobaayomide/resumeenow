import React from 'react';
import { FiCheck, FiLock, FiStar } from 'react-icons/fi';
import {
  LANDING_FREE_PLAN_FEATURES,
  LANDING_PRO_PLAN_FEATURES,
} from '../../data/landing';

const PlansSection: React.FC = () => {
  return (
    <section id="pricing" className="relative overflow-hidden py-24 bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,0,0,0.06),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(115,115,115,0.08),transparent_62%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-3xl mb-12">
          <p className="text-[11px] uppercase tracking-[0.22em] text-black/45 font-medium mb-3">Plans</p>
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-4 tracking-[-0.02em] leading-[1.05]">
            Flexible access for <span className="text-gray-400">every stage</span>
          </h2>
          <p className="text-gray-600 font-light leading-relaxed">
            Choose the workflow that matches your current goal. Start with core builder tools, then
            unlock AI-powered optimization when you are ready.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col">
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-3">Free</p>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Builder Essentials</h3>
              <p className="text-sm text-gray-500">Everything needed to build and export polished resumes.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LANDING_FREE_PLAN_FEATURES.map((feature) => (
                <div key={feature} className="h-10 rounded-lg border border-gray-200 bg-gray-50/70 px-3 flex items-center gap-2 text-sm text-gray-700">
                  <FiCheck size={13} />
                  <span className="truncate">{feature}</span>
                </div>
              ))}
              <div className="h-10 rounded-lg border border-gray-200 bg-white px-3 flex items-center gap-2 text-sm text-gray-500 sm:col-span-2">
                <FiLock size={13} />
                <span>Advanced AI workflows remain locked</span>
              </div>
            </div>

            <div className="mt-auto pt-5">
              <button className="h-10 w-full rounded-xl border border-black/15 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2">
                Start Free
              </button>
              <p className="text-xs text-gray-500 mt-2.5">Use free tools as long as you need.</p>
            </div>
          </article>

          <article className="rounded-3xl border border-black bg-black text-white p-6 shadow-xl shadow-black/20 relative overflow-hidden flex flex-col">
            <div className="absolute -top-10 -right-6 w-36 h-36 rounded-full bg-white/10" />
            <div className="relative mb-5">
              <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85 mb-3">
                <FiStar size={11} />
                Most Popular
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 mb-3">Pro</p>
              <h3 className="text-xl font-semibold mb-1">Workflow Acceleration</h3>
              <p className="text-sm text-white/70">For users who want faster, AI-assisted optimization.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LANDING_PRO_PLAN_FEATURES.map((feature) => (
                <div key={feature} className="h-10 rounded-lg border border-white/15 bg-white/5 px-3 flex items-center gap-2 text-sm text-white/90">
                  <FiCheck size={13} />
                  <span className="truncate">{feature}</span>
                </div>
              ))}
              <div className="h-10 rounded-lg border border-white/15 bg-white/5 px-3 flex items-center gap-2 text-sm text-white/80 sm:col-span-2">
                <FiCheck size={13} />
                <span>Includes everything in Free</span>
              </div>
            </div>

            <div className="mt-auto pt-5">
              <button className="h-10 w-full rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2">
                Unlock Pro
              </button>
              <p className="text-xs text-white/60 mt-2.5">Upgrade only when you need advanced AI workflows.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
