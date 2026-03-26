import type {
  BuilderAiHighlightFocusTarget,
  BuilderAiHighlights,
} from '../../types/builder';
import { getActiveSkillItems, type ResumeData } from '../../types/resume';

export const EMPTY_BUILDER_AI_HIGHLIGHTS: BuilderAiHighlights = {
  summary: false,
  skills: [],
  experience: {},
};

const normalizeBuilderAiText = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

const normalizeBuilderAiTextList = (values: string[]): string[] => {
  const seen = new Set<string>();

  return values.reduce<string[]>((acc, value) => {
    const trimmed = value.trim();
    if (!trimmed) return acc;

    const key = normalizeBuilderAiText(trimmed);
    if (seen.has(key)) return acc;

    seen.add(key);
    acc.push(trimmed);
    return acc;
  }, []);
};

const normalizeBuilderAiExperienceHighlights = (
  experience?: Record<string, string[]>,
): Record<string, string[]> =>
  Object.fromEntries(
    Object.entries(experience ?? {})
      .map(([experienceId, bullets]) => [
        experienceId,
        normalizeBuilderAiTextList(bullets),
      ])
      .filter(([, bullets]) => bullets.length > 0),
  );

export const normalizeBuilderAiHighlights = (
  highlights?: Partial<BuilderAiHighlights>,
): BuilderAiHighlights => ({
  summary: Boolean(highlights?.summary),
  skills: normalizeBuilderAiTextList(highlights?.skills ?? []),
  experience: normalizeBuilderAiExperienceHighlights(highlights?.experience),
});

export const mergeBuilderAiHighlights = (
  current: BuilderAiHighlights,
  next?: Partial<BuilderAiHighlights>,
): BuilderAiHighlights => {
  const normalizedNext = normalizeBuilderAiHighlights(next);

  return {
    summary: current.summary || normalizedNext.summary,
    skills: normalizeBuilderAiTextList([
      ...current.skills,
      ...normalizedNext.skills,
    ]),
    experience: Object.fromEntries(
      Array.from(
        new Set([
          ...Object.keys(current.experience),
          ...Object.keys(normalizedNext.experience),
        ]),
      ).reduce<Array<[string, string[]]>>((acc, experienceId) => {
        const mergedBullets = normalizeBuilderAiTextList([
          ...(current.experience[experienceId] ?? []),
          ...(normalizedNext.experience[experienceId] ?? []),
        ]);

        if (mergedBullets.length > 0) {
          acc.push([experienceId, mergedBullets]);
        }

        return acc;
      }, []),
    ),
  };
};

export const removeBuilderAiHighlight = (
  current: BuilderAiHighlights,
  target: BuilderAiHighlightFocusTarget,
): BuilderAiHighlights => {
  if (target.section === 'summary') {
    return { ...current, summary: false };
  }

  if (target.section === 'skills') {
    if (!target.skill) {
      return { ...current, skills: [] };
    }

    return {
      ...current,
      skills: current.skills.filter(
        (skill) => normalizeBuilderAiText(skill) !== normalizeBuilderAiText(target.skill!),
      ),
    };
  }

  if (!target.experienceId) {
    return current;
  }

  return {
    ...current,
    experience: Object.fromEntries(
      Object.entries(current.experience).filter(
        ([experienceId]) => experienceId !== target.experienceId,
      ),
    ),
  };
};

export const hasBuilderAiHighlights = (
  highlights: BuilderAiHighlights,
): boolean =>
  highlights.summary ||
  highlights.skills.length > 0 ||
  Object.values(highlights.experience).some((bullets) => bullets.length > 0);

export const getBuilderAiHighlightCount = (
  highlights: BuilderAiHighlights,
): number =>
  Number(highlights.summary) +
  highlights.skills.length +
  Object.values(highlights.experience).reduce(
    (count, bullets) => count + bullets.length,
    0,
  );

export const getFirstBuilderAiHighlightFocus = (
  highlights: BuilderAiHighlights,
): BuilderAiHighlightFocusTarget | null => {
  if (highlights.summary) {
    return { section: 'summary' };
  }

  if (highlights.skills.length > 0) {
    return { section: 'skills' };
  }

  const firstExperienceId = Object.keys(highlights.experience)[0];
  if (firstExperienceId) {
    return {
      section: 'experience',
      experienceId: firstExperienceId,
    };
  }

  return null;
};

export const getBuilderAiHighlightAnchor = (
  target: BuilderAiHighlightFocusTarget,
): string =>
  target.section === 'experience' && target.experienceId
    ? `experience-${target.experienceId}`
    : target.section;

export const isBuilderAiTextHighlighted = (
  highlightedValues: string[],
  candidate: string,
): boolean =>
  highlightedValues.some(
    (value) => normalizeBuilderAiText(value) === normalizeBuilderAiText(candidate),
  );

export const getBuilderAiExperienceHighlights = (
  highlights: BuilderAiHighlights,
  experienceId: string,
): string[] => highlights.experience[experienceId] ?? [];

export const createBuilderAiExperienceHighlights = (
  entries: Array<{ experienceId: string; text: string }>,
): Record<string, string[]> =>
  entries.reduce<Record<string, string[]>>((acc, entry) => {
    const text = entry.text.trim();
    if (!text) return acc;

    acc[entry.experienceId] = normalizeBuilderAiTextList([
      ...(acc[entry.experienceId] ?? []),
      text,
    ]);

    return acc;
  }, {});

export const collectAddedBuilderAiSkills = (
  previousSkills: ResumeData['skills'],
  nextSkills: ResumeData['skills'],
): string[] => {
  const previousKeys = new Set(
    getActiveSkillItems(previousSkills).map((skill) => normalizeBuilderAiText(skill)),
  );

  return normalizeBuilderAiTextList(
    getActiveSkillItems(nextSkills).filter(
      (skill) => !previousKeys.has(normalizeBuilderAiText(skill)),
    ),
  );
};
