import {
  HttpError,
  isRecord,
  sendJson,
  toString,
  type ApiRequest,
  type ApiResponse,
} from './_lib/admin.js';
import { authenticateUserRequest } from './_lib/user.js';
import {
  parseResumeData,
  parseTemplateId,
} from '../src/schemas/domain/resume.js';
import {
  DEFAULT_TEMPLATE_ID,
  INITIAL_RESUME_DATA,
} from '../src/types/resume.js';

export const config = {
  maxDuration: 30,
};

interface ApiRequestWithQuery extends ApiRequest {
  query?: Record<string, string | string[] | undefined>;
}

const getQueryValue = (
  req: ApiRequestWithQuery,
  key: string,
): string => {
  const value = req.query?.[key];
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0].trim() : '';
  }

  return typeof value === 'string' ? value.trim() : '';
};

const parseRequestBody = (req: ApiRequest): Record<string, unknown> => {
  let rawBody: unknown;

  if (typeof req.body === 'string') {
    try {
      rawBody = JSON.parse(req.body) as unknown;
    } catch {
      throw new HttpError(400, 'Invalid JSON request body.');
    }
  } else {
    rawBody = req.body ?? {};
  }

  if (!isRecord(rawBody)) {
    throw new HttpError(400, 'Invalid resume payload.');
  }

  return rawBody;
};

const parseCreateBody = (
  req: ApiRequest,
): { title: string; templateId: string; content: ReturnType<typeof parseResumeData> } => {
  const body = parseRequestBody(req);

  try {
    return {
      title: toString(body.title) || 'Untitled Resume',
      templateId: parseTemplateId(body.templateId ?? DEFAULT_TEMPLATE_ID),
      content:
        body.content === undefined ? INITIAL_RESUME_DATA : parseResumeData(body.content),
    };
  } catch {
    throw new HttpError(400, 'Invalid resume payload.');
  }
};

const parseUpdateBody = (
  req: ApiRequest,
): { title: string; templateId: string; content: ReturnType<typeof parseResumeData> } => {
  const body = parseRequestBody(req);

  try {
    return {
      title: toString(body.title) || 'Untitled Resume',
      templateId: parseTemplateId(body.templateId ?? DEFAULT_TEMPLATE_ID),
      content: parseResumeData(body.content),
    };
  } catch {
    throw new HttpError(400, 'Invalid resume payload.');
  }
};

export default async function handler(
  req: ApiRequestWithQuery,
  res: ApiResponse,
) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method ?? '')) {
    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    });
    return;
  }

  try {
    const { supabase, user } = await authenticateUserRequest(req, res);
    const resumeId = getQueryValue(req, 'id');

    if (req.method === 'GET') {
      if (resumeId) {
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', resumeId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new HttpError(404, 'Resume not found.');
        }

        sendJson(res, 200, { resume: data });
        return;
      }

      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      sendJson(res, 200, { resumes: Array.isArray(data) ? data : [] });
      return;
    }

    if (req.method === 'POST') {
      const { title, templateId, content } = parseCreateBody(req);
      const timestamp = new Date().toISOString();
      const { data, error } = await supabase
        .from('resumes')
        .insert([
          {
            user_id: user.id,
            title,
            template_id: templateId,
            content,
            updated_at: timestamp,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      sendJson(res, 201, { resume: data });
      return;
    }

    if (!resumeId) {
      throw new HttpError(400, 'Resume id is required.');
    }

    if (req.method === 'PUT') {
      const { title, templateId, content } = parseUpdateBody(req);
      const updatedAt = new Date().toISOString();
      const { data, error } = await supabase
        .from('resumes')
        .update({
          title,
          template_id: templateId,
          content,
          updated_at: updatedAt,
        })
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new HttpError(404, 'Resume not found.');
      }

      sendJson(res, 200, { resume: data });
      return;
    }

    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    sendJson(res, 200, { ok: true });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(res, error.status, {
        error: 'RESUMES_REQUEST_FAILED',
        message: error.message,
      });
      return;
    }

    sendJson(res, 500, {
      error: 'RESUMES_REQUEST_FAILED',
      message: error instanceof Error ? error.message : 'Unexpected resumes API error.',
    });
  }
}
