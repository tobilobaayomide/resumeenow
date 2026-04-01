import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { CoverLetterTone } from '../../types/builder';
import type { AiFlowFeature } from '../../domain/workflows';
import {
  collectAddedBuilderAiSkills,
  createBuilderAiExperienceHighlights,
} from '../../lib/builder/aiHighlights';
import {
  applyAllAtsImprovements as applyAllAtsImprovementsToResume,
  applyAtsImprovement as applySingleAtsImprovementToResume,
  applyAtsKeywords as applyAtsKeywordsToResume,
} from '../../lib/ai/atsAuditApply';
import {
  mergeGroupedSkillSuggestionsIntoSection,
  mergeSkillNamesIntoSection,
  parseAiSkills,
} from '../../lib/aiResumeApply';
import {
  appendDescriptionBullet,
  replaceDescriptionBullet,
} from '../../lib/descriptionBullets';
import {
  analyzeAtsCompleteness,
  type AiRequestProgress,
  generateCoverLetterText,
  generateTailoredSummary,
} from '../../lib/gemini';
import { sanitizeAiPlainText } from '../../lib/aiText';
import { downloadCoverLetterAsPdf } from '../../lib/builder/coverLetterExport';
import { useBuilderStore } from '../../store/builderStore';
import { usePlan } from '../../context/usePlan';
import type { AtsAuditImprovement } from '../../types/builder';

const formatMissingFields = (fields: string[]): string => {
  if (fields.length === 1) return fields[0];
  if (fields.length === 2) return `${fields[0]} and ${fields[1]}`;
  return `${fields.slice(0, -1).join(', ')}, and ${fields.at(-1)}`;
};

const validateRequiredFields = (
  fields: Array<{ label: string; value: string }>,
): boolean => {
  const missingFields = fields
    .filter(({ value }) => !value.trim())
    .map(({ label }) => label);

  if (missingFields.length === 0) return true;

  toast.error(`Add ${formatMissingFields(missingFields)} first.`);
  return false;
};

