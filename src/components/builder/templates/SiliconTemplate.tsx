import React from 'react';
import type { BuilderTemplateComponentProps } from '../../../types/builder';
import {
  getActiveSkillItems,
  getPersonalLinkDisplayLabel,
  getVisiblePersonalLinks,
  toExternalLinkHref,
} from '../../../domain/resume';
import { toDescriptionBullets } from './utils';

const SiliconTemplate: React.FC<BuilderTemplateComponentProps> = ({ data, contentRef }) => {
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

  return (
    <div ref={contentRef} style={{ fontFamily: "'Courier New', Courier, monospace" }} className="text-black p-2">

      {/* Header — terminal style */}
      <div className="border border-gray-800 p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-black">
              {personalInfo.fullName || <span className="text-gray-300">Your Name</span>}
            </h1>
            <p className="text-[12px] text-gray-800 mt-1">
              {personalInfo.jobTitle || <span className="text-gray-300">Job Title</span>}
            </p>
          </div>
          {/* Version badge */}
          <div className="border border-gray-300 px-2 py-1 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            v1.0.0
          </div>
        </div>

        {/* Contact row */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 text-[10px] text-gray-800">
          {personalInfo.email && (
            <a href={`mailto:${personalInfo.email}`} className="hover:underline break-all">
              📧 {personalInfo.email}
            </a>
          )}
          {personalInfo.phone && <span>📱 {personalInfo.phone}</span>}
          {personalInfo.location && <span>📍 {personalInfo.location}</span>}
          {linkItems.map((link) => (
            <a
              key={link.id}
              href={toExternalLinkHref(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline break-all"
            >
              🔗 {getPersonalLinkDisplayLabel(link)}
            </a>
          ))}
        </div>
      </div>

      {/* About */}
      {summary && (
        <section className="mb-6">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
            ## About
          </div>
          <p className="text-[12px] text-gray-700 leading-relaxed border-l-2 border-gray-200 pl-4">
            {summary}
          </p>
        </section>
      )}

      {/* Skills — tag cloud style */}
      {activeSkills.length > 0 && (
        <section className="mb-6">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
            ## Stack
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeSkills.map((skill, i) => (
              <span key={i} className="border border-gray-300 px-2 py-0.5 text-[10px] text-gray-600 bg-gray-50">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-6">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
            ## Experience
          </div>
          <div className="space-y-5">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[13px] font-bold text-black">{exp.role}</span>
                    <span className="text-[11px] text-gray-400 mx-2">@</span>
                    <span className="text-[12px] text-gray-600">{exp.company}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    [{exp.startDate} → {exp.endDate || 'now'}]
                  </span>
                </div>
                {exp.description && (
                  <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed pl-2 border-l border-gray-200 text-justify whitespace-pre-line">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="mb-6">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
            ## Projects
          </div>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-bold text-black">{project.name}</span>
                  <span className="text-[10px] text-gray-400">
                    [{project.startDate} → {project.endDate || 'now'}]
                  </span>
                </div>
                {project.link && <p className="text-[10px] text-gray-400 mt-1 break-all">{project.link}</p>}
                {project.description && (() => {
                  const bullets = toDescriptionBullets(project.description);
                  if (bullets.length > 0) {
                    return (
                      <ul className="list-disc pl-4 text-[11px] text-gray-500 mt-1.5 leading-relaxed space-y-0.5">
                        {bullets.map((line, index) => (
                          <li key={`${project.id}-desc-${index}`}>{line}</li>
                        ))}
                      </ul>
                    );
                  }

                  return (
                    <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{project.description}</p>
                  );
                })()}
              </div>
            ))}
          </div>
        </section>
      )}

      {volunteering.length > 0 && (
        <section className="mb-6">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
            ## Volunteering
          </div>
          <div className="space-y-3">
            {volunteering.map((item) => (
              <div key={item.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-bold text-black">{item.role}</span>
                  <span className="text-[10px] text-gray-400">
                    [{item.startDate} → {item.endDate || 'now'}]
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">{item.company}</p>
                {item.description && <p className="text-[11px] text-gray-500 mt-1">{item.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {certifications.length > 0 && (
        <section className="mb-6">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
            ## Certifications
          </div>
          <ul className="space-y-1">
            {certifications.map((certification, index) => (
              <li key={`${certification}-${index}`} className="text-[11px] text-black font-bold">
                - {certification}
              </li>
            ))}
          </ul>
        </section>
      )}

      {languages.length > 0 && (
        <section className="mb-6">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
            ## Languages
          </div>
          <ul className="space-y-1">
            {languages.map((language, index) => (
              <li key={`${language}-${index}`} className="text-[11px] text-gray-500">
                - {language}
              </li>
            ))}
          </ul>
        </section>
      )}

      {achievements.length > 0 && (
        <section className="mb-6">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
            ## Achievements
          </div>
          <ul className="space-y-1">
            {achievements.map((achievement, index) => (
              <li key={`${achievement}-${index}`} className="text-[11px] text-black font-bold text-justify">
                - {achievement}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
            ## Education
          </div>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="flex items-baseline justify-between">
                <div>
                  <span className="text-[12px] font-bold text-black">{edu.school}</span>
                  {edu.degree && <span className="text-[11px] text-gray-500 ml-2">— {edu.degree}</span>}
                </div>
                <span className="text-[10px] text-gray-400">
                  [{edu.startDate} → {edu.endDate || 'now'}]
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SiliconTemplate;
