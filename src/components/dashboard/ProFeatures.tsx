import React from 'react';
import { FiCheck, FiFileText, FiLock, FiStar, FiZap } from 'react-icons/fi';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import { usePlan } from '../../context/usePlan';
import {
  DASHBOARD_FREE_PLAN_ITEMS,
  DASHBOARD_PRO_FEATURE_CARDS,
  DASHBOARD_PRO_PLAN_ITEMS,
} from '../../data/dashboard';

const ProFeatures: React.FC = () => {
  const { isPro, tier, openUpgrade, monthlyCredits, usedCredits } = usePlan();
  const creditPercent = monthlyCredits > 0 ? Math.min((usedCredits / monthlyCredits) * 100, 100) : 0;

  const handleResetToFree = () => {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('resumeenow_plan_tier'))
      .forEach((key) => window.localStorage.removeItem(key));

    toast.success('Plan reset to free. Reloading...');
    window.setTimeout(() => {
      window.location.reload();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] flex font-sans text-gray-900 selection:bg-black selection:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden w-full">
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        <main className="flex-1 px-4 md:px-8 lg:px-12 py-8 md:py-10 overflow-y-auto pb-28 md:pb-10 relative z-10">
          <div className="max-w-6xl mx-auto w-full space-y-8">
            <section className="rounded-3xl bg-linear-to-br from-[#0B0B0C] via-[#161719] to-[#202225] text-white border border-white/10 shadow-2xl shadow-black/25 overflow-hidden relative">
              <div className="absolute -top-24 -right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-14 w-56 h-56 rounded-full bg-indigo-400/20 blur-3xl" />

              <div className="relative px-6 md:px-8 py-8 md:py-9">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2">
                  Pro Workspace
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  Premium Optimization Suite
                </h1>
                <p className="text-sm md:text-base text-white/75 mt-2 max-w-2xl">
                  Centralized AI workflows for tailoring, ATS checks, and faster finalization from draft to
                  application-ready output.
                </p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-4">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] border ${
                      isPro
                        ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
                        : 'bg-white/10 border-white/20 text-white/80'
                    }`}
                  >
                    <FiStar size={12} />
                    {tier}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-white/70 font-medium">
                      <span>AI credits</span>
                      <span>{usedCredits}/{monthlyCredits}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-white/70 transition-all duration-500"
                        style={{ width: `${creditPercent}%` }}
                      />
                    </div>
                  </div>

                  {!isPro && (
                    <button
                      onClick={() => openUpgrade()}
                      className="h-11 px-5 w-full md:w-auto rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2"
                    >
                      Unlock Pro
                    </button>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleResetToFree}
                    className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70 hover:text-white transition-colors"
                  >
                    Reset to Free (Dev)
                  </button>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DASHBOARD_PRO_FEATURE_CARDS.map((feature) => (
                <article
                  key={feature.title}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                      {feature.tag}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                        isPro ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isPro ? <FiCheck size={11} /> : <FiLock size={11} />}
                      {isPro ? 'Enabled' : 'Locked'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mt-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{feature.description}</p>
                </article>
              ))}
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Free vs Pro</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Core capabilities available now and what unlocks with Pro.
                  </p>
                </div>
                <FiZap className="text-gray-300" size={18} />
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500 mb-3">Free Plan</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {DASHBOARD_FREE_PLAN_ITEMS.map((item, index) => (
                      <li key={item} className="flex items-center gap-2">
                        {index === DASHBOARD_FREE_PLAN_ITEMS.length - 1 ? <FiLock size={14} /> : <FiCheck size={14} />}
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-black p-4 bg-black text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/65 mb-3">Pro Plan</p>
                  <ul className="space-y-2 text-sm text-white/90">
                    {DASHBOARD_PRO_PLAN_ITEMS.map((item) => (
                      <li key={item} className="flex items-center gap-2"><FiCheck size={14} /> {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {!isPro && (
              <section className="bg-white border border-dashed border-gray-300 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <FiFileText size={16} />
                    Locked Until Upgrade
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    You can explore this workspace, but running Pro workflows requires an active Pro plan.
                  </p>
                </div>
                <button
                  onClick={() => openUpgrade()}
                  className="h-11 px-5 w-full sm:w-auto rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  Unlock Pro
                </button>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProFeatures;
