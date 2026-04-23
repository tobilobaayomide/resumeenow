import { createClient, type User } from '@supabase/supabase-js';
import { HttpError, type ApiRequest } from './admin.js';

const SECURE_ACCESS_TOKEN_COOKIE = '__Secure-resumeenow-access-token';
const SECURE_REFRESH_TOKEN_COOKIE = '__Secure-resumeenow-refresh-token';
const DEV_ACCESS_TOKEN_COOKIE = 'resumeenow-access-token';
const DEV_REFRESH_TOKEN_COOKIE = 'resumeenow-refresh-token';
const COOKIE_PATH = '/';
const SAME_SITE = 'Lax';
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const ACCESS_TOKEN_MAX_AGE_FALLBACK_SECONDS = 60 * 60;

interface AuthCookieOptions {
  maxAge?: number;
  expires?: Date;
}

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number | null;
}

export interface ResolvedSession {
  user: User;
  accessToken: string;
  refreshToken: string | null;
  setCookieHeaders: string[];
}

let supabaseAnonClientPromise: Promise<ReturnType<typeof createClient>> | null = null;

const getIsSecureCookie = (): boolean =>
  process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

const getAccessTokenCookieName = (): string =>
  getIsSecureCookie() ? SECURE_ACCESS_TOKEN_COOKIE : DEV_ACCESS_TOKEN_COOKIE;

const getRefreshTokenCookieName = (): string =>
  getIsSecureCookie() ? SECURE_REFRESH_TOKEN_COOKIE : DEV_REFRESH_TOKEN_COOKIE;

const getSupabaseAnonServerConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new HttpError(
      500,
      'Server authentication is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.',
    );
  }

  return { url, anonKey };
};

const getSupabaseAnonClient = async () => {
  if (!supabaseAnonClientPromise) {
    supabaseAnonClientPromise = (async () => {
      const { url, anonKey } = getSupabaseAnonServerConfig();
      return createClient(url, anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    })();
  }

  return supabaseAnonClientPromise;
};

const serializeCookie = (
  name: string,
  value: string,
  options: AuthCookieOptions = {},
): string => {
  const segments = [`${name}=${encodeURIComponent(value)}`, `Path=${COOKIE_PATH}`, `SameSite=${SAME_SITE}`];

  if (getIsSecureCookie()) {
    segments.push('Secure');
  }

  segments.push('HttpOnly');

  if (typeof options.maxAge === 'number') {
    segments.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }

  if (options.expires) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }

  return segments.join('; ');
};

const parseCookieHeader = (cookieHeader: string | undefined): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, segment) => {
      const separatorIndex = segment.indexOf('=');
      if (separatorIndex <= 0) {
        return cookies;
      }

      const name = segment.slice(0, separatorIndex).trim();
      const value = segment.slice(separatorIndex + 1).trim();

      if (!name) {
        return cookies;
      }

      try {
        cookies[name] = decodeURIComponent(value);
      } catch {
        cookies[name] = value;
      }

      return cookies;
    }, {});
};

const getHeaderValue = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const getBearerToken = (authorizationHeader: string | string[] | undefined) => {
  const authorization = getHeaderValue(authorizationHeader);
  if (!authorization) return null;

  const [scheme, token] = String(authorization).trim().split(/\s+/, 2);
  if (!/^Bearer$/i.test(scheme) || !token) return null;

  return token;
};

export const getCookieHeaderFromApiRequest = (req: ApiRequest): string | undefined =>
  getHeaderValue(req.headers.cookie);

export const createSessionCookieHeaders = ({
  accessToken,
  refreshToken,
  expiresAt,
}: SessionTokens): string[] => {
  const accessTokenMaxAge =
    typeof expiresAt === 'number'
      ? Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
      : ACCESS_TOKEN_MAX_AGE_FALLBACK_SECONDS;

  return [
    serializeCookie(getAccessTokenCookieName(), accessToken, {
      maxAge: accessTokenMaxAge,
    }),
    serializeCookie(getRefreshTokenCookieName(), refreshToken, {
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    }),
  ];
};

export const createClearedSessionCookieHeaders = (): string[] => {
  const expiredAt = new Date(0);

  return [
    serializeCookie(SECURE_ACCESS_TOKEN_COOKIE, '', { maxAge: 0, expires: expiredAt }),
    serializeCookie(SECURE_REFRESH_TOKEN_COOKIE, '', { maxAge: 0, expires: expiredAt }),
    serializeCookie(DEV_ACCESS_TOKEN_COOKIE, '', { maxAge: 0, expires: expiredAt }),
    serializeCookie(DEV_REFRESH_TOKEN_COOKIE, '', { maxAge: 0, expires: expiredAt }),
  ];
};

export const applySetCookieHeaders = (
  setHeader: (name: string, value: string | string[]) => void,
  cookieHeaders: string[],
) => {
  if (cookieHeaders.length === 0) {
    return;
  }

  setHeader('Set-Cookie', cookieHeaders);
};

const refreshAccessToken = async (
  refreshToken: string,
): Promise<ResolvedSession | null> => {
  const supabase = await getSupabaseAnonClient();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session?.access_token || !data.session.refresh_token || !data.user) {
    return null;
  }

  return {
    user: data.user,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    setCookieHeaders: createSessionCookieHeaders({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    }),
  };
};

const validateAccessToken = async (
  accessToken: string,
  refreshToken: string | null,
): Promise<ResolvedSession | null> => {
  const supabase = await getSupabaseAnonClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return {
    user,
    accessToken,
    refreshToken,
    setCookieHeaders: [],
  };
};

export const resolveSessionFromHeaders = async (
  headers: {
    authorization?: string | string[] | undefined;
    cookie?: string | string[] | undefined;
  },
): Promise<ResolvedSession> => {
  const bearerToken = getBearerToken(headers.authorization);
  if (bearerToken) {
    const bearerSession = await validateAccessToken(bearerToken, null);
    if (!bearerSession) {
      throw new HttpError(401, 'Invalid or expired session. Please sign in again.');
    }

    return bearerSession;
  }

  const cookies = parseCookieHeader(getHeaderValue(headers.cookie));
  const accessToken =
    cookies[SECURE_ACCESS_TOKEN_COOKIE] ??
    cookies[DEV_ACCESS_TOKEN_COOKIE] ??
    null;
  const refreshToken =
    cookies[SECURE_REFRESH_TOKEN_COOKIE] ??
    cookies[DEV_REFRESH_TOKEN_COOKIE] ??
    null;

  if (accessToken) {
    const activeSession = await validateAccessToken(accessToken, refreshToken);
    if (activeSession) {
      return activeSession;
    }
  }

  if (refreshToken) {
    const refreshedSession = await refreshAccessToken(refreshToken);
    if (refreshedSession) {
      return refreshedSession;
    }
  }

  throw new HttpError(401, 'Authentication required. Please sign in again.');
};

export const resolveSessionFromApiRequest = async (
  req: ApiRequest,
): Promise<ResolvedSession> =>
  resolveSessionFromHeaders({
    authorization: req.headers.authorization,
    cookie: req.headers.cookie,
  });

export const resolveSessionFromRequest = async (
  request: Request,
): Promise<ResolvedSession> =>
  resolveSessionFromHeaders({
    authorization: request.headers.get('authorization') ?? undefined,
    cookie: request.headers.get('cookie') ?? undefined,
  });
