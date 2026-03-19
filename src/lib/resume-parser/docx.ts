import mammoth from 'mammoth';
import { readFileAsArrayBuffer } from './file-reader.js';

export const extractDocxText = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to parse DOCX file. Ensure the file is not corrupted or password-protected.');
  }
};
