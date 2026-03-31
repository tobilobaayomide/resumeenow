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

const INK = "#111110";
const DATE_COL = "#4a4a48";
const BODY_TEXT = "#30302e";
const MUTED = "#70706c";
const RULE = "#e0dedd";
const MONO =
  '"IBM Plex Mono", ui-monospace, "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace';

const DATE_COL_WIDTH = 82;
const CONTENT_GAP = 20;

const columnSpacerStyle: React.CSSProperties = {
  width: DATE_COL_WIDTH,
  flexShrink: 0,
};

const contentColumnStyle: React.CSSProperties = {
  paddingLeft: CONTENT_GAP,
  flex: 1,
  minWidth: 0,
};

const monoBodyCopyStyle: React.CSSProperties = {
  color: BODY_TEXT,
  fontFamily: MONO,
  overflowWrap: "break-word",
  wordBreak: "normal",
};

const monoMutedWrapStyle: React.CSSProperties = {
  color: MUTED,
  overflowWrap: "anywhere",
  wordBreak: "normal",
};

const SectionHeading: React.FC<{ children: React.ReactNode; index: number }> = ({
  children,
  index,
}) => {
  const idx = String(index).padStart(2, "0");

  return (
    <div data-no-split="true" className="mb-4 flex items-baseline gap-3">
      <span
        className="shrink-0 text-[10px] font-bold tabular-nums"
        style={{ color: MUTED, fontFamily: MONO, letterSpacing: "0.08em" }}
      >
        {idx}
      </span>
      <div className="flex-1">
        <h2
          className="text-[11px] font-bold uppercase leading-none"
          style={{ color: INK, fontFamily: MONO, letterSpacing: "0.12em" }}
        >
          {children}
        </h2>
        <div className="mt-2 h-px" style={{ backgroundColor: RULE }} />
      </div>
    </div>
  );
};

const DateCol: React.FC<{ start?: string; end?: string }> = ({ start, end }) => {
  return (
    <div style={columnSpacerStyle}>
      {(start || end) && (
        <div
          className="pt-0.5 text-[10px] font-medium leading-[1.55] tabular-nums"
          style={{ color: DATE_COL, fontFamily: MONO, letterSpacing: "0.03em" }}
        >
          {start ? <span className="block">{start}</span> : null}
          <span className="block" style={{ color: MUTED }}>
            {end || "Present"}
          </span>
        </div>
      )}
    </div>
  );
};

const EntryRow: React.FC<{
  start?: string;
  end?: string;
  header: React.ReactNode;
  children?: React.ReactNode;
  first?: boolean;
  ['data-ai-highlight-anchor']?: string;
}> = ({
  start,
  end,
  header,
  children,
  first = false,
  "data-ai-highlight-anchor": aiHighlightAnchor,
}) => (
  <div
    data-ai-highlight-anchor={aiHighlightAnchor}
    className="flex pt-3"
    style={first ? undefined : { borderTop: `1px solid ${RULE}` }}
  >
    <DateCol start={start} end={end} />
    <div style={contentColumnStyle}>
      <div data-no-split="true">{header}</div>
      {children}
    </div>
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
  <ul className="mt-2 space-y-1 pl-4 list-disc list-outside">
    {bullets.map((line, i) => (
      <li
        key={`${id}-b-${i}`}
        data-break-point="true"
        className={`text-[11.5px] leading-[1.65] text-left ${
          isBuilderAiTextHighlighted(highlightedBullets, line)
            ? previewHighlightInlineClassName
            : ""
        }`}
        style={monoBodyCopyStyle}
      >
        {line}
      </li>
    ))}
  </ul>
);

const ContentBand: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex">
    <div style={columnSpacerStyle} />
    <div style={contentColumnStyle}>{children}</div>
  </div>
);

