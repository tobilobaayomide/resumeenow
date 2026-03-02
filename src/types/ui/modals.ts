import type { ProFeature } from '../context';

export type AuthModalMode = 'login' | 'signup';

export type OAuthProvider = 'google' | 'apple';

export interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  mode: AuthModalMode;
}

export interface UpgradeModalProps {
  open: boolean;
  feature: ProFeature | null;
  onClose: () => void;
  onUpgrade: () => void;
}
