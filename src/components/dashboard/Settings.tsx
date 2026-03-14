import React from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/useAuth';
import { useSettingsController } from '../../hooks/dashboard';
import Sidebar from './Sidebar';
import {
  SettingsAccountTab,
  SettingsComingSoon,
  SettingsHeader,
  SettingsLoading,
  SettingsProfileTab,
  SettingsTabNavigation,
} from './settings/index';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const {
    activeTab,
    loading,
    saving,
    fileInputRef,
    firstName,
    lastName,
    bio,
    avatarUrl,
    hasUnsavedChanges,
    setActiveTab,
    setFirstName,
    setLastName,
    setBio,
    handleAvatarUpload,
    saveProfile,
    resetForm,
  } = useSettingsController({ user });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex font-sans">
        <Sidebar />
        <SettingsLoading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex font-sans text-gray-900 selection:bg-black selection:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden w-full">
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        <SettingsHeader />

        <main className="flex-1 px-4 md:px-8 lg:px-12 py-8 md:py-10 overflow-y-auto pb-32">
          <div className=" mx-auto w-full">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
              <SettingsTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

              <div className="flex-1 min-w-0">
                {activeTab === 'profile' && (
                  <SettingsProfileTab
                    firstName={firstName}
                    lastName={lastName}
                    bio={bio}
                    avatarUrl={avatarUrl}
                    fileInputRef={fileInputRef}
                    saving={saving}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onFirstNameChange={setFirstName}
                    onLastNameChange={setLastName}
                    onBioChange={setBio}
                    onAvatarUpload={handleAvatarUpload}
                    onReset={resetForm}
                    onSave={() => {
                      void saveProfile();
                    }}
                  />
                )}

                {activeTab === 'account' && (
                  <SettingsAccountTab
                    email={user?.email || ''}
                    onDeleteAccount={() => toast.error('Action disabled in this demo.')}
                  />
                )}

                {(activeTab === 'billing' || activeTab === 'notifications') && (
                  <SettingsComingSoon activeTab={activeTab} />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
