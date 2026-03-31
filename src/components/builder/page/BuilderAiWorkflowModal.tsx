import React from "react";
import {
  FiCopy,
  FiDownload,
  FiX,
  FiZap,
  FiCheck,
  FiFileText,
  FiTarget,
  FiBriefcase,
  FiAlignLeft,
  FiAlertCircle,
  FiSearch,
  FiInfo,
} from "react-icons/fi";
import type { BuilderAiWorkflowModalProps } from "../../../types/builder";

const dedupeKeywords = (keywords: string[]) => {
  const seen = new Set<string>();

  return keywords.reduce<string[]>((result, keyword) => {
    const cleanKeyword = keyword.trim();
    const normalizedKeyword = cleanKeyword.toLowerCase();

    if (!cleanKeyword || seen.has(normalizedKeyword)) {
      return result;
    }

    seen.add(normalizedKeyword);
    result.push(cleanKeyword);
    return result;
  }, []);
};

const BuilderAiWorkflowModal: React.FC<BuilderAiWorkflowModalProps> = ({
  activeAiFlow,
  tailorRole,
  tailorCompany,
  tailorJobDescription,
  atsRole,
  atsJobDescription,
  atsResult,
  coverRole,
  coverCompany,
  coverHiringManager,
  coverTone,
  coverLetterDraft,
  onClose,
  onTailorRoleChange,
  onTailorCompanyChange,
  onTailorJobDescriptionChange,
  onAtsRoleChange,
  onAtsJobDescriptionChange,
  onCoverRoleChange,
  onCoverCompanyChange,
  onCoverHiringManagerChange,
  onCoverToneChange,
  onApplyTailor,
  onConfirmTailor,
  onDiscardTailor,
  onRunAtsAudit,
  onApplyAtsKeywordHint,
  onApplyAtsKeywordHints,
  onApplyAtsImprovements,
  onApplyAtsImprovement,
  onApplyTailorFix,
  onGenerateCoverLetter,
  onDownloadCoverLetterPdf,
  onCopyCoverLetter,
  isGenerating,
  isExportingCoverLetter,
  tailorPreview,
}) => {
  if (!activeAiFlow) return null;

  const headerConfig = {
    ai_tailor: {
      title: "AI Resume Tailoring",
      icon: <FiZap className="text-indigo-500" size={18} />,
    },
    ats_audit: {
      title: "ATS Match Audit",
      icon: <FiCheck className="text-emerald-500" size={18} />,
    },
    cover_letter: {
      title: "Generate Cover Letter",
      icon: <FiFileText className="text-blue-500" size={18} />,
    },
  };

  const activeConfig = headerConfig[activeAiFlow];
  const keywordAlignment = tailorPreview?.keywordAlignment || {
    matched: [],
    injected: [],
    stillMissing: [],
  };
  const matchedKeywords = dedupeKeywords(keywordAlignment.matched);
  const matchedKeywordKeys = new Set(
    matchedKeywords.map((keyword) => keyword.toLowerCase()),
  );
  const injectedKeywords = dedupeKeywords(
    keywordAlignment.injected.filter(
      (keyword) => !matchedKeywordKeys.has(keyword.trim().toLowerCase()),
    ),
  );
  const coveredKeywordKeys = new Set(
    [...matchedKeywords, ...injectedKeywords].map((keyword) =>
      keyword.toLowerCase(),
    ),
  );
  const missingKeywords = dedupeKeywords(
    keywordAlignment.stillMissing.filter(
      (keyword) => !coveredKeywordKeys.has(keyword.trim().toLowerCase()),
    ),
  );
  const hasActionableTailorSuggestions = Boolean(
    tailorPreview?.summary ||
      tailorPreview?.skills ||
      tailorPreview?.experienceImprovements.length ||
      tailorPreview?.experienceAdditions.length ||
      tailorPreview?.contactFix,
  );
  const hasKeywordInsights = Boolean(
    matchedKeywords.length || injectedKeywords.length || missingKeywords.length,
  );
  const keywordCoverageSummary = [
    matchedKeywords.length
      ? `${matchedKeywords.length} already in your resume`
      : null,
    injectedKeywords.length
      ? `${injectedKeywords.length} added in the AI rewrite`
      : null,
    missingKeywords.length ? `${missingKeywords.length} still missing` : null,
  ]
    .filter(Boolean)
    .join(" / ");
  const keywordSections = [
    {
      key: "matched",
      title: "Already in resume",
      description: "Terms the AI found in your current content.",
      emptyLabel: "No strong resume matches were detected yet.",
      items: matchedKeywords,
      icon: <FiCheck size={12} className="text-emerald-600" />,
      panelClass: "border-emerald-100 bg-emerald-50/70",
      countClass: "bg-white text-emerald-700 border border-emerald-200",
      chipClass:
        "bg-white text-emerald-700 border border-emerald-200 shadow-[0_1px_0_rgba(16,185,129,0.08)]",
    },
    {
      key: "injected",
      title: "Added by AI",
      description: "Keywords introduced in the suggested rewrite.",
      emptyLabel: "The rewrite did not add extra role terms.",
      items: injectedKeywords,
      icon: <FiZap size={12} className="text-indigo-600" />,
      panelClass: "border-indigo-100 bg-indigo-50/70",
      countClass: "bg-white text-indigo-700 border border-indigo-200",
      chipClass:
        "bg-white text-indigo-700 border border-indigo-200 shadow-[0_1px_0_rgba(99,102,241,0.08)]",
    },
    {
      key: "missing",
      title: "Still missing",
      description: "Important terms to work in naturally if they are true.",
      emptyLabel: "No obvious keyword gaps were flagged.",
      items: missingKeywords,
      icon: <FiAlertCircle size={12} className="text-amber-600" />,
      panelClass: "border-amber-100 bg-amber-50/70",
      countClass: "bg-white text-amber-700 border border-amber-200",
      chipClass:
        "bg-white text-amber-700 border border-amber-200 shadow-[0_1px_0_rgba(245,158,11,0.08)]",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-100 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 print:hidden animate-in fade-in duration-200"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-[0.98] duration-200">
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-2 rounded-xl border ${
                activeAiFlow === "ai_tailor"
                  ? "bg-indigo-50 border-indigo-100"
                  : activeAiFlow === "ats_audit"
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-blue-50 border-blue-100"
              }`}
            >
              {activeConfig.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                Smart Workflow
              </p>
              <h3 className="text-[17px] font-bold text-gray-900 leading-none">
                {activeConfig.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center justify-center"
          >
            <FiX size={15} />
          </button>
        </div>

        {/* ── BODY ────────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 bg-slate-50/30">
          {/* AI TAILOR */}
          {activeAiFlow === "ai_tailor" && (
            <div className="px-6 py-6 space-y-6">
              {!tailorPreview ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                        Target Role
                      </label>
                      <div className="relative">
                        <FiTarget
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={13}
                        />
                        <input
                          type="text"
                          value={tailorRole}
                          onChange={(event) =>
                            onTailorRoleChange(event.target.value)
                          }
                          placeholder="e.g. Senior Frontend Engineer"
                          className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-gray-200 text-[13px] font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                        Company (Optional)
                      </label>
                      <div className="relative">
                        <FiBriefcase
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={13}
                        />
                        <input
                          type="text"
                          value={tailorCompany}
                          onChange={(event) =>
                            onTailorCompanyChange(event.target.value)
                          }
                          placeholder="e.g. Vercel"
                          className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-gray-200 text-[13px] font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                      Job Description
                    </label>
                    <div className="relative">
                      <FiAlignLeft
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={13}
                      />
                      <textarea
                        value={tailorJobDescription}
                        onChange={(event) =>
                          onTailorJobDescriptionChange(event.target.value)
                        }
                        placeholder="Paste the full job description here..."
                        className="w-full min-h-45 pl-9 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-[13px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 resize-y transition-all leading-relaxed"
                      />
                    </div>
                  </div>

                  <p className="text-[11.5px] text-gray-500 flex items-center gap-1.5 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                    <FiZap size={12} className="shrink-0 text-amber-500" />
                    This will analyze the role and provide a granular strategy board to optimize your resume.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <FiZap size={14} className="text-amber-500" />
                      <h4 className="text-[12px] font-black uppercase tracking-widest text-indigo-600">Tailor Strategy Board</h4>
                    </div>
                    {hasActionableTailorSuggestions && (
                      <button 
                        onClick={onConfirmTailor}
                        className="h-8 px-4 rounded-full bg-indigo-600 text-white text-[11px] font-black hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
                      >
                        Apply All Suggested Fixes
                      </button>
                    )}
                  </div>

                  {!hasActionableTailorSuggestions && hasKeywordInsights && (
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-[12px] font-medium text-indigo-700">
                      No direct text edits are pending. Review the keyword coverage below before you finalize the resume.
                    </div>
                  )}

                  {!hasActionableTailorSuggestions && !hasKeywordInsights && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[12px] font-medium text-emerald-700">
                      All visible tailor suggestions have been applied.
                    </div>
                  )}

                  {/* Summary Fix */}
                  {tailorPreview.summary && (
                    <div className="group rounded-2xl border border-indigo-100 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all">
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Optimized Summary</label>
                          <button 
                            onClick={() => onApplyTailorFix('summary')}
                            className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Accept Fix
                          </button>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[11.5px] text-gray-400 italic leading-relaxed border-l-2 border-gray-100 pl-3 line-clamp-2">
                             "{tailorPreview.summary.current}"
                          </p>
                          <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-900 text-[12.5px] font-medium leading-relaxed border border-indigo-100">
                             {tailorPreview.summary.better}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills Fix */}
                  {tailorPreview.skills && (
                    <div className="group rounded-2xl border border-indigo-100 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all">
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Technical Skills Realignment</label>
                          <button 
                            onClick={() => onApplyTailorFix('skills')}
                            className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Update Skills
                          </button>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-900 text-[12px] font-medium leading-relaxed border border-emerald-100">
                           {tailorPreview.skills.better}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Experience Improvements */}
                  {tailorPreview.experienceImprovements.map((imp, idx) => (
                    <div key={idx} className="group rounded-2xl border border-amber-100 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all">
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                             <FiZap size={10} /> Experience Booster
                          </label>
                          <button 
                            onClick={() => onApplyTailorFix('experience', imp.id, imp.current)}
                            className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Accept Bullet
                          </button>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[11.5px] text-gray-400 italic border-l-2 border-gray-100 pl-3">"{imp.current}"</p>
                           <div className="p-3 rounded-xl bg-gray-900 text-white text-[12px] font-medium leading-relaxed shadow-lg">
                              {imp.better}
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Exp Additions */}
                  {tailorPreview.experienceAdditions.map((add, idx) => (
                    <div key={idx} className="group rounded-2xl border border-emerald-100 bg-emerald-50/30 overflow-hidden shadow-xs hover:shadow-md transition-all border-dashed">
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Strategic Addition</label>
                          <button 
                            onClick={() => onApplyTailorFix('addition', add.id)}
                            className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Add Bullet
                          </button>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-600 text-white text-[12px] font-medium leading-relaxed shadow-md">
                           {add.better}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Keyword Alignment */}
                  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <div className="p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ATS Keyword Alignment</h5>
                          <p className="text-[11.5px] text-gray-500 leading-relaxed">
                            {keywordCoverageSummary || "The AI did not surface keyword coverage details for this role yet."}
                          </p>
                        </div>
                        {hasKeywordInsights && (
                          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                            {matchedKeywords.length + injectedKeywords.length + missingKeywords.length} terms
                          </span>
                        )}
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        {keywordSections.map((section) => (
                          <div
                            key={section.key}
                            className={`rounded-2xl border p-3 space-y-3 ${section.panelClass}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {section.icon}
                                  <p className="text-[11px] font-black text-gray-900">
                                    {section.title}
                                  </p>
                                </div>
                                <p className="text-[10.5px] leading-relaxed text-gray-500">
                                  {section.description}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${section.countClass}`}
                              >
                                {section.items.length}
                              </span>
                            </div>

                            {section.items.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {section.items.map((keyword) => (
                                  <span
                                    key={`${section.key}-${keyword}`}
                                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${section.chipClass}`}
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10.5px] leading-relaxed text-gray-500">
                                {section.emptyLabel}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ATS AUDIT */}
          {activeAiFlow === "ats_audit" && (
            <div className="px-6 py-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={atsRole}
                    onChange={(event) => onAtsRoleChange(event.target.value)}
                    placeholder="e.g. Product Designer"
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-gray-200 text-[13px] font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-bold text-gray-500 uppercase tracking-wide justify-between items-end">
                    <span>Job Description</span>
                    <button
                      onClick={onRunAtsAudit}
                      disabled={isGenerating || !atsJobDescription.trim()}
                      className="h-7 px-3 rounded-lg bg-gray-900 text-white text-[11px] font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
                    >
                      {isGenerating ? (
                        <FiZap className="animate-pulse" size={10} />
                      ) : (
                        <FiTarget size={10} />
                      )}
                      {isGenerating ? "Scanning..." : "Run Audit"}
                    </button>
                  </label>
                  <textarea
                    value={atsJobDescription}
                    onChange={(event) =>
                      onAtsJobDescriptionChange(event.target.value)
                    }
                    placeholder="Paste the job description to check keyword match rate..."
                    className="w-full min-h-30 px-3.5 py-3 rounded-xl bg-white border border-gray-200 text-[13px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 resize-y transition-all leading-relaxed"
                  />
                </div>

                <p className="text-[11.5px] text-gray-500 flex items-center gap-1.5 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100/70">
                  <FiInfo size={12} className="shrink-0 text-emerald-600" />
                  This is an AI ATS-style audit, not an exact employer ATS replica. Apply only true changes, then rerun the audit to rescore.
                </p>
              </div>

              {atsResult && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
                  
                  {/* CRITICAL MISTAKE BANNER */}
                  {atsResult.criticalMistake && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex gap-4 items-start shadow-sm">
                      <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
                        <FiAlertCircle size={20} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[13px] font-black text-rose-900 leading-none">{atsResult.criticalMistake.title}</h4>
                        <p className="text-[11.5px] text-rose-800/70 leading-relaxed italic">{atsResult.criticalMistake.description}</p>
                        <div className="pt-2">
                           <p className="text-[11.5px] font-black text-rose-900 border-t border-rose-200/50 pt-2 group-hover:block">
                             ⚡ Strategic Fix: <span className="font-medium">{atsResult.criticalMistake.fix}</span>
                           </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MAIN SCORE & BREAKDOWN */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm overflow-hidden relative">
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
                       {/* Circular Score */}
                       <div className="relative shrink-0">
                          <svg className="w-32 h-32 transform -rotate-90">
                             <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-50" />
                             <circle 
                                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                strokeDasharray={364.4} 
                                strokeDashoffset={364.4 - (364.4 * atsResult.score) / 100}
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ease-out shadow-sm ${
                                  atsResult.score >= 85 ? "text-emerald-500" : atsResult.score >= 70 ? "text-indigo-500" : atsResult.score >= 50 ? "text-amber-500" : "text-rose-500"
                                }`} 
                             />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-3xl font-black tracking-tight text-gray-900">{atsResult.score}%</span>
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Match</span>
                          </div>
                       </div>

                       {/* Detailed Breakdown Bars */}
                       <div className="flex-1 w-full space-y-3">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Score Breakdown</h4>
                          {atsResult.breakdown.map((item) => (
                             <div key={item.label} className="space-y-1">
                                <div className="flex justify-between items-end">
                                   <span className="text-[10.5px] font-bold text-gray-700">{item.label}</span>
                                   <span className="text-[10.5px] font-black text-gray-900">{item.score}/{item.max}</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                   <div 
                                      className={`h-full rounded-full transition-all duration-1000 delay-300 ${
                                        (item.score / item.max) >= 0.8 ? "bg-emerald-400" : (item.score / item.max) >= 0.6 ? "bg-indigo-400" : "bg-amber-400"
                                      }`}
                                      style={{ width: `${(item.score / item.max) * 100}%` }}
                                   />
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  </div>

                  {/* KEYWORD DENSITY */}
                  {atsResult.keywordDensity && atsResult.keywordDensity.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 px-1">
                        <FiSearch size={14} className="text-gray-400" />
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500">Keyword Density (Top Priority)</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {atsResult.keywordDensity.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-white border border-gray-100 shadow-xs space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-[11px] font-black text-gray-800 truncate pr-2">{item.keyword}</span>
                              <div className="flex gap-0.5">
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className={`w-1 h-3 rounded-full ${i < Math.ceil(item.importance / 3.33) ? 'bg-indigo-500' : 'bg-gray-100'}`} />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Usage</span>
                              <span className={`text-[11px] font-black ${item.count > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {item.count}x
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STRATEGIC IMPROVEMENTS (CURRENT vs BETTER) */}
                  {atsResult.improvements && atsResult.improvements.length > 0 && (
                    <div className="space-y-4">
                       <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-1.5">
                            <FiZap size={14} className="text-amber-500" />
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500">Strategic Replacements</h4>
                          </div>
                          <button 
                            onClick={onApplyAtsImprovements}
                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                          >
                             Apply All Fixes
                          </button>
                       </div>
                       <div className="space-y-4">
                          {atsResult.improvements.map((imp, idx) => (
                             <div key={idx} className="group rounded-2xl border border-indigo-100 bg-linear-to-b from-indigo-50/30 to-white overflow-hidden shadow-xs hover:shadow-md transition-all">
                                <div className="p-4 space-y-4">
                                   <div className="space-y-2">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                                           Current Version
                                        </div>
                                        <button
                                          onClick={() => onApplyAtsImprovement(imp)}
                                          className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          Accept Fix
                                        </button>
                                      </div>
                                      <p className="text-[11.5px] text-gray-500 italic leading-relaxed border-l-2 border-gray-100 pl-3">
                                         "{imp.current}"
                                      </p>
                                   </div>
                                   <div className="space-y-2 relative">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-tighter">
                                          Better for ATS (Boosts Ranking)
                                        </div>
                                      </div>
                                      <div className="p-3.5 rounded-xl bg-indigo-600 text-white text-[12px] font-medium leading-relaxed shadow-md shadow-indigo-200">
                                         {imp.better}
                                      </div>
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {/* MISSING SKILLS FAST INJECT */}
                  {atsResult.missingKeywords.length > 0 && (
                    <div className="p-5 rounded-2xl bg-gray-900 text-white space-y-4 shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <FiInfo size={16} className="text-indigo-400" />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-black tracking-tight leading-none">Missing Core Keywords</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Add to Skills Section</p>
                          </div>
                        </div>
                        <button 
                          onClick={onApplyAtsKeywordHints}
                          className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-[11px] font-black transition-all shadow-lg active:scale-95"
                        >
                           Add All to Skills
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {atsResult.missingKeywords.map((keyword) => (
                          <div
                            key={keyword}
                            className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2"
                          >
                            <span className="text-gray-300 text-[11px] font-medium">
                              {keyword}
                            </span>
                            <button
                              onClick={() => onApplyAtsKeywordHint(keyword)}
                              className="shrink-0 rounded-lg bg-white text-gray-900 px-2.5 py-1 text-[10px] font-black hover:bg-gray-100 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* COVER LETTER */}
          {activeAiFlow === "cover_letter" && (
            <div className="px-6 py-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={coverRole}
                    onChange={(event) => onCoverRoleChange(event.target.value)}
                    placeholder="e.g. Marketing Manager"
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-gray-200 text-[13px] font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                    Company
                  </label>
                  <input
                    type="text"
                    value={coverCompany}
                    onChange={(event) =>
                      onCoverCompanyChange(event.target.value)
                    }
                    placeholder="e.g. Acme Corp"
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-gray-200 text-[13px] font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                    Hiring Manager
                  </label>
                  <input
                    type="text"
                    value={coverHiringManager}
                    onChange={(event) =>
                      onCoverHiringManagerChange(event.target.value)
                    }
                    placeholder="e.g. Jane Doe (optional)"
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-gray-200 text-[13px] font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">
                    Select Tone
                  </label>
                  <select
                    value={coverTone}
                    onChange={(event) =>
                      onCoverToneChange(
                        event.target.value as
                          | "professional"
                          | "confident"
                          | "friendly",
                      )
                    }
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-gray-200 text-[13px] font-medium text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all cursor-pointer"
                  >
                    <option value="professional">Professional & Direct</option>
                    <option value="confident">Confident & Persuasive</option>
                    <option value="friendly">Friendly & Approachable</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                <p className="text-[11px] text-blue-800/70 font-medium pl-2">
                  Draft a personalized cover letter instantly using your resume
                  data.
                </p>
                <button
                  onClick={onGenerateCoverLetter}
                  disabled={isGenerating}
                  className="h-8 px-4 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
                >
                  {isGenerating ? "Drafting..." : "Generate Draft"}
                </button>
              </div>

              {coverLetterDraft && (
                <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 pt-2">
                  <label className="block text-[10.5px] font-bold text-gray-500 uppercase tracking-wide mb-2 justify-between items-end">
                    <span>Generated Draft</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={onCopyCoverLetter}
                        className="flex items-center gap-1.5 text-[10px] text-blue-600 hover:text-blue-800"
                      >
                        <FiCopy size={11} /> Copy
                      </button>
                      <button
                        onClick={onDownloadCoverLetterPdf}
                        disabled={isExportingCoverLetter}
                        className="flex items-center gap-1.5 text-[10px] text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-blue-300"
                      >
                        <FiDownload size={11} />
                        {isExportingCoverLetter ? 'Preparing PDF...' : 'Download PDF'}
                      </button>
                    </div>
                  </label>
                  <textarea
                    value={coverLetterDraft}
                    readOnly
                    className="w-full min-h-60 p-4 rounded-xl bg-gray-50 border border-gray-200 text-[12.5px] font-serif text-gray-800 leading-relaxed outline-none resize-y shadow-inner"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-gray-200 bg-white text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            {activeAiFlow === "ats_audit" ? "Done" : "Cancel"}
          </button>

          {activeAiFlow === "ai_tailor" && !tailorPreview && (
            <button
              onClick={onApplyTailor}
              disabled={isGenerating}
              className="h-10 px-6 rounded-xl bg-gray-900 text-white text-[13px] font-bold hover:bg-black hover:-translate-y-px shadow-sm disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex items-center gap-2"
            >
              {isGenerating ? "Tailoring..." : "Generate Preview"}
            </button>
          )}

          {activeAiFlow === "ai_tailor" && tailorPreview && (
            <>
              <button
                onClick={onDiscardTailor}
                className="h-10 px-5 rounded-xl border border-gray-200 bg-white text-[13px] font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                Discard
              </button>
              <button
                onClick={onConfirmTailor}
                className="h-10 px-6 rounded-xl bg-indigo-600 text-white text-[13px] font-bold hover:bg-indigo-700 hover:-translate-y-px shadow-md transition-all flex items-center gap-2 animate-in zoom-in duration-300"
              >
                Apply All Changes
              </button>
            </>
          )}

          {activeAiFlow === "cover_letter" && coverLetterDraft && (
            <>
              <button
                onClick={onCopyCoverLetter}
                className="h-10 px-5 rounded-xl border border-blue-100 bg-blue-50 text-[13px] font-bold text-blue-700 hover:bg-blue-100 transition-all flex items-center gap-2"
              >
                <FiCopy size={14} />
                Copy
              </button>
              <button
                onClick={onDownloadCoverLetterPdf}
                disabled={isExportingCoverLetter}
                className="h-10 px-6 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 hover:-translate-y-px shadow-sm transition-all flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                
                {isExportingCoverLetter ? "Preparing PDF..." : "Download"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuilderAiWorkflowModal;
