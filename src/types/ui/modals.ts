import type { ProFeature } from '../context';

export type AuthModalMode = 'login' | 'signup';

export type OAuthProvider = 'google' | 'linkedin_oidc';

export interface AuthModalProps {
  open: boolean;
  onClose: (options?: { preservePendingTemplate?: boolean }) => void;
  mode: AuthModalMode;
}

export interface UpgradeModalProps {
  open: boolean;
  feature: ProFeature | null;
  onClose: () => void;
  onUpgrade: () => void;
}
