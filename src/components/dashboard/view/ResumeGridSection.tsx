import React from 'react';
import { FiCopy, FiFileText, FiPlus, FiTrash2, FiUploadCloud, FiClock } from 'react-icons/fi';
import { getResumeCollectionViewState } from '../../../lib/dashboard/resumeCollectionState';
import type { ResumeGridSectionProps } from '../../../types/dashboard';
import ResumeCardPreview from './ResumeCardPreview';

const ResumeGridSection: React.FC<ResumeGridSectionProps> = ({
  isLoading,
  resumeError,
  resumes,
  filteredResumes,
  searchQuery,
  getResumeStatus,
  onClearSearch,
  onOpenTemplatePicker,
  onUploadSelection,
  onOpenResume,
  onDeleteResume,
  onDuplicateResume,
  onRetryResumes,
}) => {
  const viewState = getResumeCollectionViewState({
    isLoading,
    error: resumeError,
    totalCount: resumes.length,
    filteredCount: filteredResumes.length,
  });

  // ── LOADING STATE ──────────────────────────────────────────────────────
  if (viewState === 'loading') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
            <div className="aspect-[1.4] bg-gray-50/80 animate-pulse border-b border-gray-100" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-gray-100 rounded-md w-1/2 animate-pulse" />
              <div className="h-3 bg-gray-50 rounded-md w-1/3 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50/60 p-10 md:p-14 text-center flex flex-col items-center animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-white border border-red-100 text-red-500 flex items-center justify-center mb-5 shadow-sm">
          <FiFileText size={24} strokeWidth={1.5} />
        </div>
        <h3 className="text-[20px] font-bold text-gray-900 tracking-tight mb-2">
          Failed to load resumes
        </h3>
        <p className="text-[14px] text-gray-600 max-w-md leading-relaxed pb-2">
          {resumeError}
        </p>
        <button
          onClick={onRetryResumes}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 h-10 text-[12.5px] font-bold text-white shadow-md transition-all hover:bg-black hover:shadow-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── EMPTY STATE ────────────────────────────────────────────────────────
  if (viewState === 'empty') {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/30 p-10 md:p-14 text-center flex flex-col items-center animate-in fade-in duration-500">
        <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 text-gray-400 flex items-center justify-center mb-5 shadow-sm">
          <FiFileText size={24} strokeWidth={1.5} />
        </div>
        <h3 className="text-[20px] font-bold text-gray-900 tracking-tight mb-2">Create Your First Resume</h3>
        <p className="text-[14px] text-gray-500 max-w-md leading-relaxed pb-2">
          Start from a template or import an existing PDF. You can edit everything and tailor it using AI before saving.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full sm:w-auto">
          <label className="group flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 h-10 rounded-xl text-[12.5px] font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm cursor-pointer w-full sm:w-auto overflow-hidden">
            <FiUploadCloud size={15} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
            Upload Resume
            <input type="file" className="hidden" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={onUploadSelection} />
          </label>
          <button
            onClick={onOpenTemplatePicker}
            className="group flex items-center justify-center gap-2 bg-gray-900 text-white px-6 h-10 rounded-xl text-[12.5px] font-bold hover:bg-black transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            <FiPlus size={15} className="opacity-70 group-hover:rotate-90 transition-transform duration-300" />
            Start from Template
          </button>
        </div>
      </div>
    );
  }

  // ── NO MATCHES STATE ───────────────────────────────────────────────────
  if (viewState === 'no_matches') {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
        <h3 className="text-[16px] font-bold text-gray-900 tracking-tight mb-1">
          No matches for "{searchQuery.trim()}"
        </h3>
        <p className="text-[13px] text-gray-500 mb-5">Try a different keyword or clear your search to see all resumes.</p>
        <button
          onClick={onClearSearch}
          className="h-9 px-5 rounded-lg border border-gray-200 bg-white text-[12px] font-bold text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors shadow-sm"
        >
          Clear Search
        </button>
      </div>
    );
  }

  // ── GRID STATE ─────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 animate-in fade-in duration-300">
      
      {/* Create New Card */}
      <button
        onClick={onOpenTemplatePicker}
        className="group relative border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 min-h-65 md:min-h-full hover:bg-gray-50 transition-colors bg-gray-50/30 p-6"
      >
        <div className="w-11 h-11 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform text-gray-400 shadow-sm">
          <FiPlus size={18} />
        </div>
        <span className="text-[13px] font-bold text-gray-500">Create New...</span>
      </button>

      {/* Resume Cards */}
      {filteredResumes.map((resume) => {
        const status = getResumeStatus(resume);

        return (
          <div
            key={resume.id}
            onClick={() => onOpenResume(resume)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpenResume(resume);
              }
            }}
            role="button"
            tabIndex={0}
            className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 flex flex-col h-full cursor-pointer overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.08)] outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            {/* Document Preview */}
            <div className="aspect-[1.3] bg-gray-50/50 relative flex items-center justify-center overflow-hidden border-b border-gray-100 p-6 transition-colors">
              <div className="pointer-events-none w-full h-full flex justify-center items-start shadow-sm border border-gray-100/50 bg-white">
                <ResumeCardPreview resume={resume} />
              </div>
              
              {/* Desktop Hover Overlay */}
              <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[1px] flex items-center justify-center gap-3 md:flex">
                <div className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-[12px] font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  Open Editor
                </div>
              </div>
            </div>

            {/* Document Meta (Footer) */}
            <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white">
              
              <div className="mb-3">
                <h3 className="font-bold text-[14px] text-gray-900 mb-2 truncate group-hover:text-black transition-colors" title={resume.title || 'Untitled Resume'}>
                  {resume.title || 'Untitled Resume'}
                </h3>
                
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest ${status.tone}`}
                  >
                    {status.label}
                  </span>
                  <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    {resume.template_id?.substring(0, 9) || 'modern'}
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
                  <FiClock size={10} className="opacity-70" />
                  {new Date(resume.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onDuplicateResume(resume);
                    }}
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                    title="Duplicate"
                  >
                    <FiCopy size={14} />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteResume(resume.id);
                    }}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all z-10"
                    title="Delete"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })}

    </div>
  );
};

export default ResumeGridSection;
