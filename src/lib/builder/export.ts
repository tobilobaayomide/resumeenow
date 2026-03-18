import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import type { ResumeData } from '../../domain/resume/types';
import type { TemplateId } from '../../domain/templates';
import { PDFDocument } from '../../components/builder/pdf/PDFDocument';


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
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Resume downloaded!', { id: toastId });
  } catch (error) {
    console.error('PDF Export Error:', error);
    toast.error('Failed to generate PDF.', { id: toastId });
  }
};
