import React from "react";
import {
  FiCopy,
  FiX,
  FiZap,
  FiCheck,
  FiFileText,
  FiTarget,
  FiBriefcase,
  FiAlignLeft,
  FiAlertCircle,
} from "react-icons/fi";
import type { BuilderAiWorkflowModalProps } from "../../../types/builder";

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
  onRunAtsAudit,
  onApplyAtsKeywordHints,
  onGenerateCoverLetter,
  onCopyCoverLetter,
  isGenerating,
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
            <div className="px-6 py-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <FiZap size={12} className="shrink-0" />
                This will suggest a tailored professional summary optimized for
                this exact role.
              </p>
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
              </div>

              {atsResult && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-5 space-y-5 shadow-[0_4px_12px_rgba(16,185,129,0.05)] animate-in slide-in-from-bottom-2 fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800/60">
                      Match Score
                    </span>
                    <span
                      className={`text-2xl font-black tracking-tight ${
                        atsResult.score >= 70
                          ? "text-emerald-600"
                          : atsResult.score >= 50
                            ? "text-amber-500"
                            : "text-rose-500"
                      }`}
                    >
                      {atsResult.score}%
                    </span>
                  </div>

                  <div className="h-2.5 rounded-full bg-emerald-100 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        atsResult.score >= 70
                          ? "bg-linear-to-r from-emerald-400 to-emerald-500"
                          : atsResult.score >= 50
                            ? "bg-linear-to-rrom-amber-400 to-amber-500"
                            : "bg-linear-to-r from-rose-400 to-rose-500"
                      }`}
                      style={{ width: `${atsResult.score}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-emerald-100/50 bg-white px-3.5 py-2.5 shadow-sm">
                      <p className="text-[10px] uppercase tracking-wide font-bold text-gray-400">
                        Keywords
                      </p>
                      <p className="text-[13px] font-black text-gray-800 mt-1">
                        {atsResult.matchedCount}/{atsResult.keywordCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-100/50 bg-white px-3.5 py-2.5 shadow-sm">
                      <p className="text-[10px] uppercase tracking-wide font-bold text-gray-400">
                        Coverage
                      </p>
                      <p className="text-[13px] font-black text-gray-800 mt-1">
                        {atsResult.keywordCoverage}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-100/50 bg-white px-3.5 py-2.5 shadow-sm">
                      <p className="text-[10px] uppercase tracking-wide font-bold text-gray-400">
                        Metrics
                      </p>
                      <p className="text-[13px] font-black text-gray-800 mt-1">
                        {atsResult.quantifiedBulletCount} found
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2.5 flex items-center gap-1.5">
                        <FiCheck className="text-emerald-500" size={11} />{" "}
                        Matched
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {atsResult.matchedKeywords.length > 0 ? (
                          atsResult.matchedKeywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="px-2.5 py-1 rounded-md bg-emerald-100/60 border border-emerald-200/60 text-emerald-800 text-[10.5px] font-semibold"
                            >
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11.5px] text-gray-400 italic">
                            No matches yet.
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2.5 flex items-center gap-1.5">
                        <FiAlertCircle className="text-amber-500" size={11} />{" "}
                        Missing Core Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {atsResult.missingKeywords.length > 0 ? (
                          atsResult.missingKeywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200/50 text-amber-800 text-[10.5px] font-semibold"
                            >
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11.5px] text-gray-400 italic">
                            No critical misses.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
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
                    <button
                      onClick={onCopyCoverLetter}
                      className="flex items-center gap-1.5 text-[10px] text-blue-600 hover:text-blue-800"
                    >
                      <FiCopy size={11} /> Copy
                    </button>
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

          {activeAiFlow === "ai_tailor" && (
            <button
              onClick={onApplyTailor}
              disabled={isGenerating}
              className="h-10 px-6 rounded-xl bg-gray-900 text-white text-[13px] font-bold hover:bg-black hover:-translate-y-px shadow-sm disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex items-center gap-2"
            >
              {isGenerating ? "Tailoring..." : "Apply Tailoring"}
            </button>
          )}

          {activeAiFlow === "ats_audit" && (
            <button
              onClick={onApplyAtsKeywordHints}
              className="h-10 px-6 rounded-xl bg-gray-900 text-white text-[13px] font-bold hover:bg-black hover:-translate-y-px shadow-sm transition-all"
            >
              Inject Missing Keywords
            </button>
          )}

          {activeAiFlow === "cover_letter" && coverLetterDraft && (
            <button
              onClick={onCopyCoverLetter}
              className="h-10 px-6 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 hover:-translate-y-px shadow-sm transition-all flex items-center gap-2"
            >
              <FiCopy size={14} />
              Copy to Clipboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuilderAiWorkflowModal;
