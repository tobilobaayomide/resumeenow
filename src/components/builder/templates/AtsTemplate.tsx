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
const BODY = "#3a3835";
const MUTED = "#6b6b68";
const RULE = "#d8d6d3";
const SECTION_ACCENT = "#1f3a5f";

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="mb-2.5 flex items-stretch gap-2.5">
    <div
      className="w-0.75 shrink-0 rounded-full"
      style={{ background: SECTION_ACCENT }}
    />
    <h2
      className="text-[10.5px] font-bold uppercase tracking-[0.14em] leading-none self-center"
      style={{ color: SECTION_ACCENT }}
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
      className="text-[10px] font-medium tabular-nums whitespace-nowrap shrink-0"
      style={{ color: MUTED }}
    >
      {left}
      {right ? ` – ${right}` : ""}
    </span>
  );
};

const ExperienceBlock: React.FC<{
  item: {
    id: string;
    role?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  };
}> = ({ item }) => {
  const bullets = toDescriptionBullets(item.description || "");

  return (
    <div data-no-split="true" className="space-y-0.75">
      <div className="flex items-baseline justify-between gap-3">
        <p
          className="text-[12px] font-bold leading-snug"
          style={{ color: INK }}
        >
          {item.role}
        </p>
        <DateRange startDate={item.startDate} endDate={item.endDate} />
      </div>
      {item.company && (
        <p
          className="text-[10.5px] font-semibold"
          style={{ color: SECTION_ACCENT }}
        >
          {item.company}
        </p>
      )}
      {bullets.length > 0 ? (
        <ul className="list-disc pl-4 space-y-0.75 mt-1.5">
          {bullets.map((line, i) => (
            <li
              key={`${item.id}-b-${i}`}
              data-break-point="true"
              className="text-[11px] leading-[1.6] text-justify"
              style={{ color: BODY }}
            >
              {line}
            </li>
          ))}
        </ul>
      ) : item.description ? (
        <p
          data-break-point="true"
          className="text-[11px] leading-[1.6] text-justify mt-1.5"
          style={{ color: BODY }}
        >
          {item.description}
        </p>
      ) : null}
    </div>
  );
};

