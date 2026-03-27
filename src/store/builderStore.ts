import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  EMPTY_BUILDER_AI_HIGHLIGHTS,
  getFirstBuilderAiHighlightFocus,
  hasBuilderAiHighlights,
  mergeBuilderAiHighlights,
  normalizeBuilderAiHighlights,
  removeBuilderAiHighlight,
} from '../lib/builder/aiHighlights';
import {
  mergeGroupedSkillSuggestionsIntoSection,
  mergeSkillNamesIntoSection,
  parseAiSkills,
} from '../lib/aiResumeApply';
import { sanitizeAiPlainText } from '../lib/aiText';
import {
  appendDescriptionBullet,
  replaceDescriptionBullet,
} from '../lib/descriptionBullets';
import type {
  AtsAuditResult,
  BuilderAiHighlightFocusTarget,
  BuilderAiHighlights,
  CoverLetterTone,
} from '../types/builder';
import {
  DEFAULT_TEMPLATE_ID,
  INITIAL_RESUME_DATA,
  normalizeTemplateId,
  type ResumeData,
  type TemplateId,
} from '../types/resume';
import { parseBuilderPersistedState } from '../schemas/builder/persistedState';
import { reportRuntimeValidationIssue } from '../lib/observability/runtimeValidation';
import {
  BUILDER_PERSIST_VERSION,
  BUILDER_STORAGE_NAME,
  migrateBuilderPersistedState,
} from './builderPersistence';
import { createDebouncedStateStorage } from '../lib/storage/debouncedStateStorage';

type BuilderState = {
  resumeData: ResumeData;
  templateId: TemplateId;
  title: string;
  // AI modal state
  isGenerating: boolean;
  isTailorOpen: boolean;
  tailorRole: string;
  tailorCompany: string;
  tailorJobDescription: string;
  isCoverLetterOpen: boolean;
  coverRole: string;
  coverCompany: string;
  coverHiringManager: string;
  coverTone: CoverLetterTone;
  coverLetterDraft: string;
  isAtsAuditOpen: boolean;
  atsRole: string;
  atsJobDescription: string;
  atsResult: AtsAuditResult | null;
  recentAiHighlights: BuilderAiHighlights;
  aiHighlightFocus: BuilderAiHighlightFocusTarget | null;
  aiHighlightFocusNonce: number;
  tailorPreview: {
    jobTitleAfter: string;
    summary?: { current: string; better: string };
    skills?: {
      current: string;
      better: string;
      groups?: { label: string; items: string[] }[];
    };
    experienceImprovements: { id: string; current: string; better: string }[];
    experienceAdditions: { id: string; better: string }[];
    contactFix?: { current: string; better: string };
    keywordAlignment: { matched: string[]; injected: string[]; stillMissing: string[] };
  } | null;
};

type BuilderActions = {
  setResumeData: (updater: ResumeData | ((prev: ResumeData) => ResumeData)) => void;
  setTemplateId: (templateId: TemplateId | ((prev: TemplateId) => TemplateId)) => void;
  setTitle: (title: string | ((prev: string) => string)) => void;
  hydrate: (data: ResumeData, templateId?: TemplateId, title?: string) => void;
  reset: () => void;
  // AI actions
  setIsGenerating: (value: boolean) => void;
  openTailor: () => void;
  openCoverLetter: () => void;
  openAtsAudit: () => void;
  closeAiFlows: () => void;
  setTailorFields: (role: string, company: string, jobDescription: string) => void;
  setCoverFields: (role: string, company: string, hiringManager: string, tone: CoverLetterTone) => void;
  setCoverLetterDraft: (draft: string) => void;
  setAtsFields: (role: string, jd: string) => void;
  setAtsResult: (result: AtsAuditResult | null) => void;
  markAiHighlights: (
    highlights: Partial<BuilderAiHighlights>,
    focus?: BuilderAiHighlightFocusTarget | null,
  ) => void;
  clearAiHighlights: () => void;
  clearAiHighlight: (target: BuilderAiHighlightFocusTarget) => void;
  requestAiHighlightFocus: (target?: BuilderAiHighlightFocusTarget | null) => void;
  setTailorPreview: (preview: BuilderState['tailorPreview']) => void;
  confirmTailoredPreview: () => void;
  discardTailoredPreview: () => void;
};

type BuilderStore = BuilderState & BuilderActions;

