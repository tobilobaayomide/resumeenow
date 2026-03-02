import React from 'react';
import { FiHeart } from 'react-icons/fi';
import type { EditorPanelProps } from '../../../../types/builder';
import type { EditorPanelState } from '../useEditorPanelState';
import { AddButton, Card, DateRow, Input, ItemSwitcher, Section, Textarea } from '../common';

interface EditorVolunteeringSectionProps {
  data: EditorPanelProps['data'];
  openSection: EditorPanelState['openSection'];
  toggle: EditorPanelState['toggle'];
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
    isOpen={openSection === 'volunteering'}
    onToggle={() => toggle('volunteering')}
    count={data.volunteering.length}
  >
    <div className="pt-2 space-y-3">
      {data.volunteering.length > 0 && (
        <ItemSwitcher
          title="Roles"
          items={data.volunteering.map((item, index) => ({
            id: item.id,
            label: item.role.trim() || item.company.trim() || `Role ${index + 1}`,
          }))}
          activeId={state.resolvedActiveVolunteeringId}
          onSelect={state.setActiveVolunteeringId}
          onRemove={state.removeVolunteering}
        />
      )}

      {state.activeVolunteering && (
        <Card
          label="Volunteering"
          index={Math.max(state.activeVolunteeringIndex, 0)}
          onRemove={() => state.removeVolunteering(state.activeVolunteering!.id)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="Role / Contribution"
              value={state.activeVolunteering.role}
              onChange={(value) => state.updateVolunteering(state.activeVolunteering!.id, 'role', value)}
            />
            <Input
              placeholder="Organization"
              value={state.activeVolunteering.company}
              onChange={(value) => state.updateVolunteering(state.activeVolunteering!.id, 'company', value)}
            />
          </div>
          <DateRow
            startDate={state.activeVolunteering.startDate}
            endDate={state.activeVolunteering.endDate}
            onStartChange={(value) => state.updateVolunteering(state.activeVolunteering!.id, 'startDate', value)}
            onEndChange={(value) => state.updateVolunteering(state.activeVolunteering!.id, 'endDate', value)}
          />
          <Textarea
            placeholder="Impact, activities, or outcomes..."
            value={state.activeVolunteering.description}
            onChange={(value) => state.updateVolunteering(state.activeVolunteering!.id, 'description', value)}
          />
        </Card>
      )}
      <AddButton label="Add Volunteering" onClick={state.addVolunteering} />
    </div>
  </Section>
);

export default EditorVolunteeringSection;
