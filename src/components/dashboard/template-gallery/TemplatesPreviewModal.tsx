import React from 'react';
import { FiX } from 'react-icons/fi';
import { isRenderableTemplate } from '../../../domain/templates';
import type { TemplatesPreviewModalProps } from '../../../types/dashboard';
import TemplateModalPreview from '../view/TemplateModalPreview';

// ─── Main Modal ───────────────────────────────────────────────────────────────
const TemplatesPreviewModal: React.FC<TemplatesPreviewModalProps> = ({
  previewTemplate,
  onClose,
  onUseTemplate,
}) => {
  if (!previewTemplate) return null;

  return (
    <div
      className="fixed inset-0 z-90 bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full h-full md:h-auto md:w-fit md:max-h-[92vh] md:max-w-5xl bg-white border border-gray-200 md:rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
              Template Preview
            </p>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mt-1">
              {previewTemplate.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-xs text-gray-500">{previewTemplate.description}</p>
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                {previewTemplate.layout}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center"
            aria-label="Close preview"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="relative min-h-0 flex-1 p-3 md:flex-none md:p-6 bg-[#F6F6F6] overflow-auto md:overflow-visible">
          {isRenderableTemplate(previewTemplate.id) ? (
            <div className="relative w-full h-full min-h-[70vh] md:h-auto md:min-h-0">
              <TemplateModalPreview templateId={previewTemplate.id} />
            </div>
          ) : (
            <div className="max-w-xl mx-auto h-full min-h-80 rounded-2xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-center p-8">
              <h4 className="text-lg font-semibold text-gray-900">
                Preview Not Available Yet
              </h4>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                This template is still in production. We&apos;ll publish an
                interactive preview as soon as it launches.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 px-4 md:px-6 py-4 border-t border-gray-100 bg-white flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-[0.12em] font-semibold self-start">
            {previewTemplate.category}
          </span>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              onClick={onClose}
              className="h-10 flex-1 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-gray-300 hover:text-gray-900 sm:flex-none"
            >
              Close
            </button>
            <button
              onClick={() => onUseTemplate(previewTemplate)}
              className={`h-10 px-5 rounded-xl text-sm font-semibold ${
                previewTemplate.available
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              } flex-1 sm:flex-none`}
              disabled={!previewTemplate.available}
            >
              {previewTemplate.available ? 'Use Template' : 'Coming Soon'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TemplatesPreviewModal;
