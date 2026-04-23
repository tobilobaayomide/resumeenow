import fs from 'node:fs';
import type { Browser, Page } from 'playwright-core';
import { Buffer } from 'node:buffer';
import {
  buildRateLimitKey,
  enforceInMemoryRateLimit,
  getClientIpFromHeaderRecord,
  RateLimitError,
} from './_lib/rate-limit.js';
import { applySetCookieHeaders, resolveSessionFromApiRequest } from './_lib/session.js';
import {
  PRINT_FONT_LOADS,
  PRINT_FONT_READY_TIMEOUT_MS,
} from '../src/lib/builder/printFonts.js';

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
  setHeader: (name: string, value: string | string[]) => void;
  status: (code: number) => ApiResponse;
  send: (body: string | Buffer) => void;
}

type HttpHeaderMap = Record<string, string>;

const PDF_PAGE_WIDTH_MM = '210mm';
const PDF_PAGE_HEIGHT_MM = '297mm';
const PRINT_VIEWPORT = {
  width: 1100,
  height: 1500,
} as const;
const PRINT_PAGE_SELECTOR = '.resume-print-page';
const FLUSH_HEADER_SELECTOR = `${PRINT_PAGE_SELECTOR} [data-flush-header="true"]`;
const MAX_EXPORT_REQUEST_BYTES = 1024 * 1024;
const PDF_EXPORT_RATE_LIMIT = {
  limit: 8,
  windowMs: 5 * 60 * 1000,
} as const;

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

const getConfiguredAppOrigin = (env: NodeJS.ProcessEnv = process.env) =>
  normalizeOrigin(
    env.APP_URL ||
      env.SITE_URL ||
      env.PUBLIC_APP_URL ||
      env.VERCEL_URL ||
      env.VERCEL_BRANCH_URL ||
      env.VERCEL_PROJECT_PRODUCTION_URL,
  );

export const resolvePdfExportAppOrigin = (
  req: ApiRequest,
  env: NodeJS.ProcessEnv = process.env,
) => {
  void req;

  const configuredOrigin = getConfiguredAppOrigin(env);
  if (configuredOrigin) {
    return configuredOrigin;
  }

  throw new HttpError(
    500,
    'PDF export origin is not configured. Set APP_URL or SITE_URL.',
  );
};

