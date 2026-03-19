import type {
  BuilderTemplateOption,
  LandingTemplateItem,
  TemplateGalleryItem,
  TemplatePickerItem,
} from "./types.js";

export const LANDING_TEMPLATE_ITEMS: LandingTemplateItem[] = [
  {
    id: "executive",
    name: "Executive",
    category: "Clean Two-Column",
    tag: "Best Seller",
  },
  {
    id: "silicon",
    name: "Silicon",
    category: "Tech & Product",
    tag: "Developer Favorite",
  },
  {
    id: "ats",
    name: "ATS Classic",
    category: "Single-Column ATS",
    tag: "Recruiter-Ready",
  },
];

export const TEMPLATE_GALLERY_ITEMS: TemplateGalleryItem[] = [
  {
    id: "executive",
    name: "The Executive",
    category: "Professional",
    description: "Clean, authoritative layout for senior roles.",
    layout: "Two Column",
    color: "bg-slate-50",
    popular: true,
    available: true,
  },
  {
    id: "studio",
    name: "Studio",
    category: "Creative",
    description: "Bold typography for designers and artists.",
    layout: "Single Column",
    color: "bg-stone-50",
    popular: false,
    available: true,
  },
  {
    id: "silicon",
    name: "Silicon",
    category: "Tech",
    description: "Optimized for technical skills and projects.",
    layout: "Single Column",
    color: "bg-zinc-50",
    popular: true,
    available: true,
  },
  {
    id: "ivy",
    name: "Ivy League",
    category: "Academic",
    description: "Traditional serif structure for CVs.",
    layout: "Two Column",
    color: "bg-gray-50",
    popular: false,
    available: false,
  },
  {
    id: "mono",
    name: "Mono",
    category: "Minimal",
    description: "Stripped back black & white aesthetic.",
    layout: "Single Column",
    color: "bg-gray-50",
    popular: false,
    available: true,
  },
  {
    id: "ats",
    name: "ATS Classic",
    category: "Professional",
    description: "Single-column, recruiter-first structure.",
    layout: "ATS-Friendly",
    color: "bg-zinc-50",
    popular: true,
    available: true,
  },
  {
    id: "startup",
    name: "Startup",
    category: "Tech",
    description: "Modern, energetic, and concise.",
    layout: "Sidebar",
    color: "bg-gray-50",
    popular: false,
    available: false,
  },
];

export const TEMPLATE_PICKER_ITEMS: TemplatePickerItem[] = [
  {
    id: "executive",
    name: "The Executive",
    desc: "Clean, authoritative, 2-column.",
    color: "bg-slate-50",
  },
  {
    id: "studio",
    name: "Studio",
    desc: "Bold typography, left sidebar.",
    color: "bg-stone-50",
  },
  {
    id: "silicon",
    name: "Silicon",
    desc: "Monospace, tech-focused.",
    color: "bg-zinc-50",
  },
  {
    id: "mono",
    name: "Mono",
    desc: "Minimalist, pure typography.",
    color: "bg-white",
  },
  {
    id: "ats",
    name: "ATS Classic",
    desc: "Single-column, recruiter-first.",
    color: "bg-gray-50",
  },
];

export const BUILDER_TEMPLATE_OPTIONS: BuilderTemplateOption[] = [
  { id: "executive", label: "Executive" },
  { id: "studio", label: "Studio" },
  { id: "silicon", label: "Silicon" },
  { id: "mono", label: "Mono" },
  { id: "ats", label: "ATS" },
];
