import React from 'react';
import {
  FiCheck,
  FiChevronLeft,
  FiDownload,
  FiDownloadCloud,
  FiEdit3,
  FiEye,
  FiFileText,
  FiLayout,
  FiLock,
  FiStar,
  FiZap,
} from 'react-icons/fi';
import { MdFileDownloadDone } from 'react-icons/md';
import { BUILDER_TEMPLATE_OPTIONS } from '../../../domain/templates';
import type { BuilderHeaderProps } from '../../../types/builder';
import { normalizeTemplateId } from '../../../types/resume';

const BuilderHeader: React.FC<BuilderHeaderProps> = ({
  title,
  saveStatusLabel,
  templateId,
  mobileView,
  isEditorCollapsed,
  isPro,
  isImporting,
  isSaving,
  isAutosaving,
  onBackToDashboard,
  onTitleChange,
  onTemplateChange,
  onMobileViewChange,
  onProAction,
  onToggleEditorCollapse,
  onUpgrade,
  onImportProfile,
  onDownload,
  onSave,
}) => {
  const isBusy = isSaving || isAutosaving;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 md:px-6 gap-3 z-30 shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] print:hidden">

      <div className="flex items-center gap-3 flex-1 min-w-0">

        {/* Back Button */}
        <button
          onClick={onBackToDashboard}
          className="w-8 h-8 hidden md:flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:text-black hover:bg-gray-100 transition-colors shrink-0"
          title="Back to Dashboard"
        >
          <FiChevronLeft size={16} />
        </button>

        <div className="w-px h-6 bg-gray-200 shrink-0 hidden sm:block mx-1" />

        {/* Title + Save Status */}
        <div className="relative group flex flex-col justify-center min-w-0 flex-1 max-w-35 sm:max-w-50 md:max-w-60 lg:max-w-70 p-1.5 -ml-1.5 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="font-bold text-[13.5px] text-gray-900 bg-transparent focus:outline-none placeholder-gray-300 w-full truncate leading-none relative z-10"
              placeholder="Untitled Resume"
            />
            <FiEdit3
              size={11}
              className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 pointer-events-none"
            />
          </div>
          <div className="hidden md:flex items-center gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-400 animate-pulse' : isAutosaving ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`} />
            <span className="text-[9.5px] text-gray-400 font-medium truncate hidden sm:block uppercase tracking-wide">
              {saveStatusLabel}
            </span>
          </div>
        </div>

        {/* Template Selector (Desktop) */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0 ml-4 relative">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Template
          </span>
          <div className="relative border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-gray-50 overflow-hidden">
            <select
              value={templateId}
              onChange={(e) => onTemplateChange(normalizeTemplateId(e.target.value))}
              className="h-8 pl-3 pr-8 w-32 text-[11.5px] font-semibold text-gray-800 outline-none cursor-pointer bg-transparent appearance-none"
            >
              {BUILDER_TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <FiLayout size={12} />
            </div>
          </div>
        </div>
      </div>

      {/* ── CENTRE: Edit/Preview toggle (Mobile Only) ──────────────────── */}
      <div className="flex md:hidden items-center bg-gray-100/80 p-1 rounded-xl shrink-0 border border-gray-200/50">
        <button
          onClick={() => onMobileViewChange('editor')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            mobileView === 'editor'
              ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiEdit3 size={12} />
          <span>Edit</span>
        </button>
        <button
          onClick={() => onMobileViewChange('preview')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            mobileView === 'preview'
              ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiEye size={12} />
          <span>View</span>
        </button>
      </div>

      {/* ── RIGHT: Actions ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 shrink-0">

        {/* Template Selector (Tablet Only) */}
        <select
          value={templateId}
          onChange={(e) => onTemplateChange(normalizeTemplateId(e.target.value))}
          className="hidden md:block lg:hidden h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-[11.5px] font-semibold text-gray-800 outline-none hover:border-gray-300 cursor-pointer transition-colors"
          aria-label="Select template"
        >
          {BUILDER_TEMPLATE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>

        {/* AI Features Group (Modern Segmented Pill) */}
        <div className="hidden md:flex items-center bg-indigo-50/50 p-1 rounded-xl border border-indigo-100/50">
          <button
            onClick={() => onProAction('ai_tailor', 'AI Tailor')}
            className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-[11px] font-bold text-indigo-600 hover:bg-white hover:shadow-sm transition-all"
            title="AI Tailor"
          >
            <FiZap size={12} />
            <span className="hidden lg:inline">Tailor</span>
            {!isPro && <FiLock size={10} className="text-indigo-300 opacity-60 hidden lg:block" />}
          </button>

          <div className="w-px h-4 bg-indigo-200/50 mx-0.5" />

          <button
            onClick={() => onProAction('cover_letter', 'Cover Letter')}
            className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-[11px] font-bold text-indigo-600 hover:bg-white hover:shadow-sm transition-all"
            title="Cover Letter"
          >
            <FiFileText size={12} />
            <span className="hidden lg:inline">Cover Letter</span>
            {!isPro && <FiLock size={10} className="text-indigo-300 opacity-60 hidden lg:block" />}
          </button>

          <div className="w-px h-4 bg-indigo-200/50 mx-0.5" />

          <button
            onClick={() => onProAction('ats_audit', 'ATS Audit')}
            className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-[11px] font-bold text-indigo-600 hover:bg-white hover:shadow-sm transition-all"
            title="ATS Audit"
          >
            <FiCheck size={12} />
            <span className="hidden lg:inline">Audit</span>
            {!isPro && <FiLock size={10} className="text-indigo-300 opacity-60 hidden lg:block" />}
          </button>
        </div>

        {/* Utilities Group */}
        <div className="hidden lg:flex items-center gap-1.5 ml-1">
          <button
            onClick={onImportProfile}
            disabled={isImporting}
            className="flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl text-[11.5px] font-bold text-gray-600 bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all disabled:opacity-50"
            title="Import Profile"
          >
            <FiDownloadCloud size={14} />
            <span>{isImporting ? 'Importing…' : 'Import'}</span>
          </button>

          <button
            onClick={onToggleEditorCollapse}
            className="flex items-center justify-center gap-1.5 w-9 h-9 rounded-xl text-gray-500 bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm hover:text-gray-900 transition-all"
            title={isEditorCollapsed ? 'Show Editor' : 'Focus Preview'}
          >
            {isEditorCollapsed ? <FiLayout size={14} /> : <FiEye size={14} />}
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

        {/* Go Pro Badge */}
        {!isPro && (
          <button
            onClick={onUpgrade}
            className="hidden sm:flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-[11px] font-black uppercase tracking-wider bg-linear-to-r from-amber-200 to-yellow-400 text-yellow-900 hover:from-amber-300 hover:to-yellow-500 hover:shadow-md transition-all border border-amber-300/50"
          >
            <FiStar size={12} className="fill-yellow-600" />
            <span>Pro</span>
          </button>
        )}

        {/* Primary Actions */}
        <button
          onClick={onDownload}
          className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-4 rounded-xl text-[11.5px] font-bold text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
          title="Download PDF"
        >
          <FiDownload size={14} />
          <span className="hidden sm:inline sm:ml-2">Download</span>
        </button>

        <button
          onClick={onSave}
          disabled={isBusy}
          className={`
            flex items-center justify-center gap-2 h-9 px-4 lg:px-5
            rounded-xl text-[11.5px] font-bold transition-all shrink-0 shadow-sm
            ${isBusy
              ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-black hover:shadow-md'
            }
          `}
        >
          <MdFileDownloadDone size={15} />
          <span className="hidden sm:inline tracking-wide">
            {isSaving ? 'Saving…' : isAutosaving ? 'Autosaving…' : 'Save'}
          </span>
        </button>

      </div>
    </header>
  );
};

export default BuilderHeader;