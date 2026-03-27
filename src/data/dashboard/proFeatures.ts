import type { ProFeatureCardItem } from '../../types/dashboard';

export const DASHBOARD_PRO_FEATURE_CARDS: ProFeatureCardItem[] = [
  {
    title: 'AI Tailor',
    description: 'Target any role with guided inputs and summary optimization inside the builder.',
    tag: 'Workflow',
  },
  {
    title: 'ATS Audit',
    description: 'Check keyword match, identify gaps, and apply actionable hints before export.',
    tag: 'Optimization',
  },
  {
    title: 'Cover Letter Generator',
    description: 'Generate role-specific drafts from your current resume data and copy instantly.',
    tag: 'Output',
  },
  {
    title: 'Priority Templates',
    description: 'Access premium template variants and faster iteration for final delivery.',
    tag: 'Design',
  },
];

export const DASHBOARD_FREE_PLAN_ITEMS = [
  'Resume upload and parsing',
  'Live editor and templates',
  'Save and PDF export',
  '5 AI workflow runs per day',
] as const;

export const DASHBOARD_PRO_PLAN_ITEMS = [
  '100 AI workflow runs per day',
  'AI Tailor, ATS Audit, and Cover Letter generator',
  'Pro workspace controls',
] as const;