const isRelevantAssetUrl = (url: string) =>
  /\.(?:css|js|woff2?|ttf|otf)(?:$|[?#])/i.test(url) ||
  /\/assets\//i.test(url);

export const getPdfExportExtraHeaders = (
  appOrigin: string,
  env: NodeJS.ProcessEnv = process.env,
): HttpHeaderMap | null => {
  const host = new URL(appOrigin).host;

  if (isLocalHost(host)) {
    return null;
  }

  const bypassSecret =
    env.VERCEL_AUTOMATION_BYPASS_SECRET ||
    env.VERCEL_PROTECTION_BYPASS_SECRET;

  if (!bypassSecret) {
    return null;
  }

  return {
    'x-vercel-protection-bypass': bypassSecret,
    'x-vercel-set-bypass-cookie': 'true',
  };
};

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

const buildRasterizedPdfHtml = (pageImages: readonly string[]) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      @page {
        size: ${PDF_PAGE_WIDTH_MM} ${PDF_PAGE_HEIGHT_MM};
        margin: 0;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #fff;
      }

      .pdf-page {
        width: ${PDF_PAGE_WIDTH_MM};
        height: ${PDF_PAGE_HEIGHT_MM};
        break-after: page;
        page-break-after: always;
      }

      .pdf-page:last-child {
        break-after: auto;
        page-break-after: auto;
      }

      .pdf-page img {
        display: block;
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    ${pageImages
      .map(
        (src, index) => `
          <div class="pdf-page">
            <img src="${src}" alt="Resume page ${index + 1}" />
          </div>`,
      )
      .join('')}
  </body>
</html>`;

const renderRasterizedPdf = async (
  browser: Browser,
  printPage: Page,
): Promise<Buffer> => {
  const pageLocator = printPage.locator(PRINT_PAGE_SELECTOR);
  const pageCount = await pageLocator.count();

  if (pageCount < 1) {
    throw new Error('Resume print view did not render any pages.');
  }

  const pageImages: string[] = [];

  for (let index = 0; index < pageCount; index += 1) {
    const pageHandle = pageLocator.nth(index);
    await pageHandle.scrollIntoViewIfNeeded();

    const screenshotBuffer = await pageHandle.screenshot({
      type: 'png',
      animations: 'disabled',
    });

    pageImages.push(`data:image/png;base64,${screenshotBuffer.toString('base64')}`);
  }

  const pdfPage = await browser.newPage({
    viewport: PRINT_VIEWPORT,
    deviceScaleFactor: 1,
  });

  try {
    await pdfPage.setContent(buildRasterizedPdfHtml(pageImages), {
      waitUntil: 'load',
    });

    return await pdfPage.pdf({
      width: PDF_PAGE_WIDTH_MM,
      height: PDF_PAGE_HEIGHT_MM,
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      preferCSSPageSize: true,
    });
  } finally {
    await pdfPage.close();
  }
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
    if (Buffer.byteLength(req.body, 'utf8') > MAX_EXPORT_REQUEST_BYTES) {
      throw new HttpError(413, 'PDF export payload is too large.');
    }
  } else if (req.body && typeof req.body === 'object') {
    if (Buffer.byteLength(JSON.stringify(req.body), 'utf8') > MAX_EXPORT_REQUEST_BYTES) {
      throw new HttpError(413, 'PDF export payload is too large.');
    }
  }

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

const authenticateRequest = async (
  req: ApiRequest,
  res: ApiResponse,
): Promise<{ userId: string }> => {
  const session = await resolveSessionFromApiRequest(req);
  applySetCookieHeaders((name, value) => res.setHeader(name, value), session.setCookieHeaders);

  return {
    userId: session.user.id,
  };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).send('Method Not Allowed');
    return;
  }

  let browser: Browser | null = null;

  try {
    const { userId } = await authenticateRequest(req, res);
    enforceInMemoryRateLimit({
      key: buildRateLimitKey({
        namespace: 'pdf-export',
        userId,
        ipAddress: getClientIpFromHeaderRecord(req.headers),
      }),
      limit: PDF_EXPORT_RATE_LIMIT.limit,
      windowMs: PDF_EXPORT_RATE_LIMIT.windowMs,
    });

    const { data, templateId, fileName } = await parseExportRequest(req);
    const appOrigin = resolvePdfExportAppOrigin(req);
    const exportUrl = `${appOrigin}/print/resume`;

    const { playwright, launchOptions } = await loadBrowserRuntimes(appOrigin);
    browser = await playwright.launch(launchOptions);

    const page = await browser.newPage({
      viewport: PRINT_VIEWPORT,
      deviceScaleFactor: 2,
    });
    const extraHeaders = getPdfExportExtraHeaders(appOrigin);
    const assetFailures = new Set<string>();

    if (extraHeaders) {
      await page.setExtraHTTPHeaders(extraHeaders);
    }

    page.on('requestfailed', (request) => {
      const url = request.url();
      if (!isRelevantAssetUrl(url)) {
        return;
      }

      assetFailures.add(
        `${request.method()} ${url} (${request.failure()?.errorText || 'request failed'})`,
      );
    });

    page.on('response', (response) => {
      const url = response.url();
      if (!isRelevantAssetUrl(url) || response.status() < 400) {
        return;
      }

      assetFailures.add(`${response.status()} ${url}`);
    });

    await page.addInitScript((injectedPayload: unknown) => {
      const printPage = globalThis as PrintPageGlobals;
      printPage.__RESUME_PRINT_PAYLOAD__ = injectedPayload;
      printPage.__RESUME_PRINT_READY__ = false;
    }, { data, templateId, fileName });

    await page.emulateMedia({ media: 'screen' });
    await page.goto(exportUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => {
      const printPage = globalThis as PrintPageGlobals;
      return printPage.__RESUME_PRINT_READY__ === true;
    }, {
      timeout: 20000,
    });
    await page.evaluate(async ({
      fontLoads,
      fontTimeoutMs,
    }: {
      fontLoads: readonly string[];
      fontTimeoutMs: number;
    }) => {
      const browserGlobal = globalThis as unknown as {
        setTimeout: (handler: () => void, timeout?: number) => unknown;
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

      const timeoutPromise = new Promise<void>((resolve) => {
        browserGlobal.setTimeout(resolve, fontTimeoutMs);
      });

      const loadPromise = (async () => {
        await Promise.allSettled(
          fontLoads.map((font) => fonts.load(font, 'BESbswy 0123456789')),
        );
        await fonts.ready;
      })();

      await Promise.race([loadPromise, timeoutPromise]);
    }, {
      fontLoads: PRINT_FONT_LOADS,
      fontTimeoutMs: PRINT_FONT_READY_TIMEOUT_MS,
    });
    await page.waitForTimeout(150);
    if (assetFailures.size > 0) {
      console.error('PDF export asset failures', {
        appOrigin,
        exportUrl,
        assetFailures: Array.from(assetFailures),
      });
    }
    await page.evaluate((title: string | undefined) => {
      const printPage = globalThis as PrintPageGlobals;
      if (typeof title === 'string' && title.trim() && printPage.document) {
        printPage.document.title = title.trim();
      }
    }, fileName);

    const shouldRasterizePdf = (await page.locator(FLUSH_HEADER_SELECTOR).count()) > 0;
    const pdfBuffer = shouldRasterizePdf
      ? await renderRasterizedPdf(browser, page)
      : await page.pdf({
          width: PDF_PAGE_WIDTH_MM,
          height: PDF_PAGE_HEIGHT_MM,
          printBackground: true,
          margin: {
            top: '0',
            right: '0',
            bottom: '0',
            left: '0',
          },
          preferCSSPageSize: true,
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
    const shouldExposeInternalError =
      process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview';
    if (error instanceof RateLimitError) {
      res.setHeader('Retry-After', String(error.retryAfterSeconds));
    }

    res
      .status(error instanceof HttpError || error instanceof RateLimitError ? error.status : 500)
      .send(
        shouldExposeInternalError
          ? `Failed to export PDF: ${message}`
          : error instanceof HttpError || error instanceof RateLimitError
            ? message
            : 'Failed to export PDF.'
      );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
