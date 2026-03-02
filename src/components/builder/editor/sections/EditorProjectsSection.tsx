import React from 'react';
import { FiCode } from 'react-icons/fi';
import type { EditorPanelProps } from '../../../../types/builder';
import type { EditorPanelState } from '../useEditorPanelState';
import { AddButton, Card, DateRow, Input, ItemSwitcher, Section, Textarea } from '../common';

interface EditorProjectsSectionProps {
  data: EditorPanelProps['data'];
  openSection: EditorPanelState['openSection'];
  toggle: EditorPanelState['toggle'];
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
    isOpen={openSection === 'projects'}
    onToggle={() => toggle('projects')}
    count={data.projects.length}
  >
    <div className="pt-2 space-y-3">
      {data.projects.length > 0 && (
        <ItemSwitcher
          title="Projects"
          items={data.projects.map((item, index) => ({
            id: item.id,
            label: item.name.trim() || item.link.trim() || `Project ${index + 1}`,
          }))}
          activeId={state.resolvedActiveProjectId}
          onSelect={state.setActiveProjectId}
          onRemove={state.removeProject}
        />
      )}

      {state.activeProject && (
        <Card
          label="Project"
          index={Math.max(state.activeProjectIndex, 0)}
          onRemove={() => state.removeProject(state.activeProject!.id)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="Project name"
              value={state.activeProject.name}
              onChange={(value) => state.updateProject(state.activeProject!.id, 'name', value)}
            />
            <Input
              placeholder="Live/demo URL"
              value={state.activeProject.link}
              onChange={(value) => state.updateProject(state.activeProject!.id, 'link', value)}
            />
          </div>
          <DateRow
            startDate={state.activeProject.startDate}
            endDate={state.activeProject.endDate}
            onStartChange={(value) => state.updateProject(state.activeProject!.id, 'startDate', value)}
            onEndChange={(value) => state.updateProject(state.activeProject!.id, 'endDate', value)}
          />
          <Textarea
            placeholder="What you built, stack, and measurable results..."
            value={state.activeProject.description}
            onChange={(value) => state.updateProject(state.activeProject!.id, 'description', value)}
          />
        </Card>
      )}
      <AddButton label="Add Project" onClick={state.addProject} />
    </div>
  </Section>
);

export default EditorProjectsSection;
