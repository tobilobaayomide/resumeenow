import {
  parseAdminUserActionResult,
  parseAdminUserDetailResponse,
  parseAdminUsersResponse,
} from '../../schemas/integrations/admin';
import type {
  AdminUserActionInput,
  AdminUserActionResult,
  AdminUserDetail,
  AdminUserRecord,
} from '../../types/admin';

const ADMIN_USERS_ENDPOINT = '/api/admin-users';
const ADMIN_USER_ACTIONS_ENDPOINT = '/api/admin-user-actions';
const ADMIN_USER_DETAIL_ENDPOINT = '/api/admin-user-detail';

export const getAdminUsersQueryKey = () => ['adminUsers'] as const;
export const getAdminUserDetailQueryKey = (userId: string | null | undefined) =>
  ['adminUserDetail', userId ?? null] as const;

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
  const response = await fetch(ADMIN_USERS_ENDPOINT);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = parseAdminUsersResponse((await response.json()) as unknown);
  return payload.users;
};

export const fetchAdminUserDetail = async (userId: string): Promise<AdminUserDetail> => {
  const params = new URLSearchParams({ userId });
  const response = await fetch(`${ADMIN_USER_DETAIL_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = parseAdminUserDetailResponse((await response.json()) as unknown);
  return payload.detail;
};

export const runAdminUserAction = async (
  input: AdminUserActionInput,
): Promise<AdminUserActionResult> => {
  const response = await fetch(ADMIN_USER_ACTIONS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return parseAdminUserActionResult((await response.json()) as unknown);
};
