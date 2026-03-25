export const sanitizeAiPlainText = (value: string | null | undefined): string =>
  (value || '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,;:!?])/g, '$1$2')
    .replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,;:!?])/g, '$1$2')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .trim();

export const sanitizeAiKeywordList = (
  values: Array<string | null | undefined> | null | undefined,
): string[] =>
  (values || [])
    .map((value) => sanitizeAiPlainText(value))
    .filter(Boolean);
