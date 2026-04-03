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
import InlineFormattedText from "./InlineFormattedText";
import { isBuilderAiTextHighlighted } from "../../../lib/builder/aiHighlights";
import { FONT_STACKS } from "../../../fonts/registry";
import { toDescriptionBullets } from "./utils";

const INK = "#111111";
const BODY = "#222222";
const MUTED = "#7d7d7d";
const RULE = "#d8d6d3";
const SECTION_ACCENT = "#2f2f2b";
const ATS_SANS = FONT_STACKS.sans;

const NAME_SIZE = 28;
const SECTION_SIZE = 10;
const ROLE_SIZE = 13;
const META_SIZE = 11;
const BODY_SIZE = 12;

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    data-no-split="true"
    style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}
  >
    <div
      style={{
        width: 3,
        height: 14,
        backgroundColor: SECTION_ACCENT,
        borderRadius: 2,
        flexShrink: 0,
      }}
    />
    <h2
      style={{
        fontSize: SECTION_SIZE,
        fontWeight: 700,
        color: INK,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        lineHeight: 1,
        margin: 0,
      }}
    >
      {children}
    </h2>
  </div>
);

const DateRange: React.FC<{ startDate?: string; endDate?: string }> = ({
  startDate = "",
  endDate = "",
}) => {
  const left = startDate.trim();
  const right = endDate.trim();
  if (!left && !right) return null;

  return (
    <span
      style={{
        fontSize: META_SIZE,
        color: MUTED,
        whiteSpace: "nowrap",
        flexShrink: 0,
        lineHeight: 1.5,
      }}
    >
      {left}
      {right ? ` – ${right}` : ""}
    </span>
  );
};

const BulletList: React.FC<{
  id: string;
  bullets: string[];
  highlightedBullets?: string[];
}> = ({
  id,
  bullets,
  highlightedBullets = [],
}) => (
  <ul
    style={{
      marginTop: 6,
      marginBottom: 0,
      paddingLeft: 18,
      listStyleType: "disc",
    }}
  >
    {bullets.map((line, i) => (
      <li
        key={`${id}-b-${i}`}
        data-break-point="true"
        style={{
          fontSize: BODY_SIZE,
          color: BODY,
          lineHeight: 1.65,
          textAlign: "justify",
          marginTop: i === 0 ? 0 : 3,
          ...(isBuilderAiTextHighlighted(highlightedBullets, line)
            ? {
                backgroundColor: "rgba(254, 243, 199, 0.85)",
                border: "1px solid rgba(245, 158, 11, 0.28)",
                borderRadius: 6,
                padding: "2px 4px",
              }
            : {}),
        }}
      >
        <InlineFormattedText value={line} />
      </li>
    ))}
  </ul>
);

const EntryBlock: React.FC<{
  id: string;
  title?: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  link?: string;
  sectionTitle?: React.ReactNode;
  highlightedBullets?: string[];
  ['data-ai-highlight-anchor']?: string;
}> = ({
  id,
  title,
  subtitle,
  startDate,
  endDate,
  description,
  link,
  sectionTitle,
  highlightedBullets,
  "data-ai-highlight-anchor": aiHighlightAnchor,
}) => {
  const bullets = toDescriptionBullets(description || "");

  return (
    <div
      data-ai-highlight-anchor={aiHighlightAnchor}
      style={{ marginBottom: 12 }}
    >
      <div data-no-split="true">
        {sectionTitle}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: ROLE_SIZE,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.3,
            }}
          >
            {title}
          </span>
          <DateRange startDate={startDate} endDate={endDate} />
        </div>

        {subtitle ? (
          <div
            style={{
              fontSize: META_SIZE,
              fontWeight: 600,
              color: BODY,
              marginTop: 2,
              lineHeight: 1.45,
            }}
          >
            {subtitle}
          </div>
        ) : null}

        {link ? (
          <a
            href={toExternalLinkHref(link)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              marginTop: 4,
              fontSize: META_SIZE,
              color: MUTED,
              textDecoration: "none",
              wordBreak: "break-all",
              lineHeight: 1.5,
            }}
          >
            {link}
          </a>
        ) : null}
      </div>

      {bullets.length > 0 ? (
        <BulletList
          id={id}
          bullets={bullets}
          highlightedBullets={highlightedBullets}
        />
      ) : description ? (
        <p
          data-break-point="true"
          style={{
            fontSize: BODY_SIZE,
            color: BODY,
            lineHeight: 1.65,
            textAlign: "justify",
            marginTop: 6,
            marginBottom: 0,
            whiteSpace: "pre-line",
          }}
        >
          <InlineFormattedText value={description} />
        </p>
      ) : null}
    </div>
  );
};

