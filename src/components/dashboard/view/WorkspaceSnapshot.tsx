import React from 'react';
import { FiDownload, FiPlus, FiStar, FiUploadCloud } from 'react-icons/fi';
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
  onUpgrade,
  onOpenTemplatePicker,
  onExportLatest,
  onUploadSelection,
}) => {
  return (
    <div className="mb-12">
      <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-black mb-4">
        {greeting}, {username?.split(' ')[0] || 'Creative'}.
      </h2>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-gray-100 pb-6">
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">
            Workspace Snapshot
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700">
              Docs
              <span className="font-semibold text-black">{documentCountLabel}</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700">
              Plan
              <span className="font-semibold text-black">{tier.toUpperCase()}</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700">
              AI Credits
              <span className="font-semibold text-black">
                {usedCredits}/{monthlyCredits}
              </span>
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {resumeCount === 0
              ? 'Start with a new resume or upload an existing one to activate your workflow.'
              : 'Keep refining and exporting high-quality versions from your workspace.'}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto md:overflow-visible no-scrollbar pb-1 md:pb-0">
          {!isPro && (
            <button
              onClick={onUpgrade}
              className="group hidden md:inline-flex h-11 w-auto items-center justify-center gap-2 bg-white text-gray-800 border border-gray-200 px-4 md:px-5 rounded-xl md:rounded-full text-xs md:text-sm font-medium hover:border-black hover:text-black transition-all active:scale-95 shrink-0"
            >
              <FiStar className="text-gray-500 group-hover:text-black transition-colors" />
              Upgrade
            </button>
          )}
          <button
            onClick={onOpenTemplatePicker}
            className="group h-10 md:h-11 w-auto inline-flex items-center justify-center gap-2 bg-black text-white px-3 md:px-6 rounded-full text-xs md:text-sm font-medium hover:bg-gray-800 transition-all shadow-xl shadow-black/5 active:scale-95 shrink-0"
          >
            <FiPlus className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="inline">Create New</span>
          </button>
          <button
            onClick={onExportLatest}
            disabled={!hasLatestResume}
            className="group h-10 md:h-11 w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-800 border border-gray-200 px-3 md:px-5 rounded-full text-xs md:text-sm font-medium hover:border-black hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <FiDownload className="text-gray-500 group-hover:text-black transition-colors" />
            <span className="inline">Export Latest</span>
          </button>
          <label className="cursor-pointer group h-10 md:h-11 w-10 md:w-12 inline-flex items-center justify-center rounded-full border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-all text-gray-600 shrink-0">
            <FiUploadCloud size={18} />
            <input type="file" className="hidden" accept=".pdf" onChange={onUploadSelection} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSnapshot;
