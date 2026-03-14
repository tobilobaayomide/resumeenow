import React from 'react';
import { useAuth } from '../../context/useAuth';
import { useCareerProfileController } from '../../hooks/dashboard';
import Sidebar from './Sidebar';
import {
  CareerProfileEducationModal,
  CareerProfileExperienceModal, 
  CareerProfileHero,
  CareerProfileLoading,
  CareerProfileMainContent,
  CareerProfileMobileActions,
  CareerProfileSidebar,
} from './career-profile/index';

const CareerProfile: React.FC = () => {
  const { user } = useAuth();
  const {
    loading,
    saving,
    isEditing,
    hasUnsavedChanges,
    profile,
    newExp,
    newEdu,
    newSkill,
    activeModal,
    completionPercent,
    missingItems,
    setNewExp,
    setNewEdu,
    setNewSkill,
    startEditing,
    discardChanges,
    saveProfile,
    changeField,
    openExperienceModal,
    openEducationModal,
    closeModal,
    addExperience,
    deleteExperience,
    addEducation,
    deleteEducation,
    addSkill,
    deleteSkill,
  } = useCareerProfileController({ user });

  const sectionCardClasses =
    'group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 md:p-6 shadow-[0_14px_30px_-28px_rgba(17,24,39,0.35)]';
  const cardTopAccent =
    'absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex font-sans">
        <Sidebar />
        <CareerProfileLoading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-[#ffffff] via-[#fcfcfc] to-[#f7f7f8] flex font-sans text-[#1a1a1a] selection:bg-black selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen relative w-full overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-32 md:pb-12">
          <CareerProfileHero
            isEditing={isEditing}
            saving={saving}
            hasUnsavedChanges={hasUnsavedChanges}
            fullName={profile.full_name}
            headline={profile.headline}
            onStartEditing={startEditing}
            onDiscard={discardChanges}
            onSave={saveProfile}
            onFullNameChange={(value) => changeField('full_name', value)}
            onHeadlineChange={(value) => changeField('headline', value)}
          />

          <main className="px-4 md:px-8 lg:px-12 pt-24 md:pt-28 pb-12 mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
            <CareerProfileSidebar
              isEditing={isEditing}
              email={user?.email || ''}
              profile={profile}
              completionPercent={completionPercent}
              missingItems={missingItems}
              newSkill={newSkill}
              sectionCardClasses={sectionCardClasses}
              cardTopAccent={cardTopAccent}
              onChangeField={changeField}
              onNewSkillChange={setNewSkill}
              onAddSkill={addSkill}
              onDeleteSkill={deleteSkill}
            />

            <CareerProfileMainContent
              isEditing={isEditing}
              profile={profile}
              sectionCardClasses={sectionCardClasses}
              cardTopAccent={cardTopAccent}
              onChangeField={changeField}
              onOpenExperienceModal={openExperienceModal}
              onOpenEducationModal={openEducationModal}
              onDeleteExperience={deleteExperience}
              onDeleteEducation={deleteEducation}
            />
          </main>
        </div>

        {isEditing && (
          <CareerProfileMobileActions
            saving={saving}
            hasUnsavedChanges={hasUnsavedChanges}
            onDiscard={discardChanges}
            onSave={saveProfile}
          />
        )}

        <CareerProfileExperienceModal
          open={activeModal === 'experience'}
          value={newExp}
          onClose={closeModal}
          onChange={setNewExp}
          onAdd={addExperience}
        />

        <CareerProfileEducationModal
          open={activeModal === 'education'}
          value={newEdu}
          onClose={closeModal}
          onChange={setNewEdu}
          onAdd={addEducation}
        />
      </div>
    </div>
  );
};

export default CareerProfile;
