import React from "react";
import type { BuilderTemplateComponentProps } from "../../../types/builder";
import {
  getActiveSkillItems,
  getPersonalLinkDisplayLabel,
  getVisiblePersonalLinks,
  toExternalLinkHref,
} from "../../../domain/resume";
import { toDescriptionBullets } from "./utils";

const INK = "#111111";
const MUTED = "#6b6b68";
const RULE = "#d8d6d3";
const SECTION_ACCENT = "#1f3a5f";

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
    <div style={{ width: 3, height: 13, backgroundColor: SECTION_ACCENT, borderRadius: 2, flexShrink: 0 }} />
    <h2 style={{ fontSize: 9.5, fontWeight: 700, color: SECTION_ACCENT, letterSpacing: "0.14em", textTransform: "uppercase", lineHeight: 1, margin: 0 }}>
      {children}
    </h2>
  </div>
);

const DateRange: React.FC<{ startDate?: string; endDate?: string }> = ({ startDate = "", endDate = "" }) => {
  const left = startDate.trim();
  const right = endDate.trim();
  if (!left && !right) return null;
  return (
    <span style={{ fontSize: 8.5, color: MUTED, whiteSpace: "nowrap", flexShrink: 0 }}>
      {left}{right ? ` – ${right}` : ""}
    </span>
  );
};

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <div style={{ marginTop: 3 }}>
    {items.map((item, i) => (
      <div key={i} style={{ display: "flex", marginTop: 3 }}>
        <span style={{ fontSize: 9.5, color: INK, marginRight: 5, lineHeight: 1.6, flexShrink: 0 }}>•</span>
        <span data-break-point="true" style={{ fontSize: 9.5, color: INK, lineHeight: 1.6, flex: 1, textAlign: "justify" }}>
          {item}
        </span>
      </div>
    ))}
  </div>
);

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
    <div data-no-split="true" style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: INK }}>{item.role}</span>
        <DateRange startDate={item.startDate} endDate={item.endDate} />
      </div>
      {item.company && (
        <div style={{ fontSize: 9.5, fontWeight: 700, color: SECTION_ACCENT, marginTop: 2 }}>
          {item.company}
        </div>
      )}
      {bullets.length > 0 ? (
        <Bullets items={bullets} />
      ) : item.description ? (
        <p data-break-point="true" style={{ fontSize: 9.5, color: INK, lineHeight: 1.6, textAlign: "justify", marginTop: 3 }}>
          {item.description}
        </p>
      ) : null}
    </div>
  );
};

