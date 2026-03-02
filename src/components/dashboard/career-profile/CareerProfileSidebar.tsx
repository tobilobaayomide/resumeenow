import React from 'react';
import { FiEdit3, FiLink, FiMail, FiMapPin, FiPhone, FiX } from 'react-icons/fi';
import type { CareerProfileSidebarProps } from '../../../types/dashboard';

const CareerProfileSidebar: React.FC<CareerProfileSidebarProps> = ({
  isEditing,
  email,
  profile,
  completionPercent,
  missingItems,
  newSkill,
  sectionCardClasses,
  cardTopAccent,
  onChangeField,
  onNewSkillChange,
  onAddSkill,
  onDeleteSkill,
}) => (
  <div className="col-span-1 md:col-span-4 space-y-6 md:space-y-8">
    <div className={sectionCardClasses}>
      <div className={cardTopAccent} />
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500">
          Profile Strength
        </h3>
        <span className="text-sm font-semibold text-black">{completionPercent}%</span>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-4 mb-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 mb-2">Completion</p>
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-black/85 transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-600">
          A complete profile improves resume quality and template suggestions.
        </p>
      </div>
      {missingItems.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400 font-medium">
            Still missing
          </p>
          {missingItems.map((item) => (
            <p key={item.label} className="text-xs text-gray-700 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> {item.label}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-700">Everything looks complete. Great profile quality.</p>
      )}
    </div>

    <div className={sectionCardClasses}>
      <div className={cardTopAccent} />
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500">Contact</h3>
        {!isEditing && <FiEdit3 size={14} className="text-gray-300" />}
      </div>
      <ul className="space-y-2.5 text-sm font-light text-gray-700">
        <li className="flex items-center gap-3 overflow-hidden rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2.5">
          <FiMail className="text-gray-400 shrink-0" /> <span className="truncate">{email}</span>
        </li>
        <li className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2.5">
          <FiPhone className="text-gray-400 shrink-0" />
          {isEditing ? (
            <input
              className="border-b border-gray-300 focus:border-black w-full outline-none bg-transparent"
              value={profile.phone}
              onChange={(event) => onChangeField('phone', event.target.value)}
              placeholder="Add phone number"
            />
          ) : (
            <span className="truncate">{profile.phone || 'No phone'}</span>
          )}
        </li>
        <li className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2.5">
          <FiMapPin className="text-gray-400 shrink-0" />
          {isEditing ? (
            <input
              className="border-b border-gray-300 focus:border-black w-full outline-none bg-transparent"
              value={profile.location}
              onChange={(event) => onChangeField('location', event.target.value)}
              placeholder="Add location"
            />
          ) : (
            <span className="truncate">{profile.location || 'No location'}</span>
          )}
        </li>
        <li className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2.5">
          <FiLink className="text-gray-400 shrink-0" />
          {isEditing ? (
            <input
              className="border-b border-gray-300 focus:border-black w-full outline-none bg-transparent"
              value={profile.website}
              onChange={(event) => onChangeField('website', event.target.value)}
              placeholder="Add website"
            />
          ) : profile.website ? (
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              className="border-b border-black/20 truncate hover:text-black transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              {profile.website}
            </a>
          ) : (
            <span className="truncate">No website</span>
          )}
        </li>
      </ul>
    </div>

    <div className={sectionCardClasses}>
      <div className={cardTopAccent} />
      <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500 mb-4">Skills</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {profile.skills.map((skill, idx) => (
          <span
            key={idx}
            className="bg-white border border-gray-300 text-gray-800 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 group shadow-[0_4px_10px_-8px_rgba(0,0,0,0.5)]"
          >
            {skill}
            {isEditing && (
              <button onClick={() => onDeleteSkill(skill)} className="text-gray-400 hover:text-red-500">
                <FiX size={12} />
              </button>
            )}
          </span>
        ))}
      </div>
      {isEditing ? (
        <input
          type="text"
          placeholder="Add skill and press Enter"
          className="w-full text-sm border-b border-gray-300 focus:border-black outline-none py-1 bg-transparent"
          value={newSkill}
          onChange={(event) => onNewSkillChange(event.target.value)}
          onKeyDown={onAddSkill}
        />
      ) : (
        <p className="text-xs text-gray-400">Enable edit mode to manage skills.</p>
      )}
    </div>
  </div>
);

export default CareerProfileSidebar;
