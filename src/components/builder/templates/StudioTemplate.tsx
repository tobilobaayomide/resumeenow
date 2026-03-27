import React from "react";
import { FiMail, FiPhone, FiMapPin, FiGlobe } from "react-icons/fi";
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

const ACCENT = "#1a1a2e";
const ACCENT_RULE = "#e63946";

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="mb-3.5">
    <h2
      style={{ color: ACCENT }}
      className="text-[9.5px] font-black uppercase tracking-[0.3em] leading-none"
    >
      {children}
    </h2>
    <div
      className="mt-1.5 h-0.5 w-full"
      style={{
        background: `linear-gradient(to right, ${ACCENT_RULE} 32px, rgba(230,57,70,0.15) 32px)`,
      }}
    />
  </div>
);

const DateBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    className="shrink-0 text-[9px] font-bold tracking-[0.04em] px-1.75 py-0.5 rounded-[3px] tabular-nums"
    style={{ color: ACCENT_RULE, background: "rgba(230,57,70,0.08)" }}
  >
    {children}
  </span>
);

const Entry: React.FC<{
  children: React.ReactNode;
  noSplit?: boolean;
  className?: string;
  ['data-ai-highlight-anchor']?: string;
}> = ({
  children,
  noSplit,
  className,
  "data-ai-highlight-anchor": aiHighlightAnchor,
}) => (
  <div
    data-no-split={noSplit ? "true" : undefined}
    data-ai-highlight-anchor={aiHighlightAnchor}
    className={`pl-0 border-l-2 border-transparent ${className ?? ""}`.trim()}
  >
    {children}
  </div>
);

const SkillPill: React.FC<{ label: string; className?: string }> = ({
  label,
  className,
}) => (
  <span
    className={`text-[10px] font-semibold px-2.5 py-0.75 rounded-[3px] tracking-[0.03em] ${
      className ?? ""
    }`.trim()}
    style={{
      color: ACCENT,
      background: "rgba(26,26,46,0.06)",
      border: "1px solid rgba(26,26,46,0.12)",
    }}
  >
    {label}
  </span>
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
  <ul className="mt-2 space-y-1 list-disc list-outside pl-4">
    {bullets.map((line, i) => (
      <li
        key={`${id}-b-${i}`}
        data-break-point="true"
        className={`text-[11px] text-gray-600 leading-relaxed text-justify ${
          isBuilderAiTextHighlighted(highlightedBullets, line)
            ? previewHighlightInlineClassName
            : ""
        }`}
      >
        {line}
      </li>
    ))}
  </ul>
);

