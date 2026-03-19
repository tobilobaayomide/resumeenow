import React from 'react';
import { FiX, FiLayout, FiUploadCloud } from 'react-icons/fi';
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
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-[0.98] duration-300">
        
        <div className="px-6 md:px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
              {pendingUploadFile ? <FiUploadCloud size={20} className="text-blue-500" /> : <FiLayout size={20} className="text-indigo-500" />}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                Template Gallery
              </p>
              <h2 className="text-[20px] font-bold text-gray-900 tracking-tight leading-none mb-1">
                {pendingUploadFile ? 'Choose an import layout' : 'Select a starting point'}
              </h2>
              <p className="text-[13px] text-gray-500 leading-none">
                {pendingUploadFile
                  ? `Applying your data to a new design.`
                  : 'You can easily switch designs later in the editor.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all flex items-center justify-center"
            aria-label="Close template picker"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-6 md:p-8 bg-slate-50/50 overflow-y-auto flex-1 no-scrollbar mask-edges-vertical">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {templates.map((template) => (
              <div key={template.id} className="flex flex-col">
                <button
                  onClick={() => onSelectTemplate(template.id)}
                  className="group relative flex flex-col items-center text-left transition-all duration-300 focus:outline-none"
                >
                  <div
                    className={`
                      aspect-[1/1.414] w-full rounded-xl bg-white border border-gray-200 overflow-hidden relative
                      ${template.color} transition-all duration-500 ease-out
                      group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] group-hover:border-gray-300
                      group-focus-visible:ring-4 group-focus-visible:ring-indigo-500 group-focus-visible:ring-offset-2 group-focus-visible:-translate-y-2
                    `}
                  >
                    <div className="absolute inset-0 bg-white">
                      <TemplateModalPreview templateId={template.id} mode="card" />
                    </div>

                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <span className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-[12.5px] font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out border border-gray-800">
                        Use Template
                      </span>
                    </div>
                  </div>
                </button>
                
                <div className="mt-4 text-center">
                  <h3 className="font-bold text-[14px] text-gray-900 tracking-tight">{template.name}</h3>
                  <p className="text-[12px] text-gray-500 mt-0.5">{template.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TemplatePickerModal;
