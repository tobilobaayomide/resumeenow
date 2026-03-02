import React from 'react';
import { FiCopy, FiEdit3, FiTrash2, FiX } from 'react-icons/fi';
import type { ResumeActionSheetProps } from '../../../types/dashboard';

const ResumeActionSheet: React.FC<ResumeActionSheetProps> = ({
  resume,
  onClose,
  onOpenResume,
  onDuplicateResume,
  onDeleteResume,
}) => {
  if (!resume) return null;

  return (
    <div
      className="fixed inset-0 z-90 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full md:max-w-sm rounded-t-2xl md:rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Resume Actions
            </p>
            <h3 className="text-sm font-semibold text-gray-900 truncate mt-0.5">
              {resume.title || 'Untitled Resume'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              onOpenResume(resume);
              onClose();
            }}
            className="w-full h-11 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:border-gray-300 inline-flex items-center justify-center gap-2"
          >
            <FiEdit3 size={14} />
            Edit Resume
          </button>

          <button
            onClick={() => {
              onDuplicateResume(resume);
              onClose();
            }}
            className="w-full h-11 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:border-gray-300 inline-flex items-center justify-center gap-2"
          >
            <FiCopy size={14} />
            Duplicate
          </button>

          <button
            onClick={() => {
              onDeleteResume(resume.id);
              onClose();
            }}
            className="w-full h-11 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-100 inline-flex items-center justify-center gap-2"
          >
            <FiTrash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeActionSheet;
