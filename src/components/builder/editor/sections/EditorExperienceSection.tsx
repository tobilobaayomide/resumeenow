import React from "react";
import { FiBriefcase, FiInfo, FiPlus } from "react-icons/fi";
import { getBuilderAiExperienceHighlights } from "../../../../lib/builder/aiHighlights";
import type { EditorPanelState } from "../useEditorPanelState";
import type { ResumeData } from "../../../../types/resume";
import {
  AddButton,
  Card,
  DateRow,
  Input,
  ItemSwitcher,
  Section,
  Textarea,
} from "../common";

interface EditorExperienceSectionProps {
  data: ResumeData;
  openSection: EditorPanelState["openSection"];
  toggle: EditorPanelState["toggle"];
  state: EditorPanelState;
}

const EditorExperienceSection: React.FC<EditorExperienceSectionProps> = ({
  data,
  openSection,
  toggle,
  state,
}) => {
  const activeExperienceHighlights = state.activeExperience
    ? getBuilderAiExperienceHighlights(
        state.recentAiHighlights,
        state.activeExperience.id,
      )
    : [];

  return (
    <Section
      sectionId="experience"
      icon={<FiBriefcase />}
      label="Experience"
      isOpen={openSection === "experience"}
      onToggle={() => toggle("experience")}
      count={data.experience.length}
    >
      <div className="pt-1 pb-2">
        <div className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 mb-5">
          <div className="bg-blue-100/50 p-1 hidden md:flex rounded-md shrink-0 mt-0.5">
            <FiInfo className="text-blue-500" size={12} />
          </div>
          <p className="text-[11.5px] text-slate-600 leading-relaxed pr-2">
            Focus on{" "}
            <strong className="font-semibold text-slate-800">
              measurable achievements
            </strong>{" "}
            and impact. Use bullet points to make your descriptions easy to scan
            for ATS systems.
          </p>
        </div>

        {data.experience.length === 0 && (
          <div className="flex flex-col items-center justify-center py-7 px-4 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl animate-in fade-in duration-300">
            <div className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
              <FiBriefcase size={16} />
            </div>
            <h4 className="text-[12px] font-bold text-gray-800 mb-1">
              No roles added yet
            </h4>
            <p className="text-[11px] text-gray-400 text-center max-w-50 mb-4 leading-relaxed">
              Add your past professional experience to build out your resume.
            </p>
            <button
              onClick={state.addExperience}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white hover:bg-black transition-all rounded-lg text-[11px] font-semibold tracking-wide shadow-sm"
            >
              <FiPlus size={12} />
              Add First Position
            </button>
          </div>
        )}

        {data.experience.length > 0 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="pb-1">
              <ItemSwitcher
                title="Positions"
                items={data.experience.map((item, index) => ({
                  id: item.id,
                  label:
                    item.role.trim() ||
                    item.company.trim() ||
                    `Position ${index + 1}`,
                }))}
                activeId={state.resolvedActiveExperienceId}
                onSelect={state.setActiveExperienceId}
                onRemove={state.removeExperience}
              />
            </div>

            {state.activeExperience && (
              <div
                data-ai-highlight-anchor={`experience-${state.activeExperience.id}`}
                className="animate-in slide-in-from-bottom-2 fade-in duration-200 rounded-xl transition-all duration-300"
              >
                <Card
                  label="Role"
                  index={Math.max(state.activeExperienceIndex, 0)}
                  onRemove={() =>
                    state.removeExperience(state.activeExperience!.id)
                  }
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Job Title"
                        placeholder="e.g. Senior Product Manager"
                        value={state.activeExperience.role}
                        onChange={(value) =>
                          state.updateExperience(
                            state.activeExperience!.id,
                            "role",
                            value,
                          )
                        }
                      />
                      <Input
                        label="Company"
                        placeholder="e.g. Stripe"
                        value={state.activeExperience.company}
                        onChange={(value) =>
                          state.updateExperience(
                            state.activeExperience!.id,
                            "company",
                            value,
                          )
                        }
                      />
                    </div>

                    <DateRow
                      startDate={state.activeExperience.startDate}
                      endDate={state.activeExperience.endDate}
                      onStartChange={(value) =>
                        state.updateExperience(
                          state.activeExperience!.id,
                          "startDate",
                          value,
                        )
                      }
                      onEndChange={(value) =>
                        state.updateExperience(
                          state.activeExperience!.id,
                          "endDate",
                          value,
                        )
                      }
                    />

                    {activeExperienceHighlights.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2">
                        <p className="text-[10.5px] font-semibold tracking-wide text-amber-800">
                          Recent AI-updated bullet
                          {activeExperienceHighlights.length === 1 ? "" : "s"}
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {activeExperienceHighlights.map((bullet, index) => (
                            <li
                              key={`${state.activeExperience?.id}-highlight-${index}`}
                              className="text-[11px] leading-relaxed text-amber-900"
                            >
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Textarea
                      label="Description & Highlights"
                      placeholder="• Spearheaded the launch of a new payment API that increased revenue by 15%&#10;• Mentored a team of 4 junior developers..."
                      value={state.activeExperience.description}
                      onChange={(value) =>
                        state.updateExperience(
                          state.activeExperience!.id,
                          "description",
                          value,
                        )
                      }
                    />
                  </div>
                </Card>
              </div>
            )}

            <div className="pt-2">
              <AddButton
                label="Add Another Position"
                onClick={state.addExperience}
              />
            </div>
          </div>
        )}
      </div>
    </Section>
  );
};

export default EditorExperienceSection;
