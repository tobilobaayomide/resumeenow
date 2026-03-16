import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { AtsAuditResult, CoverLetterTone } from '../types/builder';
import {
  DEFAULT_TEMPLATE_ID,
  INITIAL_RESUME_DATA,
  normalizeTemplateId,
  type ResumeData,
  type TemplateId,
} from '../types/resume';

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
  tailorPreview: {
    jobTitleAfter: string;
    summary?: { current: string; better: string };
    skills?: { current: string; better: string };
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
  setTailorPreview: (preview: BuilderState['tailorPreview']) => void;
  confirmTailoredPreview: () => void;
  discardTailoredPreview: () => void;
};

type BuilderStore = BuilderState & BuilderActions;

const storageTimers: Record<string, ReturnType<typeof setTimeout>> = {};

/**
 * Custom storage that debounces writes to localStorage
 * to prevent performance degradation during frequent state updates (typing).
 */
const debouncedLocalStorage: StateStorage = {
  getItem: (name) => {
    return localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (storageTimers[name]) {
      clearTimeout(storageTimers[name]);
    }
    storageTimers[name] = setTimeout(() => {
      localStorage.setItem(name, value);
      delete storageTimers[name];
    }, 1000); // 1s debounce for persistence
  },
  removeItem: (name) => {
    if (storageTimers[name]) {
      clearTimeout(storageTimers[name]);
      delete storageTimers[name];
    }
    localStorage.removeItem(name);
  },
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
      setTailorPreview: (preview) => set({ tailorPreview: preview }),
      confirmTailoredPreview: () => set((state) => {
        if (!state.tailorPreview) return state;
        
        let nextData = { ...state.resumeData };
        const p = state.tailorPreview;

        // Apply Job Title
        nextData.personalInfo = { ...nextData.personalInfo, jobTitle: p.jobTitleAfter };

        // Apply Summary
        if (p.summary) nextData.summary = p.summary.better;

        // Apply Skills
        if (p.skills) {
           // skills.better is usually a list of strings if categorized well, but here we treat it as a refined section.
           // For simplicity in this surgical view, we might need a more structured skills update.
           // But let's assume skills.better is applied to the list.
           nextData.skills = { ...nextData.skills, list: p.skills.better.split(',').map(s => s.trim()) };
        }

        // Apply Experience Improvements
        p.experienceImprovements.forEach((imp) => {
           nextData.experience = nextData.experience.map(e => 
             e.id === imp.id ? { ...e, description: e.description.replace(imp.current, imp.better) } : e
           );
        });

        // Apply Additions
        p.experienceAdditions.forEach((add) => {
           nextData.experience = nextData.experience.map(e => 
             e.id === add.id ? { ...e, description: e.description + '\n' + add.better } : e
           );
        });

        return { resumeData: nextData, tailorPreview: null };
      }),
      discardTailoredPreview: () => set({ tailorPreview: null }),
    }),
    {
      name: 'resumeenow:builder',
      storage: createJSONStorage(() => debouncedLocalStorage),
      partialize: (state) => ({
        resumeData: state.resumeData,
        templateId: state.templateId,
        title: state.title,
      }),
    },
  ),
);
