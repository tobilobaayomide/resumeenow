import fs from 'node:fs';
import type { Browser } from 'playwright-core';
import { PRINT_FONT_LOADS } from '../src/lib/builder/printFonts.js';

export const config = {
  maxDuration: 60,
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ApiResponse;
  send: (body: string | Buffer) => void;
}

let supabaseAuthClientPromise: Promise<import('@supabase/supabase-js').SupabaseClient> | null = null;
let exportSchemaModulePromise: Promise<typeof import('../src/schemas/builder/exportPayload.js')> | null = null;

interface PrintPageGlobals {
  __RESUME_PRINT_PAYLOAD__?: unknown;
  __RESUME_PRINT_READY__?: boolean;
  document?: {
    title: string;
  };
}

const isInvalidFileNameCharacter = (char: string): boolean =>
  /[<>:"/\\|?*]/.test(char) || char.charCodeAt(0) < 32;

const sanitizeFileName = (value: string | undefined) =>
  Array.from(String(value || 'Resume').trim())
    .filter((char) => !isInvalidFileNameCharacter(char))
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '') || 'Resume';

const isLocalHost = (host: string) => /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);

const normalizeHeaderValue = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const getRequestOrigin = (req: ApiRequest): string | null => {
  const forwardedHost = normalizeHeaderValue(req.headers['x-forwarded-host']);
  const host = forwardedHost || normalizeHeaderValue(req.headers.host);

  if (!host) {
    return null;
  }

  const forwardedProto = normalizeHeaderValue(req.headers['x-forwarded-proto']);
  const protocol = forwardedProto || (isLocalHost(host) ? 'http' : 'https');

  return normalizeOrigin(`${protocol}://${host}`);
};

