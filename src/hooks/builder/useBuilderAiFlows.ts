import { toast } from 'sonner';
import type { CoverLetterTone } from '../../types/builder';
import {
  analyzeAtsCompleteness,
  generateCoverLetterText,
  generateTailoredSummary,
} from '../../lib/gemini';
import { useBuilderStore } from '../../store/builderStore';
import { getActiveSkillItems } from '../../types/resume';
import { usePlan } from '../../context/usePlan';

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
  const setTailorPreview = useBuilderStore((store) => store.setTailorPreview);
  const confirmTailoredPreview = useBuilderStore((store) => store.confirmTailoredPreview);
  const discardTailoredPreview = useBuilderStore((store) => store.discardTailoredPreview);
  const tailorPreview = useBuilderStore((store) => store.tailorPreview);

  const { requestAccess, consumeCredit, refreshCredits } = usePlan();

  const generateAiTailorPreview = async () => {
    if (!tailorRole.trim() || !tailorJobDescription.trim()) {
      toast.error('Add target role and job description first.');
      return;
    }

    if (!requestAccess('ai_tailor')) return;

    setIsGenerating(true);
    const loadingToast = toast.loading('Tailoring resume with Gemini AI...');

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

      await consumeCredit();
      // Do NOT close flow yet, wait for confirming preview
    } catch (error) {
      console.error(error);
      toast.error(String(error), { id: loadingToast });
    } finally {
      setIsGenerating(false);
      await refreshCredits();
    }
  };

  const onApplyTailorFix = (type: 'summary' | 'skills' | 'experience' | 'addition' | 'contact', id?: string, current?: string) => {
    const p = tailorPreview;
    if (!p) return;

    setResumeData((prev) => {
      let next = { ...prev };
      if (type === 'summary' && p.summary) {
        next.summary = p.summary.better;
      } else if (type === 'skills' && p.skills) {
        // AI re-aligns skills. We replace the current list but keep groups if they exist.
        // For simplicity, we update the main list.
        next.skills = { ...next.skills, list: p.skills.better.split(',').map(s => s.trim()) };
      } else if (type === 'experience' && id && current) {
        const imp = p.experienceImprovements.find(i => i.id === id && i.current === current);
        if (imp) {
          next.experience = next.experience.map(e => 
            e.id === id ? { ...e, description: e.description.replace(imp.current, imp.better) } : e
          );
        }
      } else if (type === 'addition' && id) {
        const add = p.experienceAdditions.find(a => a.id === id);
        if (add) {
          next.experience = next.experience.map(e => 
            e.id === id ? { ...e, description: (e.description ? e.description + '\n' : '') + add.better } : e
          );
        }
      }
      return next;
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

  const generateCoverLetter = async () => {
    if (!coverRole.trim() || !coverCompany.trim()) {
      toast.error('Add role and company to generate your draft.');
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
      await consumeCredit();
      toast.success('Cover letter generated.', { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error('Failed to draft cover letter.', { id: loadingToast });
    } finally {
      setIsGenerating(false);
      await refreshCredits();
    }
  };

  const runAtsAudit = async () => {
    if (!atsJobDescription.trim()) {
      toast.error('Paste the job description to run ATS audit.');
      return;
    }

    if (!requestAccess('ats_audit')) return;

    setIsGenerating(true);
    const loadingToast = toast.loading('Scanning ATS compatibility...');

    try {
      const result = await analyzeAtsCompleteness(resumeData, atsRole, atsJobDescription);
      setAtsResult(result);
      await consumeCredit();
      toast.success('ATS audit complete.', { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error('Failed processing audit.', { id: loadingToast });
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

    onClose: closeAiFlows,

    onTailorRoleChange: (value: string) =>
      setTailorFields(value, tailorCompany, tailorJobDescription),
    onTailorCompanyChange: (value: string) =>
      setTailorFields(tailorRole, value, tailorJobDescription),
    onTailorJobDescriptionChange: (value: string) =>
      setTailorFields(tailorRole, tailorCompany, value),

    onAtsRoleChange: (value: string) => setAtsFields(value, atsJobDescription),
    onAtsJobDescriptionChange: (value: string) => setAtsFields(atsRole, value),

    onCoverRoleChange: (value: string) =>
      setCoverFields(value, coverCompany, coverHiringManager, coverTone),
    onCoverCompanyChange: (value: string) =>
      setCoverFields(coverRole, value, coverHiringManager, coverTone),
    onCoverHiringManagerChange: (value: string) =>
      setCoverFields(coverRole, coverCompany, value, coverTone),
    onCoverToneChange: (value: CoverLetterTone) =>
      setCoverFields(coverRole, coverCompany, coverHiringManager, value),

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
              groups: groups.map((g, idx) =>
                idx === 0 ? { ...g, items: [...g.items, ...additions] } : g,
              ),
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
      closeAiFlows();
    },
    onApplyAtsImprovements: () => {
      if (!atsResult || !atsResult.improvements?.length) {
        toast.info('No improvements to apply.');
        return;
      }
      setResumeData((prev) => {
        let nextContext = { ...prev };
        atsResult.improvements?.forEach((imp) => {
          if (imp.type === 'bullet' && imp.id) {
            nextContext.experience = nextContext.experience.map((exp) =>
              exp.id === imp.id 
                ? { ...exp, description: exp.description.replace(imp.current, imp.better) } 
                : exp
            );
          } else if (imp.type === 'skill') {
             if (nextContext.skills.mode === 'list') {
                nextContext.skills.list = nextContext.skills.list.map((s) => 
                   s === imp.current ? imp.better : s
                );
             } else {
                nextContext.skills.groups = nextContext.skills.groups.map((g) => ({
                   ...g,
                   items: g.items.map((s) => s === imp.current ? imp.better : s)
                }));
             }
          }
        });
        return nextContext;
      });
      toast.success('Strategic improvements applied!');
      closeAiFlows();
    },
    onApplyAtsImprovement: (imp: any) => {
      setResumeData((prev) => {
        let nextContext = { ...prev };
        if (imp.type === 'bullet' && imp.id) {
          nextContext.experience = nextContext.experience.map((exp) =>
            exp.id === imp.id 
              ? { ...exp, description: exp.description.replace(imp.current, imp.better) } 
              : exp
          );
        } else if (imp.type === 'skill') {
          if (nextContext.skills.mode === 'list') {
            nextContext.skills.list = nextContext.skills.list.map((s) => 
              s === imp.current ? imp.better : s
            );
          } else {
            nextContext.skills.groups = nextContext.skills.groups.map((g) => ({
              ...g,
              items: g.items.map((s) => s === imp.current ? imp.better : s)
            }));
          }
        }
        return nextContext;
      });
      toast.success('Improvement applied!');
    },
    onGenerateCoverLetter: generateCoverLetter,
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