import React from 'react';
import { FiBook } from 'react-icons/fi';
import type { EditorPanelState } from '../useEditorPanelState';
import type { ResumeData } from '../../../../types/resume';
import { AddButton, Card, DateRow, Input, ItemSwitcher, Section, Textarea } from '../common';

interface EditorEducationSectionProps {
  data: ResumeData;
  openSection: EditorPanelState['openSection'];
  toggle: EditorPanelState['toggle'];
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
    isOpen={openSection === 'education'}
    onToggle={() => toggle('education')}
    count={data.education.length}
  >
    <div className="pt-2 space-y-3">
      {data.education.length > 0 && (
        <ItemSwitcher
          title="Schools"
          items={data.education.map((item, index) => ({
            id: item.id,
            label: item.school.trim() || item.degree.trim() || `School ${index + 1}`,
          }))}
          activeId={state.resolvedActiveEducationId}
          onSelect={state.setActiveEducationId}
          onRemove={state.removeEducation}
        />
      )}

      {state.activeEducation && (
        <Card
          label="School"
          index={Math.max(state.activeEducationIndex, 0)}
          onRemove={() => state.removeEducation(state.activeEducation!.id)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="School / University"
              value={state.activeEducation.school}
              onChange={(value) => state.updateEducation(state.activeEducation!.id, 'school', value)}
            />
            <Input
              placeholder="Degree"
              value={state.activeEducation.degree}
              onChange={(value) => state.updateEducation(state.activeEducation!.id, 'degree', value)}
            />
          </div>
          <DateRow
            startDate={state.activeEducation.startDate}
            endDate={state.activeEducation.endDate}
            onStartChange={(value) => state.updateEducation(state.activeEducation!.id, 'startDate', value)}
            onEndChange={(value) => state.updateEducation(state.activeEducation!.id, 'endDate', value)}
          />
          <Textarea
            placeholder="Relevant coursework, honours or achievements..."
            value={state.activeEducation.description}
            onChange={(value) => state.updateEducation(state.activeEducation!.id, 'description', value)}
          />
        </Card>
      )}
      <AddButton label="Add School" onClick={state.addEducation} />
    </div>
  </Section>
);

export default EditorEducationSection;
