import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { isAiFlowFeature, type AiFlowFeature } from '../../domain/workflows';
import {
  clampSummary,
  extractKeywords,
  runLocalAtsAudit,
} from '../../lib/builder/page';
import type { BuilderAiWorkflowModalProps, CoverLetterTone } from '../../types/builder';
import type { ProFeature } from '../../types/context';
import type { ResumeData } from '../../types/resume';

interface UseBuilderAiFlowsArgs {
  searchParams: URLSearchParams;
  requestAccess: (feature: ProFeature) => boolean;
  resumeData: ResumeData;
  setResumeData: Dispatch<SetStateAction<ResumeData>>;
}

interface UseBuilderAiFlowsResult {
  aiModalProps: BuilderAiWorkflowModalProps;
  handleProAction: (feature: ProFeature, label: string) => void;
}

export const useBuilderAiFlows = ({
  searchParams,
  requestAccess,
  resumeData,
  setResumeData,
}: UseBuilderAiFlowsArgs): UseBuilderAiFlowsResult => {
  const [activeAiFlow, setActiveAiFlow] = useState<AiFlowFeature | null>(null);
  const [tailorRole, setTailorRole] = useState('');
  const [tailorCompany, setTailorCompany] = useState('');
  const [tailorJobDescription, setTailorJobDescription] = useState('');
  const [atsRole, setAtsRole] = useState('');
  const [atsJobDescription, setAtsJobDescription] = useState('');
  const [atsResult, setAtsResult] = useState<BuilderAiWorkflowModalProps['atsResult']>(null);
  const [coverRole, setCoverRole] = useState('');
  const [coverCompany, setCoverCompany] = useState('');
  const [coverHiringManager, setCoverHiringManager] = useState('');
  const [coverTone, setCoverTone] = useState<CoverLetterTone>('professional');
  const [coverLetterDraft, setCoverLetterDraft] = useState('');
  const hasHandledAiQueryRef = useRef(false);

  const prepareTailorFlow = useCallback(() => {
    setTailorRole(resumeData.personalInfo.jobTitle || '');
    setTailorCompany('');
    setTailorJobDescription('');
    setActiveAiFlow('ai_tailor');
  }, [resumeData.personalInfo.jobTitle]);

  const prepareCoverLetterFlow = useCallback(() => {
    setCoverRole(resumeData.personalInfo.jobTitle || '');
    setCoverCompany('');
    setCoverHiringManager('');
    setCoverTone('professional');
    setCoverLetterDraft('');
    setActiveAiFlow('cover_letter');
  }, [resumeData.personalInfo.jobTitle]);

  const prepareAtsAuditFlow = useCallback(() => {
    setAtsRole(resumeData.personalInfo.jobTitle || '');
    setAtsJobDescription('');
    setAtsResult(null);
    setActiveAiFlow('ats_audit');
  }, [resumeData.personalInfo.jobTitle]);

  useEffect(() => {
    if (hasHandledAiQueryRef.current) return;

    const aiParam = searchParams.get('ai');
    hasHandledAiQueryRef.current = true;

    if (!aiParam || !isAiFlowFeature(aiParam)) {
      return;
    }

    if (!requestAccess(aiParam)) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (aiParam === 'ai_tailor') {
        prepareTailorFlow();
      } else if (aiParam === 'cover_letter') {
        prepareCoverLetterFlow();
      } else {
        prepareAtsAuditFlow();
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [prepareAtsAuditFlow, prepareCoverLetterFlow, prepareTailorFlow, requestAccess, searchParams]);

  const closeAiFlow = () => {
    setActiveAiFlow(null);
  };

  const applyAiTailor = () => {
    if (!tailorRole.trim() || !tailorJobDescription.trim()) {
      toast.error('Add target role and job description first.');
      return;
    }

    const keywords = extractKeywords(tailorJobDescription);
    const baseSummary = resumeData.summary.trim();
    const companySuffix = tailorCompany.trim() ? ` at ${tailorCompany.trim()}` : '';
    const keywordText = keywords.length > 0 ? `Key focus: ${keywords.join(', ')}.` : '';

    const tailoredSummary = [
      `Targeting ${tailorRole.trim()}${companySuffix}.`,
      baseSummary || 'Experienced professional with strong ownership and delivery focus.',
      keywordText,
    ]
      .filter(Boolean)
      .join(' ');

    setResumeData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        jobTitle: prev.personalInfo.jobTitle || tailorRole.trim(),
      },
      summary: clampSummary(tailoredSummary),
    }));

    toast.success('AI Tailor applied to your summary. Review and edit as needed.');
    closeAiFlow();
  };

  const generateCoverLetter = () => {
    if (!coverRole.trim() || !coverCompany.trim()) {
      toast.error('Add role and company to generate your draft.');
      return;
    }

    const applicantName = resumeData.personalInfo.fullName || 'Applicant';
    const intro = coverHiringManager.trim()
      ? `Dear ${coverHiringManager.trim()},`
      : 'Dear Hiring Manager,';
    const summary =
      resumeData.summary.trim() || 'I bring proven problem-solving and execution skills.';
    const experience = resumeData.experience[0];
    const impactLine = experience
      ? `In my role as ${experience.role || 'a contributor'} at ${experience.company || 'my previous company'}, I delivered measurable outcomes and supported cross-functional goals.`
      : 'I have consistently delivered meaningful outcomes across my responsibilities.';
    const toneLine =
      coverTone === 'confident'
        ? 'I am confident my background aligns strongly with your needs.'
        : coverTone === 'friendly'
          ? 'I would love the opportunity to contribute to your team.'
          : 'I am excited to bring this experience to your team.';

    const draft = [
      intro,
      '',
      `I am writing to apply for the ${coverRole.trim()} role at ${coverCompany.trim()}. ${summary}`,
      '',
      impactLine,
      '',
      toneLine,
      '',
      'Thank you for your time and consideration.',
      '',
      'Sincerely,',
      applicantName,
    ].join('\n');

    setCoverLetterDraft(draft);
    toast.success('Cover letter draft generated.');
  };

  const copyCoverLetter = async () => {
    if (!coverLetterDraft) {
      toast.error('Generate a draft first.');
      return;
    }

    try {
      await navigator.clipboard.writeText(coverLetterDraft);
      toast.success('Cover letter copied to clipboard.');
    } catch {
      toast.error('Unable to copy. Please copy manually.');
    }
  };

  const runAtsAudit = () => {
    if (!atsJobDescription.trim()) {
      toast.error('Paste the job description to run ATS audit.');
      return;
    }

    const result = runLocalAtsAudit(resumeData, atsJobDescription, atsRole);
    setAtsResult(result);
    toast.success('ATS audit completed.');
  };

  const applyAtsKeywordsToSummary = () => {
    if (!atsResult || atsResult.missingKeywords.length === 0) {
      toast.info('No missing keywords to apply.');
      return;
    }

    const hints = atsResult.missingKeywords.slice(0, 3).join(', ');
    setResumeData((prev) => ({
      ...prev,
      summary: clampSummary(
        `${prev.summary.trim()} ${prev.summary.trim() ? '' : 'Experienced professional.'} Focus areas: ${hints}.`.trim(),
      ),
    }));
    toast.success('Keyword hints added to your summary. Review before saving.');
  };

  const handleProAction = (feature: ProFeature, label: string) => {
    if (!requestAccess(feature)) return;
    if (!isAiFlowFeature(feature)) {
      toast.info(`${label} flow will be wired next.`);
      return;
    }

    if (feature === 'ai_tailor') {
      prepareTailorFlow();
      return;
    }

    if (feature === 'cover_letter') {
      prepareCoverLetterFlow();
      return;
    }

    if (feature === 'ats_audit') {
      prepareAtsAuditFlow();
    }
  };

  return {
    handleProAction,
    aiModalProps: {
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
      onClose: closeAiFlow,
      onTailorRoleChange: setTailorRole,
      onTailorCompanyChange: setTailorCompany,
      onTailorJobDescriptionChange: setTailorJobDescription,
      onAtsRoleChange: setAtsRole,
      onAtsJobDescriptionChange: setAtsJobDescription,
      onCoverRoleChange: setCoverRole,
      onCoverCompanyChange: setCoverCompany,
      onCoverHiringManagerChange: setCoverHiringManager,
      onCoverToneChange: setCoverTone,
      onApplyTailor: applyAiTailor,
      onRunAtsAudit: runAtsAudit,
      onApplyAtsKeywordHints: applyAtsKeywordsToSummary,
      onGenerateCoverLetter: generateCoverLetter,
      onCopyCoverLetter: copyCoverLetter,
    },
  };
};
