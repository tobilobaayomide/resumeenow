import React from 'react';
import { FiEdit3 } from 'react-icons/fi';
import type { CareerProfileHeroProps } from '../../../types/dashboard';

const CareerProfileHero: React.FC<CareerProfileHeroProps> = ({
  isEditing,
  saving,
  hasUnsavedChanges,
  fullName,
  headline,
  onStartEditing,
  onDiscard,
  onSave,
  onFullNameChange,
  onHeadlineChange,
}) => (
  <div className="relative h-56 md:h-64 bg-linear-to-b from-white via-[#fbfbfb] to-[#f5f5f5] border-b border-gray-200 overflow-visible">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(17,24,39,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,24,39,0.04)_1px,transparent_1px)] bg-size-[36px_36px] opacity-35" />

    <div className="absolute top-11 right-4 md:top-8 md:right-12 z-20">
      {!isEditing ? (
        <button
          onClick={onStartEditing}
          className="bg-white border border-gray-300 text-black px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs font-medium shadow-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <FiEdit3 /> <span className="hidden sm:inline">Edit Profile</span>
        </button>
      ) : (
        <div className="hidden md:flex gap-2">
          <button
            onClick={onDiscard}
            className="bg-white border border-gray-300 text-gray-600 px-3 py-1.5 md:py-2 rounded-xl text-xs font-medium hover:text-black"
          >
            Discard
          </button>
          <button
            onClick={onSave}
            disabled={saving || !hasUnsavedChanges}
            className="bg-black text-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      )}
    </div>

    <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 lg:px-12 pb-4 md:pb-8 translate-y-[45%] md:translate-y-1/2 flex items-end justify-between">
      <div className="flex items-end gap-4 md:gap-6 w-full">
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white border border-gray-200 shadow-[0_20px_35px_-30px_rgba(15,23,42,0.65)] p-1.5 shrink-0 flex items-center justify-center">
          <div className="w-full h-full bg-black text-white rounded-xl flex items-center justify-center text-3xl md:text-4xl font-medium uppercase">
            {fullName.charAt(0) || 'U'}
          </div>
        </div>
        <div className="mb-1 md:mb-2 space-y-1 md:space-y-2 w-full max-w-lg">
          {isEditing ? (
            <>
              <input
                value={fullName}
                onChange={(event) => onFullNameChange(event.target.value)}
                placeholder="Full Name"
                className="block text-xl md:text-3xl font-medium text-black bg-white/50 border-b-2 border-black outline-none w-full py-1"
              />
              <input
                value={headline}
                onChange={(event) => onHeadlineChange(event.target.value)}
                placeholder="Headline"
                className="block text-sm md:text-lg text-gray-600 font-light bg-white/50 border-b-2 border-gray-300 focus:border-black outline-none w-full py-1"
              />
            </>
          ) : (
            <>
              <h1 className="text-xl md:text-[2rem] font-semibold text-black tracking-tight truncate">
                {fullName || 'New User'}
              </h1>
              <p className="text-sm md:text-lg text-gray-600 font-light">
                {headline || 'Add a professional headline'}
              </p>
            </>
          )}
          {hasUnsavedChanges && (
            <span className="inline-flex items-center rounded-full bg-black text-white text-[10px] px-2.5 py-1 font-semibold tracking-wide uppercase">
              Unsaved changes
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default CareerProfileHero;
