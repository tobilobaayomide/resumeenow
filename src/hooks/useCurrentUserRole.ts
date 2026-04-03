import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/useAuth';
import {
  fetchProfileRecord,
  getProfileQueryKey,
} from '../lib/queries/profile';
import { parseProfileRole } from '../schemas/integrations/profile';
import {
  isAdminProfileRole,
  isSuperAdminProfileRole,
  type ProfileRole,
} from '../types/profile';

export interface UseCurrentUserRoleResult {
  role: ProfileRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  error: Error | null;
}

export const useCurrentUserRole = (): UseCurrentUserRoleResult => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const profileQuery = useQuery({
    queryKey: getProfileQueryKey(userId),
    queryFn: async () => fetchProfileRecord(userId as string),
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchOnMount: 'always',
  });

  const role = useMemo(() => parseProfileRole(profileQuery.data ?? null), [profileQuery.data]);

  return {
    role,
    isAdmin: isAdminProfileRole(role),
    isSuperAdmin: isSuperAdminProfileRole(role),
    loading: Boolean(userId) && profileQuery.isPending && profileQuery.data === undefined,
    error: profileQuery.error instanceof Error ? profileQuery.error : null,
  };
};
