import {
  authenticateAdminRequest,
  HttpError,
  sendJson,
  toString,
} from './_lib/admin.js';
import { buildAdminUserDetail } from './_lib/admin-users.js';

export const config = {
  maxDuration: 30,
};

interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader: (name: string, value: string | string[]) => void;
  status: (code: number) => ApiResponse;
  send: (body: string) => void;
}

const getRequestedUserId = (req: ApiRequest): string => {
  const rawQuery = req.query?.userId;
  const userId = toString(Array.isArray(rawQuery) ? rawQuery[0] : rawQuery);

  if (!userId) {
    throw new HttpError(400, 'User id is required.');
  }

  return userId;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  try {
    const { supabase } = await authenticateAdminRequest(req, res);
    const userId = getRequestedUserId(req);
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data.user) {
      throw new HttpError(404, 'User not found.');
    }

    const detail = await buildAdminUserDetail(supabase, data.user);
    sendJson(res, 200, { detail });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, {
        error: 'ADMIN_USER_DETAIL_REQUEST_FAILED',
        message: error.message,
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Unexpected admin API error.';
    sendJson(res, 500, {
      error: 'ADMIN_USER_DETAIL_REQUEST_FAILED',
      message,
    });
  }
}
