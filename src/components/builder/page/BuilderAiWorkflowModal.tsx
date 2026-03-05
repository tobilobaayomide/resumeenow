import React from 'react';
import { FiCopy, FiX } from 'react-icons/fi';
import type { BuilderAiWorkflowModalProps } from '../../../types/builder';

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

  return (
    <div
      className="fixed inset-0 z-90 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/* CHANGED: Added flex flex-col max-h-[90vh] to cap height */}
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header - flex-shrink-0 keeps it always visible */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
              AI Workflow
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mt-1">
              {activeAiFlow === 'ai_tailor'
                ? 'AI Tailor Resume'
                : activeAiFlow === 'ats_audit'
                  ? 'Run ATS Audit'
                  : 'Generate Cover Letter'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* CHANGED: Body is now scrollable with overflow-y-auto flex-1 */}
        <div className="overflow-y-auto flex-1">
          {activeAiFlow === 'ai_tailor' ? (
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Target Role
                  <input
                    type="text"
                    value={tailorRole}
                    onChange={(event) => onTailorRoleChange(event.target.value)}
                    placeholder="Frontend Engineer"
                    className="mt-1.5 w-full h-11 px-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-black"
                  />
                </label>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Company
                  <input
                    type="text"
                    value={tailorCompany}
                    onChange={(event) => onTailorCompanyChange(event.target.value)}
                    placeholder="Acme Inc"
                    className="mt-1.5 w-full h-11 px-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-black"
                  />
                </label>
              </div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">
                Job Description
                <textarea
                  value={tailorJobDescription}
                  onChange={(event) => onTailorJobDescriptionChange(event.target.value)}
                  placeholder="Paste the job description here..."
                  className="mt-1.5 w-full min-h-40 p-3 rounded-xl border border-gray-200 text-sm font-medium outline-none resize-y focus:border-black"
                />
              </label>
              <p className="text-xs text-gray-500">
                This applies a tailored summary in your editor so you can refine before saving.
              </p>

            </div>
          ) : activeAiFlow === 'ats_audit' ? (
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Target Role
                  <input
                    type="text"
                    value={atsRole}
                    onChange={(event) => onAtsRoleChange(event.target.value)}
                    placeholder="Frontend Engineer"
                    className="mt-1.5 w-full h-11 px-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-black"
                  />
                </label>
              </div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">
                Job Description
                <textarea
                  value={atsJobDescription}
                  onChange={(event) => onAtsJobDescriptionChange(event.target.value)}
                  placeholder="Paste job description for ATS match..."
                  className="mt-1.5 w-full min-h-40 p-3 rounded-xl border border-gray-200 text-sm font-medium outline-none resize-y focus:border-black"
                />
              </label>
              <div className="flex justify-end">
                <button
                  onClick={onRunAtsAudit}
                  disabled={isGenerating}
                  className="h-9 px-4 rounded-lg bg-black text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Scanning...' : 'Run Audit'}
                </button>
              </div>

              {atsResult && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
                      ATS Match Score
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        atsResult.score >= 70
                          ? 'text-emerald-600'
                          : atsResult.score >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}
                    >
                      {atsResult.score}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        atsResult.score >= 70
                          ? 'bg-emerald-500'
                          : atsResult.score >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${atsResult.score}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide font-bold text-gray-500">
                        Keywords
                      </p>
                      <p className="text-xs font-semibold text-gray-800 mt-0.5">
                        {atsResult.matchedCount}/{atsResult.keywordCount || 0} matched
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide font-bold text-gray-500">
                        Coverage
                      </p>
                      <p className="text-xs font-semibold text-gray-800 mt-0.5">
                        {atsResult.keywordCoverage}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide font-bold text-gray-500">
                        Impact Metrics
                      </p>
                      <p className="text-xs font-semibold text-gray-800 mt-0.5">
                        {atsResult.quantifiedBulletCount} found
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">
                      Score Breakdown
                    </p>
                    <div className="space-y-2">
                      {atsResult.breakdown.map((item) => (
                        <div key={item.label} className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-600">{item.label}</span>
                          <span className="font-bold text-gray-800">
                            {item.score}/{item.max}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">
                        Matched
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {atsResult.matchedKeywords.length > 0 ? (
                          atsResult.matchedKeywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold"
                            >
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">No matches yet.</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">
                        Missing
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {atsResult.missingKeywords.length > 0 ? (
                          atsResult.missingKeywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold"
                            >
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">No critical misses.</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">
                      Suggestions
                    </p>
                    <ul className="space-y-1.5">
                      {atsResult.suggestions.map((suggestion) => (
                        <li key={suggestion} className="text-xs text-gray-700">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Role
                  <input
                    type="text"
                    value={coverRole}
                    onChange={(event) => onCoverRoleChange(event.target.value)}
                    placeholder="Frontend Engineer"
                    className="mt-1.5 w-full h-11 px-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-black"
                  />
                </label>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Company
                  <input
                    type="text"
                    value={coverCompany}
                    onChange={(event) => onCoverCompanyChange(event.target.value)}
                    placeholder="Acme Inc"
                    className="mt-1.5 w-full h-11 px-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-black"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Hiring Manager
                  <input
                    type="text"
                    value={coverHiringManager}
                    onChange={(event) => onCoverHiringManagerChange(event.target.value)}
                    placeholder="Jane Doe (optional)"
                    className="mt-1.5 w-full h-11 px-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-black"
                  />
                </label>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Tone
                  <select
                    value={coverTone}
                    onChange={(event) =>
                      onCoverToneChange(
                        event.target.value as 'professional' | 'confident' | 'friendly',
                      )
                    }
                    className="mt-1.5 w-full h-11 px-3 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-black bg-white"
                  >
                    <option value="professional">Professional</option>
                    <option value="confident">Confident</option>
                    <option value="friendly">Friendly</option>
                  </select>
                </label>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  Generate a draft instantly from your current resume data.
                </p>
                <button
                  onClick={onGenerateCoverLetter}
                  disabled={isGenerating}
                  className="h-9 px-4 rounded-lg bg-black text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Drafting...' : 'Generate Draft'}
                </button>
              </div>
              {coverLetterDraft && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    Draft
                  </label>
                  <textarea
                    value={coverLetterDraft}
                    readOnly
                    className="w-full min-h-48 p-3 rounded-xl border border-gray-200 text-sm font-medium outline-none resize-y bg-gray-50"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - flex-shrink-0 keeps it always visible at the bottom */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3 justify-end shrink-0">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            {activeAiFlow === 'ats_audit' ? 'Close' : 'Cancel'}
          </button>
          {activeAiFlow === 'ai_tailor' && (
            <button
              onClick={onApplyTailor}
              disabled={isGenerating}
              className="h-10 px-5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Tailoring...' : 'Apply Tailoring'}
            </button>
          )}
          {activeAiFlow === 'ats_audit' && (
            <button
              onClick={onApplyAtsKeywordHints}
              className="h-10 px-5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800"
            >
              Apply Keyword Hints
            </button>
          )}
          {activeAiFlow === 'cover_letter' && (
            <button
              onClick={onCopyCoverLetter}
              className="h-10 px-5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 inline-flex items-center gap-2"
            >
              <FiCopy size={14} />
              Copy Draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuilderAiWorkflowModal;