const normalizeOrigin = (value: string | undefined): string | null => {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^[a-z]+:\/\//i.test(trimmed)
    ? trimmed
    : `${isLocalHost(trimmed) ? 'http' : 'https'}://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new HttpError(
      500,
      'Invalid PDF export origin. Set APP_URL or SITE_URL to a valid app URL.',
    );
  }

  if (!/^https?:$/.test(url.protocol)) {
    throw new HttpError(
      500,
      'Invalid PDF export origin protocol. Use http or https.',
    );
  }

  if (
    (url.pathname && url.pathname !== '/') ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new HttpError(
      500,
      'Invalid PDF export origin. Use a bare origin without a path, query, or hash.',
    );
  }

  return url.origin;
};

const getConfiguredAppOrigin = () =>
  normalizeOrigin(
    process.env.APP_URL ||
      process.env.SITE_URL ||
      process.env.PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      process.env.VERCEL_BRANCH_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
  );

const getTrustedAppOrigin = (req: ApiRequest) => {
  const requestOrigin = getRequestOrigin(req);

  if (process.env.VERCEL_ENV === 'preview' && requestOrigin) {
    return requestOrigin;
  }

  const configuredOrigin = getConfiguredAppOrigin();
  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (requestOrigin && process.env.NODE_ENV !== 'production') {
    return requestOrigin;
  }

  throw new HttpError(
    500,
    'PDF export origin is not configured. Set APP_URL or SITE_URL.',
  );
};

const isPreviewDeployment = () => process.env.VERCEL_ENV === 'preview';

const shouldExposeServerError = () =>
  process.env.NODE_ENV !== 'production' || isPreviewDeployment();

const getLocalChromeExecutablePath = () => {
  const envPath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    process.env.CHROME_EXECUTABLE_PATH;

  const candidates = [
    envPath,
    process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : null,
    process.platform === 'darwin'
      ? '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
      : null,
    process.platform === 'linux' ? '/usr/bin/google-chrome-stable' : null,
    process.platform === 'linux' ? '/usr/bin/google-chrome' : null,
    process.platform === 'linux' ? '/usr/bin/chromium-browser' : null,
    process.platform === 'linux' ? '/usr/bin/chromium' : null,
    process.platform === 'win32'
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : null,
    process.platform === 'win32'
      ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
      : null,
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
};

const loadBrowserRuntimes = async (appOrigin: string) => {
  const host = new URL(appOrigin).host;

  if (isLocalHost(host)) {
    const { chromium: playwright } = await import('playwright-core');
    const executablePath = getLocalChromeExecutablePath();

    if (!executablePath) {
      throw new Error(
        'Local Chrome executable not found. Install Chrome or set CHROME_EXECUTABLE_PATH.',
      );
    }

    return {
      playwright,
      launchOptions: {
        executablePath,
        headless: true,
      },
    };
  }

  process.env.AWS_LAMBDA_JS_RUNTIME ??= 'nodejs22.x';

  const chromium = (await import('@sparticuz/chromium')).default;
  const { chromium: playwright } = await import('playwright-core');

  return {
    playwright,
    launchOptions: {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    },
  };
};

const getExportSchemaModule = async () => {
  if (!exportSchemaModulePromise) {
    exportSchemaModulePromise = import('../src/schemas/builder/exportPayload.js');
  }

  return exportSchemaModulePromise;
};

const parseBody = (req: ApiRequest) => {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as unknown;
    } catch {
      throw new HttpError(400, 'Invalid JSON request body.');
    }
  }

  return req.body ?? {};
};

const parseExportRequest = async (req: ApiRequest) => {
  const requestBody = parseBody(req);
  const { parseExportPayload } = await getExportSchemaModule();

  try {
    return parseExportPayload(requestBody);
  } catch {
    throw new HttpError(400, 'Invalid PDF export request.');
  }
};

const getSupabaseServerConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new HttpError(
      500,
      'Server authentication is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.',
    );
  }

  return { url, anonKey };
};

const getSupabaseAuthClient = async () => {
  if (!supabaseAuthClientPromise) {
    supabaseAuthClientPromise = (async () => {
      const { url, anonKey } = getSupabaseServerConfig();
      const { createClient } = await import('@supabase/supabase-js');

      return createClient(url, anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    })();
  }

  return supabaseAuthClientPromise;
};

const getBearerToken = (authorizationHeader: string | string[] | undefined) => {
  if (!authorizationHeader) return null;

  const authorization = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;
  const [scheme, token] = String(authorization).trim().split(/\s+/, 2);

  if (!/^Bearer$/i.test(scheme) || !token) return null;
  return token;
};

const authenticateRequest = async (req: ApiRequest) => {
  const accessToken = getBearerToken(req.headers.authorization);
  if (!accessToken) {
    throw new HttpError(401, 'Authentication required. Please sign in again.');
  }

  const supabase = await getSupabaseAuthClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    throw new HttpError(401, 'Invalid or expired session. Please sign in again.');
  }
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).send('Method Not Allowed');
    return;
  }

  let browser: Browser | null = null;

  try {
    await authenticateRequest(req);

    const { data, templateId, fileName } = await parseExportRequest(req);
    const appOrigin = getTrustedAppOrigin(req);
    const exportUrl = `${appOrigin}/print/resume`;

    const { playwright, launchOptions } = await loadBrowserRuntimes(appOrigin);
    browser = await playwright.launch(launchOptions);

    const page = await browser.newPage({
      viewport: {
        width: 1100,
        height: 1500,
      },
      deviceScaleFactor: 1,
    });

    await page.addInitScript((injectedPayload: unknown) => {
      const printPage = globalThis as PrintPageGlobals;
      printPage.__RESUME_PRINT_PAYLOAD__ = injectedPayload;
      printPage.__RESUME_PRINT_READY__ = false;
    }, { data, templateId, fileName });

    await page.emulateMedia({ media: 'screen' });
    await page.goto(exportUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    try {
      await page.waitForFunction(() => {
        const printPage = globalThis as PrintPageGlobals;
        return printPage.__RESUME_PRINT_READY__ === true;
      }, {
        timeout: 20000,
      });
    } catch {
      const currentUrl = page.url();
      let title = '';

      try {
        title = await page.title();
      } catch {
        // Ignore title lookup failures while reporting the original readiness error.
      }

      throw new Error(
        `Print page did not become ready at ${currentUrl}${title ? ` (title: ${title})` : ''}.`,
      );
    }
    await page.evaluate(async (fontLoads: readonly string[]) => {
      const browserGlobal = globalThis as {
        document?: {
          fonts?: {
            load: (font: string, text?: string) => Promise<unknown>;
            ready: Promise<unknown>;
          };
        };
      };
      const fonts = browserGlobal.document?.fonts;

      if (!fonts) {
        return;
      }

      await Promise.allSettled(
        fontLoads.map((font) => fonts.load(font, 'BESbswy 0123456789')),
      );
      await fonts.ready;
    }, PRINT_FONT_LOADS);
    await page.waitForTimeout(150);
    await page.evaluate((title: string | undefined) => {
      const printPage = globalThis as PrintPageGlobals;
      if (typeof title === 'string' && title.trim() && printPage.document) {
        printPage.document.title = title.trim();
      }
    }, fileName);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      preferCSSPageSize: false,
    });

    const finalFileName = `${sanitizeFileName(fileName)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${finalFileName}"`,
    );
    res.status(200).send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('PDF export failed', error);
    const message =
      error instanceof Error ? error.message : 'Failed to export PDF.';

    res
      .status(error instanceof HttpError ? error.status : 500)
      .send(
        shouldExposeServerError()
          ? `Failed to export PDF: ${message}`
          : error instanceof HttpError
            ? message
            : 'Failed to export PDF.'
      );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