const StudioTemplate: React.FC<BuilderTemplateComponentProps> = ({
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
      className="font-sans text-black bg-white"
      data-self-padded="true"
       data-flush-header="true" 
    >
      <header
        data-no-split="true"
        className="px-8 pt-7 pb-6"
        style={{
          backgroundColor: ACCENT,
          backgroundImage: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        }}
      >
        <h1 className="text-[36px] font-black tracking-tight leading-none text-white uppercase">
          {personalInfo.fullName || (
            <span className="opacity-30">Your Name</span>
          )}
        </h1>
        <p
          style={{ color: ACCENT_RULE }}
          className="text-[12px] font-bold uppercase tracking-[0.25em] mt-2"
        >
          {personalInfo.jobTitle || (
            <span className="opacity-30 text-white">Job Title</span>
          )}
        </p>
        <div className="mt-4 mb-3.5 h-px bg-white/10" />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {personalInfo.email && (
            <a
              href={`mailto:${personalInfo.email}`}
              className="flex items-center gap-1.5 text-[10px] text-white/65 hover:text-white transition-colors"
            >
              <FiMail size={9} className="shrink-0" />
              {personalInfo.email}
            </a>
          )}
          {personalInfo.phone && (
            <span className="flex items-center gap-1.5 text-[10px] text-white/65">
              <FiPhone size={9} className="shrink-0" />
              {personalInfo.phone}
            </span>
          )}
          {personalInfo.location && (
            <span className="flex items-center gap-1.5 text-[10px] text-white/65">
              <FiMapPin size={9} className="shrink-0" />
              {personalInfo.location}
            </span>
          )}
          {linkItems.map((link) => (
            <a
              key={link.id}
              href={toExternalLinkHref(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] text-white/65 hover:text-white transition-colors break-all"
            >
              <FiGlobe size={9} className="shrink-0" />
              {getPersonalLinkDisplayLabel(link)}
            </a>
          ))}
        </div>
      </header>

      <div className="px-8 py-6 space-y-6">
        {summary && (
          <section
            data-ai-highlight-anchor="summary"
            className={isSummaryHighlighted ? previewHighlightSectionClassName : undefined}
          >
            <SectionHeading>Profile</SectionHeading>
            <p
              data-break-point="true"
              className="text-[11.5px] leading-relaxed text-gray-600 text-justify"
            >
              {summary}
            </p>
          </section>
        )}

        {experience.length > 0 && (
          <section>
            <SectionHeading>Experience</SectionHeading>
            <div className="space-y-5">
              {experience.map((exp) => (
                <Entry
                  key={exp.id}
                  noSplit
                  data-ai-highlight-anchor={`experience-${exp.id}`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3
                      style={{ color: ACCENT }}
                      className="text-[12.5px] font-black leading-snug uppercase tracking-[0.02em]"
                    >
                      {exp.role}
                    </h3>
                    <DateBadge>
                      {exp.startDate}
                      {exp.endDate ? ` – ${exp.endDate}` : " – Present"}
                    </DateBadge>
                  </div>
                  <p className="text-[10.5px] font-semibold text-gray-500 mt-0.5">
                    {exp.company}
                  </p>
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
                          className="text-[11px] text-gray-600 mt-2 leading-relaxed text-justify whitespace-pre-line"
                        >
                          {exp.description}
                        </p>
                      );
                    })()}
                </Entry>
              ))}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section>
            <SectionHeading>Projects</SectionHeading>
            <div className="space-y-4">
              {projects.map((project) => (
                <Entry key={project.id}>
                  <div
                    className="flex items-baseline justify-between gap-4"
                    data-no-split="true"
                  >
                    <h3
                      style={{ color: ACCENT }}
                      className="text-[12px] font-black leading-snug uppercase tracking-[0.02em]"
                    >
                      {project.name}
                    </h3>
                    {(project.startDate || project.endDate) && (
                      <DateBadge>
                        {project.startDate}
                        {project.endDate ? ` – ${project.endDate}` : ""}
                      </DateBadge>
                    )}
                  </div>
                  {project.link && (
                    <p className="text-[9.5px] text-gray-400 mt-0.5 break-all">
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
                          className="text-[11px] text-gray-600 mt-1.5 leading-relaxed text-justify"
                        >
                          {project.description}
                        </p>
                      );
                    })()}
                </Entry>
              ))}
            </div>
          </section>
        )}

        {education.length > 0 && (
          <section>
            <SectionHeading>Education</SectionHeading>
            <div className="space-y-4">
              {education.map((edu) => (
                <Entry key={edu.id} noSplit>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3
                      style={{ color: ACCENT }}
                      className="text-[12px] font-black leading-snug uppercase tracking-[0.02em]"
                    >
                      {edu.school}
                    </h3>
                    <DateBadge>
                      {edu.startDate}
                      {edu.endDate ? ` – ${edu.endDate}` : ""}
                    </DateBadge>
                  </div>
                  <p className="text-[10.5px] font-semibold text-gray-500 mt-0.5">
                    {edu.degree}
                  </p>
                  {edu.description && (
                    <p
                      data-break-point="true"
                      className="text-[11px] text-gray-600 mt-1 leading-relaxed"
                    >
                      {edu.description}
                    </p>
                  )}
                </Entry>
              ))}
            </div>
          </section>
        )}

        {activeSkills.length > 0 && (
          <section
            data-ai-highlight-anchor="skills"
            className={isSkillsHighlighted ? previewHighlightSectionClassName : undefined}
          >
            <SectionHeading>Skills</SectionHeading>
            {shouldRenderGroupedSkills ? (
              <div className="space-y-1.5">
                {groupedSkills.map((group) => (
                  <p
                    key={group.id}
                    data-break-point="true"
                    className="text-[11px] text-gray-600 leading-relaxed"
                  >
                    <span style={{ color: ACCENT }} className="font-bold">
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
              <div data-break-point="true" className="flex flex-wrap gap-1.5">
                {activeSkills.map((skill) => (
                  <SkillPill
                    key={skill}
                    label={skill}
                    className={
                      isBuilderAiTextHighlighted(aiHighlights?.skills ?? [], skill)
                        ? previewHighlightInlineClassName
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {volunteering.length > 0 && (
          <section>
            <SectionHeading>Volunteering</SectionHeading>
            <div className="space-y-4">
              {volunteering.map((item) => (
                <Entry key={item.id} noSplit>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3
                      style={{ color: ACCENT }}
                      className="text-[12px] font-black leading-snug uppercase tracking-[0.02em]"
                    >
                      {item.role}
                    </h3>
                    <DateBadge>
                      {item.startDate}
                      {item.endDate ? ` – ${item.endDate}` : " – Present"}
                    </DateBadge>
                  </div>
                  <p className="text-[10.5px] font-semibold text-gray-500 mt-0.5">
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
                          className="text-[11px] text-gray-600 mt-1.5 leading-relaxed text-justify whitespace-pre-line"
                        >
                          {item.description}
                        </p>
                      );
                    })()}
                </Entry>
              ))}
            </div>
          </section>
        )}

        {certifications.length > 0 && (
          <section>
            <SectionHeading>Certifications</SectionHeading>
            <div className="space-y-1">
              {certifications.map((cert, i) => (
                <p
                  key={`${cert}-${i}`}
                  data-break-point="true"
                  className="text-[11px] text-gray-600 leading-relaxed"
                >
                  {cert}
                </p>
              ))}
            </div>
          </section>
        )}

        {languages.length > 0 && (
          <section>
            <SectionHeading>Languages</SectionHeading>
            <div data-break-point="true" className="flex flex-wrap gap-1.5">
              {languages.map((lang) => (
                <SkillPill key={lang} label={lang} />
              ))}
            </div>
          </section>
        )}

        {achievements.length > 0 && (
          <section>
            <SectionHeading>Achievements</SectionHeading>
            <div className="space-y-1">
              {achievements.map((ach, i) => (
                <p
                  key={`${ach}-${i}`}
                  data-break-point="true"
                  className="text-[11px] text-gray-600 leading-relaxed"
                >
                  {ach}
                </p>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default StudioTemplate;
