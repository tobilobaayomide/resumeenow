import React, { useState, useCallback, useRef } from 'react';
import { 
  FiUser, 
  FiBriefcase, 
  FiBook, 
  FiList, 
  FiChevronDown, 
  FiPlus, 
  FiCalendar,
  FiX
} from 'react-icons/fi';

interface EditorPanelProps {
  data: any;
  onChange: (section: string, field: string | any, value?: any) => void;
}

const Input: React.FC<{
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}> = ({ label, placeholder, value, onChange, type = 'text' }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-lg text-[13px] text-gray-800 font-medium placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
    />
  </div>
);

const Textarea: React.FC<{
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, placeholder, value, onChange }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </label>
    )}
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-lg text-[13px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none min-h-22.5 leading-relaxed"
    />
  </div>
);

const DateRow: React.FC<{
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}> = ({ startDate, endDate, onStartChange, onEndChange }) => (
  <div className="grid grid-cols-2 gap-2">
    <div className="space-y-1">
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start</label>
      <div className="relative">
        <FiCalendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" size={11} />
        <input
          type="text"
          value={startDate}
          onChange={e => onStartChange(e.target.value)}
          placeholder="Jan 2022"
          className="w-full pl-7 pr-3 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-lg text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
        />
      </div>
    </div>
    <div className="space-y-1">
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">End</label>
      <div className="relative">
        <FiCalendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" size={11} />
        <input
          type="text"
          value={endDate}
          onChange={e => onEndChange(e.target.value)}
          placeholder="Present"
          className="w-full pl-7 pr-3 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-lg text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
        />
      </div>
    </div>
  </div>
);

