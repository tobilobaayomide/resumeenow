import React from "react";
import type { BuilderTemplateComponentProps } from "../../../types/builder";
import {
  getActiveSkillItems,
  getPersonalLinkDisplayLabel,
  getVisiblePersonalLinks,
  toExternalLinkHref,
} from "../../../domain/resume";
import { toDescriptionBullets } from "./utils";

const INK = "#111110";
const DATE_COL = "#4a4a48";
const BODY_TEXT = "#30302e";
const MUTED = "#70706c";
const RULE = "#e0dedd";
const MONO =
  '"IBM Plex Mono", "JetBrains Mono", "Fira Code", "SFMono-Regular", "Menlo", "Consolas", monospace';

const DATE_COL_WIDTH = 82;
const CONTENT_GAP = 20;

const columnSpacerStyle: React.CSSProperties = {
  width: DATE_COL_WIDTH,
  flexShrink: 0,
};

const contentColumnStyle: React.CSSProperties = {
  paddingLeft: CONTENT_GAP,
  flex: 1,
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
}> = ({ start, end, header, children, first = false }) => (
  <div
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

const BulletList: React.FC<{ id: string; bullets: string[] }> = ({
  id,
  bullets,
}) => (
  <ul className="mt-2 space-y-1 pl-4 list-disc list-outside">
    {bullets.map((line, i) => (
      <li
        key={`${id}-b-${i}`}
        data-break-point="true"
        className="text-[11.5px] leading-[1.65] text-justify"
        style={{ color: BODY_TEXT, fontFamily: MONO }}
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
                  className="break-all"
                  style={{ color: MUTED }}
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
                  className="break-all"
                  style={{ color: MUTED }}
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
          <section data-break-point="true">
            <SectionHeading index={1}>Profile</SectionHeading>
            <ContentBand>
              <p
                data-break-point="true"
                className="text-[11.5px] leading-[1.75] text-justify -ml-20"
                style={{ color: BODY_TEXT }}
              >
                {summary}
              </p>
            </ContentBand>
          </section>
        ) : null}


   {activeSkills.length > 0 ? (
          <section data-break-point="true">
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
                      {group.items.join(", ")}
                    </p>
                  ))}
                </div>
              ) : (
                <p
                  data-break-point="true"
                  className="text-[11.5px] leading-[1.7] -ml-20 text-justify"
                  style={{ color: BODY_TEXT }}
                >
                  {activeSkills.join(", ")}
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
                          <BulletList id={exp.id} bullets={bullets} />
                        ) : (
                          <p
                            data-break-point="true"
                            className="mt-2 text-[11.5px] leading-[1.7] text-justify whitespace-pre-line"
                            style={{ color: BODY_TEXT }}
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
    className="mt-1 block text-[10px] break-all hover:underline"
    style={{ color: MUTED }}
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
                            className="mt-2 text-[11.5px] leading-[1.7] text-justify "
                            style={{ color: BODY_TEXT }}
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
                            className="mt-2 text-[11.5px] leading-[1.7] text-justify whitespace-pre-line"
                            style={{ color: BODY_TEXT }}
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
                      className="mt-2 text-[11.5px] leading-[1.7] text-justify whitespace-pre-line"
                      style={{ color: BODY_TEXT }}
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
