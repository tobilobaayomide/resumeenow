import { clampSummary } from '../../lib/builder/page';
import type { BuilderPagePersonalInfoField, UseBuilderDraftMutationsResult } from '../../types/builder';
import type { ResumeData, ResumeEducationItem, ResumeExperienceItem, ResumeProjectItem } from '../../types/resume';
import { useBuilderStore } from '../../store/builderStore';

export const useBuilderDraftMutations = (
): UseBuilderDraftMutationsResult => {
  const setResumeData = useBuilderStore((store) => store.setResumeData);

  const onPersonalInfoChange = (
    field: BuilderPagePersonalInfoField,
    value: string,
  ) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  const onLinksChange = (links: ResumeData['personalInfo']['links']) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        links,
      },
    }));
  };

  const onSummaryChange = (summary: string) => {
    setResumeData((prev) => ({ ...prev, summary: clampSummary(summary) }));
  };

  const onExperienceChange = (experience: ResumeExperienceItem[]) => {
    setResumeData((prev) => ({ ...prev, experience }));
  };

  const onEducationChange = (education: ResumeEducationItem[]) => {
    setResumeData((prev) => ({ ...prev, education }));
  };

  const onVolunteeringChange = (volunteering: ResumeExperienceItem[]) => {
    setResumeData((prev) => ({ ...prev, volunteering }));
  };

  const onProjectsChange = (projects: ResumeProjectItem[]) => {
    setResumeData((prev) => ({ ...prev, projects }));
  };

  const onCertificationsChange = (certifications: string[]) => {
    setResumeData((prev) => ({ ...prev, certifications }));
  };

  const onSkillsChange = (skills: ResumeData['skills']) => {
    setResumeData((prev) => ({ ...prev, skills }));
  };

  const onLanguagesChange = (languages: string[]) => {
    setResumeData((prev) => ({ ...prev, languages }));
  };

  const onAchievementsChange = (achievements: string[]) => {
    setResumeData((prev) => ({ ...prev, achievements }));
  };

  return {
    onPersonalInfoChange,
    onLinksChange,
    onSummaryChange,
    onExperienceChange,
    onEducationChange,
    onVolunteeringChange,
    onProjectsChange,
    onCertificationsChange,
    onSkillsChange,
    onLanguagesChange,
    onAchievementsChange,
  };
};
