const BULLET_PREFIX_REGEX = /^[•●◦▪‣*-]\s+/;

const normalizeLine = (value: string): string => value.trim();

export const toDescriptionBullets = (value: string): string[] => {
  const normalized = value.replace(/\r/g, '\n').trim();
  if (!normalized) return [];

  const lines = normalized
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean);

  if (lines.length === 0) return [];

  const hasExplicitBullet = lines.some((line) => BULLET_PREFIX_REGEX.test(line));
  if (hasExplicitBullet) {
    return lines
      .map((line) => line.replace(BULLET_PREFIX_REGEX, '').trim())
      .filter(Boolean);
  }

  if (lines.length > 1) {
    return lines;
  }

  const sentenceBullets = normalized
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((line) => line.trim())
    .filter(Boolean);

  return sentenceBullets.length > 1 ? sentenceBullets : [];
};
