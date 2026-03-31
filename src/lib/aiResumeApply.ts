import {
  getActiveSkillItems,
  normalizeSkillsSection,
  type ResumeSkillGroup,
  type ResumeSkillsSection,
} from "../types/resume.js";
import { sanitizeAiPlainText } from "./aiText.js";

export type AiSkillGroupSuggestion = {
  label: string;
  items: string[];
};

type SkillDescriptor = {
  display: string;
  key: string;
  normalized: string;
  tokens: Set<string>;
};

type GroupState = {
  id: string;
  label: string;
  labelTokens: Set<string>;
  items: string[];
  itemDescriptors: SkillDescriptor[];
};

const STOP_TOKENS = new Set([
  "and",
  "the",
  "for",
  "with",
  "of",
  "to",
  "a",
  "an",
]);

const SKILL_NORMALIZATION_RULES: Array<[RegExp, string]> = [
  [/\breact\.?js\b/g, "react"],
  [/\bnext\.?js\b/g, "next"],
  [/\bnode\.?js\b/g, "node"],
  [/\bvue\.?js\b/g, "vue"],
  [/\bhtml5\b/g, "html"],
  [/\bcss3\b/g, "css"],
  [/\bci\s*\/\s*cd\b/g, "ci cd"],
  [/\bapis\b/g, "api"],
  [/\bframeworks\b/g, "framework"],
  [/\blanguages\b/g, "language"],
  [/\bdatabases\b/g, "database"],
  [/\btools\b/g, "tool"],
];

const MIN_GROUP_MATCH_SCORE = 8;
const FALLBACK_GROUP_LABEL = "Additional Skills";
const FALLBACK_GROUP_ID = "skills-group-additional";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeSkillName = (value: string): string =>
  sanitizeAiPlainText(value).replace(/\s+/g, " ").trim();

const normalizeSearchText = (value: string): string => {
  let normalized = normalizeSkillName(value).toLowerCase();

  SKILL_NORMALIZATION_RULES.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement);
  });

  return normalized
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeGroupLabel = (value: string): string =>
  normalizeSkillName(value) || FALLBACK_GROUP_LABEL;

const toSkillKey = (value: string): string => normalizeSearchText(value);

const toTokenSet = (value: string): Set<string> =>
  new Set(
    normalizeSearchText(value)
      .split(" ")
      .map((token) => token.trim())
      .filter(Boolean)
      .filter((token) => !STOP_TOKENS.has(token)),
  );

const countSharedTokens = (left: Set<string>, right: Set<string>): number => {
  let count = 0;
  left.forEach((token) => {
    if (right.has(token)) count += 1;
  });
  return count;
};

const toUniqueSkills = (skills: string[]): string[] => {
  const seen = new Set<string>();
  const next: string[] = [];

  skills.forEach((skill) => {
    const normalized = normalizeSkillName(skill);
    if (!normalized) return;

    const key = toSkillKey(normalized);
    if (seen.has(key)) return;

    seen.add(key);
    next.push(normalized);
  });

  return next;
};

const slugify = (value: string): string =>
  normalizeSearchText(value).replace(/\s+/g, "-") || "additional";

const createUniqueGroupId = (groups: GroupState[], label: string): string => {
  const baseId = `skills-group-${slugify(label)}`;
  const existingIds = new Set(groups.map((group) => group.id));
  if (!existingIds.has(baseId)) return baseId;

  let counter = 2;
  while (existingIds.has(`${baseId}-${counter}`)) {
    counter += 1;
  }

  return `${baseId}-${counter}`;
};

const buildSkillDescriptor = (value: string): SkillDescriptor => {
  const display = normalizeSkillName(value);
  return {
    display,
    key: toSkillKey(display),
    normalized: normalizeSearchText(display),
    tokens: toTokenSet(display),
  };
};

const buildGroupState = (group: ResumeSkillGroup): GroupState => {
  const items = toUniqueSkills(group.items);
  return {
    id: group.id,
    label: normalizeGroupLabel(group.label),
    labelTokens: toTokenSet(group.label),
    items,
    itemDescriptors: items.map((item) => buildSkillDescriptor(item)),
  };
};

const createGroupState = (
  groups: GroupState[],
  label: string,
  items: string[],
): GroupState =>
  buildGroupState({
    id: createUniqueGroupId(groups, label),
    label: normalizeGroupLabel(label),
    items,
  });

