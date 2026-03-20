import React from "react";
import { FiCheck, FiStar, FiX } from "react-icons/fi";
import type { ProFeature } from "../../types/context";
import type { UpgradeModalProps } from "../../types/ui";

const FEATURE_LABELS: Record<ProFeature, string> = {
  ai_tailor: "AI Tailor",
  ats_audit: "ATS Audit",
  cover_letter: "Cover Letter Generator",
  interview_prep: "Interview Prep",
  priority_templates: "Premium Templates",
};

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  feature,
  onClose,
  onUpgrade,
}) => {
  if (!open) return null;

  const featureLabel = feature ? FEATURE_LABELS[feature] : "Premium Workflow";

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-105 rounded-3xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col animate-in zoom-in-[0.98] duration-300">
        <div className="relative px-6 pt-8 pb-6 bg-gray-900 border-b border-gray-800 overflow-hidden shrink-0">
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[10.5px] font-bold text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <FiStar className="fill-amber-500" size={11} />
                Pro Feature Preview
              </p>
              <h3 className="text-[22px] font-bold text-white tracking-tight leading-tight">
                Unlock {featureLabel}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/5 text-gray-400 hover:text-white hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <FiX size={15} />
            </button>
          </div>
        </div>

        <div className="p-6 bg-white space-y-6">
          <p className="text-[14px] text-gray-600 leading-relaxed font-medium">
            This premium capability is currently in development. Join the waitlist for our Pro plan to
            get early access to {featureLabel} and a full suite of
            intelligent tools when they launch.
          </p>

          <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700/70 mb-3.5">
              Everything in Pro
            </p>
            <ul className="space-y-3">
              {[
                "Unlimited AI generation & tailoring",
                "Deep ATS keyword optimization",
                "Priority access to premium templates",
                "Advanced cover letter drafting",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.75 w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <FiCheck size={10} strokeWidth={3} />
                  </span>
                  <span className="text-[13px] text-gray-700 font-medium leading-tight">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-6 py-5 bg-gray-50/80 border-t border-gray-100 flex flex-row-reverse gap-3 items-center">
          <button
            onClick={onUpgrade}
            className="sm:w-auto flex-1 h-11 rounded-xl bg-gray-900 text-white text-[13.5px] font-bold hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2"
          >
            Join Pro Waitlist
          </button>
          <button
            onClick={onClose}
            className="sm:w-auto h-11 px-5 rounded-xl border border-transparent bg-transparent text-[13px] font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100/80 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
