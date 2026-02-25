export type TemplateId = 'executive' | 'studio' | 'silicon' | 'mono';

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  category: string;
  description: string;
  color: string;
  popular?: boolean;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'executive',
    name: 'The Executive',
    category: 'Professional',
    description: 'Clean, authoritative layout for senior roles.',
    color: 'bg-slate-50',
    popular: true,
  },
  {
    id: 'studio',
    name: 'Studio',
    category: 'Creative',
    description: 'Bold typography for designers and artists.',
    color: 'bg-stone-50',
  },
  {
    id: 'silicon',
    name: 'Silicon',
    category: 'Tech',
    description: 'Optimized for technical skills and projects.',
    color: 'bg-blue-50/30',
    popular: true,
  },
  {
    id: 'mono',
    name: 'Mono',
    category: 'Minimal',
    description: 'Stripped back black & white aesthetic.',
    color: 'bg-gray-50',
  },
];