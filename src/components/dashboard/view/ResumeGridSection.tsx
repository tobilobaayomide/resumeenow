import React from 'react';
import { FiCopy, FiFileText, FiPlus, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import type { ResumeGridSectionProps } from '../../../types/dashboard';
import ResumeCardPreview from './ResumeCardPreview';

const ResumeGridSection: React.FC<ResumeGridSectionProps> = ({
  isLoading,
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
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="aspect-3/4 md:aspect-4/3 bg-gray-50 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-linear-to-b from-white to-gray-50 p-8 md:p-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-4 shadow-lg shadow-black/15">
          <FiFileText size={18} />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">Create Your First Resume</h3>
        <p className="text-sm md:text-base text-gray-500 mt-2 max-w-xl mx-auto">
          Start from a template or import an existing PDF. You can edit everything before saving.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
          <button
            onClick={onOpenTemplatePicker}
            className="group inline-flex items-center justify-center gap-2 bg-black text-white px-6 h-12 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-xl shadow-black/5 active:scale-95 w-full sm:w-auto"
          >
            <FiPlus className="group-hover:rotate-90 transition-transform duration-300" />
            Start From Template
          </button>
          <label className="group inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 h-12 rounded-xl text-sm font-semibold hover:bg-black hover:text-white hover:border-black transition-all shadow-xl shadow-black/5 active:scale-95 cursor-pointer w-full sm:w-auto">
            <FiUploadCloud className="group-hover:text-white transition-colors" />
            Upload Existing Resume
            <input type="file" className="hidden" accept=".pdf" onChange={onUploadSelection} />
          </label>
        </div>
      </div>
    );
  }

  if (filteredResumes.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 md:p-10 text-center">
        <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
          No matches for "{searchQuery.trim()}"
        </h3>
        <p className="text-sm text-gray-500 mt-2">Try a different keyword or clear search to see all resumes.</p>
        <button
          onClick={onClearSearch}
          className="mt-5 h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-gray-300 hover:text-gray-900"
        >
          Clear Search
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            className="group relative bg-white rounded-xl border border-gray-100 hover:border-gray-300 transition-all duration-300 select-none hover:shadow-2xl hover:shadow-black/5 overflow-hidden flex flex-col h-full cursor-pointer"
          >
            <div className="aspect-[1.4] bg-[#FAFAFA] relative flex items-center justify-center overflow-hidden border-b border-gray-50 p-8 group-hover:bg-gray-50/50 transition-colors">
              <ResumeCardPreview resume={resume} />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px] flex items-center justify-center gap-3">
                <button className="bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-lg">
                  Edit
                </button>
              </div>
            </div>
            <div className="p-5 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-1">{resume.title || 'Untitled'}</h3>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${status.tone}`}
                    >
                      {status.label}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600">
                      {resume.template_id || 'executive'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                    Last updated {new Date(resume.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteResume(resume.id);
                  }}
                  className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-gray-50 rounded-md"
                  title="Delete"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDuplicateResume(resume);
                  }}
                  className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:text-gray-900 inline-flex items-center gap-1.5"
                >
                  <FiCopy size={13} />
                  Duplicate
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenResume(resume);
                  }}
                  className="h-9 px-3 rounded-lg bg-black text-white text-xs font-semibold hover:bg-gray-800"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        );
      })}
      <div
        className="relative group border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 min-h-50 hover:bg-gray-50 transition-colors bg-gray-50/50 p-6 cursor-pointer"
        onClick={onOpenTemplatePicker}
      >
        <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform text-gray-400 shadow-sm mb-2">
          <FiPlus />
        </div>
        <span className="text-sm font-medium text-gray-500">New Document</span>
      </div>
    </div>
  );
};

export default ResumeGridSection;
