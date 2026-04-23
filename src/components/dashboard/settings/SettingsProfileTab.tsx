import React from 'react';
import { FiUpload } from 'react-icons/fi';
import type { SettingsProfileTabProps } from '../../../types/dashboard';

const SettingsProfileTab: React.FC<SettingsProfileTabProps> = ({
  firstName,
  lastName,
  bio,
  avatarUrl,
  fileInputRef,
  saving,
  hasUnsavedChanges,
  onFirstNameChange,
  onLastNameChange,
  onBioChange,
  onAvatarUpload,
  onReset,
  onSave,
}) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative group w-24 h-24 shrink-0">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-50 shadow-inner bg-gray-100 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-gray-300">
                {firstName.charAt(0)}
                {lastName.charAt(0)}
              </span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full shadow-lg border-2 border-white hover:scale-105 transition-transform"
            title="Upload new photo"
          >
            <FiUpload size={14} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png,image/jpeg,image/webp"
            onChange={onAvatarUpload}
          />
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
          <p className="text-sm font-light text-gray-500 max-w-xs">
            This image will be displayed on your profile and shared resumes.
          </p>
          <p className="text-xs font-light text-gray-400 max-w-xs">
            PNG, JPEG, or WebP only. Maximum file size: 2 MB.
          </p>
        </div>
      </div>
    </section>

    <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 p-6 md:px-8 md:py-6 bg-gray-50/50">
        <h3 className="font-semibold text-gray-900">Personal Information</h3>
        <p className="text-xs font-light text-gray-500 mt-1">Update your personal details here.</p>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide ml-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(event) => onFirstNameChange(event.target.value)}
              className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-light focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
              placeholder="e.g. Jane"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide ml-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(event) => onLastNameChange(event.target.value)}
              className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-light focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
              placeholder="e.g. Doe"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide ml-1">
            Bio / Headline
          </label>
          <textarea
            value={bio}
            onChange={(event) => onBioChange(event.target.value)}
            className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-light focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all min-h-28 resize-none"
            placeholder="Tell us a little bit about yourself..."
            maxLength={240}
          />
          <div className="flex justify-end">
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
              {bio.length} / 240
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 md:px-8 border-t border-gray-100 flex justify-end gap-3">
        <button
          onClick={onReset}
          disabled={!hasUnsavedChanges}
          className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black hover:bg-gray-200/50 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving || !hasUnsavedChanges}
          className="bg-black text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-black/20 hover:shadow-black/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </section>
  </div>
);

export default SettingsProfileTab;
