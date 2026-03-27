import { useCallback, useEffect, useState } from 'react';
import type { EditorSectionTabId } from '../../../types/builder';
import type {
  ResumeSkillGroup,
  ResumeSkillsMode,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeLinkItem,
  ResumeProjectItem,
} from '../../../types/resume';
import { getActiveSkillItems } from '../../../types/resume';
import { getBuilderAiExperienceHighlights } from '../../../lib/builder/aiHighlights';
import { hasValueIgnoreCase } from './utils';
import { useBuilderStore } from '../../../store/builderStore';
import { useBuilderDraftMutations } from '../../../hooks/builder/useBuilderDraftMutations';

export const useEditorPanelState = (onSectionToggle?: (section: EditorSectionTabId) => void) => {
  const data = useBuilderStore((store) => store.resumeData);
  const recentAiHighlights = useBuilderStore((store) => store.recentAiHighlights);
  const aiHighlightFocus = useBuilderStore((store) => store.aiHighlightFocus);
  const aiHighlightFocusNonce = useBuilderStore((store) => store.aiHighlightFocusNonce);
  const clearAiHighlight = useBuilderStore((store) => store.clearAiHighlight);
  const {
    onPersonalInfoChange,
    onLinksChange,
    onSummaryChange: onDraftSummaryChange,
    onExperienceChange: onDraftExperienceChange,
    onEducationChange,
    onVolunteeringChange,
    onProjectsChange,
    onCertificationsChange,
    onSkillsChange: onDraftSkillsChange,
    onLanguagesChange,
    onAchievementsChange,
  }: ReturnType<typeof useBuilderDraftMutations> = useBuilderDraftMutations();
  const [openSection, setOpenSection] = useState<EditorSectionTabId>('personal');
  const [newSkill, setNewSkill] = useState('');
  const [newSkillGroupLabel, setNewSkillGroupLabel] = useState('');
  const [activeSkillGroupId, setActiveSkillGroupId] = useState<string | null>(null);
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
  const resolvedActiveSkillGroupId = resolveActiveId(activeSkillGroupId, data.skills.groups);

  useEffect(() => {
    if (!aiHighlightFocus) return;

    const frameId = window.requestAnimationFrame(() => {
      setOpenSection(aiHighlightFocus.section);

      if (aiHighlightFocus.section === 'experience' && aiHighlightFocus.experienceId) {
        setActiveExperienceId(aiHighlightFocus.experienceId);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [aiHighlightFocus, aiHighlightFocusNonce]);

  const onSummaryChange = (summary: string) => {
    if (recentAiHighlights.summary) {
      clearAiHighlight({ section: 'summary' });
    }
    onDraftSummaryChange(summary);
  };

  const addExperience = () => {
    const nextId = `exp-${Date.now()}`;
    onDraftExperienceChange([
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

  const updateExperience = (id: string, field: keyof ResumeExperienceItem, value: string) => {
    if (field === 'description' && getBuilderAiExperienceHighlights(recentAiHighlights, id).length > 0) {
      clearAiHighlight({ section: 'experience', experienceId: id });
    }

    onDraftExperienceChange(
      data.experience.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeExperience = (id: string) => {
    const next = data.experience.filter((item) => item.id !== id);
    if (getBuilderAiExperienceHighlights(recentAiHighlights, id).length > 0) {
      clearAiHighlight({ section: 'experience', experienceId: id });
    }
    onDraftExperienceChange(next);
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
    if (!trimmedSkill || hasValueIgnoreCase(getActiveSkillItems(data.skills), trimmedSkill)) return;

    if (data.skills.mode === 'grouped') {
      let nextGroups = data.skills.groups;
      let targetGroupId = resolvedActiveSkillGroupId;

      if (!targetGroupId) {
        const fallbackGroup: ResumeSkillGroup = {
          id: `skills-group-${Date.now()}`,
          label: 'Core Skills',
          items: [],
        };
        nextGroups = [...data.skills.groups, fallbackGroup];
        targetGroupId = fallbackGroup.id;
        setActiveSkillGroupId(targetGroupId);
      }

      const groupedSkills = nextGroups.map((group) =>
        group.id === targetGroupId
          ? { ...group, items: [...group.items, trimmedSkill] }
          : group,
      );

      onDraftSkillsChange({
        mode: 'grouped',
        list: getActiveSkillItems({
          ...data.skills,
          mode: 'grouped',
          groups: groupedSkills,
        }),
        groups: groupedSkills,
      });
      setNewSkill('');
      return;
    }

    onDraftSkillsChange({
      ...data.skills,
      mode: 'list',
      list: [...data.skills.list, trimmedSkill],
    });
    setNewSkill('');
  };

  const removeSkill = (skill: string, groupId?: string) => {
    if (skill.trim()) {
      clearAiHighlight({ section: 'skills', skill });
    }

    if (data.skills.mode === 'grouped') {
      const nextGroups = data.skills.groups.map((group) => {
        if (groupId && group.id !== groupId) return group;
        return {
          ...group,
          items: group.items.filter((existingSkill) => existingSkill !== skill),
        };
      });

      onDraftSkillsChange({
        mode: 'grouped',
        list: getActiveSkillItems({
          ...data.skills,
          mode: 'grouped',
          groups: nextGroups,
        }),
        groups: nextGroups,
      });
      return;
    }

    onDraftSkillsChange({
      ...data.skills,
      mode: 'list',
      list: data.skills.list.filter((existingSkill) => existingSkill !== skill),
    });
  };

  const removeSkillAtIndex = (index: number, groupId?: string) => {
    const removedSkill =
      data.skills.mode === 'grouped'
        ? data.skills.groups.find((group) => !groupId || group.id === groupId)?.items[index] ?? ''
        : data.skills.list[index] ?? '';

    if (removedSkill.trim()) {
      clearAiHighlight({ section: 'skills', skill: removedSkill });
    }

    if (data.skills.mode === 'grouped') {
      const nextGroups = data.skills.groups.map((group) => {
        if (groupId && group.id !== groupId) return group;

        return {
          ...group,
          items: group.items.filter((_, itemIndex) => itemIndex !== index),
        };
      });

      onDraftSkillsChange({
        mode: 'grouped',
        list: getActiveSkillItems({
          ...data.skills,
          mode: 'grouped',
          groups: nextGroups,
        }),
        groups: nextGroups,
      });
      return;
    }

    onDraftSkillsChange({
      ...data.skills,
      mode: 'list',
      list: data.skills.list.filter((_, skillIndex) => skillIndex !== index),
    });
  };

  const updateSkill = (index: number, value: string, groupId?: string) => {
    const currentSkill =
      data.skills.mode === 'grouped'
        ? data.skills.groups.find((group) => !groupId || group.id === groupId)?.items[index] ?? ''
        : data.skills.list[index] ?? '';

    if (currentSkill.trim()) {
      clearAiHighlight({ section: 'skills', skill: currentSkill });
    }

    if (data.skills.mode === 'grouped') {
      const nextGroups = data.skills.groups.map((group) => {
        if (groupId && group.id !== groupId) return group;

        return {
          ...group,
          items: group.items.map((item, itemIndex) => (itemIndex === index ? value : item)),
        };
      });

      onDraftSkillsChange({
        mode: 'grouped',
        list: getActiveSkillItems({
          ...data.skills,
          mode: 'grouped',
          groups: nextGroups,
        }),
        groups: nextGroups,
      });
      return;
    }

    onDraftSkillsChange({
      ...data.skills,
      mode: 'list',
      list: data.skills.list.map((skill, skillIndex) => (skillIndex === index ? value : skill)),
    });
  };

  const switchSkillMode = (mode: ResumeSkillsMode) => {
    if (mode === data.skills.mode) return;

    if (mode === 'grouped') {
      const fallbackGroups =
        data.skills.groups.length > 0
          ? data.skills.groups
          : data.skills.list.length > 0
            ? [
                {
                  id: `skills-group-${Date.now()}`,
                  label: 'Core Skills',
                  items: data.skills.list,
                },
              ]
            : [];

      onDraftSkillsChange({
        mode: 'grouped',
        list: getActiveSkillItems({
          mode: 'grouped',
          list: data.skills.list,
          groups: fallbackGroups,
        }),
        groups: fallbackGroups,
      });
      setActiveSkillGroupId(fallbackGroups[0]?.id ?? null);
      return;
    }

    onDraftSkillsChange({
      mode: 'list',
      list: getActiveSkillItems(data.skills),
      groups: data.skills.groups,
    });
  };

  const addSkillGroup = () => {
    const baseLabel = newSkillGroupLabel.trim() || 'New Group';
    const existingLabels = new Set(
      data.skills.groups.map((group) => group.label.trim().toLowerCase()).filter(Boolean),
    );
    let label = baseLabel;
    let suffix = 2;
    while (existingLabels.has(label.toLowerCase())) {
      label = `${baseLabel} ${suffix}`;
      suffix += 1;
    }

    const nextGroup: ResumeSkillGroup = {
      id: `skills-group-${Date.now()}`,
      label,
      items: [],
    };
    const nextGroups = [...data.skills.groups, nextGroup];

    onDraftSkillsChange({
      mode: 'grouped',
      list: getActiveSkillItems({
        ...data.skills,
        mode: 'grouped',
        groups: nextGroups,
      }),
      groups: nextGroups,
    });

    setNewSkillGroupLabel('');
    setActiveSkillGroupId(nextGroup.id);
  };

  const removeSkillGroup = (groupId: string) => {
    const nextGroups = data.skills.groups.filter((group) => group.id !== groupId);

    onDraftSkillsChange({
      mode: 'grouped',
      list: getActiveSkillItems({
        ...data.skills,
        mode: 'grouped',
        groups: nextGroups,
      }),
      groups: nextGroups,
    });

    if (resolvedActiveSkillGroupId === groupId) {
      setActiveSkillGroupId(nextGroups[0]?.id ?? null);
    }
  };

  const updateSkillGroupLabel = (groupId: string, label: string) => {
    const nextGroups = data.skills.groups.map((group) =>
      group.id === groupId ? { ...group, label } : group,
    );

    onDraftSkillsChange({
      ...data.skills,
      mode: 'grouped',
      list: getActiveSkillItems({
        ...data.skills,
        mode: 'grouped',
        groups: nextGroups,
      }),
      groups: nextGroups,
    });
  };

  const addLanguage = () => {
    const trimmedLanguage = newLanguage.trim();
    if (!trimmedLanguage || hasValueIgnoreCase(data.languages, trimmedLanguage)) return;
    onLanguagesChange([...data.languages, trimmedLanguage]);
    setNewLanguage('');
  };

  const removeLanguage = (language: string) =>
    onLanguagesChange(data.languages.filter((existingLanguage) => existingLanguage !== language));

  const updateLanguage = (index: number, value: string) =>
    onLanguagesChange(
      data.languages.map((language, languageIndex) => (languageIndex === index ? value : language)),
    );

  const removeLanguageAtIndex = (index: number) =>
    onLanguagesChange(data.languages.filter((_, languageIndex) => languageIndex !== index));

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

  const updateCertification = (index: number, value: string) =>
    onCertificationsChange(
      data.certifications.map((certification, certificationIndex) =>
        certificationIndex === index ? value : certification,
      ),
    );

  const removeCertificationAtIndex = (index: number) =>
    onCertificationsChange(
      data.certifications.filter((_, certificationIndex) => certificationIndex !== index),
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

  const updateAchievement = (index: number, value: string) =>
    onAchievementsChange(
      data.achievements.map((achievement, achievementIndex) =>
        achievementIndex === index ? value : achievement,
      ),
    );

  const removeAchievementAtIndex = (index: number) =>
    onAchievementsChange(
      data.achievements.filter((_, achievementIndex) => achievementIndex !== index),
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
    data,
    recentAiHighlights,
    openSection,
    toggle,
    onPersonalInfoChange,
    onSummaryChange,
    newSkill,
    setNewSkill,
    newSkillGroupLabel,
    setNewSkillGroupLabel,
    resolvedActiveSkillGroupId,
    setActiveSkillGroupId,
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
    removeSkillAtIndex,
    updateSkill,
    switchSkillMode,
    addSkillGroup,
    removeSkillGroup,
    updateSkillGroupLabel,
    addLanguage,
    removeLanguage,
    removeLanguageAtIndex,
    updateLanguage,
    addCertification,
    removeCertification,
    removeCertificationAtIndex,
    updateCertification,
    addAchievement,
    removeAchievement,
    removeAchievementAtIndex,
    updateAchievement,
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
