import React from "react";
import type { BuilderTemplateComponentProps } from "../../../types/builder";
import {
  getActiveSkillItems,
  getPersonalLinkDisplayLabel,
  getVisiblePersonalLinks,
  toExternalLinkHref,
} from "../../../domain/resume";
import {
  previewHighlightInlineClassName,
  previewHighlightSectionClassName,
} from "./highlightStyles";
import HighlightedSkillTokens from "./HighlightedSkillTokens";
import { isBuilderAiTextHighlighted } from "../../../lib/builder/aiHighlights";
import { toDescriptionBullets } from "./utils";

const INK = "#0f1117";
const PROMPT = "#16a34a";
const BORDER = "#e2e4e9";
const MONO =
  "'JetBrains Mono', 'Fira Code', 'Fira Mono', 'Courier New', monospace";

const SectionHeading: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <span
      className="text-[11px] font-bold select-none shrink-0"
      style={{ color: PROMPT, fontFamily: MONO }}
    >
      ##
    </span>
    <span
      className="text-[10px] font-bold uppercase tracking-[0.18em] shrink-0"
      style={{ color: INK, fontFamily: MONO }}
    >
      {label}
    </span>
    <div className="flex-1 h-px" style={{ backgroundColor: BORDER }} />
  </div>
);

const BulletList: React.FC<{
  id: string;
  bullets: string[];
  highlightedBullets?: string[];
}> = ({
  id,
  bullets,
  highlightedBullets = [],
}) => (
  <ul className="mt-1.5 space-y-0.75 list-disc list-outside pl-4">
    {bullets.map((line, i) => (
      <li
        key={`${id}-b-${i}`}
        data-break-point="true"
        className={`text-[12px] leading-[1.65] text-justify ${
          isBuilderAiTextHighlighted(highlightedBullets, line)
            ? previewHighlightInlineClassName
            : ""
        }`}
        style={{ color: INK, fontFamily: MONO }}
      >
        {line}
      </li>
    ))}
  </ul>
);

const DateBracket: React.FC<{ start?: string; end?: string }> = ({
  start,
  end,
}) => {
  if (!start && !end) return null;
  return (
    <span
      className="text-[12px] whitespace-nowrap shrink-0 tabular-nums"
      style={{ color: INK, fontFamily: MONO }}
    >
      [{start}
      {end ? ` → ${end}` : " → now"}]
    </span>
  );
};

