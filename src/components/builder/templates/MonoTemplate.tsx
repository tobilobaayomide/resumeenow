import React from 'react';

interface MonoTemplateProps {
  data: any;
  contentRef?: React.RefObject<HTMLDivElement>;
}

const MonoTemplate: React.FC<MonoTemplateProps> = ({ data, contentRef }) => {
  const { personalInfo, summary, experience, education, skills } = data;

  return (
    <div ref={contentRef} className="font-sans text-black p-4 space-y-8">

      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-[40px] font-black tracking-tighter leading-none text-black">
          {personalInfo.fullName || <span className="text-gray-200">Your Name</span>}
        </h1>
        <p className="text-[14px] font-light text-gray-500 tracking-wide">
          {personalInfo.jobTitle || <span className="text-gray-200">Job Title</span>}
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-0.5 text-[11px] text-gray-400 pt-1">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.website && <span>{personalInfo.website}</span>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section>
          <p className="text-[13px] leading-relaxed text-gray-600 max-w-140 ">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">Experience</h2>
          {experience.map((exp: any) => (
            <div key={exp.id} className="grid grid-cols-[140px_1fr] gap-6">
              <div className="text-[10px] text-gray-400 leading-relaxed pt-0.5">
                {exp.startDate}<br />{exp.endDate || 'Present'}
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-black">{exp.role}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{exp.company}</p>
                {exp.description && (
                  <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">{exp.description}</p>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">Education</h2>
          {education.map((edu: any) => (
            <div key={edu.id} className="grid grid-cols-[140px_1fr] gap-6">
              <div className="text-[10px] text-gray-400 leading-relaxed pt-0.5">
                {edu.startDate}<br />{edu.endDate || 'Present'}
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-black">{edu.school}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{edu.degree}</p>
                {edu.description && (
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{edu.description}</p>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">Skills</h2>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {skills.join('  ·  ')}
          </p>
        </section>
      )}
    </div>
  );
};

export default MonoTemplate; // ← this was missing