const AtsTemplate: React.FC<BuilderTemplateComponentProps> = ({ data, contentRef }) => {
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
  const shouldRenderGroupedSkills = skills.mode === "grouped" && groupedSkills.length > 0;

  return (
    <div
      ref={contentRef}
      style={{
        fontFamily: "Helvetica, Arial, sans-serif",
        color: INK,
        paddingTop: 25,
        paddingBottom: 25,
        paddingLeft: 35,
        paddingRight: 35,
      }}
    >
      {/* Header */}
      <div data-no-split="true">
        <h1 style={{ fontSize: 26, fontWeight: 700, color: INK, letterSpacing: "-0.5px", lineHeight: 1.1, margin: 0 }}>
          {personalInfo.fullName || <span style={{ color: RULE }}>Your Name</span>}
          {personalInfo.jobTitle && (
            <span style={{ fontSize: 26, fontWeight: 400, color: MUTED, letterSpacing: "-0.3px" }}>
              , {personalInfo.jobTitle}
            </span>
          )}
        </h1>

        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 5 }}>
          {personalInfo.email && (
            <a
              href={`mailto:${personalInfo.email}`}
              style={{ fontSize: 8.5, color: MUTED, textDecoration: "none" }}
            >
              {personalInfo.email}
            </a>
          )}
          {personalInfo.phone && (
            <React.Fragment>
              {personalInfo.email && (
                <span style={{ fontSize: 8.5, color: RULE, marginLeft: 3, marginRight: 3 }}>·</span>
              )}
              <span style={{ fontSize: 8.5, color: MUTED }}>{personalInfo.phone}</span>
            </React.Fragment>
          )}
          {personalInfo.location && (
            <React.Fragment>
              {(personalInfo.email || personalInfo.phone) && (
                <span style={{ fontSize: 8.5, color: RULE, marginLeft: 3, marginRight: 3 }}>·</span>
              )}
              <span style={{ fontSize: 8.5, color: MUTED }}>{personalInfo.location}</span>
            </React.Fragment>
          )}
          {visibleLinks.map((link) => (
            <React.Fragment key={link.id}>
              <span style={{ fontSize: 8.5, color: RULE, marginLeft: 3, marginRight: 3 }}>·</span>
              <a
                href={toExternalLinkHref(link.url)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 8.5, color: MUTED, textDecoration: "none" }}
              >
                {getPersonalLinkDisplayLabel(link)}
              </a>
            </React.Fragment>
          ))}
        </div>

        <div style={{ borderBottom: `1.5px solid ${INK}`, marginTop: 8 }} />
      </div>

      {/* Summary */}
      {summary && (
        <section style={{ marginTop: 16 }}>
          <SectionTitle>Summary</SectionTitle>
          <p data-break-point="true" style={{ fontSize: 9.5, color: INK, lineHeight: 1.6, textAlign: "justify", margin: 0 }}>
            {summary}
          </p>
        </section>
      )}

      {/* Skills */}
      {activeSkills.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <SectionTitle>Technical Skills</SectionTitle>
          {shouldRenderGroupedSkills ? (
            <div>
              {groupedSkills.map((group) => (
                <p key={group.id} data-break-point="true" style={{ fontSize: 9.5, color: INK, lineHeight: 1.6, textAlign: "justify", margin: 0 }}>
                  <span style={{ fontWeight: 700 }}>{group.label || "Skills"}: </span>
                  {group.items.join(", ")}
                </p>
              ))}
            </div>
          ) : (
            <p data-break-point="true" style={{ fontSize: 9.5, color: INK, lineHeight: 1.6, textAlign: "justify", margin: 0 }}>
              {activeSkills.join(", ")}
            </p>
          )}
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <SectionTitle>Professional Experience</SectionTitle>
          {experience.map((item) => (
            <ExperienceBlock key={item.id} item={item} />
          ))}
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <SectionTitle>Projects</SectionTitle>
          {projects.map((project) => {
            const bullets = toDescriptionBullets(project.description ?? "");
            return (
              <div key={project.id} data-no-split="true" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: INK }}>{project.name}</span>
                  <DateRange startDate={project.startDate} endDate={project.endDate} />
                </div>
                {project.link && (
                  <a
                    href={toExternalLinkHref(project.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 8.5, color: MUTED, textDecoration: "none", display: "block" }}
                  >
                    {project.link}
                  </a>
                )}
                {bullets.length > 0 ? (
                  <Bullets items={bullets} />
                ) : project.description ? (
                  <p data-break-point="true" style={{ fontSize: 9.5, color: INK, lineHeight: 1.6, textAlign: "justify", marginTop: 3 }}>
                    {project.description}
                  </p>
                ) : null}
              </div>
            );
          })}
        </section>
      )}

      {/* Volunteering */}
      {volunteering.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <SectionTitle>Volunteering</SectionTitle>
          {volunteering.map((item) => (
            <ExperienceBlock key={item.id} item={item} />
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <SectionTitle>Education</SectionTitle>
          {education.map((edu) => (
            <div key={edu.id} data-no-split="true" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: INK }}>{edu.degree}</span>
                <DateRange startDate={edu.startDate} endDate={edu.endDate} />
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: SECTION_ACCENT, marginTop: 2 }}>
                {edu.school}
              </div>
              {edu.description && (
                <p data-break-point="true" style={{ fontSize: 9.5, color: INK, lineHeight: 1.6, textAlign: "justify", marginTop: 3 }}>
                  {edu.description}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <SectionTitle>Certifications</SectionTitle>
          <Bullets items={certifications} />
        </section>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <SectionTitle>Languages</SectionTitle>
          <p style={{ fontSize: 9.5, color: INK, lineHeight: 1.6, margin: 0 }}>
            {languages.join(", ")}
          </p>
        </section>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <SectionTitle>Achievements</SectionTitle>
          <Bullets items={achievements} />
        </section>
      )}
    </div>
  );
};

export default AtsTemplate;