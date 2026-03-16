import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

/**
 * Generates a PDF from the resume preview pages and triggers a download.
 * Bypasses the browser print dialog to avoid unwanted headers/footers.
 */
export const downloadResumeAsPdf = async (fileName: string): Promise<void> => {
  const container = document.getElementById('resume-preview-container');
  if (!container) {
    toast.error('Resume preview not found. Please try again.');
    return;
  }

  const pages = container.querySelectorAll('[data-export-page="true"]');
  if (pages.length === 0) {
    toast.error('No pages found to export.');
    return;
  }

  const toastId = toast.loading('Generating high-quality PDF...');

  try {
    // A4 dimensions in pt: 595.28 x 841.89
    // We use a portrait orientation
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        // Temporarily reset transform for capture
        const originalTransform = page.style.transform;
        const originalMargin = page.style.marginBottom;
        
        page.style.transform = 'none';
        page.style.marginBottom = '0px';

        const canvas = await html2canvas(page, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794, // Fixed A4 width in px
            windowHeight: 1123, // Fixed A4 height in px
        });

        // Restore original styles
        page.style.transform = originalTransform;
        page.style.marginBottom = originalMargin;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) {
            pdf.addPage();
        }

        // Add image to PDF, filling the A4 page (595x842 pts)
        pdf.addImage(imgData, 'JPEG', 0, 0, 595.28, 841.89, undefined, 'FAST');
    }

    pdf.save(`${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    toast.success('Resume downloaded successfully!', { id: toastId });
  } catch (error) {
    console.error('PDF Export Error:', error);
    toast.error('Failed to generate PDF. Please try the print option.', { id: toastId });
  }
};
