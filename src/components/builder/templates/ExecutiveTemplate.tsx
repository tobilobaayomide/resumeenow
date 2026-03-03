import React from 'react';
import { FiMail, FiPhone, FiMapPin, FiGlobe } from 'react-icons/fi';
import type { BuilderTemplateComponentProps, TemplateSectionTitleProps } from '../../../types/builder';
import {
  getPersonalLinkDisplayLabel,
  getVisiblePersonalLinks,
  toExternalLinkHref,
} from '../../../domain/resume';

const SectionTitle: React.FC<TemplateSectionTitleProps> = ({ children }) => (
  <h3 className="font-bold text-[10px] uppercase tracking-[0.15em] text-gray-400 border-b border-gray-200 pb-1 mb-3">
    {children}
  </h3>
);

const ExecutiveTemplate: React.FC<BuilderTemplateComponentProps> = ({ data, contentRef }) => {
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
    <div ref={contentRef} className="font-sans text-black space-y-6">
      <header className="border-b-2 border-gray-900 pb-5">
        <h1 className="text-3xl font-bold uppercase tracking-wide text-gray-900 mb-1">
          {personalInfo.fullName || <span className="text-gray-300">Your Name</span>}
        </h1>
        <p className="text-base text-gray-500 font-medium tracking-wide mb-3">
          {personalInfo.jobTitle || <span className="text-gray-300">Job Title</span>}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          {personalInfo.email && (
            <div className="flex items-center gap-1.5">
              <FiMail size={9} />
              <a href={`mailto:${personalInfo.email}`} className="hover:underline break-all text-blue-600">
                {personalInfo.email}
              </a>
            </div>
          )}
          {personalInfo.phone && (
            <div className="flex items-center gap-1.5"><FiPhone size={9} /> {personalInfo.phone}</div>
          )}
          {personalInfo.location && (
            <div className="flex items-center gap-1.5"><FiMapPin size={9} /> {personalInfo.location}</div>
          )}
          {linkItems.map((link) => (
            <div key={link.id} className="flex items-center gap-1.5">
              <FiGlobe size={9} />
              <a
                href={toExternalLinkHref(link.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline break-all text-blue-600"
              >
                {getPersonalLinkDisplayLabel(link)}
              </a>
            </div>
          ))}
        </div>
      </header>

      <div className="flex gap-8">
        <div className="w-2/3 space-y-7">
          {summary && (
            <section>
              <SectionTitle>Summary</SectionTitle>
              <p className="text-[12px] leading-relaxed text-gray-600 text-justify whitespace-pre-wrap">{summary}</p>
            </section>
          )}
          {experience.length > 0 && (
            <section>
              <SectionTitle>Experience</SectionTitle>
              <div className="space-y-5">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-[13px] text-gray-900">
                        {exp.role || <span className="text-gray-300">Role</span>}
                      </h4>
                      <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap ml-2">
                        {exp.startDate}{exp.endDate ? ` — ${exp.endDate}` : ''}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 mt-0.5 mb-1.5">
                      {exp.company || <span className="text-gray-300">Company</span>}
                    </p>
                    {exp.description && (
                      <p className="text-[11px] leading-relaxed text-gray-600 text-justify whitespace-pre-wrap">
                        {exp.description}
                      </p>
                    )}
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
                      <h4 className="font-bold text-[12px] text-gray-900">
                        {project.name || <span className="text-gray-300">Project</span>}
                      </h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {project.startDate}{project.endDate ? ` — ${project.endDate}` : ''}
                      </span>
                    </div>
                    {project.link && (
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5 break-all">{project.link}</p>
                    )}
                    {project.description && (
                      <p className="text-[11px] leading-relaxed text-gray-600 mt-1">{project.description}</p>
                    )}
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
                      <h4 className="font-bold text-[12px] text-gray-900">
                        {item.role || <span className="text-gray-300">Role</span>}
                      </h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {item.startDate}{item.endDate ? ` — ${item.endDate}` : ''}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{item.company}</p>
                    {item.description && (
                      <p className="text-[11px] leading-relaxed text-gray-600 mt-1">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="w-1/3 space-y-7">
          {education.length > 0 && (
            <section>
              <SectionTitle>Education</SectionTitle>
              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <h4 className="font-bold text-[11px] text-gray-900">
                      {edu.school || <span className="text-gray-300">School</span>}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">{edu.degree}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {edu.startDate}{edu.endDate ? ` — ${edu.endDate}` : ''}
                    </p>
                    {edu.description && (
                      <p className="text-[10px] text-gray-500 mt-1 text-justifyleading-snug">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          {skills.length > 0 && (
            <section>
              <SectionTitle>Skills</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
          {certifications.length > 0 && (
            <section>
              <SectionTitle>Certifications</SectionTitle>
              <ul className="space-y-1">
                {certifications.map((certification, index) => (
                  <li key={`${certification}-${index}`} className="text-[10px] text-gray-600 leading-snug">
                    {certification}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {languages.length > 0 && (
            <section>
              <SectionTitle>Languages</SectionTitle>
              <ul className="space-y-1">
                {languages.map((language, index) => (
                  <li key={`${language}-${index}`} className="text-[10px] text-gray-600 leading-snug">
                    {language}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {achievements.length > 0 && (
            <section>
              <SectionTitle>Achievements</SectionTitle>
              <ul className="space-y-1">
                {achievements.map((achievement, index) => (
                  <li key={`${achievement}-${index}`} className="text-[10px] text-gray-600 text-justify leading-snug">
                    {achievement}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveTemplate;
