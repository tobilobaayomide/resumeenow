import React from "react";
import { FiHeart, FiInfo, FiPlus } from "react-icons/fi";
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

interface EditorVolunteeringSectionProps {
  data: ResumeData;
  openSection: EditorPanelState["openSection"];
  toggle: EditorPanelState["toggle"];
  state: EditorPanelState;
}

const EditorVolunteeringSection: React.FC<EditorVolunteeringSectionProps> = ({
  data,
  openSection,
  toggle,
  state,
}) => (
  <Section
    sectionId="volunteering"
    icon={<FiHeart />}
    label="Volunteering"
    isOpen={openSection === "volunteering"}
    onToggle={() => toggle("volunteering")}
    count={data.volunteering.length}
  >
    <div className="pt-1 pb-2">
      <div className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 mb-5">
        <div className="bg-blue-100/50 p-1 hidden md:flex rounded-md shrink-0 mt-0.5">
          <FiInfo className="text-blue-500" size={12} />
        </div>
        <p className="text-[11.5px] text-slate-600 leading-relaxed pr-2">
          Include{" "}
          <strong className="font-semibold text-slate-800">
            volunteer work
          </strong>{" "}
          or community service that highlights your leadership, passions, or
          relevant skills.
        </p>
      </div>

      {data.volunteering.length === 0 && (
        <div className="flex flex-col items-center justify-center py-7 px-4 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl animate-in fade-in duration-300">
          <div className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
            <FiHeart size={16} />
          </div>
          <h4 className="text-[12px] font-bold text-gray-800 mb-1">
            No volunteering added
          </h4>
          <p className="text-[11px] text-gray-400 text-center max-w-50 mb-4 leading-relaxed">
            Share your community involvement or pro-bono work to stand out.
          </p>
          <button
            onClick={state.addVolunteering}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white hover:bg-black transition-all rounded-lg text-[11px] font-semibold tracking-wide shadow-sm"
          >
            <FiPlus size={12} />
            Add First Role
          </button>
        </div>
      )}

      {data.volunteering.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="pb-1">
            <ItemSwitcher
              title="Roles"
              items={data.volunteering.map((item, index) => ({
                id: item.id,
                label:
                  item.role.trim() ||
                  item.company.trim() ||
                  `Role ${index + 1}`,
              }))}
              activeId={state.resolvedActiveVolunteeringId}
              onSelect={state.setActiveVolunteeringId}
              onRemove={state.removeVolunteering}
            />
          </div>

          {state.activeVolunteering && (
            <div className="animate-in slide-in-from-bottom-2 fade-in duration-200">
              <Card
                label="Volunteering"
                index={Math.max(state.activeVolunteeringIndex, 0)}
                onRemove={() =>
                  state.removeVolunteering(state.activeVolunteering!.id)
                }
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Role / Contribution"
                      placeholder="e.g. Mentor"
                      value={state.activeVolunteering.role}
                      onChange={(value) =>
                        state.updateVolunteering(
                          state.activeVolunteering!.id,
                          "role",
                          value,
                        )
                      }
                    />
                    <Input
                      label="Organization"
                      placeholder="e.g. Code for Good"
                      value={state.activeVolunteering.company}
                      onChange={(value) =>
                        state.updateVolunteering(
                          state.activeVolunteering!.id,
                          "company",
                          value,
                        )
                      }
                    />
                  </div>

                  <DateRow
                    startDate={state.activeVolunteering.startDate}
                    endDate={state.activeVolunteering.endDate}
                    onStartChange={(value) =>
                      state.updateVolunteering(
                        state.activeVolunteering!.id,
                        "startDate",
                        value,
                      )
                    }
                    onEndChange={(value) =>
                      state.updateVolunteering(
                        state.activeVolunteering!.id,
                        "endDate",
                        value,
                      )
                    }
                  />

                  <DescriptionBulletEditor
                    label="Description & Impact"
                    placeholder="e.g. Mentored 20 students through weekly front-end workshops and portfolio reviews."
                    value={state.activeVolunteering.description}
                    onChange={(value) =>
                      state.updateVolunteering(
                        state.activeVolunteering!.id,
                        "description",
                        value,
                      )
                    }
                    minRows={3}
                  />
                </div>
              </Card>
            </div>
          )}

          <div className="pt-2">
            <AddButton
              label="Add Another Role"
              onClick={state.addVolunteering}
            />
          </div>
        </div>
      )}
    </div>
  </Section>
);

export default EditorVolunteeringSection;