const Section: React.FC<{
  id: string;
  icon: React.ReactElement<any>;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  count?: number;
}> = ({ icon, label, isOpen, onToggle, children, count }) => (
  <div className={`rounded-xl border transition-all duration-200 overflow-hidden
    ${isOpen ? 'border-gray-300 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-gray-50/80 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors
          ${isOpen ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
        >
          {React.cloneElement(icon as React.ReactElement<any>, { size: 13 })}
        </div>
        <span className="text-[13px] font-bold text-gray-800">{label}</span>
        {count !== undefined && count > 0 && (
          <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <FiChevronDown
        size={14}
        className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
    {isOpen && (
      <div className="px-4 pb-4 pt-1 bg-white border-t border-gray-100">
        {children}
      </div>
    )}
  </div>
);

const AddButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full py-2.5 mt-3 border border-dashed border-gray-200 rounded-lg text-[12px] font-bold text-gray-400 hover:text-black hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
  >
    <FiPlus size={13} /> {label}
  </button>
);

const Card: React.FC<{
  label: string;
  index: number;
  onRemove: () => void;
  children: React.ReactNode;
}> = ({ label, index, onRemove, children }) => (
  <div className="group relative border border-gray-100 rounded-xl p-4 bg-[#FAFAFA] hover:border-gray-200 transition-all space-y-3">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {label} {index + 1}
      </span>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
      >
        <FiX size={12} />
      </button>
    </div>
    {children}
  </div>
);

const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange }) => {
  const [openSection, setOpenSection] = useState<string | null>('personal');
  const [newSkill, setNewSkill] = useState('');

  const MIN_WIDTH = 320;
  const MAX_WIDTH = 700;
  const DEFAULT_WIDTH = 420;
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = panelWidth;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [panelWidth]);

  const toggle = (s: string) => setOpenSection(openSection === s ? null : s);

  const addExperience = () => onChange('experience', [
    ...data.experience,
    { id: Date.now(), role: '', company: '', startDate: '', endDate: '', description: '' }
  ]);
  const updateExperience = (id: number, field: string, value: string) =>
    onChange('experience', data.experience.map((e: any) => e.id === id ? { ...e, [field]: value } : e));
  const removeExperience = (id: number) =>
    onChange('experience', data.experience.filter((e: any) => e.id !== id));

  const addEducation = () => onChange('education', [
    ...data.education,
    { id: Date.now(), school: '', degree: '', startDate: '', endDate: '', description: '' }
  ]);
  const updateEducation = (id: number, field: string, value: string) =>
    onChange('education', data.education.map((e: any) => e.id === id ? { ...e, [field]: value } : e));
  const removeEducation = (id: number) =>
    onChange('education', data.education.filter((e: any) => e.id !== id));

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !data.skills.includes(s)) {
      onChange('skills', '', [...data.skills, s]);
      setNewSkill('');
    }
  };
  const removeSkill = (skill: string) =>
    onChange('skills', '', data.skills.filter((s: string) => s !== skill));

  return (
    // FIX 1: h-full + flex flex-col makes panel always fill workspace height
    // FIX 2: overflow-hidden on outer, overflow-y-auto on inner scroll area only
    <div
      className="relative flex flex-col bg-white border-r border-gray-200 z-20 shrink-0 h-full"
      style={{ width: `${panelWidth}px` }}
    >
      {/* Header — fixed, never scrolls */}
      <div className="px-5 pt-20 pb-5 border-b border-gray-100 shrink-0 bg-white">
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">Resume Content</h2>
        <p className="text-[12px] text-gray-400 mt-0.5">Fill in the details below</p>
      </div>

      {/* 
        FIX: flex-1 + overflow-y-auto + min-h-0
        - flex-1 makes it take remaining height
        - min-h-0 allows it to shrink below its content size (critical for flex scroll)
        - overflow-y-auto enables scrolling when content overflows
        - pb-8 adds breathing room at the bottom
      */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2 pb-8 bg-white">
        <Section id="personal" icon={<FiUser />} label="Personal Details"
          isOpen={openSection === 'personal'} onToggle={() => toggle('personal')}>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input label="Full Name" placeholder="e.g. Alex Morgan"
                  value={data.personalInfo.fullName}
                  onChange={v => onChange('personalInfo', 'fullName', v)} />
              </div>
              <div className="col-span-2">
                <Input label="Job Title" placeholder="e.g. Senior Product Designer"
                  value={data.personalInfo.jobTitle}
                  onChange={v => onChange('personalInfo', 'jobTitle', v)} />
              </div>
              <Input label="Email" placeholder="you@email.com"
                value={data.personalInfo.email}
                onChange={v => onChange('personalInfo', 'email', v)} />
              <Input label="Phone" placeholder="+1 000 000"
                value={data.personalInfo.phone}
                onChange={v => onChange('personalInfo', 'phone', v)} />
              <div className="col-span-2">
                <Input label="Location" placeholder="e.g. San Francisco, CA"
                  value={data.personalInfo.location || ''}
                  onChange={v => onChange('personalInfo', 'location', v)} />
              </div>
              <div className="col-span-2">
                <Input label="Website" placeholder="yoursite.com"
                  value={data.personalInfo.website || ''}
                  onChange={v => onChange('personalInfo', 'website', v)} />
              </div>
            </div>
          </div>
        </Section>

        <Section id="summary" icon={<FiList />} label="Professional Summary"
          isOpen={openSection === 'summary'} onToggle={() => toggle('summary')}>
          <div className="pt-2">
            <Textarea
              placeholder="Briefly describe your background, strengths and key achievements..."
              value={data.summary}
              onChange={v => onChange('summary', '', v)} />
            <p className="text-[10px] text-gray-300 text-right mt-1.5">
              {data.summary.length} / 400
            </p>
          </div>
        </Section>

        <Section id="experience" icon={<FiBriefcase />} label="Experience"
          isOpen={openSection === 'experience'} onToggle={() => toggle('experience')}
          count={data.experience.length}>
          <div className="pt-2 space-y-3">
            {data.experience.map((exp: any, index: number) => (
              <Card key={exp.id} label="Role" index={index} onRemove={() => removeExperience(exp.id)}>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Job Title" value={exp.role}
                    onChange={v => updateExperience(exp.id, 'role', v)} />
                  <Input placeholder="Company" value={exp.company}
                    onChange={v => updateExperience(exp.id, 'company', v)} />
                </div>
                <DateRow
                  startDate={exp.startDate} endDate={exp.endDate}
                  onStartChange={v => updateExperience(exp.id, 'startDate', v)}
                  onEndChange={v => updateExperience(exp.id, 'endDate', v)} />
                <Textarea placeholder="Key responsibilities and achievements..."
                  value={exp.description}
                  onChange={v => updateExperience(exp.id, 'description', v)} />
              </Card>
            ))}
            <AddButton label="Add Position" onClick={addExperience} />
          </div>
        </Section>

        <Section id="education" icon={<FiBook />} label="Education"
          isOpen={openSection === 'education'} onToggle={() => toggle('education')}
          count={data.education.length}>
          <div className="pt-2 space-y-3">
            {data.education.map((edu: any, index: number) => (
              <Card key={edu.id} label="School" index={index} onRemove={() => removeEducation(edu.id)}>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="School / University" value={edu.school}
                    onChange={v => updateEducation(edu.id, 'school', v)} />
                  <Input placeholder="Degree" value={edu.degree}
                    onChange={v => updateEducation(edu.id, 'degree', v)} />
                </div>
                <DateRow
                  startDate={edu.startDate} endDate={edu.endDate}
                  onStartChange={v => updateEducation(edu.id, 'startDate', v)}
                  onEndChange={v => updateEducation(edu.id, 'endDate', v)} />
                <Textarea placeholder="Relevant coursework, honours or achievements..."
                  value={edu.description}
                  onChange={v => updateEducation(edu.id, 'description', v)} />
              </Card>
            ))}
            <AddButton label="Add School" onClick={addEducation} />
          </div>
        </Section>

        <Section id="skills" icon={<FiList />} label="Skills"
          isOpen={openSection === 'skills'} onToggle={() => toggle('skills')}
          count={data.skills.length}>
          <div className="pt-2 space-y-3">
            {data.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3 bg-[#FAFAFA] border border-gray-100 rounded-xl min-h-12">
                {data.skills.map((skill: string) => (
                  <span key={skill}
                    className="group flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-700 shadow-sm">
                    {skill}
                    <button onClick={() => removeSkill(skill)}
                      className="text-gray-300 hover:text-red-400 transition-colors ml-0.5">
                      <FiX size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                placeholder="Type a skill and press Enter..."
                className="flex-1 px-3 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-lg text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
              />
              <button onClick={addSkill}
                className="w-9 h-9 flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shrink-0">
                <FiPlus size={14} />
              </button>
            </div>
          </div>
        </Section>
      </div>

      {/* Drag Handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 bottom-0 right-0 w-4 flex items-center justify-center cursor-col-resize group z-30"
      >
        <div className="absolute top-0 bottom-0 w-px bg-gray-200 group-hover:bg-gray-400 transition-colors" />
        <div className="relative flex flex-col gap-1 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-gray-500 transition-colors" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;