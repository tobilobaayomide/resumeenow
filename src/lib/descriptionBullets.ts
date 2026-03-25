const BULLET_PREFIX_REGEX = /^[•●◦▪‣*-]\s+/;

const normalizeLine = (value: string): string => value.trim();

export const normalizeDescriptionBulletText = (value: string): string =>
  value
    .replace(/\r/g, " ")
    .replace(BULLET_PREFIX_REGEX, "")
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

const formatBulletList = (bullets: string[]): string =>
  bullets
    .map((bullet) => normalizeDescriptionBulletText(bullet))
    .filter(Boolean)
    .map((bullet) => `• ${bullet}`)
    .join("\n");

export const findMatchingDescriptionBullet = (
  description: string,
  candidate: string,
): string | null => {
  const normalizedCandidate = normalizeDescriptionBulletText(candidate);
  if (!normalizedCandidate) return null;

  const bullets = toEditableDescriptionBullets(description);
  const match = bullets.find(
    (bullet) => normalizeDescriptionBulletText(bullet) === normalizedCandidate,
  );

  return match || null;
};

export const replaceDescriptionBullet = (
  description: string,
  current: string,
  better: string,
): string | null => {
  const normalizedCurrent = normalizeDescriptionBulletText(current);
  const normalizedBetter = normalizeDescriptionBulletText(better);
  if (!normalizedCurrent || !normalizedBetter) return null;

  const bullets = toEditableDescriptionBullets(description);
  const index = bullets.findIndex(
    (bullet) => normalizeDescriptionBulletText(bullet) === normalizedCurrent,
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
    (bullet) => normalizeDescriptionBulletText(bullet) === normalizedAddition,
  );

  return formatBulletList(alreadyExists ? bullets : [...bullets, normalizedAddition]);
};
