import { Buffer } from 'node:buffer';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

type ParserModules = {
  getDocumentProxy: typeof import('unpdf')['getDocumentProxy'];
  parseResumeText: typeof import('../src/lib/resume-parser/parse.js')['parseResumeText'];
  extractPdfPageLines: typeof import('../src/lib/resume-parser/pdf-text.js')['extractPdfPageLines'];
  toPdfTextItem: typeof import('../src/lib/resume-parser/pdf-text.js')['toPdfTextItem'];
  cleanupSectionText: typeof import('../src/lib/resume-parser/text.js')['cleanupSectionText'];
  isReadableDocumentText: typeof import('../src/lib/resume-parser/text.js')['isReadableDocumentText'];
};

let parserModulesPromise: Promise<ParserModules> | null = null;

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

const createJsonResponse = (status: number, payload: unknown): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

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
    console.info('[ResumeParser] Server parse started.', { fileName });

    const modules = await loadParserModules();
    const buffer = await readRequestBuffer(request);

    if (buffer.length === 0) {
      return createTextResponse(400, 'Missing PDF file upload.');
    }

    const rawText = await extractPdfTextFromBuffer(buffer, modules);
    const result = modules.parseResumeText(rawText, fileName);
    return createJsonResponse(200, result);
  } catch (error) {
    console.error('[ResumeParser] Server PDF parse failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to parse uploaded PDF.';
    const statusCode =
      /too large/i.test(message) ? 413
      : /reliable text|image-based|scanned/i.test(message) ? 422
      : 500;

    return createTextResponse(statusCode, message);
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
