import type { PdfTextItem } from '../../types/parser';
import {
  cleanLine,
  cleanupSectionText,
  isNoiseLine,
  isReadableDocumentText,
} from './text';
import { ensurePdfJsBrowserPolyfills } from './pdf-polyfills';
import { readFileAsArrayBuffer } from './file-reader';

type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

let pdfJsModulePromise: Promise<PdfJsModule> | null = null;
let workerConfigured = false;

const getPdfJsModule = async (): Promise<PdfJsModule> => {
  if (!pdfJsModulePromise) {
    // Use the legacy build — it supports older mobile WebKit engines.
    pdfJsModulePromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfJsModulePromise;
};

const ensurePdfWorker = async (pdfJs: PdfJsModule): Promise<void> => {
  if (workerConfigured) return;

  ensurePdfJsBrowserPolyfills();

  try {
    // `new URL(..., import.meta.url)` is the Vite-native way to reference a
    // static asset. Vite detects this pattern at build time, emits the worker
    // file to the output directory, and replaces `import.meta.url` with the
    // correct public base URL. The resulting URL is a plain HTTPS URL which
    // works on real iOS Safari and Android WebView — unlike blob: URLs from
    // dynamic import() which those browsers restrict or block entirely.
    const workerUrl = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      import.meta.url,
    );
    pdfJs.GlobalWorkerOptions.workerSrc = workerUrl.href;
  } catch {
    // Fallback: empty string tells PDF.js to run everything on the main thread
    // (fake-worker / same-thread mode). Slower but universally compatible.
    pdfJs.GlobalWorkerOptions.workerSrc = '';
  }

  workerConfigured = true;
};

const toPdfTextItem = (item: unknown): PdfTextItem | null => {
  if (typeof item !== 'object' || item === null) return null;

  const raw = item as Partial<PdfTextItem>;
  if (typeof raw.str !== 'string' || !Array.isArray(raw.transform)) return null;

  return {
    str: raw.str,
    transform: raw.transform,
    width: typeof raw.width === 'number' ? raw.width : 0,
    hasEOL: raw.hasEOL,
  };
};

const extractPageLines = (items: PdfTextItem[]): string[] => {
  const sorted = [...items].sort((a, b) => {
    const yA = a.transform[5] ?? 0;
    const yB = b.transform[5] ?? 0;
    const yDiff = yB - yA;

    if (Math.abs(yDiff) > 2.5) return yDiff;

    const xA = a.transform[4] ?? 0;
    const xB = b.transform[4] ?? 0;
    return xA - xB;
  });

  const lines: string[] = [];
  let currentLine = '';
  let currentY: number | null = null;
  let lastX = 0;

  const pushCurrentLine = () => {
    const line = cleanLine(currentLine);
    if (line && !isNoiseLine(line)) {
      lines.push(line);
    }
    currentLine = '';
    currentY = null;
    lastX = 0;
  };

  for (const item of sorted) {
    const text = cleanLine(item.str);
    if (!text) continue;

    const x = item.transform[4] ?? 0;
    const y = item.transform[5] ?? 0;

    if (currentY === null || Math.abs(y - currentY) > 2.5) {
      if (currentLine) pushCurrentLine();
      currentY = y;
      currentLine = text;
      lastX = x + Math.max(item.width, text.length * 4);
      if (item.hasEOL) pushCurrentLine();
      continue;
    }

    if (x > lastX + 1.5) {
      currentLine += ' ';
    }

    currentLine += text;
    lastX = x + Math.max(item.width, text.length * 4);

    if (item.hasEOL) {
      pushCurrentLine();
    }
  }

  if (currentLine) pushCurrentLine();

  return lines;
};

export const extractPdfText = async (file: File): Promise<string> => {
  try {
    const pdfJs = await getPdfJsModule();
    await ensurePdfWorker(pdfJs);

    const { getDocument } = pdfJs;

    const bytes = new Uint8Array(await readFileAsArrayBuffer(file));
    const loadingTask = getDocument({
      data: bytes,
      isImageDecoderSupported: false,
      isOffscreenCanvasSupported: false,
      useWasm: false,
      useWorkerFetch: false,
    });
    const pdf = await loadingTask.promise;

    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const items = textContent.items
        .map(toPdfTextItem)
        .filter((item): item is PdfTextItem => item !== null);

      const lines = extractPageLines(items);
      if (lines.length > 0) {
        pageTexts.push(lines.join('\n'));
      }
    }

    await loadingTask.destroy();

    const joined = cleanupSectionText(pageTexts.join('\n\n'));
    if (!isReadableDocumentText(joined)) {
      throw new Error(
        'Unable to extract reliable text from this PDF. Try another PDF or paste your resume as plain text.',
      );
    }

    return joined;
  } catch (error: unknown) {
    console.error('[ResumeParser] PDF extraction failed:', error);

    // Broadly catch any initialization failure — mobile browsers can throw
    // TypeError, DOMException, or plain Error when workers fail to boot.
    const isInitError =
      error instanceof TypeError ||
      error instanceof DOMException ||
      (error instanceof Error &&
        /worker|module|initialize|script/i.test(error.message));

    if (isInitError) {
      throw new Error(
        'This browser could not initialize PDF parsing. Update your browser or upload a DOCX or TXT file instead.',
      );
    }

    throw error;
  }
};
