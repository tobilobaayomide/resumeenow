import React from 'react';
import { FiBriefcase, FiX } from 'react-icons/fi';
import type { CareerProfileExperienceModalProps } from '../../../types/dashboard';

const CareerProfileExperienceModal: React.FC<CareerProfileExperienceModalProps> = ({
  open,
  value,
  onClose,
  onChange,
  onAdd,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 transform transition-all scale-100 max-h-[90vh] flex flex-col">
        <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm md:text-base">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black text-white flex items-center justify-center text-xs md:text-sm">
              <FiBriefcase />
            </div>
            Add Experience
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors bg-white p-1.5 md:p-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-5 md:p-8 space-y-4 md:space-y-5 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Role Title
              </label>
              <input
                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                placeholder="e.g. Senior Product Designer"
                value={value.role}
                onChange={(event) => onChange({ ...value, role: event.target.value })}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                  Company
                </label>
                <input
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none transition-all"
                  placeholder="e.g. Google"
                  value={value.company}
                  onChange={(event) => onChange({ ...value, company: event.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                  Start Date
                </label>
                <input
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none transition-all"
                  placeholder="2020"
                  value={value.startDate}
                  onChange={(event) => onChange({ ...value, startDate: event.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                  End Date
                </label>
                <input
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none transition-all"
                  placeholder="Present"
                  value={value.endDate}
                  onChange={(event) => onChange({ ...value, endDate: event.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Description
              </label>
              <textarea
                className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none transition-all min-h-25 resize-none"
                placeholder="Describe your responsibilities and achievements..."
                value={value.description}
                onChange={(event) => onChange({ ...value, description: event.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="px-5 md:px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            disabled={!value.role}
            className="px-6 md:px-8 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10 transition-all"
          >
            Add Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareerProfileExperienceModal;
