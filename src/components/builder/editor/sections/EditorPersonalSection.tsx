import React from "react";
import { FiLink, FiPlus, FiUser, FiX } from "react-icons/fi";
import type { EditorPanelState } from "../useEditorPanelState";
import type { ResumeData } from "../../../../types/resume";
import { Input, Section } from "../common";

interface EditorPersonalSectionProps {
  data: ResumeData;
  openSection: EditorPanelState["openSection"];
  toggle: EditorPanelState["toggle"];
  state: EditorPanelState;
}

const GroupLabel: React.FC<{
  children: React.ReactNode;
  rightText?: string;
}> = ({ children, rightText }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[12px] font-bold text-gray-800 tracking-tight">
      {children}
    </span>
    <div className="flex-1 h-px bg-gray-100" />
    {rightText && (
      <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
        {rightText}
      </span>
    )}
  </div>
);

const EditorPersonalSection: React.FC<EditorPersonalSectionProps> = ({
  data,
  openSection,
  toggle,
  state,
}) => (
  <Section
    sectionId="personal"
    icon={<FiUser />}
    label="Profile"
    isOpen={openSection === "personal"}
    onToggle={() => toggle("personal")}
  >
    <div className="space-y-7 pt-1 pb-2">
      <div className="space-y-3">
        <Input
          label="Full Name"
          placeholder="e.g. Alex Morgan"
          value={data.personalInfo.fullName}
          onChange={(value) => state.onPersonalInfoChange("fullName", value)}
        />
        <Input
          label="Job Title"
          placeholder="e.g. Senior Product Designer"
          value={data.personalInfo.jobTitle}
          onChange={(value) => state.onPersonalInfoChange("jobTitle", value)}
        />
      </div>

      <div>
        <GroupLabel>Contact</GroupLabel>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              placeholder="you@email.com"
              value={data.personalInfo.email}
              onChange={(value) => state.onPersonalInfoChange("email", value)}
            />
            <Input
              label="Phone"
              placeholder="+1 000 000"
              value={data.personalInfo.phone}
              onChange={(value) => state.onPersonalInfoChange("phone", value)}
            />
          </div>
          <Input
            label="Location"
            placeholder="e.g. San Francisco, CA"
            value={data.personalInfo.location}
            onChange={(value) => state.onPersonalInfoChange("location", value)}
          />
          <Input
            label="Portfolio"
            placeholder="yoursite.com"
            value={data.personalInfo.website}
            onChange={(value) => state.onPersonalInfoChange("website", value)}
          />
        </div>
      </div>

      <div>
        <GroupLabel
          rightText={
            data.personalInfo.links.length > 0
              ? `${data.personalInfo.links.length} added`
              : undefined
          }
        >
          Social Links
        </GroupLabel>

        {data.personalInfo.links.length > 0 && (
          <div className="space-y-2 mb-3">
            {data.personalInfo.links.map((link) => (
              <div
                key={link.id}
                className="group flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:shadow-sm focus-within:border-gray-300 focus-within:ring-4 focus-within:ring-gray-50 transition-all duration-200"
              >
                <div className="bg-gray-50 p-1.5 rounded-lg text-gray-400">
                  <FiLink size={12} className="shrink-0" />
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) =>
                      state.updateLink(link.id, "label", e.target.value)
                    }
                    placeholder="Platform (e.g. LinkedIn)"
                    className="min-w-0 w-full text-[12.5px] font-medium text-gray-800 placeholder:text-gray-300 bg-transparent focus:outline-none"
                  />
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) =>
                      state.updateLink(link.id, "url", e.target.value)
                    }
                    placeholder="https://..."
                    className="min-w-0 w-full text-[12px] text-gray-500 placeholder:text-gray-300 bg-transparent focus:outline-none truncate"
                  />
                </div>
                <button
                  onClick={() => state.removeLink(link.id)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                  title="Remove link"
                >
                  <FiX size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl px-3.5 py-2.5 hover:border-gray-300 hover:bg-white focus-within:bg-white focus-within:border-gray-300 focus-within:ring-4 focus-within:ring-gray-50 transition-all duration-200 group">
          <div className="bg-white border border-gray-100 shadow-sm p-1.5 rounded-lg text-gray-300 group-hover:text-gray-400 group-focus-within:text-gray-600 transition-colors">
            <FiLink size={12} className="shrink-0" />
          </div>
          <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
            <input
              type="text"
              value={state.newLinkLabel}
              onChange={(e) => state.setNewLinkLabel(e.target.value)}
              placeholder="Label (e.g. GitHub)"
              className="min-w-0 w-full text-[12.5px] font-medium text-gray-800 placeholder:text-gray-400 bg-transparent focus:outline-none"
            />
            <input
              type="text"
              value={state.newLinkUrl}
              onChange={(e) => state.setNewLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  state.addLink();
                }
              }}
              placeholder="https://..."
              className="min-w-0 w-full text-[12px] text-gray-500 placeholder:text-gray-400 bg-transparent focus:outline-none"
            />
          </div>
          <button
            onClick={state.addLink}
            disabled={!state.newLinkLabel.trim() || !state.newLinkUrl.trim()}
            className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-all shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiPlus size={13} />
          </button>
        </div>

        <p className="mt-2.5 text-[10.5px] text-gray-400 flex items-center gap-1.5 pl-1">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-sans font-medium text-gray-500 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
            Return
          </kbd>
          <span>to save</span>
        </p>
      </div>
    </div>
  </Section>
);

export default EditorPersonalSection;
