import React from 'react';
import { FiFileText, FiLock, FiZap, FiTarget } from 'react-icons/fi';
import { AI_WORKFLOW_ITEMS } from '../../../domain/workflows';
import type { AiFlowFeature } from '../../../domain/workflows';
import type { AiWorkspaceSectionProps, ProActionCard } from '../../../types/dashboard';

// Contextual icons for AI features
const AI_WORKFLOW_ICONS: Record<
  AiFlowFeature,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  ai_tailor: FiZap,
  ats_audit: FiTarget,
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
    <div className="mb-12">
      
      {/* ── Section Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[11.5px] font-black uppercase tracking-[0.2em] text-gray-400">
          AI Workspace
        </h3>
        {!isPro && (
          <button
            onClick={onUnlockPro}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold hover:bg-amber-100 transition-colors"
          >
            <FiLock size={10} />
            Unlock Pro
          </button>
        )}
      </div>

      {/* ── Cards Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PRO_ACTIONS.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.feature}
              onClick={() => onProAction(item.feature, item.title)}
              className="group relative text-left p-5 rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.08)] hover:border-gray-300"
            >
              <div className="flex items-start justify-between mb-4">
                
                {/* Unified Sleek Icon Box */}
                <span className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-100 bg-gray-50 text-gray-500 transition-all duration-300 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 group-hover:shadow-md">
                  <Icon size={18} />
                </span>

                {/* Pro Lock Indicator */}
                {!isPro && (
                  <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                    <FiLock size={10} />
                    Pro
                  </span>
                )}
              </div>

              <h4 className="text-[14px] font-bold text-gray-900 tracking-tight transition-colors group-hover:text-black">
                {item.title}
              </h4>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-500 line-clamp-2">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default AiWorkspaceSection;