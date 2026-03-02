import type { ReactNode } from 'react';

export interface LandingFeatureItem {
  id: number;
  title: string;
  description: string;
  icon: ReactNode;
  media: string;
}
