import React from "react";
import { FiAlignLeft, FiInfo } from "react-icons/fi";
import { SUMMARY_MAX_LENGTH } from "../../../../lib/builder/page";
import type { EditorPanelState } from "../useEditorPanelState";
import type { ResumeData } from "../../../../types/resume";
import { Section, Textarea } from "../common";

interface EditorSummarySectionProps {
  data: ResumeData;
  openSection: EditorPanelState["openSection"];
  toggle: EditorPanelState["toggle"];
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
    icon={<FiAlignLeft />}
    label="Professional Summary"
    isOpen={openSection === "summary"}
    onToggle={() => toggle("summary")}
  >
    <div className="pt-1 pb-2">
      <div className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 mb-5">
        <div className="bg-blue-100/50 p-1 hidden md:flex rounded-md shrink-0 mt-0.5">
          <FiInfo className="text-blue-500" size={12} />
        </div>
        <p className="text-[11.5px] text-slate-600 leading-relaxed pr-2">
          Write a brief, engaging pitch that highlights your{" "}
          <strong className="font-semibold text-slate-800">
            core strengths
          </strong>
          , key achievements, and what makes you unique.
        </p>
      </div>

      <div className="group animate-in fade-in duration-300">
        <Textarea
          label="Your Pitch"
          placeholder="e.g. Results-driven Senior Product Designer with 8+ years of experience leading cross-functional teams..."
          value={data.summary}
          onChange={state.onSummaryChange}
          maxLength={SUMMARY_MAX_LENGTH}
        />
      </div>
    </div>
  </Section>
);

export default EditorSummarySection;
