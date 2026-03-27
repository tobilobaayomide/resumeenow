import React from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';
import type { ResumeData } from '../../domain/resume/types';
import type { TemplateId } from '../../domain/templates';
import { HtmlTemplateDocument } from '../../components/builder/preview/HtmlTemplateDocument';
import { getValidAccessToken } from '../auth/accessToken';

const PRINT_HOST_ID = 'resume-print-host';
const PDF_EXPORT_ENDPOINT = '/api/export-pdf';

const isInvalidFileNameCharacter = (char: string): boolean =>
  /[<>:"/\\|?*]/.test(char) || char.charCodeAt(0) < 32;

const sanitizeFileName = (value: string): string =>
  Array.from(value.trim())
    .filter((char) => !isInvalidFileNameCharacter(char))
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '');

const triggerBlobDownload = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(fileName || 'Resume') || 'Resume'}.pdf`;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

const requestPdfExport = async (
  fileName: string,
  data: ResumeData,
  templateId: TemplateId,
): Promise<Blob> => {
  const accessToken = await getValidAccessToken('Please sign in again to continue.');
  const response = await fetch(PDF_EXPORT_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName,
      data,
      templateId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to export PDF.');
  }

  return response.blob();
};

const waitForPrintableRender = async (): Promise<void> => {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

  if ('fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness failures and continue to print.
    }
  }

  await new Promise((resolve) => window.setTimeout(resolve, 300));
};

export const downloadResumeAsPdf = async (
  fileName: string,
  data: ResumeData,
  templateId: TemplateId,
): Promise<void> => {
  const toastId = toast.loading('Preparing PDF download...');

  try {
    const pdfBlob = await requestPdfExport(fileName, data, templateId);
    triggerBlobDownload(pdfBlob, fileName);
    toast.success('PDF download ready.', { id: toastId });
    return;
  } catch (error) {
    console.error('Server PDF export failed, falling back to print flow.', error);
  }

  toast.loading('Falling back to print preview...', { id: toastId });
  let root: ReturnType<typeof createRoot> | null = null;
  let host: HTMLDivElement | null = null;

  try {
    host = document.createElement('div');
    host.id = PRINT_HOST_ID;
    host.className = 'resume-print-host';
    document.body.appendChild(host);

    const container = document.createElement('div');
    container.className = 'resume-print-shell';
    host.appendChild(container);

    const previousTitle = document.title;
    if (fileName) {
      document.title = fileName;
    }

    root = createRoot(container);
    root.render(
      React.createElement(HtmlTemplateDocument, {
        data,
        templateId,
        zoom: 1,
        pageGap: 0,
        withShadow: false,
      }),
    );

    await waitForPrintableRender();

    document.body.classList.add('resume-printing');

    const cleanup = () => {
      document.body.classList.remove('resume-printing');
      root?.unmount();
      host?.remove();
      document.title = previousTitle;
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    toast.success('Print dialog opened. Use Save as PDF to download.', { id: toastId });
  } catch (error) {
    document.body.classList.remove('resume-printing');
    root?.unmount();
    host?.remove();
    console.error('HTML Export Error:', error);
    toast.error('Failed to open print preview.', { id: toastId });
  }
};
