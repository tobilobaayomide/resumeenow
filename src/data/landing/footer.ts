import type { FooterLinkItem, FooterSocialLink } from '../../types/landing';

export const LANDING_FOOTER_PRODUCT_LINKS: FooterLinkItem[] = [
  { label: 'AI Tailor', href: '/#features' },
  { label: 'ATS Audit', href: '/#features' },
  { label: 'Cover Letter', href: '/#features' },
];

export const LANDING_FOOTER_COMPANY_LINKS: FooterLinkItem[] = [
  { label: 'How It Works', href: '/#steps' },
  { label: 'Templates', href: '/#templates' },
  { label: 'Docs', href: '/doc' },
  { label: 'Get Started', href: '/#get-started' },
];

export const LANDING_FOOTER_LEGAL_LINKS: FooterLinkItem[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

export const LANDING_FOOTER_SOCIAL_LINKS: FooterSocialLink[] = [
  { iconKey: 'twitter', href: '#', label: 'Twitter' },
{ iconKey: 'linkedin', href: 'https://www.linkedin.com/company/resumeenow', label: 'LinkedIn' },
  { iconKey: 'instagram', href: '#', label: 'Instagram' },
  { iconKey: 'github', href: '#', label: 'GitHub' },
];
