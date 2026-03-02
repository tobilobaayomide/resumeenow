import React from 'react';
import { FiCheck, FiStar, FiX } from 'react-icons/fi';
import type { ProFeature } from '../../types/context';
import type { UpgradeModalProps } from '../../types/ui';

const FEATURE_LABELS: Record<ProFeature, string> = {
  ai_tailor: 'AI Tailor',
  ats_audit: 'ATS Audit',
  cover_letter: 'Cover Letter Generator',
  interview_prep: 'Interview Prep',
  priority_templates: 'Premium Templates',
};

const UpgradeModal: React.FC<UpgradeModalProps> = ({ open, feature, onClose, onUpgrade }) => {
  if (!open) return null;

  const featureLabel = feature ? FEATURE_LABELS[feature] : 'this feature';

  return (
    <div
      className="fixed inset-0 z-80 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white border border-gray-100 shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em]">Upgrade</p>
            <h3 className="text-xl font-semibold text-gray-900 mt-1">Unlock Pro Features</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{featureLabel}</span> is available on the Pro plan.
          </p>

          <ul className="space-y-2">
            {[
              'Unlimited AI generations',
              'Advanced ATS optimization',
              'Priority template access',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center">
                  <FiCheck size={12} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={onUpgrade}
            className="flex-1 h-11 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <FiStar size={14} />
            Upgrade to Pro
          </button>
          <button
            onClick={onClose}
            className="px-4 h-11 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
