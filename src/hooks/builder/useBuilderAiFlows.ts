import { useState } from 'react';
import { toast } from 'sonner';
import type { CoverLetterTone } from '../../types/builder';
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
  generateCoverLetterText,
  generateTailoredSummary,
} from '../../lib/gemini';
import { sanitizeAiPlainText } from '../../lib/aiText';
import { downloadCoverLetterAsPdf } from '../../lib/builder/coverLetterExport';
import { useBuilderStore } from '../../store/builderStore';
import { getActiveSkillItems, normalizeSkillsSection } from '../../types/resume';
import { usePlan } from '../../context/usePlan';
import type { AtsAuditImprovement } from '../../types/builder';

const applyAtsSkillImprovement = (
  skills: import('../../types/resume').ResumeData['skills'],
  improvement: AtsAuditImprovement,
) => {
  const betterSkill = sanitizeAiPlainText(improvement.better);

  if (skills.mode === 'grouped' && skills.groups.length > 0) {
    return normalizeSkillsSection({
      mode: 'grouped',
      list: skills.list.map((item) => (item === improvement.current ? betterSkill : item)),
      groups: skills.groups.map((group) => ({
        ...group,
        items: group.items.map((item) => (item === improvement.current ? betterSkill : item)),
      })),
    });
  }

  return normalizeSkillsSection({
    ...skills,
    mode: 'list',
    list: skills.list.map((item) => (item === improvement.current ? betterSkill : item)),
  });
};

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

