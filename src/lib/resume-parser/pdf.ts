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
type PdfWorkerModule = typeof import('pdfjs-dist/legacy/build/pdf.worker.min.mjs');

let pdfJsModulePromise: Promise<PdfJsModule> | null = null;
let pdfWorkerModulePromise: Promise<PdfWorkerModule> | null = null;
let workerConfigured = false;

const getPdfJsModule = async (): Promise<PdfJsModule> => {
  if (!pdfJsModulePromise) {
    // The default PDF.js build assumes newer browser APIs that fail on older
    // mobile WebKit engines. Resume imports are already lazy-loaded, so favor
    // compatibility here.
    pdfJsModulePromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfJsModulePromise;
};

const getPdfWorkerModule = async (): Promise<PdfWorkerModule> => {
  if (!pdfWorkerModulePromise) {
    pdfWorkerModulePromise = import('pdfjs-dist/legacy/build/pdf.worker.min.mjs');
  }
  return pdfWorkerModulePromise;
};

const ensurePdfWorker = async (): Promise<void> => {
  if (workerConfigured) return;

  ensurePdfJsBrowserPolyfills();

  // Importing the worker module upfront registers `globalThis.pdfjsWorker`,
  // which makes PDF.js use its in-process fake worker path instead of trying
  // to bootstrap a module worker on browsers that handle that poorly.
  await getPdfWorkerModule();
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
    await ensurePdfWorker();
    const { getDocument } = await getPdfJsModule();

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

    if (error instanceof TypeError) {
      throw new Error(
        'This browser could not initialize PDF parsing. Update your browser or upload a DOCX or TXT file instead.',
      );
    }

    throw error;
  }
};
