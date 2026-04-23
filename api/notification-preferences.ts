import {
  HttpError,
  isRecord,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './_lib/admin.js';
import { authenticateUserRequest } from './_lib/user.js';
import { parseSelfNotificationPreferencesUpdate } from '../src/schemas/integrations/notifications.js';

export const config = {
  maxDuration: 30,
};

const parseRequestBody = (req: ApiRequest) => {
  let rawBody: unknown;

  if (typeof req.body === 'string') {
    try {
      rawBody = JSON.parse(req.body) as unknown;
    } catch {
      throw new HttpError(400, 'Invalid JSON request body.');
    }
  } else {
    rawBody = req.body ?? {};
  }

  if (!isRecord(rawBody)) {
    throw new HttpError(400, 'Invalid notification preferences payload.');
  }

  try {
    return parseSelfNotificationPreferencesUpdate(rawBody);
  } catch {
    throw new HttpError(400, 'Invalid notification preferences payload.');
  }
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  try {
    const {
      supabase,
      user,
    } = await authenticateUserRequest(req, res);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      sendJson(res, 200, { preferences: data });
      return;
    }

    const updates = parseRequestBody(req);

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        },
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    sendJson(res, 200, { preferences: data });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, {
        error: 'NOTIFICATION_PREFERENCES_UPDATE_FAILED',
        message: error.message,
      });
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Unexpected notification preferences API error.';
    sendJson(res, 500, {
      error: 'NOTIFICATION_PREFERENCES_UPDATE_FAILED',
      message,
    });
  }
}
