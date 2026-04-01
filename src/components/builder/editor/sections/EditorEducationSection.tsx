import React from "react";
import { FiBook, FiInfo, FiPlus } from "react-icons/fi";
import type { EditorPanelState } from "../useEditorPanelState";
import type { ResumeData } from "../../../../types/resume";
import DescriptionBulletEditor from "../DescriptionBulletEditor";
import {
  AddButton,
  Card,
  DateRow,
  Input,
  ItemSwitcher,
  Section,
} from "../common";

interface EditorEducationSectionProps {
  data: ResumeData;
  openSection: EditorPanelState["openSection"];
  toggle: EditorPanelState["toggle"];
  state: EditorPanelState;
}

const EditorEducationSection: React.FC<EditorEducationSectionProps> = ({
  data,
  openSection,
  toggle,
  state,
}) => (
  <Section
    sectionId="education"
    icon={<FiBook />}
    label="Education"
    isOpen={openSection === "education"}
    onToggle={() => toggle("education")}
    count={data.education.length}
  >
    <div className="pt-1 pb-2">
      <div className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 mb-5">
        <div className="bg-blue-100/50 p-1 hidden md:flex rounded-md shrink-0 mt-0.5">
          <FiInfo className="text-blue-500" size={12} />
        </div>
        <p className="text-[11.5px] text-slate-600 leading-relaxed pr-2">
          List your{" "}
          <strong className="font-semibold text-slate-800">
            degrees and academic background
          </strong>
          . If you have years of professional experience, keep this section
          brief.
        </p>
      </div>

      {data.education.length === 0 && (
        <div className="flex flex-col items-center justify-center py-7 px-4 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl animate-in fade-in duration-300">
          <div className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
            <FiBook size={16} />
          </div>
          <h4 className="text-[12px] font-bold text-gray-800 mb-1">
            No education added
          </h4>
          <p className="text-[11px] text-gray-400 text-center max-w-50 mb-4 leading-relaxed">
            Include your university, college, or other relevant educational
            institutions.
          </p>
          <button
            onClick={state.addEducation}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white hover:bg-black transition-all rounded-lg text-[11px] font-semibold tracking-wide shadow-sm"
          >
            <FiPlus size={12} />
            Add First School
          </button>
        </div>
      )}

      {data.education.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="pb-1">
            <ItemSwitcher
              title="Schools"
              items={data.education.map((item, index) => ({
                id: item.id,
                label:
                  item.school.trim() ||
                  item.degree.trim() ||
                  `School ${index + 1}`,
              }))}
              activeId={state.resolvedActiveEducationId}
              onSelect={state.setActiveEducationId}
              onRemove={state.removeEducation}
            />
          </div>

          {state.activeEducation && (
            <div className="animate-in slide-in-from-bottom-2 fade-in duration-200">
              <Card
                label="School"
                index={Math.max(state.activeEducationIndex, 0)}
                onRemove={() =>
                  state.removeEducation(state.activeEducation!.id)
                }
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="School / University"
                      placeholder="e.g. Stanford University"
                      value={state.activeEducation.school}
                      onChange={(value) =>
                        state.updateEducation(
                          state.activeEducation!.id,
                          "school",
                          value,
                        )
                      }
                    />
                    <Input
                      label="Degree"
                      placeholder="e.g. BS in Computer Science"
                      value={state.activeEducation.degree}
                      onChange={(value) =>
                        state.updateEducation(
                          state.activeEducation!.id,
                          "degree",
                          value,
                        )
                      }
                    />
                  </div>

                  <DateRow
                    startDate={state.activeEducation.startDate}
                    endDate={state.activeEducation.endDate}
                    onStartChange={(value) =>
                      state.updateEducation(
                        state.activeEducation!.id,
                        "startDate",
                        value,
                      )
                    }
                    onEndChange={(value) =>
                      state.updateEducation(
                        state.activeEducation!.id,
                        "endDate",
                        value,
                      )
                    }
                  />

                  <DescriptionBulletEditor
                    label="Additional Details (Optional)"
                    placeholder="e.g. Graduated with first-class honours and completed coursework."
                    value={state.activeEducation.description}
                    onChange={(value) =>
                      state.updateEducation(
                        state.activeEducation!.id,
                        "description",
                        value,
                      )
                    }
                    minRows={2}
                  />
                </div>
              </Card>
            </div>
          )}

          <div className="pt-2">
            <AddButton
              label="Add Another School"
              onClick={state.addEducation}
            />
          </div>
        </div>
      )}
    </div>
  </Section>
);

export default EditorEducationSection;
