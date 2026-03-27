import type { LandingFeatureItem } from "../../types/landing";

const LANDING_CUSTOM_ICONS = {
  AI: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
      <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" fill="currentColor" />
      <path d="M19 17L20 19.5L22.5 20.5L20 21.5L19 24L18 21.5L15.5 20.5L18 19.5L19 17Z" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  Layout: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <rect x="3" y="14" width="18" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  ATS: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    </svg>
  ),
  Export: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
      <path d="M12 15V3M12 15L8.5 11.5M12 15L15.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 21H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
};

export const LANDING_FEATURE_ROTATION_MS = 5200;
export const LANDING_FEATURE_TRANSITION_MS = 420;

export const LANDING_FEATURE_ITEMS: LandingFeatureItem[] = [
  {
    id: 0,
    title: "Smart Resume Upload & Parsing",
    description:
      "Import an existing PDF and map core sections into your editor so you can start with real data, not a blank page.",
    icon: LANDING_CUSTOM_ICONS.AI,
  },
  {
    id: 1,
    title: "Live Editor + Template Control",
    description:
      "Edit summary, experience, projects, links, and more while preview updates in real time across template styles.",
    icon: LANDING_CUSTOM_ICONS.Layout,
  },
  {
    id: 2,
    title: "AI Workflows Inside Builder",
    description:
      "Run AI Tailor, ATS Audit, and Cover Letter workflows directly in your editing flow to ship faster.",
    icon: LANDING_CUSTOM_ICONS.ATS,
  },
  {
    id: 3,
    title: "Free + Pro Workspace",
    description:
      "Start free, then unlock Pro tools when ready with clear upgrade prompts and dedicated Pro workspace controls.",
    icon: LANDING_CUSTOM_ICONS.Export,
  },
];
