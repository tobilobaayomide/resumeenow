import React from 'react';
import { FiMoreVertical, FiPlus, FiTrash2 } from 'react-icons/fi';
import type { MyResumesGridViewProps } from '../../../types/dashboard';
import ResumeCardPreview from './ResumeCardPreview';

const MyResumesGridView: React.FC<MyResumesGridViewProps> = ({
  resumes,
  onOpenResume,
  onDeleteResume,
  onOpenActionMenu,
  onCreateResume,
}) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
    {resumes.map((resume) => (
      <div
        key={resume.id}
        className="group flex flex-col gap-2 md:gap-3 cursor-pointer"
        onClick={() => onOpenResume(resume)}
      >
        <div className="relative aspect-[1/1.41] bg-white border border-gray-100 rounded-lg shadow-sm group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden">
          <ResumeCardPreview resume={resume} />

          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 md:gap-3">
            <button
              onClick={(event) => {
                event.stopPropagation();
                onOpenResume(resume);
              }}
              className="bg-white text-black px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs font-bold hover:scale-105 transition-transform"
            >
              Edit
            </button>
            <div className="flex gap-2">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteResume(resume.id);
                }}
                className="p-1.5 md:p-2 bg-white/10 text-white rounded-full hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors border border-white/20"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-start px-1">
          <div className="flex-1 min-w-0 pr-1">
            <h3 className="font-medium text-xs md:text-sm text-gray-900 group-hover:text-black transition-colors truncate w-full">
              {resume.title || 'Untitled Resume'}
            </h3>
            <p className="text-[9px] md:text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
              {new Date(resume.updated_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onOpenActionMenu(resume);
            }}
            className="text-gray-300 hover:text-black transition-colors shrink-0 md:hidden"
            title="More actions"
          >
            <FiMoreVertical size={14} />
          </button>
        </div>
      </div>
    ))}

    <button
      onClick={onCreateResume}
      className="aspect-[1/1.41] border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black hover:bg-gray-50 transition-all duration-300 group"
    >
      <div className="p-2 md:p-3 rounded-full border border-gray-100 group-hover:border-black/10 mb-2 transition-colors">
        <FiPlus size={20} className="md:w-6 md:h-6" />
      </div>
      <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider">New Resume</span>
    </button>
  </div>
);

export default MyResumesGridView;
