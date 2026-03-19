import React, { useState } from 'react';
import {
  FiCheck,
  FiChevronDown,
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
  monthlyCredits,
  usedCredits,
  onBackToDashboard,
  onTitleChange,
  onTemplateChange,
  onMobileViewChange,
  onProAction,
  onToggleEditorCollapse,
  onImportProfile,
  onDownload,
  onSave,
}) => {
  const isBusy = isSaving || isAutosaving;
  const [isMobileTemplateMenuOpen, setIsMobileTemplateMenuOpen] = useState(false);
  const [isMobileAiMenuOpen, setIsMobileAiMenuOpen] = useState(false);
  const saveIndicatorClass = isSaving
    ? 'bg-amber-400 animate-pulse'
    : isAutosaving
      ? 'bg-blue-400 animate-pulse'
      : 'bg-green-400';

  const closeMobileMenus = () => {
    setIsMobileTemplateMenuOpen(false);
    setIsMobileAiMenuOpen(false);
  };

  return (
    <>
    <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 z-30 shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] print:hidden">
      <div className="flex items-start gap-3">
        <button
          onClick={onBackToDashboard}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:text-black hover:bg-gray-100 transition-colors shrink-0"
          title="Back to Dashboard"
        >
          <FiChevronLeft size={16} />
        </button>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="relative group rounded-lg px-1.5 py-1 -ml-1.5 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                className="font-bold text-[13px] text-gray-900 bg-transparent focus:outline-none placeholder-gray-300 w-full truncate leading-none"
                placeholder="Untitled Resume"
              />
              <FiEdit3
                size={11}
                className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pointer-events-none"
              />
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${saveIndicatorClass}`} />
              <span className="text-[9px] text-gray-400 font-medium truncate uppercase tracking-wide">
                {saveStatusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onDownload}
            className="w-9 h-9 rounded-xl text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all flex items-center justify-center"
            title="Download PDF"
          >
            <FiDownload size={14} />
          </button>

          <button
            onClick={onSave}
            disabled={isBusy}
            className={`
              w-9 h-9 rounded-xl transition-all shrink-0 shadow-sm flex items-center justify-center
              ${isBusy
                ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-black hover:shadow-md'
              }
            `}
            title={isSaving ? 'Saving…' : isAutosaving ? 'Autosaving…' : 'Save'}
          >
            <MdFileDownloadDone size={15} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex items-center bg-gray-100/80 p-1 rounded-xl shrink-0 border border-gray-200/50">
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

        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => {
              setIsMobileTemplateMenuOpen((value) => !value);
              setIsMobileAiMenuOpen(false);
            }}
            className={`h-9 px-3 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              isMobileTemplateMenuOpen
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-gray-50 text-gray-700 border-gray-200'
            }`}
            title="Change template"
          >
            <FiLayout size={13} />
            <span>Template</span>
            <FiChevronDown size={12} className={isMobileTemplateMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>

          <button
            onClick={() => {
              setIsMobileAiMenuOpen((value) => !value);
              setIsMobileTemplateMenuOpen(false);
            }}
            className={`h-9 px-3 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
              isMobileAiMenuOpen
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
            }`}
            title="Open AI tools"
          >
            <FiZap size={13} />
            <span>AI</span>
            {!isPro && <FiLock size={10} className={isMobileAiMenuOpen ? 'text-white/70' : 'text-indigo-300'} />}
            <FiChevronDown size={12} className={isMobileAiMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
        </div>
      </div>
    </header>

    <header className="hidden h-16 bg-white border-b border-gray-100 md:flex items-center px-4 md:px-6 gap-3 z-30 shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] print:hidden">

      <div className="flex items-center gap-3 flex-1 min-w-0">

        {/* Back Button */}
        <button
          onClick={onBackToDashboard}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:text-black hover:bg-gray-100 transition-colors shrink-0"
          title="Back to Dashboard"
        >
          <FiChevronLeft size={16} />
        </button>

        <div className="w-px h-6 bg-gray-200 shrink-0 hidden md:block mx-1" />

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
            <div className={`w-1.5 h-1.5 rounded-full ${saveIndicatorClass}`} />
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
        
        {/* Credits Badge */}
        {!isPro && (
          <div className="hidden xl:flex flex-col items-end mr-1">
            <div className="text-[9px] font-bold text-gray-400 tracking-wider uppercase">
              Daily AI Trial
            </div>
            <div className="text-[11px] font-black text-indigo-600 tabular-nums">
              {monthlyCredits - usedCredits} / {monthlyCredits} <span className="text-[9px] font-bold opacity-60">Uses</span>
            </div>
          </div>
        )}

        {/* Go Pro Badge */}
        {!isPro && (
          <button
            onClick={() => onProAction('priority_templates', 'Pro Waitlist')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-[11px] font-black uppercase tracking-wider bg-linear-to-r from-amber-200 to-yellow-400 text-yellow-900 transition-all hover:shadow-sm"
          >
            <FiStar size={12} className="fill-yellow-600" />
            <span>Join Pro Waitlist</span>
          </button>
        )}

        {/* Primary Actions */}
        <button
          onClick={onDownload}
          className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-4 rounded-xl text-[11.5px] font-bold text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
          title="Download PDF"
        >
          <FiDownload size={14} />
          <span className="hidden sm:inline sm:ml-2">Download PDF</span>
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

    {(isMobileTemplateMenuOpen || isMobileAiMenuOpen) && (
      <div
        className="fixed inset-0 z-90 bg-slate-950/35 backdrop-blur-[2px] md:hidden print:hidden"
        onClick={closeMobileMenus}
      >
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div
            className="w-full rounded-[28px] bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] border border-gray-200 overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            {isMobileTemplateMenuOpen && (
              <div>
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">
                    Switch Template
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-gray-900">
                    Choose the layout for this resume.
                  </p>
                </div>

                <div className="p-2">
                  {BUILDER_TEMPLATE_OPTIONS.map((option) => {
                    const isActive = option.id === templateId;

                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          onTemplateChange(option.id);
                          closeMobileMenus();
                        }}
                        className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-3 text-left transition-colors ${
                          isActive
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div>
                          <p className="text-[13px] font-bold">{option.label}</p>
                          <p className={`text-[11px] mt-0.5 ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                            {option.id === 'ats' ? 'Recruiter-first single column' : `${option.label} resume layout`}
                          </p>
                        </div>
                        {isActive && <FiCheck size={16} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isMobileAiMenuOpen && (
              <div>
                <div className="px-4 pt-4 pb-3 border-b border-indigo-100 bg-linear-to-r from-indigo-50 to-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-500">
                    AI Tools
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-gray-900">
                    Run tailoring, cover letter, or ATS audit from mobile.
                  </p>
                </div>

                <div className="p-2">
                  {[
                    {
                      feature: 'ai_tailor' as const,
                      label: 'AI Tailor',
                      description: 'Adapt this resume to a specific role.',
                      icon: <FiZap size={15} />,
                    },
                    {
                      feature: 'cover_letter' as const,
                      label: 'Cover Letter',
                      description: 'Generate a matching cover letter draft.',
                      icon: <FiFileText size={15} />,
                    },
                    {
                      feature: 'ats_audit' as const,
                      label: 'ATS Audit',
                      description: 'Review keyword and formatting alignment.',
                      icon: <FiCheck size={15} />,
                    },
                  ].map((item) => (
                    <button
                      key={item.feature}
                      onClick={() => {
                        onProAction(item.feature, item.label);
                        closeMobileMenus();
                      }}
                      className="w-full flex items-start gap-3 rounded-2xl px-3.5 py-3 text-left text-gray-700 hover:bg-indigo-50/70 transition-colors"
                    >
                      <span className="mt-0.5 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-[13px] font-bold text-gray-900">
                          {item.label}
                          {!isPro && <FiLock size={11} className="text-indigo-300" />}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-gray-500">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default BuilderHeader;