const addSkillToGroupState = (group: GroupState, skill: SkillDescriptor) => {
  if (group.itemDescriptors.some((item) => item.key === skill.key)) return;

  const items = toUniqueSkills([...group.items, skill.display]);
  const next = buildGroupState({
    id: group.id,
    label: group.label,
    items,
  });

  group.label = next.label;
  group.labelTokens = next.labelTokens;
  group.items = next.items;
  group.itemDescriptors = next.itemDescriptors;
};

const ensureGroupedState = (
  skills: ResumeSkillsSection,
  existingSkills: string[],
): GroupState[] => {
  const groups = skills.groups.map((group) => buildGroupState(group));
  if (groups.length > 0 || existingSkills.length === 0) return groups;

  return [
    buildGroupState({
      id: "skills-group-1",
      label: "Core Skills",
      items: existingSkills,
    }),
  ];
};

const scoreSkillAgainstGroup = (
  skill: SkillDescriptor,
  group: GroupState,
): number => {
  let score = 0;
  score += countSharedTokens(skill.tokens, group.labelTokens) * 4;

  group.itemDescriptors.forEach((item) => {
    if (skill.key === item.key) {
      score += 20;
      return;
    }

    const sharedTokens = countSharedTokens(skill.tokens, item.tokens);
    if (sharedTokens > 0) {
      score += sharedTokens * 3;
    }

    if (
      skill.normalized &&
      item.normalized &&
      (skill.normalized.startsWith(`${item.normalized} `) ||
        item.normalized.startsWith(`${skill.normalized} `))
    ) {
      score += 4;
    }
  });

  return score;
};

const scoreSuggestedGroupAgainstExisting = (
  suggestion: GroupState,
  existing: GroupState,
): number => {
  let score = 0;
  score += countSharedTokens(suggestion.labelTokens, existing.labelTokens) * 5;

  suggestion.itemDescriptors.forEach((item) => {
    score += scoreSkillAgainstGroup(item, existing);
  });

  return score;
};

const ensureFallbackGroup = (groups: GroupState[]): GroupState => {
  const existing = groups.find(
    (group) =>
      group.id === FALLBACK_GROUP_ID ||
      group.label.toLowerCase() === FALLBACK_GROUP_LABEL.toLowerCase(),
  );

  if (existing) return existing;

  const fallback = buildGroupState({
    id: FALLBACK_GROUP_ID,
    label: FALLBACK_GROUP_LABEL,
    items: [],
  });
  groups.push(fallback);
  return fallback;
};

const normalizeSuggestionGroup = (
  value: unknown,
): AiSkillGroupSuggestion | null => {
  if (!isRecord(value)) return null;

  const label = normalizeGroupLabel(
    typeof value.label === "string" ? value.label : "",
  );
  const items = Array.isArray(value.items)
    ? toUniqueSkills(value.items.filter((item): item is string => typeof item === "string"))
    : [];

  if (!label || items.length === 0) return null;
  return { label, items };
};

export const parseAiSkills = (value: string): string[] =>
  toUniqueSkills(value.split(","));

export const parseAiGroupedSkills = (
  value: unknown,
): AiSkillGroupSuggestion[] => {
  if (!Array.isArray(value)) return [];

  const seenLabels = new Set<string>();
  const groups: AiSkillGroupSuggestion[] = [];

  value.forEach((item) => {
    const normalized = normalizeSuggestionGroup(item);
    if (!normalized) return;

    const labelKey = normalizeSearchText(normalized.label);
    if (seenLabels.has(labelKey)) {
      const existing = groups.find(
        (group) => normalizeSearchText(group.label) === labelKey,
      );
      if (!existing) return;
      existing.items = toUniqueSkills([...existing.items, ...normalized.items]);
      return;
    }

    seenLabels.add(labelKey);
    groups.push(normalized);
  });

  return groups;
};

const flattenGroupedSkillSuggestions = (
  groups: AiSkillGroupSuggestion[],
): string[] => groups.flatMap((group) => group.items);

