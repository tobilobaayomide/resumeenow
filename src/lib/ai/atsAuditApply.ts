import type {
  AtsAuditImprovement,
  AtsAuditResult,
} from '../../types/builder/page.js';
import {
  getActiveSkillItems,
  normalizeSkillsSection,
  type ResumeData,
} from '../../types/resume.js';
import { mergeSkillNamesIntoSection } from '../aiResumeApply.js';
import { sanitizeAiPlainText } from '../aiText.js';
import { replaceDescriptionBullet } from '../descriptionBullets.js';

const normalizeTextKey = (value: string): string =>
  sanitizeAiPlainText(value).toLowerCase();

const dedupeTextList = (values: string[]): string[] => {
  const seen = new Set<string>();

  return values.reduce<string[]>((result, value) => {
    const cleaned = sanitizeAiPlainText(value);
    if (!cleaned) {
      return result;
    }

    const key = normalizeTextKey(cleaned);
    if (seen.has(key)) {
      return result;
    }

    seen.add(key);
    result.push(cleaned);
    return result;
  }, []);
};

const appendUniqueKeywords = (
  current: string[],
  additions: string[],
): string[] => dedupeTextList([...current, ...additions]);

const applyAtsSkillImprovement = (
  skills: ResumeData['skills'],
  improvement: AtsAuditImprovement,
) => {
  const betterSkill = sanitizeAiPlainText(improvement.better);

  if (skills.mode === 'grouped' && skills.groups.length > 0) {
    return normalizeSkillsSection({
      mode: 'grouped',
      list: skills.list.map((item) => (item === improvement.current ? betterSkill : item)),
      groups: skills.groups.map((group) => ({
        ...group,
        items: group.items.map((item) => (item === improvement.current ? betterSkill : item)),
      })),
    });
  }

  return normalizeSkillsSection({
    ...skills,
    mode: 'list',
    list: skills.list.map((item) => (item === improvement.current ? betterSkill : item)),
  });
};

const toSkillSnapshot = (skills: ResumeData['skills']): string =>
  getActiveSkillItems(skills)
    .map((skill) => normalizeTextKey(skill))
    .sort()
    .join('|');

const isSameImprovement = (
  left: AtsAuditImprovement,
  right: AtsAuditImprovement,
): boolean =>
  left.type === right.type &&
  (left.id ?? '') === (right.id ?? '') &&
  normalizeTextKey(left.current) === normalizeTextKey(right.current) &&
  normalizeTextKey(left.better) === normalizeTextKey(right.better);

export const applyAtsKeywords = (
  resumeData: ResumeData,
  result: AtsAuditResult,
  keywords: string[],
) => {
  const missingKeywordKeys = new Set(
    result.missingKeywords.map((keyword) => normalizeTextKey(keyword)),
  );
  const resolvedKeywords = dedupeTextList(keywords).filter((keyword) =>
    missingKeywordKeys.has(normalizeTextKey(keyword)),
  );

  if (resolvedKeywords.length === 0) {
    return {
      nextResumeData: resumeData,
      nextResult: result,
      appliedKeywords: [] as string[],
      resolvedKeywords: [] as string[],
    };
  }

  const existingSkillKeys = new Set(
    getActiveSkillItems(resumeData.skills).map((skill) => normalizeTextKey(skill)),
  );
  const appliedKeywords = resolvedKeywords.filter(
    (keyword) => !existingSkillKeys.has(normalizeTextKey(keyword)),
  );

  const nextResumeData =
    appliedKeywords.length > 0
      ? {
          ...resumeData,
          skills: mergeSkillNamesIntoSection(resumeData.skills, appliedKeywords),
        }
      : resumeData;

  const resolvedKeywordKeys = new Set(
    resolvedKeywords.map((keyword) => normalizeTextKey(keyword)),
  );

  return {
    nextResumeData,
    nextResult: {
      ...result,
      matchedKeywords: appendUniqueKeywords(result.matchedKeywords, resolvedKeywords),
      missingKeywords: result.missingKeywords.filter(
        (keyword) => !resolvedKeywordKeys.has(normalizeTextKey(keyword)),
      ),
      keywordDensity: result.keywordDensity?.map((item) =>
        resolvedKeywordKeys.has(normalizeTextKey(item.keyword))
          ? {
              ...item,
              count: Math.max(item.count, 1),
            }
          : item,
      ),
    },
    appliedKeywords,
    resolvedKeywords,
  };
};

export const applyAtsImprovement = (
  resumeData: ResumeData,
  result: AtsAuditResult,
  improvement: AtsAuditImprovement,
) => {
  let nextResumeData = resumeData;
  let applied = false;

  if (improvement.type === 'bullet' && improvement.id) {
    const betterBullet = sanitizeAiPlainText(improvement.better);

    nextResumeData = {
      ...resumeData,
      experience: resumeData.experience.map((item) => {
        if (item.id !== improvement.id) {
          return item;
        }

        const nextDescription = replaceDescriptionBullet(
          item.description,
          improvement.current,
          betterBullet,
        );

        if (!nextDescription || nextDescription === item.description) {
          return item;
        }

        applied = true;
        return {
          ...item,
          description: nextDescription,
        };
      }),
    };
  } else if (improvement.type === 'skill') {
    const nextSkills = applyAtsSkillImprovement(resumeData.skills, improvement);
    applied = toSkillSnapshot(nextSkills) !== toSkillSnapshot(resumeData.skills);

    if (applied) {
      nextResumeData = {
        ...resumeData,
        skills: nextSkills,
      };
    }
  }

  if (!applied) {
    return {
      applied: false,
      nextResumeData: resumeData,
      nextResult: result,
      appliedSkill: undefined as string | undefined,
      appliedExperience: undefined as
        | { experienceId: string; text: string }
        | undefined,
    };
  }

  return {
    applied: true,
    nextResumeData,
    nextResult: {
      ...result,
      improvements: (result.improvements ?? []).filter(
        (candidate) => !isSameImprovement(candidate, improvement),
      ),
    },
    appliedSkill:
      improvement.type === 'skill'
        ? sanitizeAiPlainText(improvement.better)
        : undefined,
    appliedExperience:
      improvement.type === 'bullet' && improvement.id
        ? {
            experienceId: improvement.id,
            text: sanitizeAiPlainText(improvement.better),
          }
        : undefined,
  };
};

export const applyAllAtsImprovements = (
  resumeData: ResumeData,
  result: AtsAuditResult,
) => {
  const appliedSkills: string[] = [];
  const appliedExperience: Array<{ experienceId: string; text: string }> = [];
  let nextResumeData = resumeData;
  let nextResult = result;
  let appliedCount = 0;

  for (const improvement of result.improvements ?? []) {
    const outcome = applyAtsImprovement(nextResumeData, nextResult, improvement);
    nextResumeData = outcome.nextResumeData;
    nextResult = outcome.nextResult;

    if (!outcome.applied) {
      continue;
    }

    appliedCount += 1;

    if (outcome.appliedSkill) {
      appliedSkills.push(outcome.appliedSkill);
    }

    if (outcome.appliedExperience) {
      appliedExperience.push(outcome.appliedExperience);
    }
  }

  return {
    nextResumeData,
    nextResult,
    appliedCount,
    appliedSkills: dedupeTextList(appliedSkills),
    appliedExperience,
  };
};