const AtsTemplate: React.FC<BuilderTemplateComponentProps> = ({
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

  const visibleLinks = getVisiblePersonalLinks(personalInfo);
  const activeSkills = getActiveSkillItems(skills);
  const groupedSkills = skills.groups.filter((g) => g.items.length > 0);
  const shouldRenderGroupedSkills =
    skills.mode === "grouped" && groupedSkills.length > 0;

  const contactItems = [
    personalInfo.email
      ? { id: "email", type: "email" as const, value: personalInfo.email }
      : null,
    personalInfo.phone
      ? { id: "phone", type: "text" as const, value: personalInfo.phone }
      : null,
    personalInfo.location
      ? { id: "location", type: "text" as const, value: personalInfo.location }
      : null,
    ...visibleLinks.map((link) => ({
      id: link.id,
      type: "link" as const,
      label: getPersonalLinkDisplayLabel(link),
      href: toExternalLinkHref(link.url),
    })),
  ].filter(Boolean) as Array<
    | { id: string; type: "email"; value: string }
    | { id: string; type: "text"; value: string }
    | { id: string; type: "link"; label: string; href: string }
  >;

  return (
    <div ref={contentRef} className="font-sans text-black space-y-5">
      <header data-no-split="true" className="space-y-1.5">
        <h1
          className="text-[33px] font-bold tracking-[-0.02em] leading-none"
          style={{ color: INK }}
        >
          {personalInfo.fullName || (
            <span style={{ color: RULE }}>Your Name</span>
          )}
          {personalInfo.jobTitle && (
            <span
              className="font-normal text-[33px] tracking-[-0.01em]"
              style={{ color: MUTED }}
            >
              {""}, {personalInfo.jobTitle}
            </span>
          )}
        </h1>

        {contactItems.length > 0 && (
          <p className="text-[10px] leading-relaxed" style={{ color: MUTED }}>
            {contactItems.map((item, i) => (
              <React.Fragment key={item.id}>
                {i > 0 && <span style={{ color: RULE }}> · </span>}
                {item.type === "link" ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline break-all"
                    style={{ color: MUTED }}
                  >
                    {item.label}
                  </a>
                ) : item.type === "email" ? (
                  <a
                    href={`mailto:${item.value}`}
                    className="hover:underline break-all"
                    style={{ color: MUTED }}
                  >
                    {item.value}
                  </a>
                ) : (
                  <span>{item.value}</span>
                )}
              </React.Fragment>
            ))}
          </p>
        )}

        <div className="pt-1" style={{ borderBottom: `1.5px solid ${INK}` }} />
      </header>

      {summary && (
        <section>
          <SectionTitle>Summary</SectionTitle>
          <p
            data-break-point="true"
            className="text-[11.5px] leading-relaxed text-justify"
            style={{ color: BODY }}
          >
            {summary}
          </p>
        </section>
      )}

      {activeSkills.length > 0 && (
        <section>
          <SectionTitle>Technical Skills</SectionTitle>
          {shouldRenderGroupedSkills ? (
            <div className="space-y-1">
              {groupedSkills.map((group) => (
                <p
                  key={group.id}
                  data-break-point="true"
                  className="text-[11px] leading-relaxed text-justify"
                  style={{ color: BODY }}
                >
                  <span className="font-bold" style={{ color: INK }}>
                    {group.label || "Skills"}:
                  </span>{" "}
                  {group.items.join(", ")}
                </p>
              ))}
            </div>
          ) : (
            <p
              data-break-point="true"
              className="text-[11px] leading-relaxed text-justify"
              style={{ color: BODY }}
            >
              {activeSkills.join(", ")}
            </p>
          )}
        </section>
      )}

      {experience.length > 0 && (
        <section>
          <SectionTitle>Professional Experience</SectionTitle>
          <div className="space-y-3.5">
            {experience.map((item) => (
              <ExperienceBlock key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section>
          <SectionTitle>Projects</SectionTitle>
          <div className="space-y-3.5">
            {projects.map((project) => (
              <div
                key={project.id}
                data-no-split="true"
                className="space-y-0.75"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p
                    className="text-[12px] font-bold leading-snug"
                    style={{ color: INK }}
                  >
                    {project.name}
                  </p>
                  <DateRange
                    startDate={project.startDate}
                    endDate={project.endDate}
                  />
                </div>
                   {project.link && (
                  <a
                    href={toExternalLinkHref(project.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] break-all hover:underline"
                    style={{ color: MUTED }}
                  >
                    {project.link}
                  </a>
                )}
                {project.description &&
                  (() => {
                    const bullets = toDescriptionBullets(project.description);
                    if (bullets.length > 0) {
                      return (
                        <ul className="list-disc pl-4 space-y-0.75 mt-1.5">
                          {bullets.map((line, i) => (
                            <li
                              key={`${project.id}-b-${i}`}
                              data-break-point="true"
                              className="text-[11px] leading-[1.6] text-justify"
                              style={{ color: BODY }}
                            >
                              {line}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p
                        data-break-point="true"
                        className="text-[11px] leading-[1.6] text-justify whitespace-pre-line mt-1.5"
                        style={{ color: BODY }}
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
          <SectionTitle>Volunteering</SectionTitle>
          <div className="space-y-3.5">
            {volunteering.map((item) => (
              <ExperienceBlock key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section>
          <SectionTitle>Education</SectionTitle>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} data-no-split="true" className="space-y-0.75">
                <div className="flex items-baseline justify-between gap-3">
                  <p
                    className="text-[12px] font-bold leading-snug"
                    style={{ color: INK }}
                  >
                    {edu.degree}
                  </p>
                  <DateRange startDate={edu.startDate} endDate={edu.endDate} />
                </div>
                <p
                  className="text-[10.5px] font-semibold"
                  style={{ color: SECTION_ACCENT }}
                >
                  {edu.school}
                </p>
                {edu.description && (
                  <p
                    data-break-point="true"
                    className="text-[11px] leading-[1.6] text-justify whitespace-pre-line"
                    style={{ color: BODY }}
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
          <SectionTitle>Certifications</SectionTitle>
          <ul className="list-disc pl-4 space-y-0.75">
            {certifications.map((cert, i) => (
              <li
                key={`${cert}-${i}`}
                data-break-point="true"
                className="text-[11px] leading-relaxed"
                style={{ color: BODY }}
              >
                {cert}
              </li>
            ))}
          </ul>
        </section>
      )}

      {languages.length > 0 && (
        <section>
          <SectionTitle>Languages</SectionTitle>
          <p
            data-break-point="true"
            className="text-[11px] leading-relaxed"
            style={{ color: BODY }}
          >
            {languages.join(", ")}
          </p>
        </section>
      )}

      {achievements.length > 0 && (
        <section>
          <SectionTitle>Achievements</SectionTitle>
          <ul className="list-disc pl-4 space-y-0.75">
            {achievements.map((ach, i) => (
              <li
                key={`${ach}-${i}`}
                data-break-point="true"
                className="text-[11px] leading-relaxed"
                style={{ color: BODY }}
              >
                {ach}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default AtsTemplate;
