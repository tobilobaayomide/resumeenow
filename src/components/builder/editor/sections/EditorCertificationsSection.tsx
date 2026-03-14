import React from "react";
import { FiCheck, FiPlus, FiX, FiInfo, FiCheckCircle } from "react-icons/fi";
import type { EditorPanelState } from "../useEditorPanelState";
import type { ResumeData } from "../../../../types/resume";
import { Section } from "../common";

interface EditorCertificationsSectionProps {
  data: ResumeData;
  openSection: EditorPanelState["openSection"];
  toggle: EditorPanelState["toggle"];
  state: EditorPanelState;
}

const EditorCertificationsSection: React.FC<
  EditorCertificationsSectionProps
> = ({ data, openSection, toggle, state }) => (
  <Section
    sectionId="certifications"
    icon={<FiCheck />}
    label="Certifications"
    isOpen={openSection === "certifications"}
    onToggle={() => toggle("certifications")}
    count={data.certifications.length}
  >
    <div className="pt-1 pb-2 space-y-5">
      <div className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-100/50 rounded-xl p-3">
        <div className="bg-blue-100/50 p-1 hidden md:flex rounded-md shrink-0 mt-0.5">
          <FiInfo className="text-blue-500" size={12} />
        </div>
        <p className="text-[11.5px] text-slate-600 leading-relaxed pr-2">
          Include relevant{" "}
          <strong className="font-semibold text-slate-800">
            licenses, certifications, or courses
          </strong>{" "}
          that validate your professional expertise.
        </p>
      </div>

      <div className="flex flex-col gap-2 min-h-25 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-3 animate-in fade-in duration-300">
        {data.certifications.length === 0 ? (
          <div className="m-auto text-center">
            <p className="text-[11px] text-gray-400">
              No certifications added yet. Use the input below.
            </p>
          </div>
        ) : (
          data.certifications.map((certification, index) => (
            <div
              key={`${certification}-${index}`}
              className="group flex items-start justify-between gap-3 bg-white border border-gray-200 p-2.5 rounded-lg text-[11.5px] font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 pointer-events-none"
            >
              <span className="flex-1 leading-relaxed mt-px">
                {certification}
              </span>
              <button
                type="button"
                onClick={() => state.removeCertification(certification)}
                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-all shrink-0 pointer-events-auto"
                title="Remove certification"
              >
                <FiX size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-gray-100">
        <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200 rounded-xl focus-within:bg-white focus-within:ring-4 focus-within:ring-gray-50 focus-within:border-gray-300 transition-all duration-200">
          <div className="flex-1 flex items-center px-2">
            <FiCheckCircle className="text-gray-400 shrink-0" size={12} />
            <input
              id="new-certification"
              type="text"
              value={state.newCertification}
              onChange={(event) =>
                state.setNewCertification(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  state.addCertification();
                }
              }}
              placeholder="e.g. AWS Certified Solutions Architect"
              className="w-full bg-transparent px-2.5 py-2 text-[12px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={state.addCertification}
            disabled={!state.newCertification.trim()}
            className="w-8 h-8 m-0.5 rounded-lg bg-gray-900 text-white flex items-center justify-center shrink-0 hover:bg-black transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiPlus size={14} />
          </button>
        </div>
      </div>
    </div>
  </Section>
);

export default EditorCertificationsSection;
