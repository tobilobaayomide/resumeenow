import React from "react";
import { FiCode, FiInfo, FiPlus } from "react-icons/fi";
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

interface EditorProjectsSectionProps {
  data: ResumeData;
  openSection: EditorPanelState["openSection"];
  toggle: EditorPanelState["toggle"];
  state: EditorPanelState;
}

const EditorProjectsSection: React.FC<EditorProjectsSectionProps> = ({
  data,
  openSection,
  toggle,
  state,
}) => (
  <Section
    sectionId="projects"
    icon={<FiCode />}
    label="Projects"
    isOpen={openSection === "projects"}
    onToggle={() => toggle("projects")}
    count={data.projects.length}
  >
    <div className="pt-1 pb-2">
      <div className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 mb-5">
        <div className="bg-blue-100/50 p-1 hidden md:flex rounded-md shrink-0 mt-0.5">
          <FiInfo className="text-blue-500" size={12} />
        </div>
        <p className="text-[11.5px] text-slate-600 leading-relaxed pr-2">
          Showcase your{" "}
          <strong className="font-semibold text-slate-800">
            personal or open-source projects
          </strong>
          . Include links to live demos or repositories if available.
        </p>
      </div>

      {data.projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-7 px-4 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl animate-in fade-in duration-300">
          <div className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
            <FiCode size={16} />
          </div>
          <h4 className="text-[12px] font-bold text-gray-800 mb-1">
            No projects added
          </h4>
          <p className="text-[11px] text-gray-400 text-center max-w-50 mb-4 leading-relaxed">
            Add your side projects, open-source contributions, or portfolio
            work.
          </p>
          <button
            onClick={state.addProject}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white hover:bg-black transition-all rounded-lg text-[11px] font-semibold tracking-wide shadow-sm"
          >
            <FiPlus size={12} />
            Add First Project
          </button>
        </div>
      )}

      {data.projects.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="pb-1">
            <ItemSwitcher
              title="Projects"
              items={data.projects.map((item, index) => ({
                id: item.id,
                label:
                  item.name.trim() ||
                  item.link.trim() ||
                  `Project ${index + 1}`,
              }))}
              activeId={state.resolvedActiveProjectId}
              onSelect={state.setActiveProjectId}
              onRemove={state.removeProject}
            />
          </div>

          {state.activeProject && (
            <div className="animate-in slide-in-from-bottom-2 fade-in duration-200">
              <Card
                label="Project"
                index={Math.max(state.activeProjectIndex, 0)}
                onRemove={() => state.removeProject(state.activeProject!.id)}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Project Name"
                      placeholder="e.g. E-commerce Platform"
                      value={state.activeProject.name}
                      onChange={(value) =>
                        state.updateProject(
                          state.activeProject!.id,
                          "name",
                          value,
                        )
                      }
                    />
                    <Input
                      label="Live / Repo URL"
                      placeholder="e.g. github.com/username/repo"
                      value={state.activeProject.link}
                      onChange={(value) =>
                        state.updateProject(
                          state.activeProject!.id,
                          "link",
                          value,
                        )
                      }
                    />
                  </div>

                  <DateRow
                    startDate={state.activeProject.startDate}
                    endDate={state.activeProject.endDate}
                    onStartChange={(value) =>
                      state.updateProject(
                        state.activeProject!.id,
                        "startDate",
                        value,
                      )
                    }
                    onEndChange={(value) =>
                      state.updateProject(
                        state.activeProject!.id,
                        "endDate",
                        value,
                      )
                    }
                  />

                  <DescriptionBulletEditor
                    label="Description & Tech Stack"
                    placeholder="e.g. Built a multi-tenant dashboard with React, Supabase, and Stripe, improving onboarding speed by 40%."
                    value={state.activeProject.description}
                    onChange={(value) =>
                      state.updateProject(
                        state.activeProject!.id,
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
            <AddButton label="Add Another Project" onClick={state.addProject} />
          </div>
        </div>
      )}
    </div>
  </Section>
);

export default EditorProjectsSection;
