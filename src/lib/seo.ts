export type SeoStructuredData =
  | Record<string, unknown>
  | Array<Record<string, unknown>>;

const DEFAULT_SITE_URL = 'https://resumeenow.com';
const DEFAULT_IMAGE_PATH = '/resumeenowlogo.png';

const normalizeSiteUrl = (value: string | undefined): string => {
  if (!value) return DEFAULT_SITE_URL;

  try {
    return new URL(value).toString().replace(/\/+$/, '');
  } catch {
    return DEFAULT_SITE_URL;
  }
};

export const SEO_SITE_NAME = 'ResumeeNow';
export const SEO_SITE_URL = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
export const SEO_DEFAULT_IMAGE_URL = new URL(DEFAULT_IMAGE_PATH, `${SEO_SITE_URL}/`).toString();

export const buildSeoUrl = (path = '/'): string =>
  new URL(path, `${SEO_SITE_URL}/`).toString();

export const buildSeoImageUrl = (path = DEFAULT_IMAGE_PATH): string =>
  new URL(path, `${SEO_SITE_URL}/`).toString();
