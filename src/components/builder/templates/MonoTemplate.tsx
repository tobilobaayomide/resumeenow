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
const BODY_TEXT = "#3d3d3b";
const MUTED = "#888884";
const RULE = "#e0dedd";

let sectionIndex = 0;
const resetSectionIndex = () => {
  sectionIndex = 0;
};

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  sectionIndex += 1;
  const idx = String(sectionIndex).padStart(2, "0");
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span
        className="text-[9px] font-bold tabular-nums shrink-0"
        style={{ color: MUTED, letterSpacing: "0.05em" }}
      >
        {idx}
      </span>
      <div className="flex-1">
        <h2
          className="text-[11px] font-bold leading-none"
          style={{ color: INK, letterSpacing: "0.04em" }}
        >
          {children}
        </h2>
        <div className="mt-1.5 h-px" style={{ background: RULE }} />
      </div>
    </div>
  );
};

const DateCol: React.FC<{ start?: string; end?: string }> = ({
  start,
  end,
}) => {
  if (!start && !end) return <div className="w-20.5 shrink-0" />;
  return (
    <div
      className="w-20.5 shrink-0 text-[9.5px] font-medium leading-[1.6] pt-0.5"
      style={{ color: DATE_COL, letterSpacing: "0.02em" }}
    >
      {start && <span className="block">{start}</span>}
      <span className="block" style={{ color: MUTED }}>
        {end || "Present"}
      </span>
    </div>
  );
};

const EntryRow: React.FC<{
  start?: string;
  end?: string;
  children: React.ReactNode;
  first?: boolean;
}> = ({ start, end, children, first = false }) => (
  <div
    className="flex gap-0 pt-3"
    data-no-split="true"
    style={first ? undefined : { borderTop: `1px solid ${RULE}` }}
  >
    <DateCol start={start} end={end} />
    <div className="flex-1 pb-0.5">{children}</div>
  </div>
);

const BulletList: React.FC<{ id: string; bullets: string[] }> = ({
  id,
  bullets,
}) => (
  <ul className="list-disc list-outside pl-4 mt-2 space-y-0.75">
    {bullets.map((line, i) => (
      <li
        key={`${id}-b-${i}`}
        data-break-point="true"
        className="text-[11px] leading-[1.6] text-justify"
        style={{ color: BODY_TEXT }}
      >
        {line}
      </li>
    ))}
  </ul>
);

