import React from 'react';
import { FiFileText, FiLock, FiStar } from 'react-icons/fi';
import { AI_WORKFLOW_ITEMS } from '../../../domain/workflows';
import type { AiFlowFeature } from '../../../domain/workflows';
import type { AiWorkspaceSectionProps, ProActionCard } from '../../../types/dashboard';

const AI_WORKFLOW_ICONS: Record<
  AiFlowFeature,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  ai_tailor: FiStar,
  ats_audit: FiLock,
  cover_letter: FiFileText,
};

const PRO_ACTIONS: ProActionCard[] = AI_WORKFLOW_ITEMS.map((item) => ({
  ...item,
  icon: AI_WORKFLOW_ICONS[item.feature],
}));

const AiWorkspaceSection: React.FC<AiWorkspaceSectionProps> = ({
  isPro,
  onUnlockPro,
  onProAction,
}) => {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-400">AI Workspace</h3>
        {!isPro && (
          <button
            onClick={onUnlockPro}
            className="text-xs font-semibold text-gray-600 hover:text-black transition-colors"
          >
            Unlock Pro
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PRO_ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.feature}
              onClick={() => onProAction(item.feature, item.title)}
              className="text-left p-5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg hover:shadow-black/5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                  <Icon size={16} />
                </span>
                {!isPro && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
                    <FiLock size={12} />
                    Pro
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AiWorkspaceSection;
