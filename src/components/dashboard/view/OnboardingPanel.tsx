import React from 'react';
import type { OnboardingPanelProps } from '../../../types/dashboard';

const OnboardingPanel: React.FC<OnboardingPanelProps> = ({ resumeCount, hasExportedPdf }) => {
  const steps = [
    { label: 'Account Created', done: true },
    { label: 'First Resume', done: resumeCount > 0 },
    { label: 'Export PDF', done: hasExportedPdf },
  ];

  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Onboarding</h4>
      <div className="relative pl-4 border-l border-gray-200 space-y-8">
        {steps.map((step) => (
          <div key={step.label} className="relative">
            <span
              className={`absolute -left-5.25 top-0.5 w-2.5 h-2.5 rounded-full border-2 ${step.done ? 'bg-black border-black' : 'bg-white border-gray-300'}`}
            ></span>
            <p className={`text-sm font-medium ${step.done ? 'text-gray-400 line-through' : 'text-black'}`}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
      {!hasExportedPdf && (
        <p className="text-xs text-gray-500 mt-5">
          Use <span className="font-semibold text-gray-700">Export Latest</span> or download from Builder to
          complete this step.
        </p>
      )}
    </div>
  );
};

export default OnboardingPanel;
