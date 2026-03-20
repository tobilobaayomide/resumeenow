import { normalizeResumeData } from '../types/resume';
import type { ParsedResumeResult } from '../types/parser';
import { parseResumeText } from './resume-parser/parse';
import { supabase } from './supabase';

const PDF_PARSE_ENDPOINT = '/api/parse-resume';

type ParseResumeResponse = ParsedResumeResult & {
  error?: string;
};

type ResponseError = Error & {
  status?: number;
};

const isPdfFile = (file: File): boolean => {
  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith('.pdf') || file.type === 'application/pdf';
};

const toServerResponseError = (status: number, message: string): ResponseError => {
  const error = new Error(message) as ResponseError;
  error.status = status;
  return error;
};

const getAccessToken = async (): Promise<string> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('Please sign in again to continue.');
  }

  return session.access_token;
};

const shouldFallbackToBrowserParse = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const responseError = error as ResponseError;
  return responseError.status === 404 || responseError.status === 405 || (responseError.status ?? 0) >= 500;
};

const parsePdfFileOnServer = async (file: File): Promise<ParsedResumeResult> => {
  const accessToken = await getAccessToken();
  const response = await fetch(PDF_PARSE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': file.type || 'application/pdf',
      'X-Resume-File-Name': encodeURIComponent(file.name),
    },
    body: file,
  });

  if (!response.ok) {
    const errorText = (await response.text()).trim();
    throw toServerResponseError(response.status, errorText || 'Failed to parse uploaded PDF.');
  }

  const payload = (await response.json()) as Partial<ParseResumeResponse> | null;
  if (!payload || typeof payload !== 'object' || !('data' in payload) || !payload.data) {
    throw new Error('Server returned an invalid resume parse response.');
  }

  return {
    data: normalizeResumeData(payload.data),
    suggestedTitle:
      typeof payload.suggestedTitle === 'string' && payload.suggestedTitle.trim()
        ? payload.suggestedTitle
        : file.name.replace(/\.[^.]+$/, '') || 'Imported Resume',
  };
};

export const parseResumeFile = async (file: File): Promise<ParsedResumeResult> => {
  try {
    if (isPdfFile(file)) {
      try {
        return await parsePdfFileOnServer(file);
      } catch (error) {
        if (!shouldFallbackToBrowserParse(error)) {
          throw error;
        }

        console.warn(
          '[ResumeParser] Server PDF parsing unavailable, falling back to browser parser.',
          error,
        );
      }
    }

    const { extractRawText } = await import('./resume-parser/file');
    const rawText = await extractRawText(file);
    return parseResumeText(rawText, file.name);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown parsing error';
    console.error('[ResumeParser] Critical failure:', error);
    throw new Error(`Resume parsing failed: ${message}. Try a different file format if this persists.`);
  }
};
