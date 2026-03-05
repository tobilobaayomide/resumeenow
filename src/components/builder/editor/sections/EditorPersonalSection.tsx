import React from 'react';
import { FiLink, FiPlus, FiUser, FiX } from 'react-icons/fi';
import type { EditorPanelState } from '../useEditorPanelState';
import type { ResumeData } from '../../../../types/resume';
import { Input, Section } from '../common';

interface EditorPersonalSectionProps {
  data: ResumeData;
  openSection: EditorPanelState['openSection'];
  toggle: EditorPanelState['toggle'];
  state: EditorPanelState;
}

const EditorPersonalSection: React.FC<EditorPersonalSectionProps> = ({
  data,
  openSection,
  toggle,
  state,
}) => (
  <Section
    sectionId="personal"
    icon={<FiUser />}
    label="Personal Details"
    isOpen={openSection === 'personal'}
    onToggle={() => toggle('personal')}
  >
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Input
            label="Full Name"
            placeholder="e.g. Alex Morgan"
            value={data.personalInfo.fullName}
            onChange={(value) => state.onPersonalInfoChange('fullName', value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Job Title"
            placeholder="e.g. Senior Product Designer"
            value={data.personalInfo.jobTitle}
            onChange={(value) => state.onPersonalInfoChange('jobTitle', value)}
          />
        </div>
        <Input
          label="Email"
            placeholder="you@email.com"
            value={data.personalInfo.email}
            onChange={(value) => state.onPersonalInfoChange('email', value)}
        />
        <Input
          label="Phone"
            placeholder="+1 000 000"
            value={data.personalInfo.phone}
            onChange={(value) => state.onPersonalInfoChange('phone', value)}
        />
        <div className="sm:col-span-2">
          <Input
            label="Location"
            placeholder="e.g. San Francisco, CA"
            value={data.personalInfo.location}
            onChange={(value) => state.onPersonalInfoChange('location', value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Portfolio"
            placeholder="yoursite.com"
            value={data.personalInfo.website}
            onChange={(value) => state.onPersonalInfoChange('website', value)}
          />
        </div>

        <div className="sm:col-span-2 border border-[#E4E8F0] rounded-xl p-3 bg-[#F8FAFD] space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-semibold text-gray-500">
              Additional Links
            </label>
            <span className="text-[10px] text-gray-400">{data.personalInfo.links.length}</span>
          </div>

          {data.personalInfo.links.length > 0 && (
            <div className="space-y-2">
              {data.personalInfo.links.map((link) => (
                <div
                  key={link.id}
                  className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center"
                >
                  <input
                    id={`link-label-${link.id}`}
                    name={`link-label-${link.id}`}
                    type="text"
                    value={link.label}
                    onChange={(event) => state.updateLink(link.id, 'label', event.target.value)}
                    placeholder="Label (GitHub)"
                    className="min-w-0 w-full px-2.5 py-2 bg-white border border-[#E4E8F0] rounded-lg text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40 focus:ring-2 focus:ring-[#0F172A]/10"
                  />
                  <input
                    id={`link-url-${link.id}`}
                    name={`link-url-${link.id}`}
                    type="text"
                    value={link.url}
                    onChange={(event) => state.updateLink(link.id, 'url', event.target.value)}
                    placeholder="https://github.com/you"
                    className="min-w-0 w-full px-2.5 py-2 bg-white border border-[#E4E8F0] rounded-lg text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40 focus:ring-2 focus:ring-[#0F172A]/10"
                  />
                  <button
                    onClick={() => state.removeLink(link.id)}
                    className="w-8 h-8 rounded-lg border border-[#E4E8F0] bg-white text-gray-300 hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center justify-self-start sm:justify-self-auto"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center">
            <div className="relative min-w-0">
              <FiLink className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" size={11} />
              <input
                id="new-link-label"
                name="new-link-label"
                type="text"
                value={state.newLinkLabel}
                onChange={(event) => state.setNewLinkLabel(event.target.value)}
                placeholder="Label (optional)"
                className="min-w-0 w-full pl-7 pr-2.5 py-2 bg-white border border-[#E4E8F0] rounded-lg text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40 focus:ring-2 focus:ring-[#0F172A]/10"
              />
            </div>
            <input
              id="new-link-url"
              name="new-link-url"
              type="text"
              value={state.newLinkUrl}
              onChange={(event) => state.setNewLinkUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  state.addLink();
                }
              }}
              placeholder="https://..."
              className="min-w-0 w-full px-2.5 py-2 bg-white border border-[#E4E8F0] rounded-lg text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40 focus:ring-2 focus:ring-[#0F172A]/10"
            />
            <button
              onClick={state.addLink}
              className="w-8 h-8 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center justify-self-start sm:justify-self-auto"
            >
              <FiPlus size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Section>
);

export default EditorPersonalSection;