export const mergeGroupedSkillSuggestionsIntoSection = (
  skills: ResumeSkillsSection,
  suggestions: AiSkillGroupSuggestion[],
): ResumeSkillsSection => {
  const normalizedSuggestions = parseAiGroupedSkills(suggestions);
  if (!normalizedSuggestions.length) return skills;

  if (skills.mode !== "grouped") {
    return mergeSkillNamesIntoSection(
      skills,
      flattenGroupedSkillSuggestions(normalizedSuggestions),
    );
  }

  const existingSkills = getActiveSkillItems(skills);
  const groups = ensureGroupedState(skills, existingSkills);

  normalizedSuggestions.forEach((suggestion) => {
    const suggestionState = createGroupState([], suggestion.label, suggestion.items);
    const rankedGroups = groups
      .map((group, index) => ({
        index,
        score: scoreSuggestedGroupAgainstExisting(suggestionState, group),
      }))
      .sort((left, right) => right.score - left.score);

    const bestMatch =
      rankedGroups[0] && rankedGroups[0].score >= MIN_GROUP_MATCH_SCORE
        ? groups[rankedGroups[0].index]
        : null;

    if (bestMatch) {
      suggestionState.itemDescriptors.forEach((item) => {
        addSkillToGroupState(bestMatch, item);
      });
      return;
    }

    const newGroup = createGroupState(groups, suggestion.label, suggestion.items);
    groups.push(newGroup);
  });

  return normalizeSkillsSection({
    mode: "grouped",
    list: toUniqueSkills([
      ...existingSkills,
      ...flattenGroupedSkillSuggestions(normalizedSuggestions),
    ]),
    groups: groups.map((group) => ({
      id: group.id,
      label: group.label,
      items: group.items,
    })),
  });
};

export const mergeSkillNamesIntoSection = (
  skills: ResumeSkillsSection,
  additions: string[],
  options?: {
    groupId?: string;
    groupLabel?: string;
  },
): ResumeSkillsSection => {
  const nextAdditions = toUniqueSkills(additions);
  if (!nextAdditions.length) return skills;

  const existingSkills = getActiveSkillItems(skills);
  const existingKeys = new Set(existingSkills.map((skill) => toSkillKey(skill)));
  const missingSkills = nextAdditions.filter(
    (skill) => !existingKeys.has(toSkillKey(skill)),
  );

  if (!missingSkills.length) {
    return normalizeSkillsSection({
      mode: skills.mode,
      list: existingSkills,
      groups: skills.groups,
    });
  }

  const mergedList = toUniqueSkills([...existingSkills, ...nextAdditions]);
  if (skills.mode !== "grouped") {
    return normalizeSkillsSection({
      mode: "list",
      list: mergedList,
      groups: skills.groups,
    });
  }

  const hasExplicitTarget = Boolean(options?.groupId || options?.groupLabel);
  const groups = ensureGroupedState(skills, existingSkills);

  missingSkills.forEach((skillName) => {
    const skillDescriptor = buildSkillDescriptor(skillName);

    if (hasExplicitTarget) {
      const targetGroup = groups.find(
        (group) =>
          (options?.groupId && group.id === options.groupId) ||
          (options?.groupLabel &&
            group.label.trim().toLowerCase() === options.groupLabel.toLowerCase()),
      );

      if (targetGroup) {
        addSkillToGroupState(targetGroup, skillDescriptor);
        return;
      }

      groups.push(
        buildGroupState({
          id: options?.groupId || createUniqueGroupId(groups, options?.groupLabel || FALLBACK_GROUP_LABEL),
          label: options?.groupLabel || FALLBACK_GROUP_LABEL,
          items: [skillDescriptor.display],
        }),
      );
      return;
    }

    const rankedGroups = groups
      .map((group, index) => ({
        index,
        score: scoreSkillAgainstGroup(skillDescriptor, group),
      }))
      .sort((left, right) => right.score - left.score);

    if (rankedGroups[0] && rankedGroups[0].score >= MIN_GROUP_MATCH_SCORE) {
      addSkillToGroupState(groups[rankedGroups[0].index], skillDescriptor);
      return;
    }

    addSkillToGroupState(ensureFallbackGroup(groups), skillDescriptor);
  });

  return normalizeSkillsSection({
    mode: "grouped",
    list: mergedList,
    groups: groups.map((group) => ({
      id: group.id,
      label: group.label,
      items: group.items,
    })),
  });
};