const SiliconTemplate: React.FC<BuilderTemplateComponentProps> = ({
  data,
  contentRef,
  aiHighlights,
}) => {
  const {
    personalInfo,
    summary,
    experience,
    volunteering,
    projects,
    education,
    certifications,
    skills,
    languages,
    achievements,
  } = data;

  const linkItems = getVisiblePersonalLinks(personalInfo);
  const activeSkills = getActiveSkillItems(skills);
  const groupedSkills = skills.groups.filter((g) => g.items.length > 0);
  const shouldRenderGroupedSkills =
    skills.mode === "grouped" && groupedSkills.length > 0;
  const isSummaryHighlighted = Boolean(aiHighlights?.summary);
  const isSkillsHighlighted = (aiHighlights?.skills?.length ?? 0) > 0;

  return (
    <div
      ref={contentRef}
      className="text-black bg-white"
      style={{ fontFamily: MONO }}
      data-self-padded="true"
      data-flush-header="true"
    >
      <header
        data-no-split="true"
        className="px-7 pt-0 pb-5"
        style={{
          borderBottom: `2px solid ${INK}`,
          borderLeft: `4px solid ${PROMPT}`,
        }}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-[16px] font-bold select-none leading-none mt-14" />
          <h1
            className="text-[30px] font-bold tracking-tight leading-none"
            style={{ color: INK }}
          >
            {personalInfo.fullName || (
              <span style={{ color: BORDER }}>Your Name</span>
            )}
          </h1>
        </div>

        {personalInfo.jobTitle && (
          <p className="text-[13px] mt-2 ml-2" style={{ color: INK }}>
            // {personalInfo.jobTitle}
          </p>
        )}

        <div
          className="flex flex-wrap gap-x-5 gap-y-1 mt-3 pt-3 ml-2 text-[11px] break-all"
          style={{ borderTop: `1px solid ${BORDER}`, color: INK }}
        >
          {personalInfo.email && (
            <a href={`mailto:${personalInfo.email}`} style={{ color: INK }}>
              @ {personalInfo.email}
            </a>
          )}
          {personalInfo.phone && <span>$ {personalInfo.phone}</span>}
          {personalInfo.location && <span>~ {personalInfo.location}</span>}
          {linkItems.map((link) => (
            <a
              key={link.id}
              href={toExternalLinkHref(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: INK }}
            >
              &gt; {getPersonalLinkDisplayLabel(link)}
            </a>
          ))}
        </div>
      </header>

      <div className="px-7 py-6 space-y-6">
        {summary && (
          <section
            data-ai-highlight-anchor="summary"
            className={isSummaryHighlighted ? previewHighlightSectionClassName : undefined}
          >
            <SectionHeading label="About" />
            <p
              data-break-point="true"
              className="text-[12px] leading-[1.75] text-justify pl-4 border-l-2"
              style={{ color: INK, borderColor: PROMPT }}
            >
              {summary}
            </p>
          </section>
        )}

        {activeSkills.length > 0 && (
          <section
            data-ai-highlight-anchor="skills"
            className={isSkillsHighlighted ? previewHighlightSectionClassName : undefined}
          >
            <SectionHeading label="Stack" />
            {shouldRenderGroupedSkills ? (
              <div className="space-y-1.5 pl-4">
                {groupedSkills.map((group) => (
                  <p
                    key={group.id}
                    data-break-point="true"
                    className="text-[12px] leading-relaxed"
                    style={{ color: INK }}
                  >
                    <span className="font-bold" style={{ color: INK }}>
                      {group.label}:
                    </span>{" "}
                    <HighlightedSkillTokens
                      skills={group.items}
                      highlightedSkills={aiHighlights?.skills ?? []}
                    />
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 pl-4">
                {activeSkills.map((skill) => (
                  <span
                    key={skill}
                    className={`text-[12px] px-2 py-0.75 font-medium ${
                      isBuilderAiTextHighlighted(aiHighlights?.skills ?? [], skill)
                        ? previewHighlightInlineClassName
                        : ""
                    }`}
                    style={{
                      color: PROMPT,
                      border: `1px solid ${PROMPT}`,
                      background: "rgba(22,163,74,0.05)",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {experience.length > 0 && (
          <section>
            <SectionHeading label="Experience" />
            <div className="space-y-5 pl-4">
              {experience.map((exp) => (
                <div
                  key={exp.id}
                  data-no-split="true"
                  data-ai-highlight-anchor={`experience-${exp.id}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-0 flex-wrap">
                      <span
                        className="text-[12.5px] font-bold"
                        style={{ color: INK }}
                      >
                        {exp.role}
                      </span>
                      <span
                        className="text-[11px] mx-1.5 font-bold"
                        style={{ color: PROMPT }}
                      >
                        @
                      </span>
                      <span
                        className="text-[12px] font-medium"
                        style={{ color: INK }}
                      >
                        {exp.company}
                      </span>
                    </div>
                    <DateBracket start={exp.startDate} end={exp.endDate} />
                  </div>
                  {exp.description &&
                    (() => {
                      const bullets = toDescriptionBullets(exp.description);
                      return bullets.length > 0 ? (
                        <BulletList
                          id={exp.id}
                          bullets={bullets}
                          highlightedBullets={aiHighlights?.experience[exp.id]}
                        />
                      ) : (
                        <p
                          data-break-point="true"
                          className="text-[12px] mt-1.5 leading-relaxed text-justify whitespace-pre-line"
                          style={{ color: INK }}
                        >
                          {exp.description}
                        </p>
                      );
                    })()}
                </div>
              ))}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section>
            <SectionHeading label="Projects" />
            <div className="space-y-4 pl-4">
              {projects.map((project) => (
                <div key={project.id} data-no-split="true">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="text-[12px] font-bold"
                      style={{ color: INK }}
                    >
                      {project.name}
                    </span>
                    <DateBracket
                      start={project.startDate}
                      end={project.endDate}
                    />
                  </div>
                  {project.link && (
                    <a
                      href={toExternalLinkHref(project.link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] break-all hover:underline"
                      style={{ color: PROMPT }}
                    >
                      {project.link}
                    </a>
                  )}
                  {project.description &&
                    (() => {
                      const bullets = toDescriptionBullets(project.description);
                      return bullets.length > 0 ? (
                        <BulletList id={project.id} bullets={bullets} />
                      ) : (
                        <p
                          data-break-point="true"
                          className="text-[12px] mt-1.5 leading-relaxed text-justify"
                          style={{ color: INK }}
                        >
                          {project.description}
                        </p>
                      );
                    })()}
                </div>
              ))}
            </div>
          </section>
        )}

        {volunteering.length > 0 && (
          <section>
            <SectionHeading label="Volunteering" />
            <div className="space-y-4 pl-4">
              {volunteering.map((item) => (
                <div key={item.id} data-no-split="true">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-0 flex-wrap">
                      <span
                        className="text-[12px] font-bold"
                        style={{ color: INK }}
                      >
                        {item.role}
                      </span>
                      <span
                        className="text-[11px] mx-1.5 font-bold"
                        style={{ color: PROMPT }}
                      >
                        @
                      </span>
                      <span
                        className="text-[12px] font-medium"
                        style={{ color: INK }}
                      >
                        {item.company}
                      </span>
                    </div>
                    <DateBracket start={item.startDate} end={item.endDate} />
                  </div>
                  {item.description &&
                    (() => {
                      const bullets = toDescriptionBullets(item.description);
                      return bullets.length > 0 ? (
                        <BulletList id={item.id} bullets={bullets} />
                      ) : (
                        <p
                          data-break-point="true"
                          className="text-[12px] mt-1.5 leading-relaxed text-justify whitespace-pre-line"
                          style={{ color: INK }}
                        >
                          {item.description}
                        </p>
                      );
                    })()}
                </div>
              ))}
            </div>
          </section>
        )}

     {education.length > 0 && (
  <section>
    <SectionHeading label="Education" />
    <div className="space-y-3 pl-4">
      {education.map((edu) => (
        <div key={edu.id} data-no-split="true">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div
                className="text-[12px] font-bold"
                style={{ color: INK }}
              >
                {edu.school}
              </div>

              {edu.degree && (
                <div
                  className="text-[12px] mt-1"
                  style={{ color: INK }}
                >
                  {edu.degree}
                </div>
              )}
            </div>

            <DateBracket start={edu.startDate} end={edu.endDate} />
          </div>

          {edu.description && (
            <p
              data-break-point="true"
              className="text-[12px] mt-1 leading-relaxed"
              style={{ color: INK }}
            >
              {edu.description}
            </p>
          )}
        </div>
      ))}
    </div>
  </section>
)}


        {certifications.length > 0 && (
          <section>
            <SectionHeading label="Certifications" />
            <ul className="space-y-1 pl-4">
              {certifications.map((cert, i) => (
                <li
                  key={`${cert}-${i}`}
                  data-break-point="true"
                  className="flex items-start gap-2 text-[12px] font-semibold"
                  style={{ color: INK }}
                >
                  <span className="shrink-0" style={{ color: PROMPT }}>
                    ›
                  </span>
                  {cert}
                </li>
              ))}
            </ul>
          </section>
        )}

        {languages.length > 0 && (
          <section>
            <SectionHeading label="Languages" />
            <div className="flex flex-wrap gap-1.5 pl-4">
              {languages.map((lang, i) => (
                <span
                  key={`${lang}-${i}`}
                  className="text-[12px] px-2 py-0.75"
                  style={{
                    color: INK,
                    border: `1px solid ${BORDER}`,
                    background: "#f8f9fa",
                  }}
                >
                  {lang}
                </span>
              ))}
            </div>
          </section>
        )}

        {achievements.length > 0 && (
          <section>
            <SectionHeading label="Achievements" />
            <ul className="space-y-1.5 pl-4">
              {achievements.map((ach, i) => (
                <li
                  key={`${ach}-${i}`}
                  data-break-point="true"
                  className="flex items-start gap-2 text-[12px] font-semibold text-justify"
                  style={{ color: INK }}
                >
                  <span className="shrink-0" style={{ color: PROMPT }}>
                    ›
                  </span>
                  {ach}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default SiliconTemplate;
