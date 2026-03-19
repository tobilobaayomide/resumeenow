import { RESUME_PARSER_NOISE_PATTERNS as NOISE_PATTERNS } from '../../data/parser/index.js';

export const cleanLine = (value: string): string => value.replace(/\s+/g, ' ').trim();

const countMatches = (value: string, regex: RegExp): number => value.match(regex)?.length ?? 0;

export const cleanupSectionText = (text: string): string =>
  text
    .replaceAll('\u0000', ' ')
    .replace(/[\t\f\v]/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \u00a0]{2,}/g, ' ')
    .trim();

const hasHighTokenRepetition = (line: string): boolean => {
  const words = line.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 6) return false;

  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  const max = Math.max(...counts.values());
  return max / words.length > 0.45;
};

export const isNoiseLine = (line: string): boolean => {
  const text = cleanLine(line);
  if (!text) return true;

  if (NOISE_PATTERNS.some((pattern) => pattern.test(text))) return true;
  if (hasHighTokenRepetition(text)) return true;

  const weirdChars = countMatches(text, /[^A-Za-z0-9\s.,;:()\-&/@+#'%]/g);
  const weirdRatio = weirdChars / Math.max(text.length, 1);
  return weirdRatio > 0.18;
};

export const isReadableDocumentText = (value: string): boolean => {
  const text = cleanupSectionText(value);
  if (text.length < 80) return false;

  const words = text.split(/\s+/).filter(Boolean);
  const alphaWords = words.filter((word) => /[A-Za-z]{2,}/.test(word)).length;
  const weirdChars = countMatches(text, /[^A-Za-z0-9\s.,;:()\-&/@+#'%]/g);
  const weirdRatio = weirdChars / Math.max(text.length, 1);

  return alphaWords >= 12 && alphaWords / Math.max(words.length, 1) > 0.3 && weirdRatio < 0.12;
};

export const splitLines = (text: string): string[] =>
  text
    .split('\n')
    .map(cleanLine)
    .filter((line) => Boolean(line) && !isNoiseLine(line));

const normalizeLineFingerprint = (line: string): string =>
  line.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export const dedupeRepeatedHalves = (lines: string[]): string[] => {
  if (lines.length < 80) return lines;

  const removeOneDuplicateChunk = (value: string[]): string[] => {
    const maxHalf = Math.floor(value.length / 2);
    for (let size = maxHalf; size >= 40; size -= 1) {
      if (size * 2 > value.length) continue;

      let matches = 0;
      for (let index = 0; index < size; index += 1) {
        if (normalizeLineFingerprint(value[index]) === normalizeLineFingerprint(value[index + size])) {
          matches += 1;
        }
      }

      if (matches / size >= 0.9) {
        return [...value.slice(0, size), ...value.slice(size * 2)];
      }
    }

    // Fallback: some PDFs append a near-duplicate copy of the whole resume
    // with slight punctuation differences, so exact half-splitting misses it.
    for (let offset = 40; offset <= value.length - 40; offset += 1) {
      const maxSize = Math.min(offset, value.length - offset);
      if (maxSize < 60) continue;
      if (maxSize / value.length < 0.4) continue;

      let matches = 0;
      for (let index = 0; index < maxSize; index += 1) {
        if (
          normalizeLineFingerprint(value[index])
          === normalizeLineFingerprint(value[offset + index])
        ) {
          matches += 1;
        }
      }

      if (matches / maxSize >= 0.88) {
        return [...value.slice(0, offset), ...value.slice(offset + maxSize)];
      }
    }

    return value;
  };

  let deduped = lines;
  while (true) {
    const next = removeOneDuplicateChunk(deduped);
    if (next.length === deduped.length) break;
    deduped = next;
    if (deduped.length < 80) break;
  }

  // Last-resort fallback for resumes where the full document is re-rendered
  // multiple times with different clipping/page artifacts.
  const firstFingerprint = normalizeLineFingerprint(deduped[0] ?? '');
  if (firstFingerprint) {
    for (let offset = 40; offset <= deduped.length - 40; offset += 1) {
      if (normalizeLineFingerprint(deduped[offset] ?? '') !== firstFingerprint) continue;

      const compareSize = Math.min(140, deduped.length - offset);
      if (compareSize < 80) continue;

      let matches = 0;
      for (let index = 0; index < compareSize; index += 1) {
        if (
          normalizeLineFingerprint(deduped[index] ?? '')
          === normalizeLineFingerprint(deduped[offset + index] ?? '')
        ) {
          matches += 1;
        }
      }

      if (matches / compareSize >= 0.75) {
        deduped = deduped.slice(0, offset);
        break;
      }
    }
  }

  return deduped;
};
