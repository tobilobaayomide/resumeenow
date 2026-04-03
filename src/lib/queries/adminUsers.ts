import { getValidAccessToken } from '../auth/accessToken';
import { parseAdminUsersResponse } from '../../schemas/integrations/admin';
import type { AdminUserRecord } from '../../types/admin';

const ADMIN_USERS_ENDPOINT = '/api/admin-users';

export const getAdminUsersQueryKey = () => ['adminUsers'] as const;

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.clone().json()) as {
      message?: string;
      error?: string;
    };

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }
  } catch {
    // Fall through to text parsing.
  }

  const text = (await response.text()).trim();
  return text || 'Failed to load admin users.';
};

export const fetchAdminUsers = async (): Promise<AdminUserRecord[]> => {
  const accessToken = await getValidAccessToken(
    'Please sign in again to access the admin console.',
  );

  const response = await fetch(ADMIN_USERS_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = parseAdminUsersResponse((await response.json()) as unknown);
  return payload.users;
};
