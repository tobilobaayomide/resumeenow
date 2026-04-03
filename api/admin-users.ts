import {
  authenticateAdminRequest,
  HttpError,
  sendJson,
} from './_lib/admin.js';
import { buildAdminUsers } from './_lib/admin-users.js';

export const config = {
  maxDuration: 30,
};

interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ApiResponse;
  send: (body: string) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' });
    return;
  }

  try {
    const { supabase } = await authenticateAdminRequest(req);
    const users = await buildAdminUsers(supabase);
    sendJson(res, 200, { users });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, {
        error: 'ADMIN_USERS_REQUEST_FAILED',
        message: error.message,
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Unexpected admin API error.';
    sendJson(res, 500, {
      error: 'ADMIN_USERS_REQUEST_FAILED',
      message,
    });
  }
}
