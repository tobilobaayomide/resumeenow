import React from 'react';
import { FiEdit3, FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import type { MyResumesListViewProps } from '../../../types/dashboard';
import ResumeCardPreview from './ResumeCardPreview';

const MyResumesListView: React.FC<MyResumesListViewProps> = ({
  resumes,
  onOpenResume,
  onDeleteResume,
  onOpenActionMenu,
}) => (
  <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
    <table className="w-full text-left border-collapse">
      <thead className="bg-[#FAFAFA] text-[10px] uppercase font-bold text-gray-400 tracking-wider">
        <tr>
          <th className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">Name</th>
          <th className="hidden sm:table-cell px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">
            Template
          </th>
          <th className="hidden md:table-cell px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">
            Last Modified
          </th>
          <th className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 text-right">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="text-xs md:text-sm">
        {resumes.map((resume) => (
          <tr
            key={resume.id}
            onClick={() => onOpenResume(resume)}
            className="group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
          >
            <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-gray-900 flex items-center gap-2 md:gap-3">
              <div className="relative w-8 h-10 bg-white border border-gray-200 rounded-sm overflow-hidden shrink-0">
                <ResumeCardPreview resume={resume} compact />
              </div>
              <div className="flex flex-col">
                <span className="truncate max-w-30 sm:max-w-50 md:max-w-62.5">
                  {resume.title || 'Untitled'}
                </span>
                <span className="text-[10px] text-gray-400 md:hidden mt-0.5">
                  {new Date(resume.updated_at).toLocaleDateString()}
                </span>
              </div>
            </td>
            <td className="hidden sm:table-cell px-4 md:px-6 py-3 md:py-4">
              <span className="px-2 py-1 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wide border bg-gray-50 text-gray-500 border-gray-100">
                {resume.template_id || 'Default'}
              </span>
            </td>
            <td className="hidden md:table-cell px-4 md:px-6 py-3 md:py-4 text-gray-500">
              {new Date(resume.updated_at).toLocaleDateString()}
            </td>
            <td className="px-4 md:px-6 py-3 md:py-4 text-right">
              <div className="hidden md:flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenResume(resume);
                  }}
                  className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-md transition-all border border-transparent hover:border-gray-200 shadow-sm hover:shadow"
                  title="Edit"
                >
                  <FiEdit3 size={14} />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteResume(resume.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-md transition-all border border-transparent hover:border-gray-200 shadow-sm hover:shadow"
                  title="Delete"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenActionMenu(resume);
                }}
                className="md:hidden p-2 text-gray-400 hover:text-black hover:bg-white rounded-md transition-all border border-transparent hover:border-gray-200"
                title="More actions"
              >
                <FiMoreVertical size={14} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default MyResumesListView;
