import React from 'react';
import { FiAward, FiPlus, FiX } from 'react-icons/fi';
import type { EditorPanelProps } from '../../../../types/builder';
import type { EditorPanelState } from '../useEditorPanelState';
import { Section } from '../common';

interface EditorAchievementsSectionProps {
  data: EditorPanelProps['data'];
  openSection: EditorPanelState['openSection'];
  toggle: EditorPanelState['toggle'];
  state: EditorPanelState;
}

const EditorAchievementsSection: React.FC<EditorAchievementsSectionProps> = ({
  data,
  openSection,
  toggle,
  state,
}) => (
  <Section
    sectionId="achievements"
    icon={<FiAward />}
    label="Achievements"
    isOpen={openSection === 'achievements'}
    onToggle={() => toggle('achievements')}
    count={data.achievements.length}
  >
    <div className="pt-2 space-y-3">
      {data.achievements.length > 0 && (
        <div className="space-y-2 p-3 bg-[#F8FAFD] border border-[#E4E8F0] rounded-xl">
          {data.achievements.map((achievement) => (
            <div key={achievement} className="flex items-start gap-2">
              <span className="mt-1 text-[11px] text-gray-400">•</span>
              <span className="flex-1 text-[12px] text-gray-700 leading-relaxed">{achievement}</span>
              <button
                onClick={() => state.removeAchievement(achievement)}
                className="text-gray-300 hover:text-red-400 transition-colors"
              >
                <FiX size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          id="new-achievement"
          name="new-achievement"
          type="text"
          value={state.newAchievement}
          onChange={(event) => state.setNewAchievement(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              state.addAchievement();
            }
          }}
          placeholder="e.g. Increased revenue by 28%"
          className="flex-1 px-3 py-2.5 bg-white border border-[#E4E8F0] rounded-lg text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40 focus:ring-2 focus:ring-[#0F172A]/10 transition-all"
        />
        <button
          onClick={state.addAchievement}
          className="w-9 h-9 flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shrink-0"
        >
          <FiPlus size={14} />
        </button>
      </div>
    </div>
  </Section>
);

export default EditorAchievementsSection;
