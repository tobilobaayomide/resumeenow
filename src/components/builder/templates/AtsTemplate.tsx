import React from "react";
import type {
  AtsDateRangeProps,
  AtsExperienceBlockProps,
  BuilderTemplateComponentProps,
  TemplateSectionTitleProps,
} from "../../../types/builder";
import {
  getActiveSkillItems,
  getPersonalLinkDisplayLabel,
  getVisiblePersonalLinks,
  toExternalLinkHref,
} from "../../../domain/resume";
import { toDescriptionBullets } from "./utils";

const SectionTitle: React.FC<TemplateSectionTitleProps> = ({ children }) => (
  <h2 className="text-[11px] font-bold tracking-[0.16em] text-black uppercase border-b border-black pb-1 mb-2">
    {children}
  </h2>
);

const toBullets = (value: string): string[] =>
  value
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((line) => line.trim())
    .filter(Boolean);

const DateRange: React.FC<AtsDateRangeProps> = ({ startDate, endDate }) => {
  const left = startDate.trim();
  const right = endDate.trim();
  if (!left && !right) return null;

  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
      {left}
      {right ? ` - ${right}` : ""}
    </span>
  );
};

const ExperienceBlock: React.FC<AtsExperienceBlockProps> = ({ item }) => {
  const bullets = toBullets(item.description);

  return (
    <div className="space-y-1.5">
      {/* CHANGED: Role/title first, then company below it */}
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[12px] font-semibold text-gray-800">{item.role}</p>
        <DateRange startDate={item.startDate} endDate={item.endDate} />
      </div>
      {item.company && (
        <p className="text-[12px] font-bold text-black">{item.company}</p>
      )}
      {bullets.length > 0 && (
        <ul className="space-y-1 pl-4 list-disc text-[11px] text-gray-700 leading-relaxed text-justify">
          {bullets.map((line, index) => (
            <li key={`${item.id}-${index}`}>{line}</li>
          ))}
        </ul>
      )}
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
  const groupedSkills = skills.groups.filter((group) => group.items.length > 0);
  const shouldRenderGroupedSkills =
    skills.mode === "grouped" && groupedSkills.length > 0;
  const contactDetails = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
  ].filter(Boolean);

  const contactItems = [
    ...visibleLinks.map((link) => ({
      id: link.id,
      type: "link" as const,
      label: getPersonalLinkDisplayLabel(link),
      href: toExternalLinkHref(link.url),
    })),
    ...(personalInfo.email
      ? [
          {
            id: "contact-email",
            type: "email" as const,
            value: personalInfo.email,
          },
        ]
      : []),
    ...contactDetails
      .filter((item) => item !== personalInfo.email)
      .map((item, index) => ({
        id: `contact-${index}`,
        type: "text" as const,
        value: item,
      })),
  ];

  return (
    <div ref={contentRef} className="font-sans text-black space-y-5">
      <header className="space-y-1">
        <h1 className="text-[26px] font-bold tracking-tight text-black">
          {personalInfo.fullName || (
            <span className="text-gray-300">Your Name</span>
          )}
          {personalInfo.jobTitle ? (
            <span className="font-medium text-gray-700">
              , {personalInfo.jobTitle}
            </span>
          ) : null}
        </h1>
        {contactItems.length > 0 && (
          <p className="text-[11px] text-gray-600">
            {contactItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <span> ╴ </span>}
                {item.type === "link" ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline break-all text-blue-600"
                  >
                    {item.label}
                  </a>
                ) : item.type === "email" ? (
                  <a
                    href={`mailto:${item.value}`}
                    className="hover:underline break-all text-blue-600"
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
      </header>

      {summary && (
        <section>
          <SectionTitle>Summary</SectionTitle>
          <p className="text-[12px] leading-relaxed text-gray-700 text-justify">
            {summary}
          </p>
        </section>
      )}

      {activeSkills.length > 0 && (
        <section>
          <SectionTitle>Technical Skills</SectionTitle>
          {shouldRenderGroupedSkills ? (
            <div className="space-y-1 text-[11px] leading-relaxed text-gray-700 text-justify">
              {groupedSkills.map((group) => (
                <p key={group.id}>
                  <span className="font-bold text-black">
                    {group.label || "Skills"}:
                  </span>{" "}
                  {group.items.join(", ")}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-gray-700 text-justify">
              {activeSkills.join(", ")}
            </p>
          )}
        </section>
      )}

      {experience.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>Professional Experience</SectionTitle>
          {experience.map((item) => (
            <ExperienceBlock key={item.id} item={item} />
          ))}
        </section>
      )}

      {projects.length > 0 && (
        <section className="space-y-2.5">
          <SectionTitle>Projects</SectionTitle>
          {projects.map((project) => (
            <div key={project.id}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[12px] font-semibold text-black">
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
                  className="text-[11px] text-blue-600 hover:underline break-all"
                >
                  {project.link}
                </a>
              )}
              {project.description &&
                (() => {
                  const bullets = toDescriptionBullets(project.description);
                  if (bullets.length > 0) {
                    return (
                      <ul className="list-disc pl-4 text-[11px] text-gray-700 leading-relaxed text-justify space-y-1">
                        {bullets.map((line, index) => (
                          <li key={`${project.id}-desc-${index}`}>{line}</li>
                        ))}
                      </ul>
                    );
                  }

                  return (
                    <p className="text-[11px] text-gray-700 leading-relaxed text-justify whitespace-pre-line">
                      {project.description}
                    </p>
                  );
                })()}
            </div>
          ))}
        </section>
      )}

      {volunteering.length > 0 && (
        <section className="space-y-2.5">
          <SectionTitle>Volunteering</SectionTitle>
          {volunteering.map((item) => (
            <ExperienceBlock key={item.id} item={item} />
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section className="space-y-2.5">
          <SectionTitle>Education</SectionTitle>
          {education.map((edu) => (
            <div key={edu.id}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[12px] font-semibold text-black">
                  {edu.degree}
                </p>
                <DateRange startDate={edu.startDate} endDate={edu.endDate} />
              </div>
              <p className="text-[11px] text-gray-700">{edu.school}</p>
              {edu.description && (
                <p className="text-[11px] text-gray-700 leading-relaxed text-justify whitespace-pre-line">
                  {edu.description}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {certifications.length > 0 && (
        <section>
          <SectionTitle>Certifications</SectionTitle>
          <ul className="list-disc pl-4 text-[11px] text-gray-700 space-y-1">
            {certifications.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {languages.length > 0 && (
        <section>
          <SectionTitle>Languages</SectionTitle>
          <p className="text-[11px] leading-relaxed text-gray-700">
            {languages.join(", ")}
          </p>
        </section>
      )}

      {achievements.length > 0 && (
        <section>
          <SectionTitle>Achievements</SectionTitle>
          <ul className="list-disc pl-4 text-[11px] text-gray-700 space-y-1">
            {achievements.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default AtsTemplate;
