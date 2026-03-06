import React from 'react';
import { FiX, FiZap, FiTarget, FiFileText, FiPlus, FiArrowRight } from 'react-icons/fi';
import type { AiWorkflowModalProps } from '../../../../types/dashboard';

const getFlowConfig = (activeAiFlow: AiWorkflowModalProps['activeAiFlow']) => {
  if (activeAiFlow === 'ai_tailor') return { title: 'Start AI Tailor', icon: <FiZap className="text-indigo-500" size={18} />, bg: 'bg-indigo-50' };
  if (activeAiFlow === 'ats_audit') return { title: 'Start ATS Audit', icon: <FiTarget className="text-emerald-500" size={18} />, bg: 'bg-emerald-50' };
  return { title: 'Start Cover Letter', icon: <FiFileText className="text-blue-500" size={18} />, bg: 'bg-blue-50' };
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

  const config = getFlowConfig(activeAiFlow);

  return (
    <div
      className="fixed inset-0 z-100 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-[0.98] duration-200">
        
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3.5">
            <div className={`p-2 rounded-xl border border-white shadow-sm ${config.bg}`}>
              {config.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                AI Workspace
              </p>
              <h3 className="text-[16px] font-bold text-gray-900 leading-none">
                {config.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all flex items-center justify-center"
          >
            <FiX size={15} />
          </button>
        </div>

        <div className="p-6 bg-slate-50/50 space-y-3">
          <p className="text-[13px] text-gray-500 mb-4 leading-relaxed tracking-tight">
            Choose the document you want to use. The intelligent workflow will open directly inside the editor.
          </p>

          <button
            onClick={onUseLatestResume}
            disabled={!latestResumeAvailable}
            className="group w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:border-gray-200"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 group-hover:bg-gray-900 group-hover:text-white transition-colors">
              <FiFileText size={16} />
            </div>
            <div className="flex-1">
              <h4 className="text-[13.5px] font-bold text-gray-900 mb-0.5">Use Latest Document</h4>
              <p className="text-[11.5px] text-gray-500 line-clamp-1 text-ellipsis overflow-hidden">
                {latestResumeAvailable ? "Apply to your most recently edited resume." : "No existing documents found."}
              </p>
            </div>
            <FiArrowRight className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" size={16} />
          </button>

          <button
            onClick={onCreateNewResume}
            className="group w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all text-left"
          >
             <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
              <FiPlus size={16} />
            </div>
            <div className="flex-1">
              <h4 className="text-[13.5px] font-bold text-gray-900 mb-0.5">Start Fresh</h4>
              <p className="text-[11.5px] text-gray-500 line-clamp-1 text-ellipsis overflow-hidden">
                Create a new resume from a template first.
              </p>
            </div>
            <FiArrowRight className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default AiWorkflowModal;