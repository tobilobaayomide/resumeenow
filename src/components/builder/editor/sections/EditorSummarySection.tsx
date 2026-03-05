import React from 'react';
import { FiList } from 'react-icons/fi';
import { SUMMARY_MAX_LENGTH } from '../../../../lib/builder/page';
import type { EditorPanelState } from '../useEditorPanelState';
import type { ResumeData } from '../../../../types/resume';
import { Section, Textarea } from '../common';

interface EditorSummarySectionProps {
  data: ResumeData;
  openSection: EditorPanelState['openSection'];
  toggle: EditorPanelState['toggle'];
  state: EditorPanelState;
}

const EditorSummarySection: React.FC<EditorSummarySectionProps> = ({
  data,
  openSection,
  toggle,
  state,
}) => (
  <Section
    sectionId="summary"
    icon={<FiList />}
    label="Professional Summary"
    isOpen={openSection === 'summary'}
    onToggle={() => toggle('summary')}
  >
    <div className="pt-2">
      <Textarea
        placeholder="Briefly describe your background, strengths and key achievements..."
        value={data.summary}
        onChange={state.onSummaryChange}
        maxLength={SUMMARY_MAX_LENGTH}
      />
      <p className="text-[10px] text-gray-300 text-right mt-1.5">
        {data.summary.length} / {SUMMARY_MAX_LENGTH}
      </p>
    </div>
  </Section>
);

export default EditorSummarySection;
