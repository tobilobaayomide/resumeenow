import React from "react";
import { FiGlobe, FiPlus, FiX, FiInfo, FiMessageCircle } from "react-icons/fi";
import type { EditorPanelState } from "../useEditorPanelState";
import type { ResumeData } from "../../../../types/resume";
import { Section } from "../common";

interface EditorLanguagesSectionProps {
  data: ResumeData;
  openSection: EditorPanelState["openSection"];
  toggle: EditorPanelState["toggle"];
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
    isOpen={openSection === "languages"}
    onToggle={() => toggle("languages")}
    count={data.languages.length}
  >
    <div className="pt-1 pb-2 space-y-5">
      <div className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-100/50 rounded-xl p-3">
        <div className="bg-blue-100/50 p-1 hidden md:flex rounded-md shrink-0 mt-0.5">
          <FiInfo className="text-blue-500" size={12} />
        </div>
        <p className="text-[11.5px] text-slate-600 leading-relaxed pr-2">
          List the{" "}
          <strong className="font-semibold text-slate-800">
            languages you speak
          </strong>{" "}
          and specify your proficiency level (e.g., Native, Fluent, Beginner).
        </p>
      </div>

      <div className="min-h-25 flex flex-col gap-2 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-3 animate-in fade-in duration-300">
        {data.languages.length === 0 ? (
          <p className="text-[11px] text-gray-400 w-full text-center mt-6">
            No languages added yet. Use the input below.
          </p>
        ) : (
          data.languages.map((language, index) => (
            <div
              key={`language-${index}`}
              className="group flex items-center gap-2 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300"
            >
              <input
                type="text"
                value={language}
                onChange={(event) =>
                  state.updateLanguage(index, event.target.value)
                }
                placeholder="Language"
                className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-gray-700 placeholder:text-gray-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => state.removeLanguageAtIndex(index)}
                className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded p-0.5 transition-all shrink-0"
              >
                <FiX size={11} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-gray-100">
        <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:ring-4 focus-within:ring-gray-50 focus-within:border-gray-300 transition-all duration-200">
          <div className="flex-1 flex items-center px-2">
            <FiMessageCircle className="text-gray-400 shrink-0" size={12} />
            <input
              id="new-language"
              type="text"
              value={state.newLanguage}
              onChange={(event) => state.setNewLanguage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  state.addLanguage();
                }
              }}
              placeholder="e.g. Spanish (Fluent)"
              className="w-full bg-transparent px-2.5 py-2 text-[12px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={state.addLanguage}
            disabled={!state.newLanguage.trim()}
            className="w-8 h-8 m-0.5 rounded-lg bg-gray-900 text-white flex items-center justify-center shrink-0 hover:bg-black transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiPlus size={14} />
          </button>
        </div>
      </div>
    </div>
  </Section>
);

export default EditorLanguagesSection;
