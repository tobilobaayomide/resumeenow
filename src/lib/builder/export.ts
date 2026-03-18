import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import type { ResumeData } from '../../domain/resume/types';
import type { TemplateId } from '../../domain/templates';
import { PDFDocument } from '../../components/builder/pdf/PDFDocument';

const isSafariBrowser = (): boolean => {
  const ua = window.navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|CriOS|Chromium|Android|FxiOS|EdgiOS|OPiOS|OPR|SamsungBrowser/i.test(ua);
};

const triggerAnchorDownload = (url: string, fileName: string): void => {
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const openPdfForSafari = (url: string): void => {
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    window.location.href = url;
  }
};

const sharePdfFile = async (blob: Blob, fileName: string): Promise<boolean> => {
  if (typeof window.navigator.share !== 'function') {
    return false;
  }

  try {
    const file = new File([blob], `${fileName}.pdf`, { type: 'application/pdf' });
    if (typeof window.navigator.canShare === 'function' && !window.navigator.canShare({ files: [file] })) {
      return false;
    }

    await window.navigator.share({
      title: fileName,
      files: [file],
    });

    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return true;
    }

    return false;
  }
};

export const downloadResumeAsPdf = async (
  fileName: string,
  data: ResumeData,
  templateId: TemplateId,
): Promise<void> => {
  const toastId = toast.loading('Generating PDF...');

  try {
    const element = React.createElement(PDFDocument, { data, templateId }) as any;
    const blob = await pdf(element).toBlob();
    const url = URL.createObjectURL(blob);
    const isSafari = isSafariBrowser();

    if (isSafari) {
      const shared = await sharePdfFile(blob, fileName);
      if (shared) {
        URL.revokeObjectURL(url);
        toast.success('PDF ready to save or share.', { id: toastId });
        return;
      }

      openPdfForSafari(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success('PDF opened in Safari. Use Share to save it to Files.', { id: toastId });
      return;
    }

    triggerAnchorDownload(url, fileName);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('Resume downloaded!', { id: toastId });
  } catch (error) {
    console.error('PDF Export Error:', error);
    toast.error('Failed to generate PDF.', { id: toastId });
  }
};