const mergePersistedBuilderState = (
  persistedState: unknown,
  currentState: BuilderStore,
): BuilderStore => {
  const parsedPersistedState = parseBuilderPersistedState(persistedState);

  if (!parsedPersistedState) {
    if (persistedState !== undefined && persistedState !== null) {
      reportRuntimeValidationIssue({
        key: 'builder.persist.invalid-merge',
        source: 'builder.persist',
        action: 'Ignored invalid persisted builder state during hydration merge.',
        details: {
          storageName: BUILDER_STORAGE_NAME,
        },
      });
    }

    return currentState;
  }

  return {
    ...currentState,
    ...parsedPersistedState,
  };
};

const debouncedLocalStorage = createDebouncedStateStorage({
  delayMs: 1000,
  storage: {
    getItem: (name) => localStorage.getItem(name),
    setItem: (name, value) => localStorage.setItem(name, value),
    removeItem: (name) => localStorage.removeItem(name),
  },
});

export const flushBuilderStorageWrites = () => {
  debouncedLocalStorage.flushAll();
};

export const useBuilderStore = create<BuilderStore>()(
  persist(
    (set) => ({
      resumeData: INITIAL_RESUME_DATA,
      templateId: DEFAULT_TEMPLATE_ID,
      title: 'Untitled Resume',
      isGenerating: false,
      isTailorOpen: false,
      tailorRole: '',
      tailorCompany: '',
      tailorJobDescription: '',
      isCoverLetterOpen: false,
      coverRole: '',
      coverCompany: '',
      coverHiringManager: '',
      coverTone: 'professional',
      coverLetterDraft: '',
      isAtsAuditOpen: false,
      atsRole: '',
      atsJobDescription: '',
      atsResult: null,
      recentAiHighlights: EMPTY_BUILDER_AI_HIGHLIGHTS,
      aiHighlightFocus: null,
      aiHighlightFocusNonce: 0,
      tailorPreview: null,
      setResumeData: (updater) =>
        set((state) => ({
          resumeData:
            typeof updater === 'function' ? (updater as (prev: ResumeData) => ResumeData)(state.resumeData) : updater,
        })),
      setTemplateId: (templateId) =>
        set((state) => ({
          templateId: normalizeTemplateId(
            typeof templateId === 'function' ? (templateId as (prev: TemplateId) => TemplateId)(state.templateId) : templateId,
          ),
        })),
      setTitle: (title) =>
        set((state) => ({
          title: typeof title === 'function' ? (title as (prev: string) => string)(state.title) : title,
        })),
      hydrate: (data, templateId, title) =>
        set((state) => ({
          resumeData: data,
          templateId: templateId ? normalizeTemplateId(templateId) : state.templateId,
          title: title ?? state.title,
          recentAiHighlights: EMPTY_BUILDER_AI_HIGHLIGHTS,
          aiHighlightFocus: null,
          aiHighlightFocusNonce: 0,
        })),
      reset: () =>
        set(() => ({
          resumeData: INITIAL_RESUME_DATA,
          templateId: DEFAULT_TEMPLATE_ID,
          title: 'Untitled Resume',
          isGenerating: false,
          isTailorOpen: false,
          tailorRole: '',
          tailorCompany: '',
          tailorJobDescription: '',
          isCoverLetterOpen: false,
          coverRole: '',
          coverCompany: '',
          coverHiringManager: '',
          coverTone: 'professional',
          coverLetterDraft: '',
          isAtsAuditOpen: false,
          atsRole: '',
          atsJobDescription: '',
          atsResult: null,
          recentAiHighlights: EMPTY_BUILDER_AI_HIGHLIGHTS,
          aiHighlightFocus: null,
          aiHighlightFocusNonce: 0,
          tailorPreview: null,
        })),
      setIsGenerating: (value) => set({ isGenerating: value }),
      openTailor: () => set({ isTailorOpen: true, isCoverLetterOpen: false, isAtsAuditOpen: false }),
      openCoverLetter: () => set({ isTailorOpen: false, isCoverLetterOpen: true, isAtsAuditOpen: false }),
      openAtsAudit: () => set({ isTailorOpen: false, isCoverLetterOpen: false, isAtsAuditOpen: true }),
      closeAiFlows: () =>
        set({
          isTailorOpen: false,
          isCoverLetterOpen: false,
          isAtsAuditOpen: false,
          atsResult: null,
          coverLetterDraft: '',
          tailorRole: '',
          tailorCompany: '',
          tailorJobDescription: '',
          coverRole: '',
          coverCompany: '',
          coverHiringManager: '',
          atsRole: '',
          atsJobDescription: '',
          tailorPreview: null,
        }),
      setTailorFields: (role, company, jobDescription) =>
        set({ tailorRole: role, tailorCompany: company, tailorJobDescription: jobDescription }),
      setCoverFields: (role, company, hiringManager, tone) =>
        set({ coverRole: role, coverCompany: company, coverHiringManager: hiringManager, coverTone: tone }),
      setCoverLetterDraft: (draft) => set({ coverLetterDraft: draft }),
      setAtsFields: (role, jd) => set({ atsRole: role, atsJobDescription: jd }),
      setAtsResult: (result) => set({ atsResult: result }),
      markAiHighlights: (highlights, focus) =>
        set((state) => {
          const freshHighlights = normalizeBuilderAiHighlights(highlights);
          const recentAiHighlights = mergeBuilderAiHighlights(
            state.recentAiHighlights,
            freshHighlights,
          );
          const nextFocus =
            focus ??
            getFirstBuilderAiHighlightFocus(
              hasBuilderAiHighlights(freshHighlights)
                ? freshHighlights
                : recentAiHighlights,
            );

          return {
            recentAiHighlights,
            aiHighlightFocus: nextFocus,
            aiHighlightFocusNonce: nextFocus
              ? state.aiHighlightFocusNonce + 1
              : state.aiHighlightFocusNonce,
          };
        }),
      clearAiHighlights: () =>
        set(() => ({
          recentAiHighlights: EMPTY_BUILDER_AI_HIGHLIGHTS,
          aiHighlightFocus: null,
        })),
      clearAiHighlight: (target) =>
        set((state) => {
          const recentAiHighlights = removeBuilderAiHighlight(
            state.recentAiHighlights,
            target,
          );

          return {
            recentAiHighlights,
            aiHighlightFocus: hasBuilderAiHighlights(recentAiHighlights)
              ? state.aiHighlightFocus
              : null,
          };
        }),
      requestAiHighlightFocus: (target) =>
        set((state) => {
          const aiHighlightFocus =
            target ?? getFirstBuilderAiHighlightFocus(state.recentAiHighlights);

          if (!aiHighlightFocus) {
            return state;
          }

          return {
            aiHighlightFocus,
            aiHighlightFocusNonce: state.aiHighlightFocusNonce + 1,
          };
        }),
      setTailorPreview: (preview) => set({ tailorPreview: preview }),
      confirmTailoredPreview: () => set((state) => {
        if (!state.tailorPreview) return state;
        
        const nextData = { ...state.resumeData };
        const p = state.tailorPreview;

        // Apply Job Title
        nextData.personalInfo = {
          ...nextData.personalInfo,
          jobTitle: sanitizeAiPlainText(p.jobTitleAfter),
        };

        // Apply Summary
        if (p.summary) nextData.summary = sanitizeAiPlainText(p.summary.better);

        // Apply Skills
        if (p.skills) {
           nextData.skills =
             nextData.skills.mode === 'grouped' && p.skills.groups?.length
               ? mergeGroupedSkillSuggestionsIntoSection(nextData.skills, p.skills.groups)
               : mergeSkillNamesIntoSection(
                   nextData.skills,
                   parseAiSkills(p.skills.better),
                 );
        }

        // Apply Experience Improvements
        p.experienceImprovements.forEach((imp) => {
           nextData.experience = nextData.experience.map(e => 
             e.id === imp.id
               ? {
                   ...e,
                   description:
                     replaceDescriptionBullet(
                       e.description,
                       imp.current,
                       sanitizeAiPlainText(imp.better),
                     ) || e.description,
                 }
               : e
           );
        });

        // Apply Additions
        p.experienceAdditions.forEach((add) => {
           nextData.experience = nextData.experience.map(e => 
             e.id === add.id
               ? {
                   ...e,
                   description: appendDescriptionBullet(
                     e.description,
                     sanitizeAiPlainText(add.better),
                   ),
                 }
               : e
           );
        });

        return { resumeData: nextData, tailorPreview: null };
      }),
      discardTailoredPreview: () => set({ tailorPreview: null }),
    }),
    {
      name: BUILDER_STORAGE_NAME,
      storage: createJSONStorage(() => debouncedLocalStorage),
      version: BUILDER_PERSIST_VERSION,
      migrate: migrateBuilderPersistedState,
      merge: mergePersistedBuilderState,
      partialize: (state) => ({
        resumeData: state.resumeData,
        templateId: state.templateId,
        title: state.title,
      }),
    },
  ),
);
