import React from "react";
import type { BuilderTemplateComponentProps } from "../../../types/builder";
import {
  getPersonalLinkDisplayLabel,
  getVisiblePersonalLinks,
  toExternalLinkHref,
} from "../../../domain/resume";

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

  return (
    <div ref={contentRef} className="font-sans text-black p-4 space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-[40px] font-semibold tracking-wider leading-none text-black">
          {personalInfo.fullName || (
            <span className="text-gray-200">Your Name</span>
          )}
        </h1>
        <p className="text-[14px] font-light text-gray-700 tracking-wide">
          {personalInfo.jobTitle || (
            <span className="text-gray-200">Job Title</span>
          )}
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-0.5 text-[11px] text-gray-500 pt-1">
          {personalInfo.email && (
            <a href={`mailto:${personalInfo.email}`} className="hover:underline break-all">
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
              className="hover:underline break-all"
            >
              {getPersonalLinkDisplayLabel(link)}
            </a>
          ))}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section>
          <p className="text-[12px] leading-relaxed text-black max-w-190 text-justify">
            {summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">
            Experience
          </h2>
          {experience.map((exp) => (
            <div key={exp.id} className="grid grid-cols-[140px_1fr] gap-0">
              <div className="text-[10px] text-gray-500 leading-relaxed pt-0.5">
                {exp.startDate}
                <br />
                {exp.endDate || "Present"}
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-black">{exp.role}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {exp.company}
                </p>
                {exp.description && (
                  <p className="text-[11px] text-black mt-2 leading-relaxed text-justify whitespace-pre-line">
                    {exp.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {projects.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">
            Projects
          </h2>
          {projects.map((project) => (
            <div key={project.id} className="grid grid-cols-[140px_1fr] gap-6">
              <div className="text-[10px] text-gray-400 leading-relaxed pt-0.5">
                {project.startDate}
                <br />
                {project.endDate || "Present"}
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-black">
                  {project.name}
                </h3>
                {project.link && (
                  <p className="text-[10px] text-gray-400 mt-0.5 break-all">
                    {project.link}
                  </p>
                )}
                {project.description && (
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {volunteering.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">
            Volunteering
          </h2>
          {volunteering.map((item) => (
            <div key={item.id} className="grid grid-cols-[140px_1fr]">
              <div className="text-[10px] text-gray-500 leading-relaxed pt-0.5">
                {item.startDate}
                <br />
                {item.endDate || "Present"}
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-black">
                  {item.role}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {item.company}
                </p>
                {item.description && (
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed text-justify">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">
            Education
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="grid grid-cols-[140px_1fr]">
              <div className="text-[10px] text-gray-500 leading-relaxed pt-0.5">
                {edu.startDate}
                <br />
                {edu.endDate || "Present"}
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-black">
                  {edu.school}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{edu.degree}</p>
                {edu.description && (
                  <p className="text-[11px] text-black mt-1 leading-relaxed text-justify whitespace-pre-line">
                    {edu.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">
            Skills
          </h2>
          <p className="text-[12px] text-black leading-relaxed text-justify ">
            {skills.join(", ")}
          </p>
        </section>
      )}

      {certifications.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">
            Certifications
          </h2>
          <div className="space-y-1">
            {certifications.map((certification, index) => (
              <p
                key={`${certification}-${index}`}
                className="text-[11px] text-black leading-relaxed"
              >
                {certification}
              </p>
            ))}
          </div>
        </section>
      )}

      {languages.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">
            Languages
          </h2>
          <p className="text-[11px] text-black leading-relaxed">
            {languages.join("  ·  ")}
          </p>
        </section>
      )}

      {achievements.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">
            Achievements
          </h2>
          <div className="space-y-1">
            {achievements.map((achievement, index) => (
              <p
                key={`${achievement}-${index}`}
                className="text-[11px] text-black leading-relaxed"
              >
                {achievement}
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MonoTemplate;
