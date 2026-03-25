import React from 'react';
import { FiDownload, FiPlus, FiStar, FiUploadCloud, FiFileText, FiZap } from 'react-icons/fi';
import type { WorkspaceSnapshotProps } from '../../../types/dashboard';

const WorkspaceSnapshot: React.FC<WorkspaceSnapshotProps> = ({
  greeting,
  username,
  documentCountLabel,
  tier,
  usedCredits,
  monthlyCredits,
  resumeCount,
  isPro,
  hasLatestResume,
  onOpenTemplatePicker,
  onExportLatest,
  onUploadSelection,
}) => {
  return (
    <div className="mb-10 sm:mb-12">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        {/* ── Left: Context & Metrics ───────────────────────────────────── */}
       <div>
          <h2 className="text-[32px] sm:text-[48px] font-normal tracking-tight text-gray-900 mb-4 leading-none">
            {greeting}, <span className="text-gray-400">{username?.split(' ')[0] || 'Creative'}</span>
          </h2>
          
          <p className="text-[14px] text-gray-500 max-w-xl leading-relaxed">

            {resumeCount === 0
              ? 'Start with a new resume or upload an existing one to activate your intelligent workflow.'
              : 'Keep refining, tailoring, and exporting high-quality versions from your workspace.'}
          </p>

          {/* Floating Metric Pills */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200/60 text-[11.5px] font-semibold text-gray-600">
              <FiFileText size={12} className="text-gray-400" />
              {documentCountLabel}
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11.5px] font-semibold ${
              isPro 
                ? 'bg-amber-50 border-amber-200/50 text-amber-700' 
                : 'bg-gray-50 border-gray-200/60 text-gray-600'
            }`}>
              <FiStar size={12} className={isPro ? 'text-amber-500' : 'text-gray-400'} />
              Plan: {tier.toUpperCase()}
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50/50 border border-indigo-100/50 text-[11.5px] font-semibold text-indigo-700">
              <FiZap size={12} className="text-indigo-400" />
              AI used today: {usedCredits} / {monthlyCredits}
            </div>
          </div>
        </div>

        {/* ── Right: Action Buttons ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 mt-2 md:mt-0">
          
          {!isPro && (
            <button
              disabled
              className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-[12px] font-bold text-amber-700 bg-amber-50/50 border border-amber-200/50 transition-all shadow-sm opacity-50 cursor-not-allowed"
            >
              <FiStar className="fill-amber-500 text-amber-500" size={13} />
              Coming Soon
            </button>
          )}

          <button
            onClick={onExportLatest}
            disabled={!hasLatestResume}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-[12px] font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <FiDownload size={14} className="text-gray-400" />
            <span className="hidden sm:block">Export</span>
          </button>

          <label className="cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm">
            <FiUploadCloud size={16} />
            <input type="file" className="hidden" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={onUploadSelection} />
          </label>

          <button
            onClick={onOpenTemplatePicker}
            className="group flex items-center gap-2 h-10 px-5 rounded-xl bg-gray-900 text-white text-[12px] font-bold hover:bg-black transition-all hover:-translate-y-px shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
          >
            <FiPlus className="group-hover:rotate-90 transition-transform duration-300 opacity-70" size={14} />
            Create New
          </button>

        </div>

      </div>
    </div>
  );
};

export default WorkspaceSnapshot;
