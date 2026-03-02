import React from 'react';
import { FiList, FiPlus, FiX } from 'react-icons/fi';
import type { EditorPanelProps } from '../../../../types/builder';
import type { EditorPanelState } from '../useEditorPanelState';
import { Section } from '../common';

interface EditorSkillsSectionProps {
  data: EditorPanelProps['data'];
  openSection: EditorPanelState['openSection'];
  toggle: EditorPanelState['toggle'];
  state: EditorPanelState;
}

const EditorSkillsSection: React.FC<EditorSkillsSectionProps> = ({
  data,
  openSection,
  toggle,
  state,
}) => (
  <Section
    sectionId="skills"
    icon={<FiList />}
    label="Skills"
    isOpen={openSection === 'skills'}
    onToggle={() => toggle('skills')}
    count={data.skills.length}
  >
    <div className="pt-2 space-y-3">
      {data.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-[#F8FAFD] border border-[#E4E8F0] rounded-xl min-h-12">
          {data.skills.map((skill) => (
            <span
              key={skill}
              className="group flex items-center gap-1 bg-white border border-[#E4E8F0] px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-700"
            >
              {skill}
              <button
                onClick={() => state.removeSkill(skill)}
                className="text-gray-300 hover:text-red-400 transition-colors ml-0.5"
              >
                <FiX size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          id="new-skill"
          name="new-skill"
          type="text"
          value={state.newSkill}
          onChange={(event) => state.setNewSkill(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              state.addSkill();
            }
          }}
          placeholder="Type a skill and press Enter..."
          className="flex-1 px-3 py-2.5 bg-white border border-[#E4E8F0] rounded-lg text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40 focus:ring-2 focus:ring-[#0F172A]/10 transition-all"
        />
        <button
          onClick={state.addSkill}
          className="w-9 h-9 flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shrink-0"
        >
          <FiPlus size={14} />
        </button>
      </div>
    </div>
  </Section>
);

export default EditorSkillsSection;
