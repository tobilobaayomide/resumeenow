import { HttpError } from './_lib/admin.js';
import { applySetCookieHeaders, resolveSessionFromRequest } from './_lib/session.js';

export const config = {
  maxDuration: 60,
};

const GEMINI_PROXY_UPSTREAM_TIMEOUT_MS = 25_000;

const readGeminiProxyConfig = (): { functionUrl: string; anonKey: string } => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';

  if (!supabaseUrl || !anonKey) {
    throw new Error('Gemini proxy is not configured.');
  }

  return {
    functionUrl: `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/gemini-proxy`,
    anonKey,
  };
};

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: 'METHOD_NOT_ALLOWED',
          message: 'Method not allowed.',
        }),
        {
          status: 405,
          headers: {
            Allow: 'POST',
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const session = await resolveSessionFromRequest(request);
    const { functionUrl, anonKey } = readGeminiProxyConfig();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, GEMINI_PROXY_UPSTREAM_TIMEOUT_MS);

    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(functionUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          apikey: anonKey,
          Accept: request.headers.get('accept') ?? 'application/json',
          'Content-Type': request.headers.get('content-type') ?? 'application/json',
        },
        body: await request.text(),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError(
          504,
          'AI edge function timed out. Check the deployed Supabase gemini-proxy function and its provider configuration.',
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    const headers = new Headers();
    const contentType = upstreamResponse.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    const cacheControl = upstreamResponse.headers.get('cache-control');
    headers.set('Cache-Control', cacheControl || 'no-store');
    applySetCookieHeaders(
      (name, value) => {
        if (Array.isArray(value)) {
          value.forEach((entry) => headers.append(name, entry));
          return;
        }
        headers.append(name, value);
      },
      session.setCookieHeaders,
    );

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers,
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return new Response(
      JSON.stringify({
        error: 'GEMINI_PROXY_FAILED',
        message: error instanceof Error ? error.message : 'Unexpected Gemini proxy error.',
      }),
      {
        status,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
