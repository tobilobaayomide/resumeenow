import React from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';
import type { ResumeData } from '../../domain/resume/types';
import type { TemplateId } from '../../domain/templates';
import { HtmlTemplateDocument } from '../../components/builder/preview/HtmlTemplateDocument';

const PRINT_HOST_ID = 'resume-print-host';

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
  const toastId = toast.loading('Preparing print preview...');
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
      document.title = `${fileName}.pdf`;
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
