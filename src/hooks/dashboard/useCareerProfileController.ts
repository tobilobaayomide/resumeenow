import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { EMPTY_CAREER_PROFILE } from '../../data/dashboard';
import {
  createEmptyEducationItem,
  createEmptyExperienceItem,
  getCareerProfileCompletionItems,
  getFallbackCareerProfile,
  getHydratedCareerProfile,
} from '../../lib/dashboard/careerProfile';
import { getErrorMessage } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import type { CareerProfileState, UseCareerProfileControllerArgs, UseCareerProfileControllerResult } from '../../types/dashboard';

export const useCareerProfileController = ({
  user,
}: UseCareerProfileControllerArgs): UseCareerProfileControllerResult => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedProfile, setSavedProfile] = useState<CareerProfileState | null>(null);
  const [activeModal, setActiveModal] = useState<'experience' | 'education' | null>(null);
  const [newExp, setNewExp] = useState(() => createEmptyExperienceItem());
  const [newEdu, setNewEdu] = useState(() => createEmptyEducationItem());
  const [newSkill, setNewSkill] = useState('');
  const [profile, setProfile] = useState<CareerProfileState>(EMPTY_CAREER_PROFILE);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const nextProfile = data
          ? getHydratedCareerProfile(data, user)
          : getFallbackCareerProfile(user);

        setProfile(nextProfile);
        setSavedProfile(nextProfile);
        setHasUnsavedChanges(false);
        setIsEditing(false);
      } catch {
        toast.error('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [user]);

  const handleSave = async (updatedProfile: CareerProfileState = profile, showToast = true) => {
    if (!user) return;
    setSaving(true);
    try {
      const updates = {
        id: user.id,
        full_name: updatedProfile.full_name,
        headline: updatedProfile.headline,
        location: updatedProfile.location,
        phone: updatedProfile.phone,
        website: updatedProfile.website,
        bio: updatedProfile.bio,
        experience: updatedProfile.experience,
        education: updatedProfile.education,
        skills: updatedProfile.skills,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').upsert(updates).select();
      if (error) throw error;
      setSavedProfile(updatedProfile);
      setHasUnsavedChanges(false);
      setIsEditing(false);
      if (showToast) toast.success('Profile saved successfully!');
    } catch (error: unknown) {
      toast.error(`Error saving: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const changeField = <K extends keyof CareerProfileState>(
    field: K,
    value: CareerProfileState[K],
  ) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const discardChanges = () => {
    if (savedProfile) {
      setProfile(savedProfile);
    }
    setHasUnsavedChanges(false);
    setIsEditing(false);
    setActiveModal(null);
    setNewSkill('');
  };

  const completionItems = useMemo(() => getCareerProfileCompletionItems(profile), [profile]);
  const completedItemsCount = completionItems.filter((item) => item.done).length;
  const completionPercent = Math.round((completedItemsCount / completionItems.length) * 100);
  const missingItems = completionItems.filter((item) => !item.done).slice(0, 3);

  const addExperience = () => {
    const updatedProfile = {
      ...profile,
      experience: [...profile.experience, { ...newExp, id: Date.now().toString() }],
    };
    setProfile(updatedProfile);
    setHasUnsavedChanges(true);
    toast.success('Experience added. Save changes to apply.');
    setActiveModal(null);
    setNewExp(createEmptyExperienceItem());
  };

  const deleteExperience = (id: string) => {
    toast('Delete this role?', {
      action: {
        label: 'Delete',
        onClick: () => {
          const updatedProfile = {
            ...profile,
            experience: profile.experience.filter((item) => item.id !== id),
          };
          setProfile(updatedProfile);
          setHasUnsavedChanges(true);
          toast.success('Role removed. Save changes to apply.');
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const addEducation = () => {
    const updatedProfile = {
      ...profile,
      education: [...profile.education, { ...newEdu, id: Date.now().toString() }],
    };
    setProfile(updatedProfile);
    setHasUnsavedChanges(true);
    toast.success('Education added. Save changes to apply.');
    setActiveModal(null);
    setNewEdu(createEmptyEducationItem());
  };

  const deleteEducation = (id: string) => {
    toast('Delete this school?', {
      action: {
        label: 'Delete',
        onClick: () => {
          const updatedProfile = {
            ...profile,
            education: profile.education.filter((item) => item.id !== id),
          };
          setProfile(updatedProfile);
          setHasUnsavedChanges(true);
          toast.success('Education removed. Save changes to apply.');
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const addSkill = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isEditing || event.key !== 'Enter') return;
    const normalizedSkill = newSkill.trim();
    if (!normalizedSkill) return;

    event.preventDefault();
    if (profile.skills.some((skill) => skill.toLowerCase() === normalizedSkill.toLowerCase())) {
      setNewSkill('');
      return;
    }

    const updatedProfile = { ...profile, skills: [...profile.skills, normalizedSkill] };
    setProfile(updatedProfile);
    setHasUnsavedChanges(true);
    setNewSkill('');
  };

  const deleteSkill = (skillToDelete: string) => {
    const updatedProfile = {
      ...profile,
      skills: profile.skills.filter((skill) => skill !== skillToDelete),
    };
    setProfile(updatedProfile);
    setHasUnsavedChanges(true);
  };

  return {
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
    startEditing: () => setIsEditing(true),
    discardChanges,
    saveProfile: () => void handleSave(profile, true),
    changeField,
    openExperienceModal: () => setActiveModal('experience'),
    openEducationModal: () => setActiveModal('education'),
    closeModal: () => setActiveModal(null),
    addExperience,
    deleteExperience,
    addEducation,
    deleteEducation,
    addSkill,
    deleteSkill,
  };
};