export function useBuilderAiFlows() {
  const [isExportingCoverLetter, setIsExportingCoverLetter] = useState(false);
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
  const setTailorPreview = useBuilderStore((store) => store.setTailorPreview);
  const confirmTailoredPreview = useBuilderStore((store) => store.confirmTailoredPreview);
  const discardTailoredPreview = useBuilderStore((store) => store.discardTailoredPreview);
  const tailorPreview = useBuilderStore((store) => store.tailorPreview);

  const { requestAccess, refreshCredits } = usePlan();

  const generateAiTailorPreview = async () => {
    if (!validateRequiredFields([
      { label: 'target role', value: tailorRole },
      { label: 'job description', value: tailorJobDescription },
    ])) {
      return;
    }

    if (!requestAccess('ai_tailor')) return;

    setIsGenerating(true);
    const loadingToast = toast.loading('Tailoring resume...');

    try {
      const tailored = await generateTailoredSummary(
        resumeData,
        tailorRole,
        tailorCompany,
        tailorJobDescription,
      );

      if (!tailored.jobTitleAfter) {
        toast.info('AI did not return usable edits. Tailoring skipped.', { id: loadingToast });
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

      // Show specific change in toast
      toast.success(
        'Tailor Strategy generated! Review the board.',
        { id: loadingToast },
      );

      // Do NOT close flow yet, wait for confirming preview
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Failed to tailor resume.'), { id: loadingToast });
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

    let didApply = type === 'summary' || type === 'skills';

    setResumeData((prev) => {
      const next = { ...prev };
      if (type === 'summary' && p.summary) {
        next.summary = sanitizeAiPlainText(p.summary.better);
      } else if (type === 'skills' && p.skills) {
        next.skills =
          next.skills.mode === 'grouped' && p.skills.groups?.length
            ? mergeGroupedSkillSuggestionsIntoSection(next.skills, p.skills.groups)
            : mergeSkillNamesIntoSection(
                next.skills,
                parseAiSkills(p.skills.better),
              );
      } else if (type === 'experience' && id && experienceImprovement) {
        next.experience = next.experience.map((item) =>
          item.id !== id
            ? item
            : (() => {
                const nextDescription = replaceDescriptionBullet(
                  item.description,
                  experienceImprovement.current,
                  sanitizeAiPlainText(experienceImprovement.better),
                );

                if (!nextDescription) return item;
                didApply = true;
                return {
                  ...item,
                  description: nextDescription,
                };
              })(),
        );
      } else if (type === 'addition' && id && experienceAddition) {
        next.experience = next.experience.map((item) =>
          item.id !== id
            ? item
            : (() => {
                didApply = true;
                return {
                  ...item,
                  description: appendDescriptionBullet(
                    item.description,
                    sanitizeAiPlainText(experienceAddition.better),
                  ),
                };
              })(),
        );
      }
      return next;
    });

    if (!didApply) {
      toast.info('This AI suggestion no longer matches your current bullet. Run Tailor again.');
      return;
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
    const loadingToast = toast.loading('Drafting cover letter...');

    try {
      const draft = await generateCoverLetterText(
        resumeData,
        coverRole,
        coverCompany,
        coverHiringManager,
        coverTone,
        // Pass tailor JD if available so cover letter uses same keywords
        tailorJobDescription || undefined,
      );

      setCoverLetterDraft(draft.trim());
      toast.success('Cover letter generated.', { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Failed to draft cover letter.'), { id: loadingToast });
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
    const loadingToast = toast.loading('Scanning ATS compatibility...');

    try {
      const result = await analyzeAtsCompleteness(resumeData, atsRole, atsJobDescription);
      setAtsResult(result);
      toast.success('ATS audit complete.', { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Failed processing audit.'), { id: loadingToast });
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

    onClose: closeAiFlows,

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
    onApplyAtsKeywordHints: () => {
      if (!atsResult || !atsResult.missingKeywords?.length) {
        toast.info('No missing keywords to apply.');
        return;
      }
      setResumeData((prev) => {
        const existingSkillNames = getActiveSkillItems(prev.skills).map((skill) =>
          skill.toLowerCase(),
        );
        const newSkills = atsResult.missingKeywords.filter(
          (kw) => !existingSkillNames.includes(kw.toLowerCase()),
        );
        if (newSkills.length === 0) {
          toast.info('All suggested keywords are already in your skills!');
          return prev;
        }
        const additions = newSkills.slice(0, 6);
        return {
          ...prev,
          skills: mergeSkillNamesIntoSection(prev.skills, additions),
        };
      });
      toast.success('Missing keywords added to skills.');
      closeAiFlows();
    },
    onApplyAtsImprovements: () => {
      if (!atsResult || !atsResult.improvements?.length) {
        toast.info('No improvements to apply.');
        return;
      }
      setResumeData((prev) => {
        const nextContext = { ...prev };
        atsResult.improvements?.forEach((imp) => {
          if (imp.type === 'bullet' && imp.id) {
            nextContext.experience = nextContext.experience.map((exp) =>
              exp.id !== imp.id
                ? exp
                : {
                    ...exp,
                    description:
                      replaceDescriptionBullet(
                        exp.description,
                        imp.current,
                        sanitizeAiPlainText(imp.better),
                      ) || exp.description,
                  },
            );
          } else if (imp.type === 'skill') {
            nextContext.skills = applyAtsSkillImprovement(nextContext.skills, imp);
          }
        });
        return nextContext;
      });
      toast.success('Strategic improvements applied!');
      closeAiFlows();
    },
    onApplyAtsImprovement: (imp: AtsAuditImprovement) => {
      setResumeData((prev) => {
        const nextContext = { ...prev };
        if (imp.type === 'bullet' && imp.id) {
          nextContext.experience = nextContext.experience.map((exp) =>
            exp.id !== imp.id
              ? exp
              : {
                  ...exp,
                  description:
                    replaceDescriptionBullet(
                      exp.description,
                      imp.current,
                      sanitizeAiPlainText(imp.better),
                    ) || exp.description,
                },
          );
        } else if (imp.type === 'skill') {
          nextContext.skills = applyAtsSkillImprovement(nextContext.skills, imp);
        }
        return nextContext;
      });
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
    console.log(feature, label);
  };

  return { handleProAction, aiModalProps };
}
