import type { FooterLinkItem, FooterSocialLink } from '../../types/landing';

export const LANDING_FOOTER_PRODUCT_LINKS: FooterLinkItem[] = [
  { label: 'AI Tailor', href: '#features' },
  { label: 'ATS Audit', href: '#features' },
  { label: 'Cover Letter', href: '#features' },
  { label: 'Pro Features', href: '#pricing' },
];

export const LANDING_FOOTER_COMPANY_LINKS: FooterLinkItem[] = [
  { label: 'How It Works', href: '#steps' },
  { label: 'Templates', href: '#templates' },
  { label: 'Plans', href: '#pricing' },
  { label: 'Get Started', href: '#get-started' },
];

export const LANDING_FOOTER_LEGAL_LINKS: FooterLinkItem[] = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Security', href: '#' },
];

export const LANDING_FOOTER_SOCIAL_LINKS: FooterSocialLink[] = [
  { iconKey: 'twitter', href: '#', label: 'Twitter' },
  { iconKey: 'linkedin', href: '#', label: 'LinkedIn' },
  { iconKey: 'instagram', href: '#', label: 'Instagram' },
  { iconKey: 'github', href: '#', label: 'GitHub' },
];
