import type { LandingTemplateItem, TemplateId } from '../../domain/templates/types';

export const LANDING_PENDING_TEMPLATE_IDS = [
  'executive',
  'studio',
  'silicon',
  'mono',
  'ats',
] as const satisfies readonly TemplateId[];

export const LANDING_TEMPLATE_ITEMS: LandingTemplateItem[] = [
  {
    id: 'executive',
    name: 'Executive',
    category: 'Clean Two-Column',
    tag: 'Best Seller',
  },
  {
    id: 'silicon',
    name: 'Silicon',
    category: 'Tech & Product',
    tag: 'Developer Favorite',
  },
  {
    id: 'ats',
    name: 'ATS Classic',
    category: 'Single-Column ATS',
    tag: 'Recruiter-Ready',
  },
];
