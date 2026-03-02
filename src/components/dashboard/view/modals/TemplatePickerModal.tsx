import React from 'react';
import { FiX } from 'react-icons/fi';
import type { TemplatePickerModalProps } from '../../../../types/dashboard';
import TemplateModalPreview from '../TemplateModalPreview';

const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  open,
  pendingUploadFile,
  templates,
  onClose,
  onSelectTemplate,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-white relative z-10">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {pendingUploadFile ? 'Choose a template for upload' : 'Pick a structure'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {pendingUploadFile
                ? `Apply "${pendingUploadFile.name}" to a template and open it in the builder.`
                : 'Select a starting point. You can change the content anytime.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-50 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-black"
            aria-label="Close template picker"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-8 bg-[#FAFAFA] overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                className="group relative flex flex-col text-left transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-1"
              >
                <div
                  className={`
                    aspect-[1/1.414] w-full rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4 relative
                    ${template.color} transition-all duration-300 group-hover:shadow-xl group-hover:border-gray-300 group-hover:shadow-black/5
                  `}
                >
                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
                    <TemplateModalPreview templateId={template.id} />
                  </div>

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      Select
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-gray-900 group-hover:text-black">{template.name}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{template.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePickerModal;
