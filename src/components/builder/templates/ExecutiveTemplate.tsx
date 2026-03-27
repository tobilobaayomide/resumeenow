import React from "react";
import { FiMail, FiPhone, FiMapPin, FiGlobe } from "react-icons/fi";
import type {
  BuilderTemplateComponentProps,
  TemplateSectionTitleProps,
} from "../../../types/builder";
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

const ACCENT = "#1B2A4A";
const GOLD = "#B08D57";
const SIDEBAR_BG = "#F4F6F9";

const SectionTitle: React.FC<TemplateSectionTitleProps> = ({ children }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div
      className="w-0.75 h-4 rounded-full shrink-0"
      style={{ backgroundColor: GOLD }}
    />
    <h3
      className="text-[9.5px] font-black uppercase tracking-[0.2em]"
      style={{ color: ACCENT }}
    >
      {children}
    </h3>
    <div className="flex-1 h-px bg-gray-200" />
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
  <ul className="mt-1.5 space-y-1 list-disc list-outside pl-4">
    {bullets.map((line, i) => (
      <li
        key={`${id}-b-${i}`}
        data-break-point="true"
        className={`text-[11px] leading-relaxed text-gray-600 text-justify ${
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

const ExecutiveTemplate: React.FC<BuilderTemplateComponentProps> = ({
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

  const hasSidebarContent =
    education.length > 0 ||
    activeSkills.length > 0 ||
    certifications.length > 0 ||
    languages.length > 0 ||
    achievements.length > 0;

  return (
    <div
      ref={contentRef}
      className="font-sans text-black bg-white"
      data-self-padded="true"
    >
      <header
        data-no-split="true"
        className="px-8 pt-0 pb-6 bg-white"
        style={{ borderBottom: `3px solid ${GOLD}` }}
      >
        <div className="flex items-stretch gap-5">
          <div
            className="w-1 rounded-full shrink-0"
            style={{ backgroundColor: GOLD, minHeight: "100%" }}
          />
          <div className="flex-1">
            <h1
              className="text-[38px] font-black tracking-tight leading-none uppercase"
              style={{ color: ACCENT }}
            >
              {personalInfo.fullName || (
                <span className="text-gray-200">Your Name</span>
              )}
            </h1>

            <p
              className="text-[11px] font-bold uppercase tracking-[0.28em] mt-1.5"
              style={{ color: GOLD }}
            >
              {personalInfo.jobTitle || (
                <span className="text-gray-300">Job Title</span>
              )}
            </p>

            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3"
              style={{ borderTop: `1px solid rgba(176,141,87,0.25)` }}
            >
              {personalInfo.email && (
                <a
                  href={`mailto:${personalInfo.email}`}
                  className="flex items-center gap-1.5 text-[10px] text-gray-800 break-all"
                >
                  <FiMail
                    size={9}
                    className="shrink-0"
                    style={{ color: GOLD }}
                  />
                  {personalInfo.email}
                </a>
              )}
              {personalInfo.phone && (
                <span className="flex items-center gap-1.5 text-[10px] text-gray-800">
                  <FiPhone
                    size={9}
                    className="shrink-0"
                    style={{ color: GOLD }}
                  />
                  {personalInfo.phone}
                </span>
              )}
              {personalInfo.location && (
                <span className="flex items-center gap-1.5 text-[10px] text-gray-800">
                  <FiMapPin
                    size={9}
                    className="shrink-0"
                    style={{ color: GOLD }}
                  />
                  {personalInfo.location}
                </span>
              )}
              {linkItems.map((link) => (
                <a
                  key={link.id}
                  href={toExternalLinkHref(link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] text-gray-800 break-all"
                >
                  <FiGlobe
                    size={9}
                    className="shrink-0"
                    style={{ color: GOLD }}
                  />
                  {getPersonalLinkDisplayLabel(link)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </header>

      {hasSidebarContent ? (
        <div className="flex items-start">
          <div className="w-2/3 px-8 py-6 space-y-6">
            {summary && (
              <section
                data-ai-highlight-anchor="summary"
                className={isSummaryHighlighted ? previewHighlightSectionClassName : undefined}
              >
                <SectionTitle>Summary</SectionTitle>
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
                <SectionTitle>Experience</SectionTitle>
                <div className="space-y-5">
                  {experience.map((exp) => (
                    <div
                      key={exp.id}
                      data-no-split="true"
                      data-ai-highlight-anchor={`experience-${exp.id}`}
                    >
                      <div className="flex justify-between items-baseline gap-2">
                        <h4
                          className="font-black text-[12.5px] uppercase tracking-[0.02em]"
                          style={{ color: ACCENT }}
                        >
                          {exp.role || (
                            <span className="text-gray-300">Role</span>
                          )}
                        </h4>
                        <span
                          className="text-[9.5px] font-bold whitespace-nowrap shrink-0 px-2 py-0.5 rounded-sm"
                          style={{
                            color: GOLD,
                            backgroundColor: "rgba(176,141,87,0.08)",
                            border: "1px solid rgba(176,141,87,0.25)",
                          }}
                        >
                          {exp.startDate}
                          {exp.endDate ? ` — ${exp.endDate}` : " — Present"}
                        </span>
                      </div>
                      <p className="text-[10.5px] font-semibold text-gray-500 mt-0.5">
                        {exp.company || (
                          <span className="text-gray-300">Company</span>
                        )}
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
                              className="text-[11px] leading-relaxed text-gray-600 mt-1.5 text-justify whitespace-pre-line"
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
                <SectionTitle>Projects</SectionTitle>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} data-no-split="true">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4
                          className="font-black text-[12px] uppercase tracking-[0.02em]"
                          style={{ color: ACCENT }}
                        >
                          {project.name || (
                            <span className="text-gray-300">Project</span>
                          )}
                        </h4>
                        {(project.startDate || project.endDate) && (
                          <span
                            className="text-[9.5px] font-bold whitespace-nowrap shrink-0 px-2 py-0.5 rounded-sm"
                            style={{
                              color: GOLD,
                              backgroundColor: "rgba(176,141,87,0.08)",
                              border: "1px solid rgba(176,141,87,0.25)",
                            }}
                          >
                            {project.startDate}
                            {project.endDate ? ` — ${project.endDate}` : ""}
                          </span>
                        )}
                      </div>
                      {project.link && (
                        <a
                          href={toExternalLinkHref(project.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9.5px] text-gray-800 mt-0.5 break-all"
                        >
                          {project.link}
                        </a>
                      )}
                      {project.description &&
                        (() => {
                          const bullets = toDescriptionBullets(
                            project.description,
                          );
                          return bullets.length > 0 ? (
                            <BulletList id={project.id} bullets={bullets} />
                          ) : (
                            <p 
                              data-break-point="true"
                              className="text-[11px] leading-relaxed text-gray-600 mt-1.5 text-justify"
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
                <div className="space-y-4">
                  {volunteering.map((item) => (
                    <div key={item.id} data-no-split="true">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4
                          className="font-black text-[12px] uppercase tracking-[0.02em]"
                          style={{ color: ACCENT }}
                        >
                          {item.role || (
                            <span className="text-gray-300">Role</span>
                          )}
                        </h4>
                        <span
                          className="text-[9.5px] font-bold whitespace-nowrap shrink-0 px-2 py-0.5 rounded-sm"
                          style={{
                            color: GOLD,
                            backgroundColor: "rgba(176,141,87,0.08)",
                            border: "1px solid rgba(176,141,87,0.25)",
                          }}
                        >
                          {item.startDate}
                          {item.endDate ? ` — ${item.endDate}` : " — Present"}
                        </span>
                      </div>
                      <p className="text-[10.5px] font-semibold text-gray-500 mt-0.5">
                        {item.company}
                      </p>
                      {item.description &&
                        (() => {
                          const bullets = toDescriptionBullets(
                            item.description,
                          );
                          return bullets.length > 0 ? (
                            <BulletList id={item.id} bullets={bullets} />
                          ) : (
                            <p 
                              data-break-point="true"
                              className="text-[11px] leading-relaxed text-gray-600 mt-1.5 text-justify whitespace-pre-line"
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
          </div>

          <div
            className="w-1/3 px-5 py-6 space-y-6 self-start"
            style={{
              backgroundColor: SIDEBAR_BG,
              borderLeft: `1px solid rgba(176,141,87,0.15)`,
            }}
          >
            {education.length > 0 && (
              <section>
                <SectionTitle>Education</SectionTitle>
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id} data-no-split="true">
                      <h4
                        className="font-black text-[11px] leading-snug uppercase tracking-[0.02em]"
                        style={{ color: ACCENT }}
                      >
                        {edu.school || (
                          <span className="text-gray-300">School</span>
                        )}
                      </h4>
                      <p className="text-[10px] font-semibold text-gray-500 mt-0.5">
                        {edu.degree}
                      </p>
                      <p
                        className="text-[9.5px] font-bold mt-0.5"
                        style={{ color: GOLD }}
                      >
                        {edu.startDate}
                        {edu.endDate ? ` — ${edu.endDate}` : ""}
                      </p>
                      {edu.description && (
                        <p 
                          data-break-point="true"
                          className="text-[10px] text-gray-500 mt-1 leading-snug"
                        >
                          {edu.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSkills.length > 0 && (
              <section
                data-ai-highlight-anchor="skills"
                className={isSkillsHighlighted ? previewHighlightSectionClassName : undefined}
              >
                <SectionTitle>Skills</SectionTitle>
                {shouldRenderGroupedSkills ? (
                  <div className="space-y-1.5">
                    {groupedSkills.map((group) => (
                      <p
                        key={group.id}
                        className="text-[10px] text-gray-600 leading-relaxed"
                      >
                        <span className="font-bold" style={{ color: ACCENT }}>
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
                  <div className="flex flex-wrap gap-1.5">
                    {activeSkills.map((skill, i) => (
                      <span
                        key={i}
                        className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-sm ${
                          isBuilderAiTextHighlighted(aiHighlights?.skills ?? [], skill)
                            ? previewHighlightInlineClassName
                            : ""
                        }`}
                        style={{
                          color: ACCENT,
                          backgroundColor: "white",
                          border: `1px solid rgba(176,141,87,0.35)`,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}

            {certifications.length > 0 && (
              <section>
                <SectionTitle>Certifications</SectionTitle>
                <ul className="space-y-1.5">
                  {certifications.map((cert, i) => (
                      <li
                        key={`${cert}-${i}`}
                        data-break-point="true"
                        className="text-[10px] text-gray-600 leading-snug pl-2 border-l-2"
                        style={{ borderColor: GOLD }}
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
                <ul className="space-y-1">
                  {languages.map((lang, i) => (
                      <li
                        key={`${lang}-${i}`}
                        data-break-point="true"
                        className="text-[10px] text-gray-600 leading-snug pl-2 border-l-2"
                        style={{ borderColor: GOLD }}
                      >
                      {lang}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {achievements.length > 0 && (
              <section>
                <SectionTitle>Achievements</SectionTitle>
                <ul className="space-y-1.5">
                  {achievements.map((ach, i) => (
                      <li
                        key={`${ach}-${i}`}
                        data-break-point="true"
                        className="text-[10px] text-gray-600 text-justify leading-snug pl-2 border-l-2"
                        style={{ borderColor: GOLD }}
                      >
                      {ach}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full px-8 py-6 space-y-6">
          {summary && (
            <section
              data-ai-highlight-anchor="summary"
              className={isSummaryHighlighted ? previewHighlightSectionClassName : undefined}
            >
              <SectionTitle>Summary</SectionTitle>
              <p className="text-[11.5px] leading-relaxed text-gray-600 text-justify">
                {summary}
              </p>
            </section>
          )}

          {experience.length > 0 && (
            <section>
              <SectionTitle>Experience</SectionTitle>
              <div className="space-y-5">
                {experience.map((exp) => (
                  <div
                    key={exp.id}
                    data-ai-highlight-anchor={`experience-${exp.id}`}
                  >
                    <div className="flex justify-between items-baseline gap-2">
                      <h4
                        className="font-black text-[12.5px] uppercase tracking-[0.02em]"
                        style={{ color: ACCENT }}
                      >
                        {exp.role || (
                          <span className="text-gray-300">Role</span>
                        )}
                      </h4>
                      <span
                        className="text-[9.5px] font-bold whitespace-nowrap shrink-0 px-2 py-0.5 rounded-sm"
                        style={{
                          color: GOLD,
                          backgroundColor: "rgba(176,141,87,0.08)",
                          border: "1px solid rgba(176,141,87,0.25)",
                        }}
                      >
                        {exp.startDate}
                        {exp.endDate ? ` — ${exp.endDate}` : " — Present"}
                      </span>
                    </div>
                    <p className="text-[10.5px] font-semibold text-gray-500 mt-0.5">
                      {exp.company || (
                        <span className="text-gray-300">Company</span>
                      )}
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
                          <p className="text-[11px] leading-relaxed text-gray-600 mt-1.5 text-justify whitespace-pre-line">
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
              <SectionTitle>Projects</SectionTitle>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id}>
                    <div className="flex justify-between items-baseline gap-2">
                      <h4
                        className="font-black text-[12px] uppercase tracking-[0.02em]"
                        style={{ color: ACCENT }}
                      >
                        {project.name || (
                          <span className="text-gray-300">Project</span>
                        )}
                      </h4>
                      {(project.startDate || project.endDate) && (
                        <span
                          className="text-[9.5px] font-bold whitespace-nowrap shrink-0 px-2 py-0.5 rounded-sm"
                          style={{
                            color: GOLD,
                            backgroundColor: "rgba(176,141,87,0.08)",
                            border: "1px solid rgba(176,141,87,0.25)",
                          }}
                        >
                          {project.startDate}
                          {project.endDate ? ` — ${project.endDate}` : ""}
                        </span>
                      )}
                    </div>
                    {project.link && (
                      <p className="text-[9.5px] text-gray-400 mt-0.5 break-all">
                        {project.link}
                      </p>
                    )}
                    {project.description &&
                      (() => {
                        const bullets = toDescriptionBullets(
                          project.description,
                        );
                        return bullets.length > 0 ? (
                          <BulletList id={project.id} bullets={bullets} />
                        ) : (
                          <p className="text-[11px] leading-relaxed text-gray-600 mt-1.5 text-justify">
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
              <div className="space-y-4">
                {volunteering.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between items-baseline gap-2">
                      <h4
                        className="font-black text-[12px] uppercase tracking-[0.02em]"
                        style={{ color: ACCENT }}
                      >
                        {item.role || (
                          <span className="text-gray-300">Role</span>
                        )}
                      </h4>
                      <span
                        className="text-[9.5px] font-bold whitespace-nowrap shrink-0 px-2 py-0.5 rounded-sm"
                        style={{
                          color: GOLD,
                          backgroundColor: "rgba(176,141,87,0.08)",
                          border: "1px solid rgba(176,141,87,0.25)",
                        }}
                      >
                        {item.startDate}
                        {item.endDate ? ` — ${item.endDate}` : " — Present"}
                      </span>
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
                          <p className="text-[11px] leading-relaxed text-gray-600 mt-1.5 text-justify whitespace-pre-line">
                            {item.description}
                          </p>
                        );
                      })()}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutiveTemplate;
