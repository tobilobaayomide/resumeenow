import React from 'react';
import { FiX } from 'react-icons/fi';
import type { AiWorkflowModalProps } from '../../../../types/dashboard';

const getTitle = (activeAiFlow: AiWorkflowModalProps['activeAiFlow']): string => {
  if (activeAiFlow === 'ai_tailor') return 'Start AI Tailor';
  if (activeAiFlow === 'ats_audit') return 'Start ATS Audit';
  return 'Start Cover Letter';
};

const AiWorkflowModal: React.FC<AiWorkflowModalProps> = ({
  open,
  activeAiFlow,
  latestResumeAvailable,
  onClose,
  onUseLatestResume,
  onCreateNewResume,
}) => {
  if (!open || !activeAiFlow) return null;

  return (
    <div
      className="fixed inset-0 z-90 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-100 shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em]">
              AI Workflow
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mt-1">{getTitle(activeAiFlow)}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors"
          >
            <FiX size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-gray-600">
            Pick where to run this flow. The wizard opens inside the editor.
          </p>
          <button
            onClick={onUseLatestResume}
            disabled={!latestResumeAvailable}
            className="w-full h-11 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use Latest Resume
          </button>
          <button
            onClick={onCreateNewResume}
            className="w-full h-11 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-gray-300 hover:text-gray-900"
          >
            Create New Resume First
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiWorkflowModal;
