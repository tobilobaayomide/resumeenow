import React from "react";
import { FiList, FiPlus, FiX, FiInfo, FiTag, FiFolder } from "react-icons/fi";
import { getActiveSkillItems } from "../../../../types/resume";
import { useBuilderStore } from "../../../../store/builderStore";
import type { EditorPanelState } from "../useEditorPanelState";
import { Section } from "../common";

interface EditorSkillsSectionProps {
  openSection: EditorPanelState["openSection"];
  toggle: EditorPanelState["toggle"];
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
      isOpen={openSection === "skills"}
      onToggle={() => toggle("skills")}
      count={activeSkillCount}
    >
      <div className="pt-1 pb-2 space-y-5">
        <div className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-100/50 rounded-xl p-3">
          <div className="bg-blue-100/50 p-1 hidden md:flex rounded-md shrink-0 mt-0.5">
            <FiInfo className="text-blue-500" size={12} />
          </div>
          <p className="text-[11.5px] text-slate-600 leading-relaxed pr-2">
            List your{" "}
            <strong className="font-semibold text-slate-800">
              core technologies, tools, and methodologies
            </strong>
            . Group them by category if you have a wide variety.
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => state.switchSkillMode("list")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${
              data.skills.mode === "list"
                ? "bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Simple List
          </button>
          <button
            type="button"
            onClick={() => state.switchSkillMode("grouped")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${
              data.skills.mode === "grouped"
                ? "bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Categorized
          </button>
        </div>

        <div className="animate-in fade-in duration-300">
          {data.skills.mode === "list" ? (
            <div className="min-h-25 flex flex-col gap-2 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-3">
              {data.skills.list.length === 0 ? (
                <p className="text-[11px] text-gray-400 w-full text-center mt-6">
                  No skills added yet. Use the input below.
                </p>
              ) : (
                data.skills.list.map((skill, index) => (
                  <div
                    key={`skill-${index}`}
                    className="group flex items-center gap-2 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300"
                  >
                    <input
                      type="text"
                      value={skill}
                      onChange={(event) =>
                        state.updateSkill(index, event.target.value)
                      }
                      placeholder="Skill"
                      className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-gray-700 placeholder:text-gray-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => state.removeSkillAtIndex(index)}
                      className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded p-0.5 transition-all shrink-0"
                    >
                      <FiX size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Category Cards */}
              {data.skills.groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => state.setActiveSkillGroupId(group.id)}
                  className={`relative p-3.5 rounded-xl border transition-all duration-200 cursor-text ${
                    state.resolvedActiveSkillGroupId === group.id
                      ? "border-gray-300 bg-white ring-4 ring-gray-50"
                      : "border-gray-200 bg-gray-50/50 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <FiFolder
                        size={12}
                        className={
                          state.resolvedActiveSkillGroupId === group.id
                            ? "text-gray-900"
                            : "text-gray-400"
                        }
                      />
                      <input
                        value={group.label}
                        onChange={(event) =>
                          state.updateSkillGroupLabel(
                            group.id,
                            event.target.value,
                          )
                        }
                        placeholder="Category Name (e.g. Languages)"
                        className="flex-1 bg-transparent text-[11.5px] font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        state.removeSkillGroup(group.id);
                      }}
                      className="text-gray-300 hover:text-red-500 bg-white hover:bg-red-50 border border-gray-100 p-1 rounded-md transition-all shadow-sm"
                      title="Delete category"
                    >
                      <FiX size={11} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 min-h-7">
                    {group.items.length === 0 ? (
                      <span className="text-[10px] text-gray-400 italic flex items-center h-full">
                        Empty category
                      </span>
                    ) : (
                      group.items.map((skill, index) => (
                        <div
                          key={`${group.id}-${index}`}
                          className="group flex items-center gap-2 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300"
                        >
                          <input
                            type="text"
                            value={skill}
                            onChange={(event) =>
                              state.updateSkill(
                                index,
                                event.target.value,
                                group.id,
                              )
                            }
                            onClick={(event) => event.stopPropagation()}
                            placeholder="Skill"
                            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-gray-700 placeholder:text-gray-300 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              state.removeSkillAtIndex(index, group.id);
                            }}
                            className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded p-0.5 transition-all shrink-0"
                          >
                            <FiX size={11} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}

              <div className="flex bg-gray-50 border border-dashed border-gray-200 p-1.5 rounded-xl">
                <input
                  type="text"
                  value={state.newSkillGroupLabel}
                  onChange={(event) =>
                    state.setNewSkillGroupLabel(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      state.addSkillGroup();
                    }
                  }}
                  placeholder="New category..."
                  className="flex-1 px-3 py-1.5 bg-transparent text-[11.5px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={state.addSkillGroup}
                  disabled={!state.newSkillGroupLabel.trim()}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[11px] font-semibold hover:border-gray-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100">
          <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:ring-4 focus-within:ring-gray-50 focus-within:border-gray-300 transition-all duration-200">
            {data.skills.mode === "grouped" &&
              data.skills.groups.length > 0 && (
                <div className="relative border-r border-gray-200 pr-1 flex items-center">
                  <select
                    value={state.resolvedActiveSkillGroupId ?? ""}
                    onChange={(event) =>
                      state.setActiveSkillGroupId(event.target.value || null)
                    }
                    className="w-28 pl-2 pr-6 py-2 bg-transparent text-[11px] font-bold text-gray-700 focus:outline-none appearance-none cursor-pointer truncate"
                  >
                    {data.skills.groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.label || "Untitled"}
                      </option>
                    ))}
                  </select>
                  <FiFolder
                    className="absolute right-3 text-gray-400 pointer-events-none"
                    size={10}
                  />
                </div>
              )}

            <div className="flex-1 flex items-center px-2">
              <FiTag className="text-gray-400 shrink-0" size={12} />
              <input
                id="new-skill"
                type="text"
                value={state.newSkill}
                onChange={(event) => state.setNewSkill(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    state.addSkill();
                  }
                }}
                placeholder={
                  data.skills.mode === "grouped" &&
                  data.skills.groups.length === 0
                    ? "Create a category first..."
                    : "Type a skill and press Enter..."
                }
                disabled={
                  data.skills.mode === "grouped" &&
                  data.skills.groups.length === 0
                }
                className="w-full bg-transparent px-2.5 py-2 text-[12px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
              />
            </div>

            <button
              type="button"
              onClick={state.addSkill}
              disabled={
                !state.newSkill.trim() ||
                (data.skills.mode === "grouped" &&
                  data.skills.groups.length === 0)
              }
              className="w-8 h-8 m-0.5 rounded-lg bg-gray-900 text-white flex items-center justify-center shrink-0 hover:bg-black transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlus size={14} />
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default EditorSkillsSection;
