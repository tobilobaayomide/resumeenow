import type { TemplateId } from '../resume';

export interface CtaSectionProps {
  onPrimaryClick?: () => void;
}

export interface NavbarProps {
  onLogin: () => void;
  onSignup: () => void;
}

export interface TemplatesSectionProps {
  onSelectTemplate?: (templateId: TemplateId) => void;
}
