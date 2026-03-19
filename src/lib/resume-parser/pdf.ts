import {
  cleanupSectionText,
  isReadableDocumentText,
} from './text';
import { extractPdfPageLines, toPdfTextItem } from './pdf-text';
import { ensurePdfJsBrowserPolyfills } from './pdf-polyfills';
import { readFileAsArrayBuffer } from './file-reader';
// Vite ?url suffix: emit the worker as a static HTTPS asset at build time.
// We import the URL statically so Vite always includes the file in the output.
// This avoids blob: URLs (which mobile browsers block) and dynamic import()
// side-effects (which pdfjs-dist v5 no longer uses).
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

let pdfJsModulePromise: Promise<PdfJsModule> | null = null;
let activeWorker: Worker | null = null;
let workerConfigured = false;

const getPdfJsModule = async (): Promise<PdfJsModule> => {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfJsModulePromise;
};

const ensurePdfWorker = async (pdfJs: PdfJsModule): Promise<void> => {
  if (workerConfigured) return;

  ensurePdfJsBrowserPolyfills();

  try {
    // We own the Worker creation and use { type: 'module' } explicitly.
    //
    // Reason: pdfjs-dist v5 ships an ES-module worker (pdf.worker.min.mjs).
    // When PDF.js creates it internally via GlobalWorkerOptions.workerSrc it
    // calls `new Worker(src)` — a CLASSIC worker — which cannot execute ES
    // module syntax. Desktop Chrome silently accepts this; real iOS Safari and
    // older Android WebView throw a TypeError or DOMException, causing every
    // PDF parse attempt to fail.
    //
    // Passing our own Worker instance via workerPort bypasses PDF.js's internal
    // worker spawn logic entirely. We use { type: 'module' } so the ES module
    // worker file is loaded correctly on all modern mobile browsers.
    const worker = new Worker(pdfWorkerUrl, { type: 'module' });
    activeWorker = worker;
    // workerPort accepts a Worker — the types say MessagePort but Worker also
    // satisfies the required interface (postMessage + message events).
    (pdfJs.GlobalWorkerOptions as unknown as Record<string, unknown>).workerPort = worker;
  } catch (workerError) {
    console.warn('[ResumeParser] Module worker failed, falling back to main-thread mode:', workerError);
    // Last resort: empty workerSrc means PDF.js skips spawning a worker and
    // runs everything synchronously in the main thread. Slower but always works.
    pdfJs.GlobalWorkerOptions.workerSrc = '';
  }

  workerConfigured = true;
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
        .filter((item): item is NonNullable<ReturnType<typeof toPdfTextItem>> => item !== null);

      const lines = extractPdfPageLines(items);
      if (lines.length > 0) {
        pageTexts.push(lines.join('\n'));
      }
    }

    await loadingTask.destroy();

    // Don't terminate the worker — PDF.js reuses it across documents.
    // If we need to clean up (e.g. page unload), the caller can handle it.

    const joined = cleanupSectionText(pageTexts.join('\n\n'));
    if (!isReadableDocumentText(joined)) {
      throw new Error(
        'Unable to extract reliable text from this PDF. Try another PDF or paste your resume as plain text.',
      );
    }

    return joined;
  } catch (error: unknown) {
    console.error('[ResumeParser] PDF extraction failed:', error);

    // Reset worker state so next attempt gets a fresh worker.
    workerConfigured = false;
    if (activeWorker) {
      try { activeWorker.terminate(); } catch { /* ignore */ }
      activeWorker = null;
    }

    // Broadly catch any initialization failure — mobile browsers throw
    // TypeError, DOMException, or generic Error when workers fail to boot.
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
