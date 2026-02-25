import React from 'react';

interface SiliconTemplateProps {
  data: any;
  contentRef?: React.RefObject<HTMLDivElement>;
}

const SiliconTemplate: React.FC<SiliconTemplateProps> = ({ data, contentRef }) => {
  const { personalInfo, summary, experience, education, skills } = data;

  return (
    <div ref={contentRef} style={{ fontFamily: "'Courier New', Courier, monospace" }} className="text-black p-2">

      {/* Header — terminal style */}
      <div className="border border-gray-800 p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-black">
              {personalInfo.fullName || <span className="text-gray-300">Your Name</span>}
            </h1>
            <p className="text-[12px] text-gray-500 mt-1">
              {personalInfo.jobTitle || <span className="text-gray-300">Job Title</span>}
            </p>
          </div>
          {/* Version badge */}
          <div className="border border-gray-300 px-2 py-1 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            v1.0.0
          </div>
        </div>

        {/* Contact row */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 text-[10px] text-gray-500">
          {personalInfo.email && <span>📧 {personalInfo.email}</span>}
          {personalInfo.phone && <span>📱 {personalInfo.phone}</span>}
          {personalInfo.location && <span>📍 {personalInfo.location}</span>}
          {personalInfo.website && <span>🔗 {personalInfo.website}</span>}
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
      {skills.length > 0 && (
        <section className="mb-6">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
            ## Stack
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill: string, i: number) => (
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
            {experience.map((exp: any) => (
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
                  <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed pl-2 border-l border-gray-200">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
            ## Education
          </div>
          <div className="space-y-3">
            {education.map((edu: any) => (
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