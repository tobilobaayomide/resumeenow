import React from 'react';
import { FiCheck, FiPlus, FiX } from 'react-icons/fi';
import type { EditorPanelProps } from '../../../../types/builder';
import type { EditorPanelState } from '../useEditorPanelState';
import { Section } from '../common';

interface EditorCertificationsSectionProps {
  data: EditorPanelProps['data'];
  openSection: EditorPanelState['openSection'];
  toggle: EditorPanelState['toggle'];
  state: EditorPanelState;
}

const EditorCertificationsSection: React.FC<EditorCertificationsSectionProps> = ({
  data,
  openSection,
  toggle,
  state,
}) => (
  <Section
    sectionId="certifications"
    icon={<FiCheck />}
    label="Certifications"
    isOpen={openSection === 'certifications'}
    onToggle={() => toggle('certifications')}
    count={data.certifications.length}
  >
    <div className="pt-2 space-y-3">
      {data.certifications.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-[#F8FAFD] border border-[#E4E8F0] rounded-xl min-h-12">
          {data.certifications.map((certification) => (
            <span
              key={certification}
              className="group flex items-center gap-1 bg-white border border-[#E4E8F0] px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-700"
            >
              {certification}
              <button
                onClick={() => state.removeCertification(certification)}
                className="text-gray-300 hover:text-red-400 transition-colors ml-0.5"
              >
                <FiX size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          id="new-certification"
          name="new-certification"
          type="text"
          value={state.newCertification}
          onChange={(event) => state.setNewCertification(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              state.addCertification();
            }
          }}
          placeholder="Type a certification and press Enter..."
          className="flex-1 px-3 py-2.5 bg-white border border-[#E4E8F0] rounded-lg text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40 focus:ring-2 focus:ring-[#0F172A]/10 transition-all"
        />
        <button
          onClick={state.addCertification}
          className="w-9 h-9 flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shrink-0"
        >
          <FiPlus size={14} />
        </button>
      </div>
    </div>
  </Section>
);

export default EditorCertificationsSection;