const MonoTemplate: React.FC<BuilderTemplateComponentProps> = ({
  data,
  contentRef,
}) => {
  resetSectionIndex();

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
      className="font-sans text-black bg-white"
      data-self-padded="true"
    >
      <header
        data-no-split="true"
        className="px-8 -ml-20 pt-0 pb-6"
        style={{ borderBottom: `2px solid ${INK}` }}
      >
        <div className="flex gap-0">
          <div
            className="w-20.5 shrink-0 self-stretch"
            style={{ borderRight: `3px solid ${INK}`, marginRight: "0px" }}
          />

          <div className="flex-1 pl-5">
            <h1
              className="text-[36px] font-black leading-none tracking-tight"
              style={{ color: INK }}
            >
              {personalInfo.fullName || (
                <span style={{ color: RULE }}>Your Name</span>
              )}
            </h1>

            <p
              className="text-[11.5px] font-medium mt-2 tracking-[0.08em]"
              style={{ color: MUTED }}
            >
              {personalInfo.jobTitle || (
                <span style={{ color: RULE }}>Job Title</span>
              )}
            </p>

            <div
              className="flex flex-wrap gap-x-4 gap-y-0.5 mt-3 pt-2.5 text-[10px]"
              style={{ borderTop: `1px solid ${RULE}`, color: MUTED }}
            >
              {personalInfo.email && (
                <a
                  href={`mailto:${personalInfo.email}`}
                  className="hover:text-black transition-colors break-all"
                  style={{ color: MUTED }}
                >
                  {personalInfo.email}
                </a>
              )}
              {personalInfo.phone && <span>{personalInfo.phone}</span>}
              {personalInfo.location && <span>{personalInfo.location}</span>}
              {linkItems.map((link) => (
                <a
                  key={link.id}
                  href={toExternalLinkHref(link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black transition-colors break-all"
                  style={{ color: MUTED }}
                >
                  {getPersonalLinkDisplayLabel(link)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 py-6 space-y-6">
        {summary && (
          <section>
            <div className="flex gap-0">
              <div className="w-20.5 -ml-25 shrink-0" />
              <p
                data-break-point="true"
                className="flex-1 pl-5 text-[11.5px] leading-relaxed text-justify"
                style={{ color: BODY_TEXT }}
              >
                {summary}
              </p>
            </div>
          </section>
        )}

        {experience.length > 0 && (
          <section>
            <SectionHeading>Experience</SectionHeading>
            <div>
              {experience.map((exp, i) => (
                <EntryRow
                  key={exp.id}
                  start={exp.startDate}
                  end={exp.endDate}
                  first={i === 0}
                >
                  <h3
                    className="text-[12.5px] font-bold leading-snug"
                    style={{ color: INK }}
                  >
                    {exp.role}
                  </h3>
                  <p className="text-[10.5px] mt-0.5" style={{ color: MUTED }}>
                    {exp.company}
                  </p>
                  {exp.description &&
                    (() => {
                      const bullets = toDescriptionBullets(exp.description);
                      return bullets.length > 0 ? (
                        <BulletList id={exp.id} bullets={bullets} />
                      ) : (
                        <p
                          data-break-point="true"
                          className="text-[11px] mt-2 leading-relaxed text-justify whitespace-pre-line"
                          style={{ color: BODY_TEXT }}
                        >
                          {exp.description}
                        </p>
                      );
                    })()}
                </EntryRow>
              ))}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section>
            <SectionHeading>Projects</SectionHeading>
            <div>
              {projects.map((project, i) => (
                <EntryRow
                  key={project.id}
                  start={project.startDate}
                  end={project.endDate}
                  first={i === 0}
                >
                  <h3
                    className="text-[12px] font-bold leading-snug"
                    style={{ color: INK }}
                  >
                    {project.name}
                  </h3>
                  {project.link && (
                    <p
                      className="text-[9.5px] mt-0.5 break-all"
                      style={{ color: MUTED }}
                    >
                      {project.link}
                    </p>
                  )}
                  {project.description &&
                    (() => {
                      const bullets = toDescriptionBullets(project.description);
                      return bullets.length > 0 ? (
                        <BulletList id={project.id} bullets={bullets} />
                      ) : (
                        <p
                          data-break-point="true"
                          className="text-[11px] mt-2 leading-relaxed text-justify"
                          style={{ color: BODY_TEXT }}
                        >
                          {project.description}
                        </p>
                      );
                    })()}
                </EntryRow>
              ))}
            </div>
          </section>
        )}

        {volunteering.length > 0 && (
          <section>
            <SectionHeading>Volunteering</SectionHeading>
            <div>
              {volunteering.map((item, i) => (
                <EntryRow
                  key={item.id}
                  start={item.startDate}
                  end={item.endDate}
                  first={i === 0}
                >
                  <h3
                    className="text-[12px] font-bold leading-snug"
                    style={{ color: INK }}
                  >
                    {item.role}
                  </h3>
                  <p className="text-[10.5px] mt-0.5" style={{ color: MUTED }}>
                    {item.company}
                  </p>
                  {item.description &&
                    (() => {
                      const bullets = toDescriptionBullets(item.description);
                      return bullets.length > 0 ? (
                        <BulletList id={item.id} bullets={bullets} />
                      ) : (
                        <p
                          data-break-point="true"
                          className="text-[11px] mt-2 leading-relaxed text-justify whitespace-pre-line"
                          style={{ color: BODY_TEXT }}
                        >
                          {item.description}
                        </p>
                      );
                    })()}
                </EntryRow>
              ))}
            </div>
          </section>
        )}

        {education.length > 0 && (
          <section>
            <SectionHeading>Education</SectionHeading>
            <div>
              {education.map((edu, i) => (
                <EntryRow
                  key={edu.id}
                  start={edu.startDate}
                  end={edu.endDate}
                  first={i === 0}
                >
                  <h3
                    className="text-[12px] font-bold leading-snug"
                    style={{ color: INK }}
                  >
                    {edu.school}
                  </h3>
                  <p className="text-[10.5px] mt-0.5" style={{ color: MUTED }}>
                    {edu.degree}
                  </p>
                  {edu.description && (
                    <p
                      data-break-point="true"
                      className="text-[11px] mt-1.5 leading-relaxed text-justify whitespace-pre-line"
                      style={{ color: BODY_TEXT }}
                    >
                      {edu.description}
                    </p>
                  )}
                </EntryRow>
              ))}
            </div>
          </section>
        )}

        {activeSkills.length > 0 && (
          <section>
            <SectionHeading>Skills</SectionHeading>
            <div className="flex -ml-20 gap-0">
              <div className="w-20.5 shrink-0" />
              <div className="flex-1 pl-0">
                {shouldRenderGroupedSkills ? (
                  <div className="space-y-1.5">
                    {groupedSkills.map((group) => (
                      <p
                        key={group.id}
                        data-break-point="true"
                        className="text-[11px] leading-relaxed"
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
                    className="text-[11px] leading-relaxed"
                    style={{ color: BODY_TEXT }}
                  >
                    {activeSkills.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {certifications.length > 0 && (
          <section>
            <SectionHeading>Certifications</SectionHeading>
            <div className="flex -ml-20 gap-0">
              <div className="w-20.5 shrink-0" />
              <ul className="flex-1 space-y-0.75 list-disc list-outside pl-4">
                {certifications.map((cert, i) => (
                  <li
                    key={`${cert}-${i}`}
                    data-break-point="true"
                    className="text-[11px] leading-relaxed"
                    style={{ color: BODY_TEXT }}
                  >
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {languages.length > 0 && (
          <section>
            <SectionHeading>Languages</SectionHeading>
            <div className="flex -ml-20 gap-0">
              <div className="w-20.5 shrink-0" />
              <p
                data-break-point="true"
                className="flex-1 text-[11px] leading-relaxed"
                style={{ color: BODY_TEXT }}
              >
                {languages.join(", ")}
              </p>
            </div>
          </section>
        )}

        {achievements.length > 0 && (
          <section>
            <SectionHeading>Achievements</SectionHeading>
            <div className="flex -ml-20 gap-0">
              <div className="w-20.5 shrink-0" />
              <ul className="flex-1 space-y-0.75 list-disc list-outside pl-4">
                {achievements.map((ach, i) => (
                  <li
                    key={`${ach}-${i}`}
                    data-break-point="true"
                    className="text-[11px] leading-relaxed"
                    style={{ color: BODY_TEXT }}
                  >
                    {ach}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MonoTemplate;
