import React from 'react';
import { FiCheck, FiInfo } from 'react-icons/fi';
import type { OnboardingPanelProps } from '../../../types/dashboard';

const OnboardingPanel: React.FC<OnboardingPanelProps> = ({ resumeCount, hasExportedPdf }) => {
  const steps = [
    { label: 'Account Created', done: true },
    { label: 'First Resume', done: resumeCount > 0 },
    { label: 'Export PDF', done: hasExportedPdf },
  ];

  const allComplete = hasExportedPdf && resumeCount > 0;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <h4 className="text-[11.5px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">
        Getting Started
      </h4>

      {/* ── Timeline ────────────────────────────────────────────────────── */}
      <div className="relative border-l-2 border-gray-100 ml-2 space-y-7">
        {steps.map((step) => (
          <div key={step.label} className="relative pl-6 group">
            {/* Timeline Dot / Check */}
            <span
              className={`absolute -left-2.25 top-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-white
                ${step.done 
                  ? 'bg-gray-900 border-none' 
                  : 'bg-white border-2 border-gray-200 group-hover:border-gray-300'
                }
              `}
            >
              {step.done && <FiCheck size={10} className="text-white" />}
            </span>
            
            {/* Step Content */}
            <p className={`text-[13px] tracking-tight transition-colors duration-200 -mt-0.5
                ${step.done 
                  ? 'font-bold text-gray-800' 
                  : 'font-medium text-gray-400'
                }
            `}>
              {step.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Helper Callout ──────────────────────────────────────────────── */}
      {!allComplete ? (
        <div className="mt-8 flex items-start gap-2.5 bg-gray-50 border border-gray-100 rounded-xl p-3.5">
          <div className="bg-white p-1 rounded-md shadow-sm border border-gray-100 shrink-0 mt-0.5">
            <FiInfo className="text-gray-400" size={12} />
          </div>
          <p className="text-[11.5px] text-gray-500 leading-relaxed pr-2">
            {!resumeCount 
              ? 'Create your first resume to unlock more features.'
              : 'Use the Builder or click "Export" on your resume card to complete the final step.'}
          </p>
        </div>
      ) : (
        <div className="mt-8 flex items-center gap-2 bg-emerald-50 text-emerald-700/80 border border-emerald-100/50 rounded-xl p-3.5 text-[11.5px] font-bold">
          <FiCheck size={14} className="shrink-0" />
          <span>You're all set up!</span>
        </div>
      )}
    </div>
  );
};

export default OnboardingPanel;