import { stripInlineFormattingText } from "./inlineFormatting.js";

const BULLET_PREFIX_REGEX = /^[•●◦▪‣*-]\s+/;

const normalizeLine = (value: string): string => value.trim();

const toNormalizedNonEmptyBullets = (bullets: string[]): string[] =>
  bullets
    .map((bullet) => normalizeDescriptionBulletText(bullet))
    .filter(Boolean);

const clampBulletIndex = (value: number, max: number): number => {
  if (max <= 0) return 0;
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.trunc(value), 0), max);
};

export const normalizeDescriptionBulletText = (value: string): string =>
  value
    .replace(/\r/g, " ")
    .replace(BULLET_PREFIX_REGEX, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeDescriptionBulletComparisonText = (value: string): string =>
  stripInlineFormattingText(normalizeDescriptionBulletText(value))
    .replace(/\s+/g, " ")
    .trim();

export const toDescriptionBullets = (value: string): string[] => {
  const normalized = value.replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  const lines = normalized
    .split("\n")
    .map(normalizeLine)
    .filter(Boolean);

  if (lines.length === 0) return [];

  const hasExplicitBullet = lines.some((line) => BULLET_PREFIX_REGEX.test(line));
  if (hasExplicitBullet) {
    return lines
      .map((line) => line.replace(BULLET_PREFIX_REGEX, "").trim())
      .filter(Boolean);
  }

  if (lines.length > 1) {
    return lines;
  }

  const sentenceBullets = normalized
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((line) => line.trim())
    .filter(Boolean);

  return sentenceBullets.length > 1 ? sentenceBullets : [];
};

export const toEditableDescriptionBullets = (value: string): string[] => {
  const bullets = toDescriptionBullets(value);
  if (bullets.length > 0) {
    return bullets.map((bullet) => normalizeDescriptionBulletText(bullet));
  }

  const normalized = value.replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  const lines = normalized
    .split("\n")
    .map((line) => normalizeDescriptionBulletText(line))
    .filter(Boolean);

  return lines.length > 0 ? lines : [normalizeDescriptionBulletText(normalized)];
};

export const formatEditableDescriptionBullets = (bullets: string[]): string =>
  toNormalizedNonEmptyBullets(bullets)
    .map((bullet) => `• ${bullet}`)
    .join("\n");

const formatBulletList = (bullets: string[]): string =>
  formatEditableDescriptionBullets(bullets);

export const replaceDescriptionBulletAtIndex = (
  description: string,
  index: number,
  nextBullet: string,
): string => {
  const bullets = toEditableDescriptionBullets(description);
  if (bullets.length === 0) {
    return formatEditableDescriptionBullets([nextBullet]);
  }

  const nextBullets = [...bullets];
  nextBullets[clampBulletIndex(index, nextBullets.length - 1)] = nextBullet;
  return formatEditableDescriptionBullets(nextBullets);
};

export const removeDescriptionBulletAtIndex = (
  description: string,
  index: number,
): string => {
  const bullets = toEditableDescriptionBullets(description);
  if (bullets.length === 0) return "";

  const nextBullets = bullets.filter(
    (_bullet, bulletIndex) =>
      bulletIndex !== clampBulletIndex(index, bullets.length - 1),
  );
  return formatEditableDescriptionBullets(nextBullets);
};

export const insertDescriptionBulletAtIndex = (
  description: string,
  index?: number,
  nextBullet = "",
): string => {
  const bullets = toEditableDescriptionBullets(description);
  const insertionIndex = clampBulletIndex(index ?? bullets.length, bullets.length);
  const nextBullets = [...bullets];
  nextBullets.splice(insertionIndex, 0, nextBullet);
  return formatEditableDescriptionBullets(nextBullets);
};

export const moveDescriptionBullet = (
  description: string,
  fromIndex: number,
  toIndex: number,
): string => {
  const bullets = toEditableDescriptionBullets(description);
  if (bullets.length <= 1) return formatEditableDescriptionBullets(bullets);

  const from = clampBulletIndex(fromIndex, bullets.length - 1);
  const to = clampBulletIndex(toIndex, bullets.length - 1);
  if (from === to) return formatEditableDescriptionBullets(bullets);

  const nextBullets = [...bullets];
  const [movedBullet] = nextBullets.splice(from, 1);
  nextBullets.splice(to, 0, movedBullet);
  return formatEditableDescriptionBullets(nextBullets);
};

export const findMatchingDescriptionBullet = (
  description: string,
  candidate: string,
): string | null => {
  const normalizedCandidate = normalizeDescriptionBulletComparisonText(
    candidate,
  );
  if (!normalizedCandidate) return null;

  const bullets = toEditableDescriptionBullets(description);
  const match = bullets.find(
    (bullet) =>
      normalizeDescriptionBulletComparisonText(bullet) === normalizedCandidate,
  );

  return match || null;
};

export const replaceDescriptionBullet = (
  description: string,
  current: string,
  better: string,
): string | null => {
  const normalizedCurrent = normalizeDescriptionBulletComparisonText(current);
  const normalizedBetter = normalizeDescriptionBulletText(better);
  if (!normalizedCurrent || !normalizedBetter) return null;

  const bullets = toEditableDescriptionBullets(description);
  const index = bullets.findIndex(
    (bullet) =>
      normalizeDescriptionBulletComparisonText(bullet) === normalizedCurrent,
  );

  if (index === -1) return null;

  const nextBullets = [...bullets];
  nextBullets[index] = normalizedBetter;
  return formatBulletList(nextBullets);
};

export const appendDescriptionBullet = (
  description: string,
  addition: string,
): string => {
  const normalizedAddition = normalizeDescriptionBulletText(addition);
  if (!normalizedAddition) return description.trim();

  const bullets = toEditableDescriptionBullets(description);
  const alreadyExists = bullets.some(
    (bullet) =>
      normalizeDescriptionBulletComparisonText(bullet) ===
      normalizeDescriptionBulletComparisonText(normalizedAddition),
  );

  return formatBulletList(alreadyExists ? bullets : [...bullets, normalizedAddition]);
};
