import type {
  ResumeSkillGroup,
  ResumeSkillsMode,
  ResumeSkillsSection,
} from "./types.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toString = (value: unknown): string => (typeof value === "string" ? value : "");

const toUniqueStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const next: string[] = [];

  value.forEach((item) => {
    if (typeof item !== "string") return;
    const trimmed = item.trim();
    if (!trimmed) return;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    next.push(trimmed);
  });

  return next;
};

const normalizeSkillGroup = (value: unknown, index: number): ResumeSkillGroup | null => {
  if (!isRecord(value)) return null;

  const label = toString(value.label).trim();
  const items = toUniqueStringArray(value.items);
  if (!label && items.length === 0) return null;

  return {
    id: toString(value.id).trim() || `skills-group-${index + 1}`,
    label,
    items,
  };
};

const normalizeSkillGroups = (value: unknown): ResumeSkillGroup[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => normalizeSkillGroup(item, index))
    .filter((item): item is ResumeSkillGroup => item !== null);
};

const coerceMode = (value: unknown): ResumeSkillsMode =>
  value === "grouped" ? "grouped" : "list";

export const EMPTY_SKILLS_SECTION: ResumeSkillsSection = {
  mode: "list",
  list: [],
  groups: [],
};

export const flattenSkillGroups = (groups: ResumeSkillGroup[]): string[] => {
  const seen = new Set<string>();
  const flat: string[] = [];

  groups.forEach((group) => {
    group.items.forEach((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      flat.push(item);
    });
  });

  return flat;
};

export const getActiveSkillItems = (skills: ResumeSkillsSection): string[] => {
  if (skills.mode === "grouped") {
    const groupedItems = flattenSkillGroups(skills.groups);
    return groupedItems.length > 0 ? groupedItems : skills.list;
  }

  return skills.list;
};

export const hasSkills = (skills: ResumeSkillsSection): boolean =>
  getActiveSkillItems(skills).length > 0;

export const normalizeSkillsSection = (value: unknown): ResumeSkillsSection => {
  // Backward compatibility: legacy resumes stored `skills` as `string[]`.
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return {
      mode: "list",
      list: toUniqueStringArray(value),
      groups: [],
    };
  }

  // Compatibility: accept array of groups directly.
  if (
    Array.isArray(value) &&
    value.some((item) => isRecord(item) && (item.label !== undefined || item.items !== undefined))
  ) {
    const groups = normalizeSkillGroups(value);
    return {
      mode: "grouped",
      list: flattenSkillGroups(groups),
      groups,
    };
  }

  if (!isRecord(value)) return EMPTY_SKILLS_SECTION;

  const list = toUniqueStringArray(value.list);
  const groups = normalizeSkillGroups(value.groups);
  const mode = coerceMode(value.mode);

  if (mode === "grouped") {
    const groupedList = flattenSkillGroups(groups);
    return {
      mode,
      list: groupedList.length > 0 ? groupedList : list,
      groups,
    };
  }

  return {
    mode: "list",
    list,
    groups,
  };
};

export const toGroupedSkills = (
  skills: ResumeSkillsSection,
  label = "Core Skills",
): ResumeSkillsSection => {
  if (skills.mode === "grouped") return skills;

  const items = skills.list;
  const groups =
    items.length > 0
      ? [
          {
            id: "skills-group-1",
            label,
            items,
          },
        ]
      : [];

  return {
    mode: "grouped",
    list: items,
    groups,
  };
};

export const toListSkills = (skills: ResumeSkillsSection): ResumeSkillsSection => ({
  mode: "list",
  list: getActiveSkillItems(skills),
  groups: skills.groups,
});