const BulletSection: React.FC<{
  title: React.ReactNode;
  items: string[];
  idPrefix: string;
  style?: React.CSSProperties;
}> = ({ title, items, idPrefix, style }) => {
  if (items.length === 0) return null;

  const [first, ...rest] = items;

  return (
    <section data-break-point="true" style={style}>
      <div data-no-split="true">
        {title}
        <BulletList id={`${idPrefix}-first`} bullets={[first]} />
      </div>
      {rest.length > 0 ? <BulletList id={`${idPrefix}-rest`} bullets={rest} /> : null}
    </section>
  );
};

const AtsTemplate: React.FC<BuilderTemplateComponentProps> = ({
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

  const visibleLinks = getVisiblePersonalLinks(personalInfo);
  const activeSkills = getActiveSkillItems(skills);
  const groupedSkills = skills.groups.filter((g) => g.items.length > 0);
  const shouldRenderGroupedSkills =
    skills.mode === "grouped" && groupedSkills.length > 0;
  const isSummaryHighlighted = Boolean(aiHighlights?.summary);
  const isSkillsHighlighted = (aiHighlights?.skills?.length ?? 0) > 0;

  return (
    <div
      ref={contentRef}
      data-self-padded="true"
      style={{
        fontFamily: ATS_SANS,
        color: INK,
        paddingBottom: 28,
        paddingLeft: 36,
        paddingRight: 36,
      }}
    >
      <div data-no-split="true">
        <h1
          style={{
            fontSize: NAME_SIZE,
            fontWeight: 700,
            color: INK,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          {personalInfo.fullName || <span style={{ color: RULE }}>Your Name</span>}
          {personalInfo.jobTitle ? (
            <span
              style={{
                fontSize: NAME_SIZE,
                fontWeight: 700,
                color: MUTED,
                letterSpacing: "0.02em",
              }}
            >
              , {personalInfo.jobTitle}
            </span>
          ) : null}
        </h1>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            marginTop: 8,
            rowGap: 2,
            columnGap: 0,
          }}
        >
          {personalInfo.email ? (
            <a
              href={`mailto:${personalInfo.email}`}
              style={{ fontSize: META_SIZE, color: MUTED, textDecoration: "none" }}
            >
              {personalInfo.email}
            </a>
          ) : null}

          {personalInfo.phone ? (
            <>
              {personalInfo.email ? (
                <span style={{ fontSize: META_SIZE, color: RULE, marginLeft: 4, marginRight: 4 }}>
                  ·
                </span>
              ) : null}
              <span style={{ fontSize: META_SIZE, color: MUTED }}>{personalInfo.phone}</span>
            </>
          ) : null}

          {personalInfo.location ? (
            <>
              {personalInfo.email || personalInfo.phone ? (
                <span style={{ fontSize: META_SIZE, color: RULE, marginLeft: 4, marginRight: 4 }}>
                  ·
                </span>
              ) : null}
              <span style={{ fontSize: META_SIZE, color: MUTED }}>{personalInfo.location}</span>
            </>
          ) : null}

          {visibleLinks.map((link) => (
            <React.Fragment key={link.id}>
              <span style={{ fontSize: META_SIZE, color: RULE, marginLeft: 4, marginRight: 4 }}>
                ·
              </span>
              <a
                href={toExternalLinkHref(link.url)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: META_SIZE, color: MUTED, textDecoration: "none" }}
              >
                {getPersonalLinkDisplayLabel(link)}
              </a>
            </React.Fragment>
          ))}
        </div>

        <div style={{ borderBottom: `1.5px solid ${INK}`, marginTop: 10 }} />
      </div>

      {summary ? (
        <section
          data-break-point="true"
          data-ai-highlight-anchor="summary"
          className={isSummaryHighlighted ? previewHighlightSectionClassName : undefined}
          style={{ marginTop: 18 }}
        >
          <SectionTitle>Summary</SectionTitle>
          <p
            data-break-point="true"
            style={{
              fontSize: BODY_SIZE,
              color: BODY,
              lineHeight: 1.65,
              textAlign: "justify",
              margin: 0,
            }}
          >
            {summary}
          </p>
        </section>
      ) : null}

      {activeSkills.length > 0 ? (
        <section
          data-break-point="true"
          data-ai-highlight-anchor="skills"
          className={isSkillsHighlighted ? previewHighlightSectionClassName : undefined}
          style={{ marginTop: 18 }}
        >
          <SectionTitle>Technical Skills</SectionTitle>
          {shouldRenderGroupedSkills ? (
            <div style={{ display: "grid", gap: 4 }}>
              {groupedSkills.map((group) => (
                <p
                  key={group.id}
                  data-break-point="true"
                  style={{
                    fontSize: BODY_SIZE,
                    color: BODY,
                    lineHeight: 1.65,
                    textAlign: "justify",
                    margin: 0,
                  }}
                >
                  <span style={{ fontWeight: 700, color: INK }}>
                    {group.label || "Skills"}:
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
              style={{
                fontSize: BODY_SIZE,
                color: BODY,
                lineHeight: 1.65,
                textAlign: "justify",
                margin: 0,
              }}
            >
              <HighlightedSkillTokens
                skills={activeSkills}
                highlightedSkills={aiHighlights?.skills ?? []}
                highlightedClassName={previewHighlightInlineClassName}
              />
            </p>
          )}
        </section>
      ) : null}

      {experience.length > 0 ? (
        <section data-break-point="true" style={{ marginTop: 18 }}>
          {experience.map((item, index) => (
            <EntryBlock
              key={item.id}
              id={item.id}
              data-ai-highlight-anchor={`experience-${item.id}`}
              highlightedBullets={aiHighlights?.experience[item.id]}
              title={item.role}
              subtitle={item.company}
              startDate={item.startDate}
              endDate={item.endDate}
              description={item.description}
              sectionTitle={index === 0 ? <SectionTitle>Professional Experience</SectionTitle> : null}
            />
          ))}
        </section>
      ) : null}

      {projects.length > 0 ? (
        <section data-break-point="true" style={{ marginTop: 18 }}>
          {projects.map((project, index) => (
            <EntryBlock
              key={project.id}
              id={project.id}
              title={project.name}
              startDate={project.startDate}
              endDate={project.endDate}
              description={project.description}
              link={project.link}
              sectionTitle={index === 0 ? <SectionTitle>Projects</SectionTitle> : null}
            />
          ))}
        </section>
      ) : null}

      {volunteering.length > 0 ? (
        <section data-break-point="true" style={{ marginTop: 18 }}>
          {volunteering.map((item, index) => (
            <EntryBlock
              key={item.id}
              id={item.id}
              title={item.role}
              subtitle={item.company}
              startDate={item.startDate}
              endDate={item.endDate}
              description={item.description}
              sectionTitle={index === 0 ? <SectionTitle>Volunteering</SectionTitle> : null}
            />
          ))}
        </section>
      ) : null}

      {education.length > 0 ? (
        <section data-break-point="true" style={{ marginTop: 18 }}>
          {education.map((edu, index) => (
            <EntryBlock
              key={edu.id}
              id={edu.id}
              title={edu.degree || edu.school}
              subtitle={edu.degree ? edu.school : undefined}
              startDate={edu.startDate}
              endDate={edu.endDate}
              description={edu.description}
              sectionTitle={index === 0 ? <SectionTitle>Education</SectionTitle> : null}
            />
          ))}
        </section>
      ) : null}

      <BulletSection
        title={<SectionTitle>Certifications</SectionTitle>}
        items={certifications}
        idPrefix="certifications"
        style={{ marginTop: 18 }}
      />

      {languages.length > 0 ? (
        <section data-break-point="true" style={{ marginTop: 18 }}>
          <div data-no-split="true">
            <SectionTitle>Languages</SectionTitle>
            <p
              data-break-point="true"
              style={{
                fontSize: BODY_SIZE,
                color: BODY,
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {languages.join(", ")}
            </p>
          </div>
        </section>
      ) : null}

      <BulletSection
        title={<SectionTitle>Achievements</SectionTitle>}
        items={achievements}
        idPrefix="achievements"
        style={{ marginTop: 18 }}
      />
    </div>
  );
};

export default AtsTemplate;
