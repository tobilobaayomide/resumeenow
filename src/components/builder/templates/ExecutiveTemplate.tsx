import React from 'react';
import { FiMail, FiPhone, FiMapPin, FiGlobe } from 'react-icons/fi';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="font-bold text-[10px] uppercase tracking-[0.15em] text-gray-400 border-b border-gray-200 pb-1 mb-3">
    {children}
  </h3>
);

interface ExecutiveTemplateProps {
  data: any;
  contentRef?: React.RefObject<HTMLDivElement>;
}

const ExecutiveTemplate: React.FC<ExecutiveTemplateProps> = ({ data, contentRef }) => {
  const { personalInfo, summary, experience, education, skills } = data;

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
            <div className="flex items-center gap-1.5"><FiMail size={9} /> {personalInfo.email}</div>
          )}
          {personalInfo.phone && (
            <div className="flex items-center gap-1.5"><FiPhone size={9} /> {personalInfo.phone}</div>
          )}
          {personalInfo.location && (
            <div className="flex items-center gap-1.5"><FiMapPin size={9} /> {personalInfo.location}</div>
          )}
          {personalInfo.website && (
            <div className="flex items-center gap-1.5"><FiGlobe size={9} /> {personalInfo.website}</div>
          )}
        </div>
      </header>

      <div className="flex gap-8">
        <div className="w-2/3 space-y-7">
          {summary && (
            <section>
              <SectionTitle>Summary</SectionTitle>
              <p className="text-[12px] leading-relaxed text-gray-600 whitespace-pre-wrap">{summary}</p>
            </section>
          )}
          {experience.length > 0 && (
            <section>
              <SectionTitle>Experience</SectionTitle>
              <div className="space-y-5">
                {experience.map((exp: any) => (
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
                      <p className="text-[11px] leading-relaxed text-gray-600 whitespace-pre-wrap">
                        {exp.description}
                      </p>
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
                {education.map((edu: any) => (
                  <div key={edu.id}>
                    <h4 className="font-bold text-[11px] text-gray-900">
                      {edu.school || <span className="text-gray-300">School</span>}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">{edu.degree}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {edu.startDate}{edu.endDate ? ` — ${edu.endDate}` : ''}
                    </p>
                    {edu.description && (
                      <p className="text-[10px] text-gray-500 mt-1 leading-snug">{edu.description}</p>
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
        </div>
      </div>
    </div>
  );
};

export default ExecutiveTemplate;