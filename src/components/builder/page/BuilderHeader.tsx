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
}) => (
  <header className="min-h-16 xl:h-20 bg-white border-b border-gray-200 flex flex-wrap xl:flex-nowrap items-center justify-between gap-2 xl:gap-0 px-3 md:px-4 lg:px-6 py-2 xl:py-0 z-30 shrink-0 shadow-sm transition-all print:hidden">
    <div className="order-1 flex items-center gap-2 md:gap-4 flex-1 min-w-0">
      <button
        onClick={onBackToDashboard}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:text-black transition-all shadow-sm shrink-0"
      >
        <FiChevronLeft size={16} />
      </button>

      <div className="h-6 w-px bg-gray-200 hidden md:block" />

      <div className="flex flex-col relative group sm:flex">
        <label className="text-[10px] uppercase font-normal text-gray-400 hidden lg:block">
          Project Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="font-bold text-gray-900 text-sm md:text-base focus:outline-none bg-transparent placeholder-gray-300 w-20 sm:w-32 md:w-44 lg:w-56 xl:w-64 truncate"
        />
        <FiEdit3
          className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden lg:block"
          size={12}
        />
        <span className="hidden lg:block text-[10px] text-gray-400 font-normal mt-0.5">
          {saveStatusLabel}
        </span>
      </div>

      <div className="hidden xl:flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
        <span className="text-[10px] font-normal uppercase tracking-wide text-gray-400">
          Template
        </span>
        <select
          value={templateId}
          onChange={(event) =>
            onTemplateChange(normalizeTemplateId(event.target.value))
          }
          className="h-7 rounded-full border border-gray-200 bg-white px-2 text-xs font-normal text-gray-700 outline-none"
        >
          {BUILDER_TEMPLATE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="order-3 w-full flex lg:hidden bg-gray-100 rounded-lg p-0.5 mx-1 shrink-0">
      <button
        onClick={() => onMobileViewChange('editor')}
        className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-bold ${
          mobileView === 'editor' ? 'bg-white shadow text-black' : 'text-gray-400'
        }`}
      >
        <FiLayout size={14} /> Edit
      </button>
      <button
        onClick={() => onMobileViewChange('preview')}
        className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-bold ${
          mobileView === 'preview' ? 'bg-white shadow text-black' : 'text-gray-400'
        }`}
      >
        <FiEye size={14} /> View
      </button>
    </div>

    <div className="order-2 flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0 max-w-[58vw] sm:max-w-[62vw] lg:max-w-[68vw] xl:max-w-none overflow-x-auto xl:overflow-visible no-scrollbar">
      <select
        value={templateId}
        onChange={(event) =>
          onTemplateChange(normalizeTemplateId(event.target.value))
        }
        className="h-8 shrink-0 rounded-2xl border border-gray-200 bg-white px-2 text-[11px] font-normal text-gray-700 outline-none xl:hidden"
        aria-label="Select template"
      >
        {BUILDER_TEMPLATE_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        onClick={() => onProAction('ai_tailor', 'AI Tailor')}
        className="hidden xl:flex px-3 py-2 rounded-full text-xs font-normal border border-gray-200 text-gray-700 hover:bg-gray-50 items-center gap-2 transition-colors"
        title="AI Tailor"
      >
        <FiStar size={14} />
        <span>AI Tailor</span>
        {!isPro && <FiLock size={12} className="text-gray-400" />}
      </button>

      <button
        onClick={() => onProAction('cover_letter', 'Cover Letter')}
        className="hidden xl:flex px-3 py-2 rounded-full text-xs font-normal border border-gray-200 text-gray-700 hover:bg-gray-50 items-center gap-2 transition-colors"
        title="Cover Letter"
      >
        <FiFileText size={14} />
        <span>Cover Letter</span>
        {!isPro && <FiLock size={12} className="text-gray-400" />}
      </button>

      <button
        onClick={() => onProAction('ats_audit', 'ATS Audit')}
        className="hidden xl:flex px-3 py-2 rounded-full text-xs font-normal border border-gray-200 text-gray-700 hover:bg-gray-50 items-center gap-2 transition-colors"
        title="ATS Audit"
      >
        <FiCheck size={14} />
        <span>ATS Audit</span>
        {!isPro && <FiLock size={12} className="text-gray-400" />}
      </button>

      <button
        onClick={onToggleEditorCollapse}
        className="hidden xl:flex px-3 py-2 rounded-full text-xs font-normal border border-gray-200 text-gray-700 hover:bg-gray-50 items-center gap-2 transition-colors"
        title={isEditorCollapsed ? 'Show editor panel' : 'Focus preview'}
      >
        {isEditorCollapsed ? <FiLayout size={14} /> : <FiEye size={14} />}
        <span>{isEditorCollapsed ? 'Show Editor' : 'Focus Preview'}</span>
      </button>

      {!isPro && (
        <button
          onClick={onUpgrade}
          className="hidden xl:flex px-3 py-2 rounded-full text-xs font-normal border border-gray-900 bg-gray-900 text-white hover:bg-black items-center gap-2 transition-colors"
        >
          <FiStar size={14} />
          Go Pro
        </button>
      )}

      <button
        onClick={onImportProfile}
        disabled={isImporting}
        className="flex shrink-0 items-center justify-center w-9 h-9 lg:w-auto lg:h-9 px-0 lg:px-3 xl:px-4 py-2 rounded-2xl md:rounded-full text-xs lg:text-sm font-normal border border-gray-200 text-gray-700 hover:bg-black hover:text-white gap-2 transition-colors"
      >
        <FiDownloadCloud className="block md:hidden" size={16} />
        <span className="hidden lg:inline">
          {isImporting ? 'Importing...' : 'Import Profile'}
        </span>
      </button>

      <button
        onClick={onDownload}
        className="flex shrink-0 items-center justify-center w-9 h-9 lg:w-auto lg:h-9 px-0 lg:px-3 xl:px-4 py-2 md:rounded-full rounded-2xl text-xs lg:text-sm font-normal border border-gray-200 text-gray-700 hover:bg-black hover:text-white gap-2 transition-colors group"
      >
        <FiDownload
          size={16}
          className="flex md:hidden group-hover:translate-y-0.5 transition-transform"
        />
        <span className="hidden lg:inline">Download</span>
      </button>

      <button
        onClick={onSave}
        disabled={isSaving || isAutosaving}
        className={`w-9 h-9 lg:w-auto lg:h-9 px-0 lg:px-4 xl:px-5 py-2 md:rounded-full rounded-2xl text-xs lg:text-sm font-normal flex shrink-0 items-center justify-center gap-2 transition-all shadow-md ${
          isSaving || isAutosaving
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg'
        }`}
      >
        <MdFileDownloadDone className="flex md:hidden" size={16} />
        <span className="hidden lg:inline">
          {isSaving ? 'Saving' : isAutosaving ? 'Autosaving' : 'Save'}
        </span>
      </button>
    </div>
  </header>
);

export default BuilderHeader;
