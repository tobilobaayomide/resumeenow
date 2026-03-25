import React from "react";
import { FiAward, FiPlus, FiX, FiInfo, FiStar } from "react-icons/fi";
import type { EditorPanelState } from "../useEditorPanelState";
import type { ResumeData } from "../../../../types/resume";
import { Section } from "../common";

interface EditorAchievementsSectionProps {
  data: ResumeData;
  openSection: EditorPanelState["openSection"];
  toggle: EditorPanelState["toggle"];
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
    isOpen={openSection === "achievements"}
    onToggle={() => toggle("achievements")}
    count={data.achievements.length}
  >
    <div className="pt-1 pb-2 space-y-5">
      <div className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-100/50 rounded-xl p-3">
        <div className="bg-blue-100/50 p-1 hidden md:flex rounded-md shrink-0 mt-0.5">
          <FiInfo className="text-blue-500" size={12} />
        </div>
        <p className="text-[11.5px] text-slate-600 leading-relaxed pr-2">
          Highlight notable{" "}
          <strong className="font-semibold text-slate-800">
            awards, scholarships, or milestones
          </strong>{" "}
          that add significant value to your profile.
        </p>
      </div>

      <div className="flex flex-col gap-2 min-h-25 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-3 animate-in fade-in duration-300">
        {data.achievements.length === 0 ? (
          <div className="m-auto text-center">
            <p className="text-[11px] text-gray-400">
              No achievements added yet. Use the input below.
            </p>
          </div>
        ) : (
          data.achievements.map((achievement, index) => (
            <div
              key={`achievement-${index}`}
              className="group flex items-start justify-between gap-3 bg-white border border-gray-200 p-2.5 rounded-lg text-[11.5px] font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300"
            >
              <input
                type="text"
                value={achievement}
                onChange={(event) =>
                  state.updateAchievement(index, event.target.value)
                }
                placeholder="Achievement"
                className="min-w-0 flex-1 bg-transparent leading-relaxed mt-px text-[11.5px] font-medium text-gray-700 placeholder:text-gray-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => state.removeAchievementAtIndex(index)}
                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-all shrink-0"
                title="Remove achievement"
              >
                <FiX size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-gray-100">
        <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:ring-4 focus-within:ring-gray-50 focus-within:border-gray-300 transition-all duration-200">
          <div className="flex-1 flex items-center px-2">
            <FiStar className="text-gray-400 shrink-0" size={12} />
            <input
              id="new-achievement"
              type="text"
              value={state.newAchievement}
              onChange={(event) => state.setNewAchievement(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  state.addAchievement();
                }
              }}
              placeholder="e.g. Employee of the Year 2023"
              className="w-full bg-transparent px-2.5 py-2 text-[12px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={state.addAchievement}
            disabled={!state.newAchievement.trim()}
            className="w-8 h-8 m-0.5 rounded-lg bg-gray-900 text-white flex items-center justify-center shrink-0 hover:bg-black transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiPlus size={14} />
          </button>
        </div>
      </div>
    </div>
  </Section>
);

export default EditorAchievementsSection;
