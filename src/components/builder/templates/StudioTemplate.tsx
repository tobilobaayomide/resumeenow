import React from 'react';
import { FiMail, FiPhone, FiMapPin, FiGlobe } from 'react-icons/fi';

interface StudioTemplateProps {
  data: any;
  contentRef?: React.RefObject<HTMLDivElement>;
}

const StudioTemplate: React.FC<StudioTemplateProps> = ({ data, contentRef }) => {
  const { personalInfo, summary, experience, education, skills } = data;

  return (
    <div ref={contentRef} className="font-sans text-black flex h-full min-h-225">
      
      {/* LEFT SIDEBAR — dark accent */}
      <div className="w-55 shrink-0 bg-[#1a1a1a] text-white flex flex-col p-8 gap-8">
        
        {/* Name block */}
        <div className="border-b border-white/10 pb-8">
          <h1 className="text-2xl font-black uppercase leading-tight tracking-tight text-white">
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
              <span className="text-[10px] text-white/70 break-all leading-snug">{personalInfo.email}</span>
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
          {personalInfo.website && (
            <div className="flex items-center gap-2">
              <FiGlobe size={10} className="text-white/40 shrink-0" />
              <span className="text-[10px] text-white/70 break-all">{personalInfo.website}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">Skills</h3>
            <div className="flex flex-col gap-2">
              {skills.map((skill: string, i: number) => (
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
              {education.map((edu: any) => (
                <div key={edu.id}>
                  <p className="text-[10px] font-bold text-white/80 leading-snug">{edu.school}</p>
                  <p className="text-[9px] text-white/40 mt-0.5">{edu.degree}</p>
                  <p className="text-[9px] text-white/30 mt-0.5">
                    {edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT MAIN CONTENT */}
      <div className="flex-1 p-10 space-y-8 bg-white">
        
        {/* Summary */}
        {summary && (
          <section>
            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-300 mb-3">Profile</h3>
            <p className="text-[12px] leading-relaxed text-gray-600">{summary}</p>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section>
            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-300 mb-5">Experience</h3>
            <div className="space-y-7">
              {experience.map((exp: any) => (
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
                      <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default StudioTemplate;