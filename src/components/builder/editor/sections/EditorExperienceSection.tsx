import React from 'react';
import { FiBriefcase } from 'react-icons/fi';
import type { EditorPanelState } from '../useEditorPanelState';
import type { ResumeData } from '../../../../types/resume';
import { AddButton, Card, DateRow, Input, ItemSwitcher, Section, Textarea } from '../common';

interface EditorExperienceSectionProps {
  data: ResumeData;
  openSection: EditorPanelState['openSection'];
  toggle: EditorPanelState['toggle'];
  state: EditorPanelState;
}

const EditorExperienceSection: React.FC<EditorExperienceSectionProps> = ({
  data,
  openSection,
  toggle,
  state,
}) => (
  <Section
    sectionId="experience"
    icon={<FiBriefcase />}
    label="Experience"
    isOpen={openSection === 'experience'}
    onToggle={() => toggle('experience')}
    count={data.experience.length}
  >
    <div className="pt-2 space-y-3">
      {data.experience.length > 0 && (
        <ItemSwitcher
          title="Positions"
          items={data.experience.map((item, index) => ({
            id: item.id,
            label: item.role.trim() || item.company.trim() || `Position ${index + 1}`,
          }))}
          activeId={state.resolvedActiveExperienceId}
          onSelect={state.setActiveExperienceId}
          onRemove={state.removeExperience}
        />
      )}

      {state.activeExperience && (
        <Card
          label="Role"
          index={Math.max(state.activeExperienceIndex, 0)}
          onRemove={() => state.removeExperience(state.activeExperience!.id)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="Job Title"
              value={state.activeExperience.role}
              onChange={(value) => state.updateExperience(state.activeExperience!.id, 'role', value)}
            />
            <Input
              placeholder="Company"
              value={state.activeExperience.company}
              onChange={(value) => state.updateExperience(state.activeExperience!.id, 'company', value)}
            />
          </div>
          <DateRow
            startDate={state.activeExperience.startDate}
            endDate={state.activeExperience.endDate}
            onStartChange={(value) => state.updateExperience(state.activeExperience!.id, 'startDate', value)}
            onEndChange={(value) => state.updateExperience(state.activeExperience!.id, 'endDate', value)}
          />
          <Textarea
            placeholder="Key responsibilities and measurable outcomes..."
            value={state.activeExperience.description}
            onChange={(value) => state.updateExperience(state.activeExperience!.id, 'description', value)}
          />
        </Card>
      )}
      <AddButton label="Add Position" onClick={state.addExperience} />
    </div>
  </Section>
);

export default EditorExperienceSection;
