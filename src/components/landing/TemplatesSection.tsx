import React from 'react';
import TemplateRenderer from '../builder/templates/TemplateRenderer';
import { PREVIEW_RESUME_DATA } from '../../domain/resume';
import {
  LANDING_TEMPLATE_ITEMS,
  isRenderableTemplate,
  type TemplateId,
} from '../../domain/templates';
import type { TemplatesSectionProps } from '../../types/landing';

const LandingTemplatePreview: React.FC<{ templateId: TemplateId }> = ({ templateId }) => {
  if (!isRenderableTemplate(templateId)) {
    return (
      <div className="absolute inset-0 bg-white p-3">
        <div className="w-full h-full rounded-sm border border-gray-200 bg-gray-50" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-linear-to-b from-white to-gray-50">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 origin-top scale-[0.36] md:scale-[0.37] pointer-events-none">
        <div className="w-198.5 h-280.75 bg-white border border-gray-200 shadow-sm p-6 overflow-hidden">
          <TemplateRenderer templateId={templateId} data={PREVIEW_RESUME_DATA} />
        </div>
      </div>
    </div>
  );
};

const TemplatesSection: React.FC<TemplatesSectionProps> = ({ onSelectTemplate }) => {
  const handleTemplateSelect = (templateId: TemplateId) => {
    onSelectTemplate?.(templateId);
  };

  return (
    <section id="templates" className="relative overflow-hidden py-24 bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,0,0,0.06),transparent_58%)]" />
      </div>

      <div className="max-w-360 mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-black/45 font-medium mb-3">Templates</p>
            <h2 className="text-3xl md:text-5xl text-gray-900 mb-4 tracking-[-0.02em] leading-[1.05]">
              Templates designed for <br />
              <span className="text-gray-400">real hiring pipelines.</span>
            </h2>
            <p className="text-gray-600 font-light leading-relaxed">
              Start with these curated layouts and switch anytime. Your content stays intact across all template styles.
            </p>
          </div>

          <a href="#get-started" className="group hidden md:inline-flex items-center gap-2 text-gray-900 font-semibold hover:text-black/70 transition-colors">
            View All Templates
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7">
          {LANDING_TEMPLATE_ITEMS.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleTemplateSelect(template.id)}
              className="group cursor-pointer flex flex-col text-left rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-xl hover:shadow-black/10 transition-all duration-300"
              aria-label={`Use ${template.name} template`}
            >
              <div className="relative w-full bg-gray-50 rounded-2xl p-6 md:p-7 flex items-center justify-center transition-colors duration-300 group-hover:bg-gray-100">
                <div className="relative w-full aspect-[1/1.414] bg-white shadow-sm border border-gray-200 rounded-sm overflow-hidden transition-all duration-300 ease-out group-hover:shadow-xl group-hover:-translate-y-1.5">
                  <LandingTemplatePreview templateId={template.id} />

                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium shadow-xl transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 inline-flex items-center gap-2">
                      Use Template
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.category}</p>
                </div>
                <span className="shrink-0 text-[10px] font-semibold tracking-[0.12em] text-gray-500 uppercase bg-gray-100 px-2.5 py-1 rounded-md">
                  {template.tag}
                </span>
              </div>

            </button>
          ))}
        </div>

        <a href="#get-started" className="mt-8 w-full md:hidden inline-flex items-center justify-center gap-2 text-gray-900 font-semibold hover:text-black/70 transition-colors py-3.5 border border-gray-200 rounded-xl">
          View All Templates
        </a>

      </div>
    </section>
  );
};

export default TemplatesSection;
