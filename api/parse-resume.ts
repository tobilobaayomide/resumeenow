import { Buffer } from 'node:buffer';
import {
  buildRateLimitKey,
  enforceInMemoryRateLimit,
  getClientIpFromHeaders,
  RateLimitError,
} from './_lib/rate-limit.js';
import { resolveSessionFromRequest } from './_lib/session.js';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const PARSE_RESUME_RATE_LIMIT = {
  limit: 6,
  windowMs: 10 * 60 * 1000,
} as const;

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ParserModules = {
  getDocumentProxy: typeof import('unpdf')['getDocumentProxy'];
  parseResumeText: typeof import('../src/lib/resume-parser/parse.js')['parseResumeText'];
  extractPdfPageLines: typeof import('../src/lib/resume-parser/pdf-text.js')['extractPdfPageLines'];
  toPdfTextItem: typeof import('../src/lib/resume-parser/pdf-text.js')['toPdfTextItem'];
  cleanupSectionText: typeof import('../src/lib/resume-parser/text.js')['cleanupSectionText'];
  isReadableDocumentText: typeof import('../src/lib/resume-parser/text.js')['isReadableDocumentText'];
};

let parserModulesPromise: Promise<ParserModules> | null = null;
const authenticateRequest = async (
  request: Request,
): Promise<{ userId: string; setCookieHeaders: string[] }> => {
  const session = await resolveSessionFromRequest(request);
  return {
    userId: session.user.id,
    setCookieHeaders: session.setCookieHeaders,
  };
};

const loadParserModules = async (): Promise<ParserModules> => {
  if (!parserModulesPromise) {
    parserModulesPromise = (async () => {
      const [{ getDocumentProxy }, parseModule, pdfTextModule, textModule] = await Promise.all([
        import('unpdf'),
        import('../src/lib/resume-parser/parse.js'),
        import('../src/lib/resume-parser/pdf-text.js'),
        import('../src/lib/resume-parser/text.js'),
      ]);

      return {
        getDocumentProxy,
        parseResumeText: parseModule.parseResumeText,
        extractPdfPageLines: pdfTextModule.extractPdfPageLines,
        toPdfTextItem: pdfTextModule.toPdfTextItem,
        cleanupSectionText: textModule.cleanupSectionText,
        isReadableDocumentText: textModule.isReadableDocumentText,
      };
    })();
  }

  return parserModulesPromise;
};

const createTextResponse = (status: number, message: string): Response =>
  new Response(message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });

const withSetCookieHeaders = (
  headersInit: Record<string, string>,
  setCookieHeaders: string[],
): Headers => {
  const headers = new Headers(headersInit);
  setCookieHeaders.forEach((value) => {
    headers.append('Set-Cookie', value);
  });
  return headers;
};

const decodeFileNameHeader = (value: string | null): string => {
  if (!value) return 'resume.pdf';

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const readRequestBuffer = async (request: Request): Promise<Buffer> => {
  const declaredLength = Number.parseInt(request.headers.get('content-length') ?? '', 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_FILE_BYTES) {
    throw new Error(`Uploaded file is too large. Max size is ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB.`);
  }

  const arrayBuffer = await request.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > MAX_FILE_BYTES) {
    throw new Error(`Uploaded file is too large. Max size is ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB.`);
  }

  return buffer;
};

const extractPdfTextFromBuffer = async (
  buffer: Buffer,
  modules: ParserModules,
): Promise<string> => {
  const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const pdf = await modules.getDocumentProxy(bytes);

  try {
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const items = textContent.items
        .map(modules.toPdfTextItem)
        .filter((item): item is NonNullable<ReturnType<ParserModules['toPdfTextItem']>> => item !== null);

      const lines = modules.extractPdfPageLines(items);
      if (lines.length > 0) {
        pageTexts.push(lines.join('\n'));
      }

      page.cleanup();
    }

    const joined = modules.cleanupSectionText(pageTexts.join('\n\n'));
    if (!modules.isReadableDocumentText(joined)) {
      throw new Error(
        'Could not extract reliable text from this PDF. This often happens with scanned or image-based PDFs without OCR.',
      );
    }

    return joined;
  } finally {
    await pdf.destroy();
  }
};

const handleRequest = async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        Allow: 'POST',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  const fileName = decodeFileNameHeader(request.headers.get('x-resume-file-name'));
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    return createTextResponse(415, 'Only PDF uploads are supported by this endpoint.');
  }

  try {
    const { userId, setCookieHeaders } = await authenticateRequest(request);
    enforceInMemoryRateLimit({
      key: buildRateLimitKey({
        namespace: 'resume-parse',
        userId,
        ipAddress: getClientIpFromHeaders(request.headers),
      }),
      limit: PARSE_RESUME_RATE_LIMIT.limit,
      windowMs: PARSE_RESUME_RATE_LIMIT.windowMs,
    });

    console.info('[ResumeParser] Server parse started.', { fileName });

    const modules = await loadParserModules();
    const buffer = await readRequestBuffer(request);

    if (buffer.length === 0) {
      return createTextResponse(400, 'Missing PDF file upload.');
    }

    const rawText = await extractPdfTextFromBuffer(buffer, modules);
    const result = modules.parseResumeText(rawText, fileName);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: withSetCookieHeaders(
        {
          'Content-Type': 'application/json',
        },
        setCookieHeaders,
      ),
    });
  } catch (error) {
    console.error('[ResumeParser] Server PDF parse failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to parse uploaded PDF.';
    const statusCode =
      error instanceof HttpError || error instanceof RateLimitError ? error.status
      : /too large/i.test(message) ? 413
      : /reliable text|image-based|scanned/i.test(message) ? 422
      : 500;

    return new Response(message, {
      status: statusCode,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...(error instanceof RateLimitError
          ? { 'Retry-After': String(error.retryAfterSeconds) }
          : {}),
      },
    });
  }
};

export const config = {
  maxDuration: 60,
};

export async function POST(request: Request): Promise<Response> {
  return handleRequest(request);
}

export default {
  async fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },
};
