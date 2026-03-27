import React from 'react';
import { FiCheck, FiLock, FiStar, FiZap } from 'react-icons/fi';
import Sidebar from './Sidebar';
import { usePlan } from '../../context/usePlan';
import {
  DASHBOARD_FREE_PLAN_ITEMS,
  DASHBOARD_PRO_FEATURE_CARDS,
  DASHBOARD_PRO_PLAN_ITEMS,
} from '../../data/dashboard';

const ProFeatures: React.FC = () => {
  const {
    isPro,
    isProWaitlistJoined,
    planStatus,
    tier,
    openUpgrade,
    dailyCreditLimit,
    retryPlan,
    usedCredits,
  } = usePlan();
  const isPlanReady = planStatus === 'ready';
  const isPlanUnavailable = planStatus === 'unavailable';
  const showFreeTierPlanUi = isPlanReady && !isPro;
  const creditPercent =
    isPlanReady && dailyCreditLimit > 0 ? Math.min((usedCredits / dailyCreditLimit) * 100, 100) : 0;
  const tierLabel =
    planStatus === 'loading'
      ? 'Checking plan'
      : planStatus === 'unavailable'
        ? 'Plan unavailable'
        : `${tier} Plan`;
  const usageLabel =
    planStatus === 'loading'
      ? 'Checking AI usage...'
      : planStatus === 'unavailable'
        ? 'Usage unavailable'
        : `${usedCredits} / ${dailyCreditLimit}`;
  const featureStatusLabel =
    planStatus === 'loading'
      ? 'Checking'
      : planStatus === 'unavailable'
        ? 'Sync needed'
        : isPro
          ? 'Enabled'
          : 'Locked';


  return (
    <div className="min-h-screen bg-[#F6F7F9] flex font-sans text-gray-900 selection:bg-gray-900 selection:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden w-full">
        <main className="flex-1 px-4 md:px-8 lg:px-12 py-8 md:py-10 overflow-y-auto pb-28 md:pb-10 relative z-10">
          <div className="max-w-8xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
            
            <section className="rounded-3xl bg-black text-white shadow-2xl shadow-gray-900/20 overflow-hidden relative border border-gray-800">
             
              <div className="relative px-8 md:px-10 py-10 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-12">
                <div className="flex-1">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3 flex items-center gap-2">
                    <FiStar className={isPlanReady && isPro ? "text-amber-400" : isPlanUnavailable ? 'text-rose-300' : "text-gray-400"} size={12} />
                    Pro Workspace
                  </p>
                  <h1 className="text-[28px] md:text-[34px] font-bold tracking-tight text-white mb-2 leading-tight">
                    Premium Optimization Suite
                  </h1>
                  <p className="text-[14px] md:text-[15px] text-gray-400 max-w-xl leading-relaxed">
                    Centralized AI workflows for tailoring, ATS checks, and faster finalization from draft to application-ready output.
                  </p>
                </div>

                <div className="w-full md:w-72 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shrink-0">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border ${
                        isPlanReady && isPro
                          ? 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                          : isPlanUnavailable
                            ? 'bg-rose-500/10 border-rose-300/20 text-rose-200'
                            : 'bg-white/10 border-white/10 text-gray-300'
                      }`}>
                        {tierLabel}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-gray-300 font-bold uppercase tracking-wider">
                        <span>AI Used Today</span>
                        <span className="text-white">{usageLabel}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out bg-linear-to-r from-indigo-500 to-amber-400"
                          style={{ width: `${creditPercent}%` }}
                        />
                      </div>
                    </div>

                    {isPlanUnavailable && (
                      <button
                        onClick={() => {
                          void retryPlan();
                        }}
                        className="w-full h-10 mt-1 rounded-xl bg-rose-50 text-rose-700 text-[13px] font-bold hover:bg-rose-100 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5"
                      >
                        Retry Plan Sync
                      </button>
                    )}

                    {showFreeTierPlanUi && (
                      <button
                        onClick={() => openUpgrade()}
                        disabled={isProWaitlistJoined}
                        className="w-full h-10 mt-1 rounded-xl bg-white text-gray-900 text-[13px] font-bold hover:bg-gray-100 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                      >
                        {isProWaitlistJoined ? 'On Waitlist' : 'Unlock Pro'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {DASHBOARD_PRO_FEATURE_CARDS.map((feature) => (
                <article
                  key={feature.title}
                  className="group relative bg-white border border-gray-200 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.08)] hover:border-gray-300"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-100 bg-gray-50 text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition-all duration-300">
                      <FiZap size={18} />
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest border ${
                        isPlanReady && isPro
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                          : showFreeTierPlanUi
                            ? 'bg-gray-50 border-gray-200 text-gray-500'
                            : 'bg-blue-50 border-blue-100 text-blue-600'
                      }`}
                    >
                      {isPlanReady && isPro ? <FiCheck size={10} /> : <FiLock size={10} />}
                      {featureStatusLabel}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900 tracking-tight transition-colors group-hover:text-black">
                    {feature.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              ))}
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-bold text-gray-900 tracking-tight">Capabilities Overview</h2>
                  <p className="text-[13px] text-gray-500 mt-0.5">
                    See exactly what unlocks when you join Pro.
                  </p>
                </div>
              </div>
              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                
                {/* Free Column */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-6 flex flex-col">
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-5">
                    Free Plan
                  </p>
                  <ul className="space-y-3.5 text-[13.5px] font-medium text-gray-600 flex-1">
                    {DASHBOARD_FREE_PLAN_ITEMS.map((item, index) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 shrink-0 text-gray-400">
                          {index === DASHBOARD_FREE_PLAN_ITEMS.length - 1 ? <FiLock size={14} /> : <FiCheck size={14} />}
                        </span>
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pro Column */}
                <div className="rounded-xl border-2 border-gray-900 bg-black p-6 flex flex-col shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <p className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-5 flex items-center gap-2 relative z-10">
                    <FiStar size={12} className="fill-amber-500" />
                    Pro Plan
                  </p>
                  <ul className="space-y-3.5 text-[13.5px] font-medium text-white flex-1 relative z-10">
                    {DASHBOARD_PRO_PLAN_ITEMS.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 shrink-0 text-emerald-400">
                          <FiCheck size={14} />
                        </span>
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </section>

            {showFreeTierPlanUi && (
              <section className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-amber-400" />
                <div className="pl-2">
                  <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2 tracking-tight">
                    <FiLock className="text-amber-500" size={16} />
                    Ready to supercharge your workflow?
                  </h3>
                  <p className="text-[13px] text-gray-600 mt-1 max-w-lg leading-relaxed">
                    Free accounts get 5 AI workflow runs per day. Pro expands that to 100 daily runs with the same builder workflows and premium controls.
                  </p>
                </div>
                <button
                  onClick={() => openUpgrade()}
                  disabled={isProWaitlistJoined}
                  className="h-10 px-6 w-full sm:w-auto rounded-xl bg-gray-900 text-white text-[13px] font-bold hover:bg-black transition-all hover:-translate-y-px shadow-sm shrink-0 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
                >
                  {isProWaitlistJoined ? 'Already Joined' : 'Unlock Pro Now'}
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
