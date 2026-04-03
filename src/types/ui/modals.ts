import type { ProFeature } from '../context';

export type AuthModalMode = 'login' | 'signup';

export type OAuthProvider = 'google' | 'linkedin_oidc';

export interface AuthModalProps {
  open: boolean;
  onClose: (options?: { preservePendingTemplate?: boolean }) => void;
  mode: AuthModalMode;
  postAuthPending?: boolean;
}

export interface UpgradeModalProps {
  open: boolean;
  feature: ProFeature | null;
  joined: boolean;
  joining: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}
