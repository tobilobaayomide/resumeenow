export const TEMPLATE_IDS = ["executive", "studio", "silicon", "mono", "ats"] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const DEFAULT_TEMPLATE_ID: TemplateId = "executive";

export const TEMPLATE_CATEGORIES = [
  "Professional",
  "Creative",
  "Tech",
  "Academic",
  "Minimal",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_CATEGORY_FILTERS = ["All", ...TEMPLATE_CATEGORIES] as const;

export type TemplateCategoryFilter = (typeof TEMPLATE_CATEGORY_FILTERS)[number];

export type ComingSoonTemplateId = "ivy" | "startup";

export type TemplateCatalogId = TemplateId | ComingSoonTemplateId;

export interface TemplateGalleryItem {
  id: TemplateCatalogId;
  name: string;
  category: TemplateCategory;
  description: string;
  layout: string;
  color: string;
  popular: boolean;
  available: boolean;
}

export interface LandingTemplateItem {
  id: TemplateId;
  name: string;
  category: string;
  tag: string;
}

export interface TemplatePickerItem {
  id: TemplateId;
  name: string;
  desc: string;
  color: string;
}

export interface BuilderTemplateOption {
  id: TemplateId;
  label: string;
}

export const isRenderableTemplate = (id: string): id is TemplateId =>
  TEMPLATE_IDS.includes(id as TemplateId);
