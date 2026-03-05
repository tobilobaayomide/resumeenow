import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
    summaryBefore: string;
    summaryAfter: string;
    bulletsChanged: number;
    skillsAdded: string[];
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
};

type BuilderStore = BuilderState & BuilderActions;

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
    }),
    {
      name: 'resumeenow:builder',
      partialize: (state) => ({
        resumeData: state.resumeData,
        templateId: state.templateId,
        title: state.title,
      }),
    },
  ),
);
