import { Buffer } from 'node:buffer';
import { getDocumentProxy } from 'unpdf';
import { parseResumeText } from '../src/lib/resume-parser/parse';
import { extractPdfPageLines, toPdfTextItem } from '../src/lib/resume-parser/pdf-text';
import { cleanupSectionText, isReadableDocumentText } from '../src/lib/resume-parser/text';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

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

const extractPdfTextFromBuffer = async (buffer: Buffer): Promise<string> => {
  const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const pdf = await getDocumentProxy(bytes, {
    isImageDecoderSupported: false,
    isOffscreenCanvasSupported: false,
    useWasm: false,
    useWorkerFetch: false,
  });

  try {
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const items = textContent.items
        .map(toPdfTextItem)
        .filter((item): item is NonNullable<ReturnType<typeof toPdfTextItem>> => item !== null);

      const lines = extractPdfPageLines(items);
      if (lines.length > 0) {
        pageTexts.push(lines.join('\n'));
      }

      page.cleanup();
    }

    const joined = cleanupSectionText(pageTexts.join('\n\n'));
    if (!isReadableDocumentText(joined)) {
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
    const buffer = await readRequestBuffer(request);
    if (buffer.length === 0) {
      return createTextResponse(400, 'Missing PDF file upload.');
    }

    const rawText = await extractPdfTextFromBuffer(buffer);
    const result = parseResumeText(rawText, fileName);
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

export default {
  async fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  },
};
