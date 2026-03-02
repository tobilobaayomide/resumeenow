import { useCallback, useState } from 'react';
import type {
  EditorPanelProps,
  EditorSectionTabId,
} from '../../../types/builder';
import type {
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeLinkItem,
  ResumeProjectItem,
} from '../../../types/resume';
import { hasValueIgnoreCase } from './utils';

interface UseEditorPanelStateArgs {
  data: EditorPanelProps['data'];
  onLinksChange: EditorPanelProps['onLinksChange'];
  onExperienceChange: EditorPanelProps['onExperienceChange'];
  onEducationChange: EditorPanelProps['onEducationChange'];
  onVolunteeringChange: EditorPanelProps['onVolunteeringChange'];
  onProjectsChange: EditorPanelProps['onProjectsChange'];
  onCertificationsChange: EditorPanelProps['onCertificationsChange'];
  onSkillsChange: EditorPanelProps['onSkillsChange'];
  onLanguagesChange: EditorPanelProps['onLanguagesChange'];
  onAchievementsChange: EditorPanelProps['onAchievementsChange'];
  onSectionToggle?: (section: EditorSectionTabId) => void;
}

export const useEditorPanelState = ({
  data,
  onLinksChange,
  onExperienceChange,
  onEducationChange,
  onVolunteeringChange,
  onProjectsChange,
  onCertificationsChange,
  onSkillsChange,
  onLanguagesChange,
  onAchievementsChange,
  onSectionToggle,
}: UseEditorPanelStateArgs) => {
  const [openSection, setOpenSection] = useState<EditorSectionTabId>('personal');
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [activeExperienceId, setActiveExperienceId] = useState<string | null>(null);
  const [activeEducationId, setActiveEducationId] = useState<string | null>(null);
  const [activeVolunteeringId, setActiveVolunteeringId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const toggle = (section: EditorSectionTabId) => {
    setOpenSection(section);
    onSectionToggle?.(section);
  };

  const resolveActiveId = useCallback(
    (currentId: string | null, list: Array<{ id: string }>) =>
      currentId && list.some((item) => item.id === currentId) ? currentId : (list[0]?.id ?? null),
    [],
  );

  const resolvedActiveExperienceId = resolveActiveId(activeExperienceId, data.experience);
  const resolvedActiveEducationId = resolveActiveId(activeEducationId, data.education);
  const resolvedActiveVolunteeringId = resolveActiveId(activeVolunteeringId, data.volunteering);
  const resolvedActiveProjectId = resolveActiveId(activeProjectId, data.projects);

  const addExperience = () => {
    const nextId = `exp-${Date.now()}`;
    onExperienceChange([
      ...data.experience,
      {
        id: nextId,
        role: '',
        company: '',
        startDate: '',
        endDate: '',
        description: '',
      },
    ]);
    setActiveExperienceId(nextId);
  };

  const updateExperience = (id: string, field: keyof ResumeExperienceItem, value: string) =>
    onExperienceChange(
      data.experience.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );

  const removeExperience = (id: string) => {
    const next = data.experience.filter((item) => item.id !== id);
    onExperienceChange(next);
    if (resolvedActiveExperienceId === id) {
      setActiveExperienceId(next[0]?.id ?? null);
    }
  };

  const addEducation = () => {
    const nextId = `edu-${Date.now()}`;
    onEducationChange([
      ...data.education,
      {
        id: nextId,
        school: '',
        degree: '',
        startDate: '',
        endDate: '',
        description: '',
      },
    ]);
    setActiveEducationId(nextId);
  };

  const updateEducation = (id: string, field: keyof ResumeEducationItem, value: string) =>
    onEducationChange(
      data.education.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );

  const removeEducation = (id: string) => {
    const next = data.education.filter((item) => item.id !== id);
    onEducationChange(next);
    if (resolvedActiveEducationId === id) {
      setActiveEducationId(next[0]?.id ?? null);
    }
  };

  const addVolunteering = () => {
    const nextId = `vol-${Date.now()}`;
    onVolunteeringChange([
      ...data.volunteering,
      {
        id: nextId,
        role: '',
        company: '',
        startDate: '',
        endDate: '',
        description: '',
      },
    ]);
    setActiveVolunteeringId(nextId);
  };

  const updateVolunteering = (
    id: string,
    field: keyof ResumeExperienceItem,
    value: string,
  ) =>
    onVolunteeringChange(
      data.volunteering.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );

  const removeVolunteering = (id: string) => {
    const next = data.volunteering.filter((item) => item.id !== id);
    onVolunteeringChange(next);
    if (resolvedActiveVolunteeringId === id) {
      setActiveVolunteeringId(next[0]?.id ?? null);
    }
  };

  const addProject = () => {
    const nextId = `proj-${Date.now()}`;
    onProjectsChange([
      ...data.projects,
      {
        id: nextId,
        name: '',
        link: '',
        startDate: '',
        endDate: '',
        description: '',
      },
    ]);
    setActiveProjectId(nextId);
  };

  const updateProject = (id: string, field: keyof ResumeProjectItem, value: string) =>
    onProjectsChange(data.projects.map((item) => (item.id === id ? { ...item, [field]: value } : item)));

  const removeProject = (id: string) => {
    const next = data.projects.filter((item) => item.id !== id);
    onProjectsChange(next);
    if (resolvedActiveProjectId === id) {
      setActiveProjectId(next[0]?.id ?? null);
    }
  };

  const addLink = () => {
    const label = newLinkLabel.trim();
    const url = newLinkUrl.trim();
    if (!url) return;
    if (data.personalInfo.links.some((link) => link.url.toLowerCase() === url.toLowerCase())) return;

    onLinksChange([
      ...data.personalInfo.links,
      {
        id: `link-${Date.now()}`,
        label,
        url,
      },
    ]);

    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const updateLink = (id: string, field: keyof ResumeLinkItem, value: string) =>
    onLinksChange(data.personalInfo.links.map((link) => (link.id === id ? { ...link, [field]: value } : link)));

  const removeLink = (id: string) =>
    onLinksChange(data.personalInfo.links.filter((link) => link.id !== id));

  const addSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (!trimmedSkill || hasValueIgnoreCase(data.skills, trimmedSkill)) return;
    onSkillsChange([...data.skills, trimmedSkill]);
    setNewSkill('');
  };

  const removeSkill = (skill: string) =>
    onSkillsChange(data.skills.filter((existingSkill) => existingSkill !== skill));

  const addLanguage = () => {
    const trimmedLanguage = newLanguage.trim();
    if (!trimmedLanguage || hasValueIgnoreCase(data.languages, trimmedLanguage)) return;
    onLanguagesChange([...data.languages, trimmedLanguage]);
    setNewLanguage('');
  };

  const removeLanguage = (language: string) =>
    onLanguagesChange(data.languages.filter((existingLanguage) => existingLanguage !== language));

  const addCertification = () => {
    const trimmedCertification = newCertification.trim();
    if (!trimmedCertification || hasValueIgnoreCase(data.certifications, trimmedCertification)) return;
    onCertificationsChange([...data.certifications, trimmedCertification]);
    setNewCertification('');
  };

  const removeCertification = (certification: string) =>
    onCertificationsChange(
      data.certifications.filter((existingCertification) => existingCertification !== certification),
    );

  const addAchievement = () => {
    const trimmedAchievement = newAchievement.trim();
    if (!trimmedAchievement || hasValueIgnoreCase(data.achievements, trimmedAchievement)) return;
    onAchievementsChange([...data.achievements, trimmedAchievement]);
    setNewAchievement('');
  };

  const removeAchievement = (achievement: string) =>
    onAchievementsChange(
      data.achievements.filter((existingAchievement) => existingAchievement !== achievement),
    );

  const activeExperience =
    data.experience.find((item) => item.id === resolvedActiveExperienceId) ?? null;
  const activeEducation =
    data.education.find((item) => item.id === resolvedActiveEducationId) ?? null;
  const activeVolunteering =
    data.volunteering.find((item) => item.id === resolvedActiveVolunteeringId) ?? null;
  const activeProject = data.projects.find((item) => item.id === resolvedActiveProjectId) ?? null;

  const activeExperienceIndex = activeExperience
    ? data.experience.findIndex((item) => item.id === activeExperience.id)
    : -1;
  const activeEducationIndex = activeEducation
    ? data.education.findIndex((item) => item.id === activeEducation.id)
    : -1;
  const activeVolunteeringIndex = activeVolunteering
    ? data.volunteering.findIndex((item) => item.id === activeVolunteering.id)
    : -1;
  const activeProjectIndex = activeProject
    ? data.projects.findIndex((item) => item.id === activeProject.id)
    : -1;

  return {
    openSection,
    toggle,
    newSkill,
    setNewSkill,
    newLanguage,
    setNewLanguage,
    newCertification,
    setNewCertification,
    newAchievement,
    setNewAchievement,
    newLinkLabel,
    setNewLinkLabel,
    newLinkUrl,
    setNewLinkUrl,
    resolvedActiveExperienceId,
    resolvedActiveEducationId,
    resolvedActiveVolunteeringId,
    resolvedActiveProjectId,
    setActiveExperienceId,
    setActiveEducationId,
    setActiveVolunteeringId,
    setActiveProjectId,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addVolunteering,
    updateVolunteering,
    removeVolunteering,
    addProject,
    updateProject,
    removeProject,
    addLink,
    updateLink,
    removeLink,
    addSkill,
    removeSkill,
    addLanguage,
    removeLanguage,
    addCertification,
    removeCertification,
    addAchievement,
    removeAchievement,
    activeExperience,
    activeEducation,
    activeVolunteering,
    activeProject,
    activeExperienceIndex,
    activeEducationIndex,
    activeVolunteeringIndex,
    activeProjectIndex,
  };
};

export type EditorPanelState = ReturnType<typeof useEditorPanelState>;
