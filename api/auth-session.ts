import {
  HttpError,
  isRecord,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './_lib/admin.js';
import {
  applySetCookieHeaders,
  createClearedSessionCookieHeaders,
  createSessionCookieHeaders,
  resolveSessionFromApiRequest,
} from './_lib/session.js';

export const config = {
  maxDuration: 30,
};

const parseSessionBody = (req: ApiRequest): { accessToken: string; refreshToken: string } => {
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
    throw new HttpError(400, 'Invalid auth session payload.');
  }

  const accessToken =
    typeof rawBody.accessToken === 'string' ? rawBody.accessToken.trim() : '';
  const refreshToken =
    typeof rawBody.refreshToken === 'string' ? rawBody.refreshToken.trim() : '';

  if (!accessToken || !refreshToken) {
    throw new HttpError(400, 'Both access and refresh tokens are required.');
  }

  return {
    accessToken,
    refreshToken,
  };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'DELETE') {
    applySetCookieHeaders((name, value) => res.setHeader(name, value), createClearedSessionCookieHeaders());
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST') {
    try {
      const { accessToken, refreshToken } = parseSessionBody(req);
      const session = await resolveSessionFromApiRequest({
        ...req,
        headers: {
          ...req.headers,
          authorization: `Bearer ${accessToken}`,
          cookie: undefined,
        },
      });

      applySetCookieHeaders(
        (name, value) => res.setHeader(name, value),
        createSessionCookieHeaders({
          accessToken: session.accessToken,
          refreshToken,
          expiresAt: null,
        }),
      );
      sendJson(res, 200, { user: session.user });
      return;
    } catch (error) {
      if (error instanceof HttpError) {
        applySetCookieHeaders((name, value) => res.setHeader(name, value), createClearedSessionCookieHeaders());
        sendJson(res, error.status, {
          error: 'AUTH_SESSION_FAILED',
          message: error.message,
        });
        return;
      }

      applySetCookieHeaders((name, value) => res.setHeader(name, value), createClearedSessionCookieHeaders());
      sendJson(res, 500, {
        error: 'AUTH_SESSION_FAILED',
        message: error instanceof Error ? error.message : 'Unexpected auth session error.',
      });
      return;
    }
  }

  if (req.method === 'GET') {
    try {
      const session = await resolveSessionFromApiRequest(req);
      applySetCookieHeaders((name, value) => res.setHeader(name, value), session.setCookieHeaders);
      sendJson(res, 200, { user: session.user });
      return;
    } catch (error) {
      if (error instanceof HttpError) {
        if (error.status === 401) {
          applySetCookieHeaders((name, value) => res.setHeader(name, value), createClearedSessionCookieHeaders());
          sendJson(res, 200, { user: null });
          return;
        }
        applySetCookieHeaders((name, value) => res.setHeader(name, value), createClearedSessionCookieHeaders());
        sendJson(res, error.status, {
          error: 'AUTH_SESSION_FAILED',
          message: error.message,
        });
        return;
      }

      applySetCookieHeaders((name, value) => res.setHeader(name, value), createClearedSessionCookieHeaders());
      sendJson(res, 500, {
        error: 'AUTH_SESSION_FAILED',
        message: error instanceof Error ? error.message : 'Unexpected auth session error.',
      });
      return;
    }
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  sendJson(res, 405, {
    error: 'METHOD_NOT_ALLOWED',
    message: 'Method not allowed.',
  });
}
