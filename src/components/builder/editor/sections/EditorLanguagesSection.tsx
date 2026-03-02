import React from 'react';
import { FiGlobe, FiPlus, FiX } from 'react-icons/fi';
import type { EditorPanelProps } from '../../../../types/builder';
import type { EditorPanelState } from '../useEditorPanelState';
import { Section } from '../common';

interface EditorLanguagesSectionProps {
  data: EditorPanelProps['data'];
  openSection: EditorPanelState['openSection'];
  toggle: EditorPanelState['toggle'];
  state: EditorPanelState;
}

const EditorLanguagesSection: React.FC<EditorLanguagesSectionProps> = ({
  data,
  openSection,
  toggle,
  state,
}) => (
  <Section
    sectionId="languages"
    icon={<FiGlobe />}
    label="Languages"
    isOpen={openSection === 'languages'}
    onToggle={() => toggle('languages')}
    count={data.languages.length}
  >
    <div className="pt-2 space-y-3">
      {data.languages.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-[#F8FAFD] border border-[#E4E8F0] rounded-xl min-h-12">
          {data.languages.map((language) => (
            <span
              key={language}
              className="group flex items-center gap-1 bg-white border border-[#E4E8F0] px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-700"
            >
              {language}
              <button
                onClick={() => state.removeLanguage(language)}
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
          id="new-language"
          name="new-language"
          type="text"
          value={state.newLanguage}
          onChange={(event) => state.setNewLanguage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              state.addLanguage();
            }
          }}
          placeholder="e.g. English (Fluent)"
          className="flex-1 px-3 py-2.5 bg-white border border-[#E4E8F0] rounded-lg text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40 focus:ring-2 focus:ring-[#0F172A]/10 transition-all"
        />
        <button
          onClick={state.addLanguage}
          className="w-9 h-9 flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shrink-0"
        >
          <FiPlus size={14} />
        </button>
      </div>
    </div>
  </Section>
);

export default EditorLanguagesSection;
