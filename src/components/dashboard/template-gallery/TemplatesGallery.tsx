import React from 'react';
import { FiStar } from 'react-icons/fi';
import type { TemplatesGalleryProps } from '../../../types/dashboard';
import TemplateCardPreview from './TemplateCardPreview';

const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({
  templates,
  showComingSoonCard,
  activeWaitlist,
  onOpenTemplatePreview,
  onJoinWaitlist,
  onClearFilters,
}) => {
  if (templates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 md:p-12 text-center">
        <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
          No templates found
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          Try a different keyword or switch category filters.
        </p>
        <button
          onClick={onClearFilters}
          className="mt-5 h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-gray-300 hover:text-gray-900"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onOpenTemplatePreview(template)}
          className={`group flex flex-col gap-3 md:gap-4 text-left ${
            template.available ? 'cursor-pointer' : 'cursor-pointer opacity-80'
          }`}
          aria-label={`Preview ${template.name} template`}
        >
          <div
            className={`relative aspect-[1/1.41] ${template.color} rounded-xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-black/5 group-hover:-translate-y-1`}
          >
            <TemplateCardPreview template={template} />

            {template.popular && (
              <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-black/5 backdrop-blur-md px-2 md:px-3 py-1 rounded-full flex items-center gap-1 md:gap-1.5 border border-white/20">
                <FiStar size={10} className="text-black fill-black" />
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-black">
                  Popular
                </span>
              </div>
            )}
            {!template.available && (
              <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-white/80 px-2 md:px-3 py-1 rounded-full border border-gray-200">
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-700">
                  Coming Soon
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 hidden md:flex flex-col items-center justify-center gap-4 p-8 text-center">
              <h3 className="text-white font-serif text-2xl italic">{template.name}</h3>
              <p className="text-white/80 text-xs font-light mb-2">
                {template.description}
              </p>
              <span className="bg-white text-black px-6 py-3 rounded-full text-xs font-bold shadow-xl inline-flex items-center gap-2">
                Preview Template
              </span>
            </div>
          </div>

          <div className="flex justify-between items-start px-1">
            <div>
              <h3 className="font-bold text-sm text-gray-900 group-hover:text-black transition-colors">
                {template.name}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                  {template.category}
                </span>
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[9px] md:text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                  {template.layout}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-gray-500 line-clamp-2">
                {template.description}
              </p>
              <span className="md:hidden mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                Tap to preview
              </span>
            </div>
          </div>
        </button>
      ))}

      {showComingSoonCard && (
        <div className="aspect-[1/1.41] border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center p-6 md:p-8 bg-gray-50/50">
          <span className="text-xl md:text-2xl mb-2">*</span>
          <h3 className="font-bold text-xs md:text-sm text-gray-900 mb-1">
            More coming soon
          </h3>
          <p className="text-[10px] md:text-xs text-gray-500 mb-4 md:mb-6 max-w-37.5">
            We release new editorial templates every month.
          </p>
          <button
            onClick={onJoinWaitlist}
            disabled={activeWaitlist}
            className={`text-[10px] md:text-xs font-bold border-b border-black pb-0.5 transition-all ${
              activeWaitlist
                ? 'text-green-600 border-green-600'
                : 'text-black hover:text-gray-600'
            }`}
          >
            {activeWaitlist ? "You're on the list" : 'Join Waitlist'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplatesGallery;
