import React from 'react';
import { FiMail, FiPhone, FiMapPin, FiGlobe } from 'react-icons/fi';
import type { BuilderTemplateComponentProps } from '../../../types/builder';
import {
  getActiveSkillItems,
  getPersonalLinkDisplayLabel,
  getVisiblePersonalLinks,
  toExternalLinkHref,
} from '../../../domain/resume';
import { toDescriptionBullets } from './utils';

const StudioTemplate: React.FC<BuilderTemplateComponentProps> = ({ data, contentRef }) => {
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
    <div ref={contentRef} className="font-sans text-black flex h-full min-h-225">
      
      {/* LEFT SIDEBAR — dark accent */}
      <div className="w-55 shrink-0 bg-[#3e3e3e] text-white flex flex-col p-4 gap-5">
        
        {/* Name block */}
        <div className="border-b border-white/10 pb-8">
          <h1 className="text-2xl font-normal uppercase leading-tight tracking-tight text-white">
            {personalInfo.fullName || <span className="opacity-30">Your Name</span>}
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mt-2">
            {personalInfo.jobTitle || <span className="opacity-30">Job Title</span>}
          </p>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">Contact</h3>
          {personalInfo.email && (
            <div className="flex items-start gap-2">
              <FiMail size={10} className="text-white/40 mt-0.5 shrink-0" />
              <a
                href={`mailto:${personalInfo.email}`}
                className="text-[10px] text-white break-all leading-snug hover:underline"
              >
                {personalInfo.email}
              </a>
            </div>
          )}
          {personalInfo.phone && (
            <div className="flex items-center gap-2">
              <FiPhone size={10} className="text-white/40 shrink-0" />
              <span className="text-[10px] text-white/70">{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.location && (
            <div className="flex items-center gap-2">
              <FiMapPin size={10} className="text-white/40 shrink-0" />
              <span className="text-[10px] text-white/70">{personalInfo.location}</span>
            </div>
          )}
          {linkItems.map((link) => (
            <div key={link.id} className="flex items-center gap-2">
              <FiGlobe size={10} className="text-white/40 shrink-0" />
              <a
                href={toExternalLinkHref(link.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-white break-all hover:underline"
              >
                {getPersonalLinkDisplayLabel(link)}
              </a>
            </div>
          ))}
        </div>

        {/* Skills */}
        {activeSkills.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">Skills</h3>
            <div className="flex flex-col gap-2">
              {activeSkills.map((skill, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-white/30 shrink-0" />
                  <span className="text-[10px] text-white/70">{skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education in sidebar */}
        {education.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">Education</h3>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <p className="text-[10px] font-bold text-white/80 leading-snug">{edu.school}</p>
                  <p className="text-[9px] text-white/80 mt-0.5">{edu.degree}</p>
                  <p className="text-[9px] text-white/80 mt-0.5">
                    {edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {volunteering.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">Volunteering</h3>
            <div className="space-y-3">
              {volunteering.map((item) => (
                <div key={item.id}>
                  <p className="text-[10px] font-bold text-white/80 leading-snug">{item.role}</p>
                  <p className="text-[9px] text-white/40 mt-0.5">{item.company}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {certifications.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">Certifications</h3>
            <div className="space-y-2">
              {certifications.map((certification, index) => (
                <p key={`${certification}-${index}`} className="text-[9px] text-white/80 leading-snug">
                  {certification}
                </p>
              ))}
            </div>
          </div>
        )}

        {languages.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">Languages</h3>
            <div className="space-y-2">
              {languages.map((language, index) => (
                <p key={`${language}-${index}`} className="text-[9px] text-white/60 leading-snug">
                  {language}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT MAIN CONTENT */}
      <div className="flex-1 p-5 space-y-8 bg-white">
        
        {/* Summary */}
        {summary && (
          <section>
            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400 mb-3">Profile</h3>
            <p className="text-[12px] leading-relaxed text-justify text-gray-600">{summary}</p>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section>
            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400 mb-5">Experience</h3>
            <div className="space-y-7">
              {experience.map((exp) => (
                <div key={exp.id} className="flex gap-6">
                  {/* Date column */}
                  <div className="w-24 shrink-0 text-right">
                    <p className="text-[9px] text-gray-400 font-bold leading-relaxed">
                      {exp.startDate}<br />{exp.endDate || 'Present'}
                    </p>
                  </div>
                  {/* Divider */}
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-black mt-0.5 shrink-0" />
                    <div className="w-px flex-1 bg-gray-100 mt-1" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <h4 className="font-black text-[13px] text-black">{exp.role}</h4>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{exp.company}</p>
                    {exp.description && (
                      <p className="text-[11px] text-gray-500 mt-2 leading-relaxed text-justify whitespace-pre-line">{exp.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section>
            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400 mb-5">Projects</h3>
            <div className="space-y-5">
              {projects.map((project) => (
                <div key={project.id} className="pb-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-black text-[13px] text-black">{project.name}</h4>
                    <p className="text-[9px] text-gray-400">
                      {project.startDate}{project.endDate ? ` – ${project.endDate}` : ''}
                    </p>
                  </div>
                  {project.link && <p className="text-[10px] text-gray-400 mt-1 break-all">{project.link}</p>}
                  {project.description && (() => {
                    const bullets = toDescriptionBullets(project.description);
                    if (bullets.length > 0) {
                      return (
                        <ul className="list-disc pl-4 text-[11px] text-gray-500 mt-2 leading-relaxed space-y-0.5">
                          {bullets.map((line, index) => (
                            <li key={`${project.id}-desc-${index}`}>{line}</li>
                          ))}
                        </ul>
                      );
                    }

                    return (
                      <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">{project.description}</p>
                    );
                  })()}
                </div>
              ))}
            </div>
          </section>
        )}

        {achievements.length > 0 && (
          <section>
            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400 mb-5">Achievements</h3>
            <ul className="space-y-2">
              {achievements.map((achievement, index) => (
                <li key={`${achievement}-${index}`} className="text-[11px] text-gray-500 leading-relaxed">
                  {achievement}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default StudioTemplate;
