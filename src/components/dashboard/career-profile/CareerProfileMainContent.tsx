import React from 'react';
import { FiBook, FiBriefcase, FiPlus, FiTrash2, FiUser } from 'react-icons/fi';
import type { CareerProfileMainContentProps } from '../../../types/dashboard';

const CareerProfileMainContent: React.FC<CareerProfileMainContentProps> = ({
  isEditing,
  profile,
  sectionCardClasses,
  cardTopAccent,
  onChangeField,
  onOpenExperienceModal,
  onOpenEducationModal,
  onDeleteExperience,
  onDeleteEducation,
}) => (
  <div className="col-span-1 md:col-span-8 space-y-10 md:space-y-12">
    <section className={sectionCardClasses}>
      <div className={cardTopAccent} />
      <div className="flex justify-between items-center mb-3 md:mb-4 border-b border-gray-100 pb-2">
        <h2 className="text-lg font-medium text-black flex items-center gap-2">
          <FiUser className="text-gray-400" /> About
        </h2>
      </div>
      {isEditing ? (
        <textarea
          className="w-full p-4 border rounded-xl text-gray-700 min-h-30 outline-none font-light border-gray-300 focus:border-black resize-y text-sm md:text-base"
          value={profile.bio}
          onChange={(event) => onChangeField('bio', event.target.value)}
        />
      ) : (
        <p className="text-sm md:text-base text-gray-700 leading-relaxed font-light whitespace-pre-wrap">
          {profile.bio || 'No bio added yet.'}
        </p>
      )}
    </section>

    <section className={sectionCardClasses}>
      <div className={cardTopAccent} />
      <div className="flex justify-between items-end mb-4 md:mb-6 border-b border-gray-100 pb-2">
        <h2 className="text-lg font-medium text-black flex items-center gap-2">
          <FiBriefcase className="text-gray-400" /> Experience
        </h2>
        <button
          onClick={onOpenExperienceModal}
          disabled={!isEditing}
          className="text-xs font-medium bg-white border border-gray-300 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
        >
          <FiPlus /> Add
        </button>
      </div>
      {profile.experience.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-5 text-center">
          <p className="text-sm text-gray-500 mb-2">No experience listed yet.</p>
          <p className="text-xs text-gray-400 mb-4">
            Add roles to improve profile strength and resume quality.
          </p>
          {isEditing && (
            <button
              onClick={onOpenExperienceModal}
              className="text-xs bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors"
            >
              Add your first role
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6 md:space-y-8 border-l border-gray-200/80 ml-1 pl-4 md:pl-5">
          {profile.experience.map((exp) => (
            <div key={exp.id} className="relative group pr-8">
              <span className="absolute -left-5.5 top-1.5 h-2.5 w-2.5 rounded-full bg-gray-600" />
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">{exp.role}</h3>
              <div className="text-xs md:text-sm font-normal text-gray-500 mb-2">
                {exp.company} • {exp.startDate}
                {exp.endDate ? ` - ${exp.endDate}` : ''}
              </div>
              <p className="text-xs font-extralight md:text-sm text-gray-600 leading-relaxed">
                {exp.description}
              </p>
              {isEditing && (
                <button
                  onClick={() => onDeleteExperience(exp.id)}
                  className="absolute top-0 right-0 text-gray-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <FiTrash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>

    <section className={sectionCardClasses}>
      <div className={cardTopAccent} />
      <div className="flex justify-between items-end mb-4 md:mb-6 border-b border-gray-100 pb-2">
        <h2 className="text-lg font-medium text-black flex items-center gap-2">
          <FiBook className="text-gray-400" /> Education
        </h2>
        <button
          onClick={onOpenEducationModal}
          disabled={!isEditing}
          className="text-xs font-medium bg-white border border-gray-300 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
        >
          <FiPlus /> Add
        </button>
      </div>
      {profile.education.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-5 text-center">
          <p className="text-sm text-gray-500 mb-2">No education listed yet.</p>
          <p className="text-xs text-gray-400 mb-4">
            Include your studies to make your profile more complete.
          </p>
          {isEditing && (
            <button
              onClick={onOpenEducationModal}
              className="text-xs bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors"
            >
              Add education
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5 md:space-y-6 border-l border-gray-200/80 ml-1 pl-4 md:pl-5">
          {profile.education.map((edu) => (
            <div key={edu.id} className="relative group flex items-start gap-3 md:gap-4 pr-8">
              <span className="absolute -left-5.5 top-3 h-2.5 w-2.5 rounded-full bg-gray-600" />
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-base md:text-lg font-medium shrink-0">
                {edu.school.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm md:text-base">{edu.school}</h3>
                <div className="text-xs font-light md:text-sm text-gray-600">{edu.degree}</div>
                <div className="text-[10px] font-light md:text-xs text-gray-400 mt-0.5">
                  {edu.startDate}
                  {edu.endDate ? ` - ${edu.endDate}` : ''}
                </div>
              </div>
              {isEditing && (
                <button
                  onClick={() => onDeleteEducation(edu.id)}
                  className="absolute top-0 right-0 text-gray-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <FiTrash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  </div>
);

export default CareerProfileMainContent;
