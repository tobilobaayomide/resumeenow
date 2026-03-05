import { toast } from 'sonner';
import type { CoverLetterTone } from '../../types/builder';
import {
  analyzeAtsCompleteness,
  generateCoverLetterText,
  generateTailoredSummary,
} from '../../lib/gemini';
import { useBuilderStore } from '../../store/builderStore';
import { getActiveSkillItems } from '../../types/resume';

export function useBuilderAiFlows() {
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

  const applyAiTailor = async () => {
    if (!tailorRole.trim() || !tailorJobDescription.trim()) {
      toast.error('Add target role and job description first.');
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading('Tailoring summary with Gemini AI...');
    try {
      const tailoredSummary = await generateTailoredSummary(
        resumeData,
        tailorRole,
        tailorCompany,
        tailorJobDescription,
      );

      const cleanSummary = tailoredSummary?.trim();
      if (!cleanSummary) {
        toast.info('AI did not return usable edits. Summary left unchanged.', { id: loadingToast });
        return;
      }

      setResumeData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          jobTitle: prev.personalInfo.jobTitle || tailorRole.trim(),
        },
        summary: cleanSummary,
      }));

      toast.success('AI tailoring applied.', { id: loadingToast });
      closeAiFlows();
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate summary.', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCoverLetter = async () => {
    if (!coverRole.trim() || !coverCompany.trim()) {
      toast.error('Add role and company to generate your draft.');
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading('Drafting cover letter...');

    try {
      const draft = await generateCoverLetterText(
        resumeData,
        coverRole,
        coverCompany,
        coverHiringManager,
        coverTone,
      );

      setCoverLetterDraft(draft.trim());
      toast.success('Cover letter generated.', { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error('Failed to draft cover letter.', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const runAtsAudit = async () => {
    if (!atsJobDescription.trim()) {
      toast.error('Paste the job description to run ATS audit.');
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading('Scanning ATS compatibility...');

    try {
      const result = await analyzeAtsCompleteness(resumeData, atsRole, atsJobDescription);
      setAtsResult(result);
      toast.success('ATS audit complete.', { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error('Failed processing audit.', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const activeAiFlow = isTailorOpen
    ? 'ai_tailor'
    : isAtsAuditOpen
      ? 'ats_audit'
      : isCoverLetterOpen
        ? 'cover_letter'
        : null;

  const aiModalProps: any = {
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

    onApplyTailor: applyAiTailor,
    onRunAtsAudit: runAtsAudit,
    onGenerateCoverLetter: generateCoverLetter,
    onApplyAtsKeywordHints: () => {
      if (!atsResult || !atsResult.missingKeywords?.length) {
        toast.info('No missing keywords to apply.');
        return;
      }

      setResumeData((prev) => {
        const existingSkillNames = getActiveSkillItems(prev.skills).map((skill) => skill.toLowerCase());
        const newSkills = atsResult.missingKeywords.filter(
          (kw) => !existingSkillNames.includes(kw.toLowerCase()),
        );
        if (newSkills.length === 0) return prev;

        const additions = newSkills.slice(0, 6);

        if (prev.skills.mode === 'grouped') {
          const firstGroup = prev.skills.groups[0] || {
            id: 'skills-group-1',
            label: 'Suggested',
            items: [],
          };
          const groups = prev.skills.groups.length ? prev.skills.groups : [firstGroup];
          return {
            ...prev,
            skills: {
              mode: 'grouped',
              list: [...getActiveSkillItems(prev.skills), ...additions],
              groups: groups.map((g, idx) => (idx === 0 ? { ...g, items: [...g.items, ...additions] } : g)),
            },
          };
        }

        return {
          ...prev,
          skills: {
            ...prev.skills,
            mode: 'list',
            list: [...prev.skills.list, ...additions],
          },
        };
      });

      toast.success('Missing keywords added to skills.');
    },
    onCopyCoverLetter: () => {
      if (!coverLetterDraft) {
        toast.error('Generate a draft first.');
        return;
      }
      navigator.clipboard.writeText(coverLetterDraft);
      toast.success('Copied to clipboard!');
    },
  };

  const handleProAction = (feature: any, label: string) => {
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
