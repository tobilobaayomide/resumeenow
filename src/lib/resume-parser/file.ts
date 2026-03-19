import { extractPdfText } from './pdf';
import { extractDocxText } from './docx';
import { readFileAsText } from './file-reader';
import { cleanupSectionText } from './text';

export const extractRawText = async (file: File): Promise<string> => {
  const lowerName = file.name.toLowerCase();
  
  if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractPdfText(file);
  }
  
  if (
    lowerName.endsWith('.docx') || 
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return cleanupSectionText(await extractDocxText(file));
  }
  
  if (lowerName.endsWith('.txt') || file.type === 'text/plain') {
    return cleanupSectionText(await readFileAsText(file));
  }

  throw new Error('Unsupported file format. Please upload a PDF, DOCX, or TXT file.');
};