const buildCoverLetterFileName = (
  resumeTitle: string,
  fullName: string,
): string => {
  const fallbackTitle =
    resumeTitle.trim() && resumeTitle.trim() !== 'Untitled Resume'
      ? resumeTitle.trim()
      : '';
  const owner = fullName.trim() || fallbackTitle || 'Cover Letter';
  return owner === 'Cover Letter' ? owner : `${owner} - Cover Letter`;
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message.trim() ? error.message : fallback;

const AI_PROGRESS_SUCCESS_LABELS: Record<AiFlowFeature, string> = {
  ai_tailor: 'Tailor strategy ready.',
  ats_audit: 'ATS audit ready.',
  cover_letter: 'Cover letter ready.',
};

const getAiProgressLabel = (
  flow: AiFlowFeature,
  progress: AiRequestProgress,
): string => {
  switch (flow) {
    case 'ai_tailor':
      return (
        {
          preparing: 'Reading your resume and target role…',
          authenticating: 'Securing your AI session…',
          checking_limits: 'Checking plan limits…',
          generating: 'Building your tailoring strategy…',
          finalizing: 'Polishing suggested edits…',
          cached: 'Loaded a recent tailor result.',
        } satisfies Record<AiRequestProgress['phase'], string>
      )[progress.phase];
    case 'ats_audit':
      return (
        {
          preparing: 'Reading the job description…',
          authenticating: 'Securing your AI session…',
          checking_limits: 'Checking plan limits…',
          generating: 'Scoring ATS compatibility…',
          finalizing: 'Summarizing gaps and fixes…',
          cached: 'Loaded a recent ATS audit.',
        } satisfies Record<AiRequestProgress['phase'], string>
      )[progress.phase];
    case 'cover_letter':
      return (
        {
          preparing: 'Gathering your resume context…',
          authenticating: 'Securing your AI session…',
          checking_limits: 'Checking plan limits…',
          generating: 'Drafting your cover letter…',
          finalizing: 'Polishing the final draft…',
          cached: 'Loaded a recent cover letter draft.',
        } satisfies Record<AiRequestProgress['phase'], string>
      )[progress.phase];
  }
};

export function useBuilderAiFlows() {
  const [isExportingCoverLetter, setIsExportingCoverLetter] = useState(false);
  const [aiProgress, setAiProgress] = useState<AiRequestProgress | null>(null);
  const [aiProgressStatus, setAiProgressStatus] = useState<'active' | 'success' | null>(null);
  const aiProgressResetTimeoutRef = useRef<number | null>(null);
  const title = useBuilderStore((store) => store.title);
  const resumeData = useBuilderStore((store) => store.resumeData);
  const setResumeData = useBuilderStore((store) => store.setResumeData);
  const isGenerating = useBuilderStore((store) => store.isGenerating);
  const isTailorOpen = useBuilderStore((store) => store.isTailorOpen);
  const tailorRole = useBuilderStore((store) => store.tailorRole);
  const tailorCompany = useBuilderStore((store) => store.tailorCompany);
  const tailorJobDescription = useBuilderStore((store) => store.tailorJobDescription);
  const isCoverLetterOpen = useBuilderStore((store) => store.isCoverLetterOpen);
  const coverRole = useBuilderStore((store) => store.coverRole);
  const coverCompany = useBuilderStore((store) => store.coverCompany);
  const coverHiringManager = useBuilderStore((store) => store.coverHiringManager);
  const coverTone = useBuilderStore((store) => store.coverTone);
  const coverLetterDraft = useBuilderStore((store) => store.coverLetterDraft);
  const isAtsAuditOpen = useBuilderStore((store) => store.isAtsAuditOpen);
  const atsRole = useBuilderStore((store) => store.atsRole);
  const atsJobDescription = useBuilderStore((store) => store.atsJobDescription);
  const atsResult = useBuilderStore((store) => store.atsResult);
  const setIsGenerating = useBuilderStore((store) => store.setIsGenerating);
  const openTailor = useBuilderStore((store) => store.openTailor);
  const openCoverLetter = useBuilderStore((store) => store.openCoverLetter);
  const openAtsAudit = useBuilderStore((store) => store.openAtsAudit);
  const closeAiFlows = useBuilderStore((store) => store.closeAiFlows);
  const setTailorFields = useBuilderStore((store) => store.setTailorFields);
  const setCoverFields = useBuilderStore((store) => store.setCoverFields);
  const setCoverLetterDraft = useBuilderStore((store) => store.setCoverLetterDraft);
  const setAtsFields = useBuilderStore((store) => store.setAtsFields);
  const setAtsResult = useBuilderStore((store) => store.setAtsResult);
  const markAiHighlights = useBuilderStore((store) => store.markAiHighlights);
  const setTailorPreview = useBuilderStore((store) => store.setTailorPreview);
  const confirmTailoredPreview = useBuilderStore((store) => store.confirmTailoredPreview);
  const discardTailoredPreview = useBuilderStore((store) => store.discardTailoredPreview);
  const tailorPreview = useBuilderStore((store) => store.tailorPreview);

  const { requestAccess, refreshCredits } = usePlan();

  const clearAiProgressReset = () => {
    if (aiProgressResetTimeoutRef.current !== null) {
      window.clearTimeout(aiProgressResetTimeoutRef.current);
      aiProgressResetTimeoutRef.current = null;
    }
  };

  useEffect(() => () => {
    if (aiProgressResetTimeoutRef.current !== null) {
      window.clearTimeout(aiProgressResetTimeoutRef.current);
      aiProgressResetTimeoutRef.current = null;
    }
  }, []);

  const bindAiProgress = (flow: AiFlowFeature) => {
    return (progress: AiRequestProgress) => {
      clearAiProgressReset();
      setAiProgress({
        ...progress,
        label: getAiProgressLabel(flow, progress),
      });
      setAiProgressStatus('active');
    };
  };

  const resetAiProgress = () => {
    clearAiProgressReset();
    setAiProgress(null);
    setAiProgressStatus(null);
  };

  const completeAiProgress = (
    flow: AiFlowFeature,
    label = AI_PROGRESS_SUCCESS_LABELS[flow],
  ) => {
    clearAiProgressReset();
    setAiProgress((current) => ({
      phase: current?.phase === 'cached' ? 'cached' : 'finalizing',
      label,
    }));
    setAiProgressStatus('success');
    aiProgressResetTimeoutRef.current = window.setTimeout(() => {
      setAiProgress(null);
      setAiProgressStatus(null);
      aiProgressResetTimeoutRef.current = null;
    }, 900);
  };

  const generateAiTailorPreview = async () => {
    if (!validateRequiredFields([
      { label: 'target role', value: tailorRole },
      { label: 'job description', value: tailorJobDescription },
    ])) {
      return;
    }

    if (!requestAccess('ai_tailor')) return;

    setIsGenerating(true);
    resetAiProgress();

    try {
      const tailored = await generateTailoredSummary(
        resumeData,
        tailorRole,
        tailorCompany,
        tailorJobDescription,
        bindAiProgress('ai_tailor'),
      );

      if (!tailored.jobTitleAfter) {
        completeAiProgress('ai_tailor', 'No usable edits returned.');
        toast.info('AI did not return usable edits. Tailoring skipped.');
        return;
      }

      setTailorPreview({
        jobTitleAfter: tailored.jobTitleAfter.trim() || resumeData.personalInfo.jobTitle || tailorRole.trim(),
        summary: tailored.summary,
        skills: tailored.skills,
        experienceImprovements: tailored.experienceImprovements || [],
        experienceAdditions: tailored.experienceAdditions || [],
        contactFix: tailored.contactFix,
        keywordAlignment: tailored.keywordAlignment || { matched: [], injected: [], stillMissing: [] },
      });
      completeAiProgress('ai_tailor');
    } catch (error) {
      console.error(error);
      resetAiProgress();
      toast.error(getErrorMessage(error, 'Failed to tailor resume.'));
    } finally {
      setIsGenerating(false);
      await refreshCredits();
    }
  };

  const onApplyTailorFix = (type: 'summary' | 'skills' | 'experience' | 'addition' | 'contact', id?: string, current?: string) => {
    const p = tailorPreview;
    if (!p) return;

    const experienceImprovement =
      type === 'experience' && id && current
        ? p.experienceImprovements.find((item) => item.id === id && item.current === current)
        : null;
    const experienceAddition =
      type === 'addition' && id
        ? p.experienceAdditions.find((item) => item.id === id)
        : null;

    const canApply =
      (type === 'summary' && Boolean(p.summary)) ||
      (type === 'skills' && Boolean(p.skills)) ||
      (type === 'experience' && Boolean(experienceImprovement)) ||
      (type === 'addition' && Boolean(experienceAddition));

    if (!canApply) return;

    if (type === 'summary' && p.summary) {
      setResumeData((prev) => ({
        ...prev,
        summary: sanitizeAiPlainText(p.summary!.better),
      }));
      markAiHighlights({ summary: true }, { section: 'summary' });
    } else if (type === 'skills' && p.skills) {
      const nextSkills =
        resumeData.skills.mode === 'grouped' && p.skills.groups?.length
          ? mergeGroupedSkillSuggestionsIntoSection(resumeData.skills, p.skills.groups)
          : mergeSkillNamesIntoSection(
              resumeData.skills,
              parseAiSkills(p.skills.better),
            );

      setResumeData((prev) => ({ ...prev, skills: nextSkills }));
      markAiHighlights(
        { skills: collectAddedBuilderAiSkills(resumeData.skills, nextSkills) },
        { section: 'skills' },
      );
    } else if (type === 'experience' && id && experienceImprovement) {
      let didApply = false;
      const betterBullet = sanitizeAiPlainText(experienceImprovement.better);

      setResumeData((prev) => ({
        ...prev,
        experience: prev.experience.map((item) =>
          item.id !== id
            ? item
            : (() => {
                const nextDescription = replaceDescriptionBullet(
                  item.description,
                  experienceImprovement.current,
                  betterBullet,
                );

                if (!nextDescription) return item;
                didApply = true;
                return {
                  ...item,
                  description: nextDescription,
                };
              })(),
        ),
      }));

      if (!didApply) {
        toast.info('This AI suggestion no longer matches your current bullet. Run Tailor again.');
        return;
      }

      markAiHighlights(
        {
          experience: createBuilderAiExperienceHighlights([
            { experienceId: id, text: betterBullet },
          ]),
        },
        { section: 'experience', experienceId: id },
      );
    } else if (type === 'addition' && id && experienceAddition) {
      const betterBullet = sanitizeAiPlainText(experienceAddition.better);

      setResumeData((prev) => ({
        ...prev,
        experience: prev.experience.map((item) =>
          item.id !== id
            ? item
            : {
                ...item,
                description: appendDescriptionBullet(
                  item.description,
                  betterBullet,
                ),
              },
        ),
      }));

      markAiHighlights(
        {
          experience: createBuilderAiExperienceHighlights([
            { experienceId: id, text: betterBullet },
          ]),
        },
        { section: 'experience', experienceId: id },
      );
    }

    setTailorPreview({
      ...p,
      summary: type === 'summary' ? undefined : p.summary,
      skills: type === 'skills' ? undefined : p.skills,
      experienceImprovements:
        type === 'experience' && experienceImprovement
          ? p.experienceImprovements.filter(
              (item) =>
                !(
                  item.id === experienceImprovement.id &&
                  item.current === experienceImprovement.current
                ),
            )
          : p.experienceImprovements,
      experienceAdditions:
        type === 'addition' && experienceAddition
          ? p.experienceAdditions.filter(
              (item) =>
                !(item.id === experienceAddition.id && item.better === experienceAddition.better),
            )
          : p.experienceAdditions,
      contactFix: p.contactFix,
    });

    toast.success('Strategy applied to resume!');
  };
  
  const confirmAiTailorPreview = () => {
    if (tailorPreview) {
      const nextSkills =
        tailorPreview.skills
          ? resumeData.skills.mode === 'grouped' && tailorPreview.skills.groups?.length
            ? mergeGroupedSkillSuggestionsIntoSection(
                resumeData.skills,
                tailorPreview.skills.groups,
              )
            : mergeSkillNamesIntoSection(
                resumeData.skills,
                parseAiSkills(tailorPreview.skills.better),
              )
          : resumeData.skills;

      markAiHighlights(
        {
          summary: Boolean(tailorPreview.summary),
          skills: tailorPreview.skills
            ? collectAddedBuilderAiSkills(resumeData.skills, nextSkills)
            : [],
          experience: createBuilderAiExperienceHighlights([
            ...tailorPreview.experienceImprovements.map((item) => ({
              experienceId: item.id,
              text: sanitizeAiPlainText(item.better),
            })),
            ...tailorPreview.experienceAdditions.map((item) => ({
              experienceId: item.id,
              text: sanitizeAiPlainText(item.better),
            })),
          ]),
        },
      );
    }

    confirmTailoredPreview();
    toast.success('Resume updated successfully!');
    closeAiFlows();
  };

  const discardAiTailorPreview = () => {
    discardTailoredPreview();
  };

  const downloadCoverLetterPdf = async () => {
    if (!coverLetterDraft.trim()) {
      toast.error('Generate a draft first.');
      return;
    }

    setIsExportingCoverLetter(true);

    try {
      await downloadCoverLetterAsPdf(
        buildCoverLetterFileName(
          title,
          resumeData.personalInfo.fullName,
        ),
        coverLetterDraft,
        resumeData.personalInfo,
        coverRole,
        coverCompany,
        coverHiringManager,
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to export cover letter PDF.');
    } finally {
      setIsExportingCoverLetter(false);
    }
  };

  const generateCoverLetter = async () => {
    if (!validateRequiredFields([
      { label: 'role', value: coverRole },
      { label: 'company', value: coverCompany },
    ])) {
      return;
    }

    if (!requestAccess('cover_letter')) return;

    setIsGenerating(true);
    resetAiProgress();

    try {
      const draft = await generateCoverLetterText(
        resumeData,
        coverRole,
        coverCompany,
        coverHiringManager,
        coverTone,
        // Pass tailor JD if available so cover letter uses same keywords
        tailorJobDescription || undefined,
        bindAiProgress('cover_letter'),
      );

      setCoverLetterDraft(draft.trim());
      completeAiProgress('cover_letter');
    } catch (error) {
      console.error(error);
      resetAiProgress();
      toast.error(getErrorMessage(error, 'Failed to draft cover letter.'));
    } finally {
      setIsGenerating(false);
      await refreshCredits();
    }
  };

  const runAtsAudit = async () => {
    if (!validateRequiredFields([
      { label: 'job description', value: atsJobDescription },
    ])) {
      return;
    }

    if (!requestAccess('ats_audit')) return;

    setIsGenerating(true);
    resetAiProgress();

    try {
      const result = await analyzeAtsCompleteness(
        resumeData,
        atsRole,
        atsJobDescription,
        bindAiProgress('ats_audit'),
      );
      setAtsResult(result);
      completeAiProgress('ats_audit');
    } catch (error) {
      console.error(error);
      resetAiProgress();
      toast.error(getErrorMessage(error, 'Failed processing audit.'));
    } finally {
      setIsGenerating(false);
      await refreshCredits();
    }
  };

  const activeAiFlow = isTailorOpen
    ? 'ai_tailor'
    : isAtsAuditOpen
      ? 'ats_audit'
      : isCoverLetterOpen
        ? 'cover_letter'
        : null;

  const aiModalProps: import('../../types/builder/page').BuilderAiWorkflowModalProps = {
    activeAiFlow,
    isGenerating,
    aiProgress,
    aiProgressStatus,

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
    isExportingCoverLetter,

    onClose: () => {
      resetAiProgress();
      closeAiFlows();
    },

    onTailorRoleChange: (value: string) => setTailorFields(value, tailorCompany, tailorJobDescription),
    onTailorCompanyChange: (value: string) => setTailorFields(tailorRole, value, tailorJobDescription),
    onTailorJobDescriptionChange: (value: string) => setTailorFields(tailorRole, tailorCompany, value),

    onAtsRoleChange: (value: string) => setAtsFields(value, atsJobDescription),
    onAtsJobDescriptionChange: (value: string) => setAtsFields(atsRole, value),

    onCoverRoleChange: (value: string) => setCoverFields(value, coverCompany, coverHiringManager, coverTone),
    onCoverCompanyChange: (value: string) => setCoverFields(coverRole, value, coverHiringManager, coverTone),
    onCoverHiringManagerChange: (value: string) => setCoverFields(coverRole, coverCompany, value, coverTone),
    onCoverToneChange: (value: CoverLetterTone) => setCoverFields(coverRole, coverCompany, coverHiringManager, value),

    onApplyTailor: generateAiTailorPreview,
    onConfirmTailor: confirmAiTailorPreview,
    onDiscardTailor: discardAiTailorPreview,
    onApplyTailorFix: onApplyTailorFix,
    tailorPreview,

    onRunAtsAudit: runAtsAudit,
    onApplyAtsKeywordHint: (keyword: string) => {
      if (!atsResult) {
        toast.info('Run an ATS audit first.');
        return;
      }

      const outcome = applyAtsKeywordsToResume(resumeData, atsResult, [keyword]);
      if (!outcome.resolvedKeywords.length) {
        toast.info('That keyword suggestion is no longer pending.');
        return;
      }

      setResumeData(outcome.nextResumeData);
      setAtsResult(outcome.nextResult);

      if (outcome.appliedKeywords.length > 0) {
        markAiHighlights({ skills: outcome.appliedKeywords }, { section: 'skills' });
      }

      toast.success(
        outcome.appliedKeywords.length > 0
          ? `"${outcome.resolvedKeywords[0]}" added to your skills.`
          : `"${outcome.resolvedKeywords[0]}" is already covered on your resume.`,
      );
    },
    onApplyAtsKeywordHints: () => {
      if (!atsResult || !atsResult.missingKeywords?.length) {
        toast.info('No missing keywords to apply.');
        return;
      }

      const outcome = applyAtsKeywordsToResume(
        resumeData,
        atsResult,
        atsResult.missingKeywords,
      );

      if (!outcome.resolvedKeywords.length) {
        toast.info('No missing keywords to apply.');
        return;
      }

      setResumeData(outcome.nextResumeData);
      setAtsResult(outcome.nextResult);

      if (outcome.appliedKeywords.length > 0) {
        markAiHighlights({ skills: outcome.appliedKeywords }, { section: 'skills' });
      }

      toast.success(
        outcome.appliedKeywords.length > 0
          ? `${outcome.appliedKeywords.length} keyword${outcome.appliedKeywords.length === 1 ? '' : 's'} added to your skills.`
          : 'Keyword suggestions cleared. Those terms were already covered.',
      );
    },
    onApplyAtsImprovements: () => {
      if (!atsResult || !atsResult.improvements?.length) {
        toast.info('No improvements to apply.');
        return;
      }

      const outcome = applyAllAtsImprovementsToResume(resumeData, atsResult);
      if (outcome.appliedCount === 0) {
        toast.info('These suggestions no longer match your current resume. Run the audit again.');
        return;
      }

      setResumeData(outcome.nextResumeData);
      setAtsResult(outcome.nextResult);
      markAiHighlights(
        {
          skills: outcome.appliedSkills,
          experience: createBuilderAiExperienceHighlights(outcome.appliedExperience),
        },
      );
      toast.success(
        `${outcome.appliedCount} strategic improvement${outcome.appliedCount === 1 ? '' : 's'} applied.`,
      );
    },
    onApplyAtsImprovement: (imp: AtsAuditImprovement) => {
      if (!atsResult) {
        toast.info('Run an ATS audit first.');
        return;
      }

      const outcome = applySingleAtsImprovementToResume(resumeData, atsResult, imp);
      if (!outcome.applied) {
        toast.info('This suggestion no longer matches your current resume. Run the audit again.');
        return;
      }

      setResumeData(outcome.nextResumeData);
      setAtsResult(outcome.nextResult);
      markAiHighlights(
        outcome.appliedSkill
          ? { skills: [outcome.appliedSkill] }
          : {
              experience: outcome.appliedExperience
                ? createBuilderAiExperienceHighlights([
                    outcome.appliedExperience,
                  ])
                : {},
            },
        outcome.appliedSkill
          ? { section: 'skills' }
          : outcome.appliedExperience
            ? { section: 'experience', experienceId: outcome.appliedExperience.experienceId }
            : null,
      );
      toast.success('Improvement applied!');
    },
    onGenerateCoverLetter: generateCoverLetter,
    onDownloadCoverLetterPdf: downloadCoverLetterPdf,
    onCopyCoverLetter: () => {
      if (!coverLetterDraft) {
        toast.error('Generate a draft first.');
        return;
      }
      navigator.clipboard.writeText(coverLetterDraft);
      toast.success('Copied to clipboard!');
    },
  };

  const handleProAction = (feature: import('../../types/context').ProFeature, label: string) => {
    if (feature === 'ai_tailor') {
      openTailor();
      return;
    }
    if (feature === 'cover_letter') {
      openCoverLetter();
      return;
    }
    if (feature === 'ats_audit') {
      openAtsAudit();
      return;
    }
    toast.info(`${label} flow will be wired next.`);
  };

  return { handleProAction, aiModalProps };
}
