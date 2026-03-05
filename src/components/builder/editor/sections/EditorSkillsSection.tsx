import React from 'react';
import { FiList, FiPlus, FiX } from 'react-icons/fi';
import { getActiveSkillItems } from '../../../../types/resume';
import { useBuilderStore } from '../../../../store/builderStore';
import type { EditorPanelState } from '../useEditorPanelState';
import { Section } from '../common';

interface EditorSkillsSectionProps {
  openSection: EditorPanelState['openSection'];
  toggle: EditorPanelState['toggle'];
  state: EditorPanelState;
}

const EditorSkillsSection: React.FC<EditorSkillsSectionProps> = ({
  openSection,
  toggle,
  state,
}) => {
  const data = useBuilderStore((store) => store.resumeData);
  const activeSkillCount = getActiveSkillItems(data.skills).length;

  return (
    <Section
      sectionId="skills"
      icon={<FiList />}
      label="Skills"
      isOpen={openSection === 'skills'}
      onToggle={() => toggle('skills')}
      count={activeSkillCount}
    >
      <div className="pt-2 space-y-3 max-h-[52vh] lg:max-h-[60vh] overflow-y-auto pr-1">
        <div className="inline-flex rounded-lg border border-[#E4E8F0] bg-white p-0.5">
          <button
            type="button"
            onClick={() => state.switchSkillMode('list')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
              data.skills.mode === 'list'
                ? 'bg-black text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => state.switchSkillMode('grouped')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
              data.skills.mode === 'grouped'
                ? 'bg-black text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Grouped
          </button>
        </div>

        {data.skills.mode === 'list' ? (
          <>
            {data.skills.list.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3 bg-[#F8FAFD] border border-[#E4E8F0] rounded-xl min-h-12">
                {data.skills.list.map((skill) => (
                  <span
                    key={skill}
                    className="group flex items-center gap-1 bg-white border border-[#E4E8F0] px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-700"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => state.removeSkill(skill)}
                      className="text-gray-300 hover:text-red-400 transition-colors ml-0.5"
                    >
                      <FiX size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            {data.skills.groups.map((group) => (
              <div
                key={group.id}
                className={`p-3 border rounded-xl ${
                  state.resolvedActiveSkillGroupId === group.id
                    ? 'border-[#0F172A]/30 bg-[#F8FAFD]'
                    : 'border-[#E4E8F0] bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={group.label}
                    onChange={(event) => state.updateSkillGroupLabel(group.id, event.target.value)}
                    onFocus={() => state.setActiveSkillGroupId(group.id)}
                    placeholder="Group label"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-[#E4E8F0] rounded-lg text-[11px] font-semibold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40"
                  />
                  <button
                    type="button"
                    onClick={() => state.setActiveSkillGroupId(group.id)}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold border border-[#E4E8F0] text-gray-600 hover:text-gray-800"
                  >
                    Use
                  </button>
                  <button
                    type="button"
                    onClick={() => state.removeSkillGroup(group.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <FiX size={12} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((skill) => (
                    <span
                      key={`${group.id}-${skill}`}
                      className="group flex items-center gap-1 bg-white border border-[#E4E8F0] px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-700"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => state.removeSkill(skill, group.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors ml-0.5"
                      >
                        <FiX size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                type="text"
                value={state.newSkillGroupLabel}
                onChange={(event) => state.setNewSkillGroupLabel(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    state.addSkillGroup();
                  }
                }}
                placeholder="Create a new group..."
                className="flex-1 px-3 py-2.5 bg-white border border-[#E4E8F0] rounded-lg text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40 focus:ring-2 focus:ring-[#0F172A]/10 transition-all"
              />
              <button
                type="button"
                onClick={state.addSkillGroup}
                className="w-9 h-9 flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shrink-0"
              >
                <FiPlus size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {data.skills.mode === 'grouped' && data.skills.groups.length > 0 && (
            <select
              value={state.resolvedActiveSkillGroupId ?? ''}
              onChange={(event) => state.setActiveSkillGroupId(event.target.value || null)}
              className="w-40 px-2 py-2.5 bg-white border border-[#E4E8F0] rounded-lg text-[11px] text-gray-700 focus:outline-none focus:border-[#0F172A]/40"
            >
              {data.skills.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label || 'Untitled group'}
                </option>
              ))}
            </select>
          )}
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
            type="button"
            onClick={state.addSkill}
            className="w-9 h-9 flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shrink-0"
          >
            <FiPlus size={14} />
          </button>
        </div>
      </div>
    </Section>
  );
};

export default EditorSkillsSection;
