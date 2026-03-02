import type { HeroProofCard } from '../../types/landing';

export const HERO_QUICK_VALUE_POINTS = [
  "Import your current resume and parse it into editable blocks",
  "Run AI Tailor, ATS Audit, and Cover Letter in one workspace",
] as const;

export const HERO_PROOF_CARDS: HeroProofCard[] = [
  {
    title: "AI workflow stack",
    detail: "Tailor, ATS Audit, and Cover Letter generation",
  },
  {
    title: "Real-time preview",
    detail: "See every content change reflected instantly",
  },
  {
    title: "Import-first editor",
    detail: "Start from your existing PDF in a few clicks",
  },
];
