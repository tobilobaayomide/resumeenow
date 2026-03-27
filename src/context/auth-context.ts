import { createContext } from 'react';
import type { AuthContextType } from '../types/context';

export type { AuthContextType } from '../types/context';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});