const MonoTemplate: React.FC<BuilderTemplateComponentProps> = ({
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
      className="bg-white text-black"
      style={{ fontFamily: MONO }}
      data-self-padded="true"
    >
      <header
        data-no-split="true"
        className="px-8 pt-0 pb-6 -ml-15"
        style={{ borderBottom: `2px solid ${INK}` }}
      >
        <div className="flex">
          <div
            style={{
              ...columnSpacerStyle,
              borderRight: `3px solid ${INK}`,
            }}
          />
          <div style={contentColumnStyle}>
            <h1
              className="text-[34px] font-bold leading-none"
              style={{ color: INK, letterSpacing: "-0.04em" }}
            >
              {personalInfo.fullName || (
                <span style={{ color: RULE }}>Your Name</span>
              )}
            </h1>

            <p
              className="mt-2 text-[11px] font-medium uppercase"
              style={{ color: MUTED, letterSpacing: "0.14em" }}
            >
              {personalInfo.jobTitle || (
                <span style={{ color: RULE }}>Job Title</span>
              )}
            </p>

            <div
              className="mt-3 flex flex-wrap gap-x-4 gap-y-1 pt-3 text-[10px]"
              style={{ borderTop: `1px solid ${RULE}`, color: MUTED }}
            >
              {personalInfo.email ? (
                <a
                  href={`mailto:${personalInfo.email}`}
                  className="wrap-break-word"
                  style={monoMutedWrapStyle}
                >
                  {personalInfo.email}
                </a>
              ) : null}
              {personalInfo.phone ? <span>{personalInfo.phone}</span> : null}
              {personalInfo.location ? <span>{personalInfo.location}</span> : null}
              {linkItems.map((link) => (
                <a
                  key={link.id}
                  href={toExternalLinkHref(link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wrap-break-word"
                  style={monoMutedWrapStyle}
                >
                  {getPersonalLinkDisplayLabel(link)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-8 py-6">
        {summary ? (
          <section
            data-break-point="true"
            data-ai-highlight-anchor="summary"
            className={isSummaryHighlighted ? previewHighlightSectionClassName : undefined}
          >
            <SectionHeading index={1}>Profile</SectionHeading>
            <ContentBand>
              <p
                data-break-point="true"
                className="text-[11.5px] leading-[1.75] text-left -ml-20"
                style={monoBodyCopyStyle}
              >
                {summary}
              </p>
            </ContentBand>
          </section>
        ) : null}


   {activeSkills.length > 0 ? (
          <section
            data-break-point="true"
            data-ai-highlight-anchor="skills"
            className={isSkillsHighlighted ? previewHighlightSectionClassName : undefined}
          >
            <SectionHeading index={2}>Skills</SectionHeading>
            <ContentBand>
              {shouldRenderGroupedSkills ? (
                <div className="space-y-2">
                  {groupedSkills.map((group) => (
                    <p
                      key={group.id}
                      data-break-point="true"
                      className="text-[11.5px] leading-[1.7] -ml-20"
                      style={{ color: BODY_TEXT }}
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
                <p
                  data-break-point="true"
                  className="text-[11.5px] leading-[1.7] -ml-20 text-left"
                  style={monoBodyCopyStyle}
                >
                  <HighlightedSkillTokens
                    skills={activeSkills}
                    highlightedSkills={aiHighlights?.skills ?? []}
                  />
                </p>
              )}
            </ContentBand>
          </section>
        ) : null}



        {experience.length > 0 ? (
          <section data-break-point="true">
            <SectionHeading index={3}>Experience</SectionHeading>
            <div>
              {experience.map((exp, i) => (
                <EntryRow
                  key={exp.id}
                  data-ai-highlight-anchor={`experience-${exp.id}`}
                  start={exp.startDate}
                  end={exp.endDate}
                  first={i === 0}
                  header={
                    <>
                      <h3
                        className="text-[12.5px] font-bold leading-snug"
                        style={{ color: INK }}
                      >
                        {exp.role}
                      </h3>
                      {exp.company ? (
                        <p
                          className="mt-1 text-[11px] leading-snug"
                          style={{ color: MUTED }}
                        >
                          {exp.company}
                        </p>
                      ) : null}
                    </>
                  }
                >
                  {exp.description
                    ? (() => {
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
                            className="mt-2 text-[11.5px] leading-[1.7] text-left whitespace-pre-line"
                            style={monoBodyCopyStyle}
                          >
                            {exp.description}
                          </p>
                        );
                      })()
                    : null}
                </EntryRow>
              ))}
            </div>
          </section>
        ) : null}

        {projects.length > 0 ? (
          <section data-break-point="true">
            <SectionHeading index={4}>Projects</SectionHeading>
            <div>
              {projects.map((project, i) => (
                <EntryRow
                  key={project.id}
                  start={project.startDate}
                  end={project.endDate}
                  first={i === 0}
                  header={
                    <>
                      <h3
                        className="text-[12px] font-bold leading-snug"
                        style={{ color: INK }}
                      >
                        {project.name}
                      </h3>
                    {project.link ? (
  <a
    href={toExternalLinkHref(project.link)}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-1 block text-[10px] wrap-break-word hover:underline"
    style={monoMutedWrapStyle}
  >
    {project.link}
  </a>
) : null}

                    </>
                  }
                >
                  {project.description
                    ? (() => {
                        const bullets = toDescriptionBullets(project.description);
                        return bullets.length > 0 ? (
                          <BulletList id={project.id} bullets={bullets} />
                        ) : (
                          <p
                            data-break-point="true"
                            className="mt-2 text-[11.5px] leading-[1.7] text-left"
                            style={monoBodyCopyStyle}
                          >
                            {project.description}
                          </p>
                        );
                      })()
                    : null}
                </EntryRow>
              ))}
            </div>
          </section>
        ) : null}

        {volunteering.length > 0 ? (
          <section data-break-point="true">
            <SectionHeading index={5}>Volunteering</SectionHeading>
            <div>
              {volunteering.map((item, i) => (
                <EntryRow
                  key={item.id}
                  start={item.startDate}
                  end={item.endDate}
                  first={i === 0}
                  header={
                    <>
                      <h3
                        className="text-[12px] font-bold leading-snug"
                        style={{ color: INK }}
                      >
                        {item.role}
                      </h3>
                      {item.company ? (
                        <p
                          className="mt-1 text-[11px] leading-snug"
                          style={{ color: MUTED }}
                        >
                          {item.company}
                        </p>
                      ) : null}
                    </>
                  }
                >
                  {item.description
                    ? (() => {
                        const bullets = toDescriptionBullets(item.description);
                        return bullets.length > 0 ? (
                          <BulletList id={item.id} bullets={bullets} />
                        ) : (
                          <p
                            data-break-point="true"
                            className="mt-2 text-[11.5px] leading-[1.7] text-left whitespace-pre-line"
                            style={monoBodyCopyStyle}
                          >
                            {item.description}
                          </p>
                        );
                      })()
                    : null}
                </EntryRow>
              ))}
            </div>
          </section>
        ) : null}

        {education.length > 0 ? (
          <section data-break-point="true">
            <SectionHeading index={6}>Education</SectionHeading>
            <div>
              {education.map((edu, i) => (
                <EntryRow
                  key={edu.id}
                  start={edu.startDate}
                  end={edu.endDate}
                  first={i === 0}
                  header={
                    <>
                      <h3
                        className="text-[12px] font-bold leading-snug"
                        style={{ color: INK }}
                      >
                        {edu.school}
                      </h3>
                      {edu.degree ? (
                        <p
                          className="mt-1 text-[11px] leading-snug"
                          style={{ color: MUTED }}
                        >
                          {edu.degree}
                        </p>
                      ) : null}
                    </>
                  }
                >
                  {edu.description ? (
                    <p
                      data-break-point="true"
                      className="mt-2 text-[11.5px] leading-[1.7] text-left whitespace-pre-line"
                      style={monoBodyCopyStyle}
                    >
                      {edu.description}
                    </p>
                  ) : null}
                </EntryRow>
              ))}
            </div>
          </section>
        ) : null}

        {certifications.length > 0 ? (
          <section data-break-point="true">
            <SectionHeading index={7}>Certifications</SectionHeading>
            <ContentBand>
              <ul className="space-y-1 pl-4 list-disc list-outside">
                {certifications.map((cert, i) => (
                  <li
                    key={`${cert}-${i}`}
                    data-break-point="true"
                    className="text-[11.5px] leading-[1.65] -ml-20"
                    style={{ color: BODY_TEXT }}
                  >
                    {cert}
                  </li>
                ))}
              </ul>
            </ContentBand>
          </section>
        ) : null}

        {languages.length > 0 ? (
          <section data-break-point="true">
            <SectionHeading index={8}>Languages</SectionHeading>
            <ContentBand>
              <p
                data-break-point="true"
                className="text-[11.5px] leading-[1.7] -ml-20"
                style={{ color: BODY_TEXT }}
              >
                {languages.join(", ")}
              </p>
            </ContentBand>
          </section>
        ) : null}

        {achievements.length > 0 ? (
          <section data-break-point="true">
            <SectionHeading index={9}>Achievements</SectionHeading>
            <ContentBand>
              <ul className="space-y-1 pl-4 list-disc list-outside">
                {achievements.map((ach, i) => (
                  <li
                    key={`${ach}-${i}`}
                    data-break-point="true"
                    className="text-[11.5px] leading-[1.65] -ml-20"
                    style={{ color: BODY_TEXT }}
                  >
                    {ach}
                  </li>
                ))}
              </ul>
            </ContentBand>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default MonoTemplate;
