import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { EMPTY_CAREER_PROFILE } from '../../data/dashboard';
import {
  areCareerProfilesEqual,
  createEmptyEducationItem,
  createEmptyExperienceItem,
  getCareerProfileCompletionItems,
  getFallbackCareerProfile,
  getHydratedCareerProfile,
} from '../../lib/dashboard/careerProfile';
import { getErrorMessage } from '../../lib/errors';
import {
  fetchProfileRecord,
  getProfileQueryKey,
  PROFILE_QUERY_STALE_TIME,
  upsertProfileRecord,
} from '../../lib/queries/profile';
import { parseSelfProfileUpdate } from '../../schemas/integrations/profile';
import type { CareerProfileState, UseCareerProfileControllerArgs, UseCareerProfileControllerResult } from '../../types/dashboard';

export const useCareerProfileController = ({
  user,
}: UseCareerProfileControllerArgs): UseCareerProfileControllerResult => {
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [draftProfile, setDraftProfile] = useState<CareerProfileState | null>(null);
  const [activeModal, setActiveModal] = useState<'experience' | 'education' | null>(null);
  const [newExp, setNewExp] = useState(() => createEmptyExperienceItem());
  const [newEdu, setNewEdu] = useState(() => createEmptyEducationItem());
  const [newSkill, setNewSkill] = useState('');
  const profileQueryKey = getProfileQueryKey(userId);

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => fetchProfileRecord(userId as string),
    enabled: userId !== null,
    staleTime: PROFILE_QUERY_STALE_TIME,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (profileQuery.isError) {
      toast.error('Failed to load profile.');
    }
  }, [profileQuery.error, profileQuery.isError]);

  const serverProfile =
    user == null
      ? EMPTY_CAREER_PROFILE
      : profileQuery.data
        ? getHydratedCareerProfile(profileQuery.data, user)
        : getFallbackCareerProfile(user);
  const profile = draftProfile ?? serverProfile;
  const hasUnsavedChanges =
    draftProfile !== null && !areCareerProfilesEqual(draftProfile, serverProfile);

  const updateDraftProfile = (
    updater: (current: CareerProfileState) => CareerProfileState,
  ) => {
    setDraftProfile((currentDraft) => {
      const nextProfile = updater(currentDraft ?? serverProfile);
      return areCareerProfilesEqual(nextProfile, serverProfile) ? null : nextProfile;
    });
  };

  const saveProfileMutation = useMutation({
    mutationFn: async (updatedProfile: CareerProfileState) => {
      if (!user) {
        throw new Error('Login required.');
      }

      const updates = parseSelfProfileUpdate({
        full_name: updatedProfile.full_name,
        headline: updatedProfile.headline,
        location: updatedProfile.location,
        phone: updatedProfile.phone,
        website: updatedProfile.website,
        bio: updatedProfile.bio,
        experience: updatedProfile.experience,
        education: updatedProfile.education,
        skills: updatedProfile.skills,
      });

      const savedProfileRecord = await upsertProfileRecord(user.id, updates);
      return {
        savedProfileRecord,
      };
    },
    onSuccess: ({ savedProfileRecord }) => {
      queryClient.setQueryData(profileQueryKey, savedProfileRecord);
      setDraftProfile(null);
      setIsEditing(false);
      toast.success('Profile saved successfully!');
    },
    onError: (error: unknown) => {
      toast.error(`Error saving: ${getErrorMessage(error)}`);
    },
  });

  const changeField = <K extends keyof CareerProfileState>(
    field: K,
    value: CareerProfileState[K],
  ) => {
    updateDraftProfile((current) => ({ ...current, [field]: value }));
  };

  const discardChanges = () => {
    setDraftProfile(null);
    setIsEditing(false);
    setActiveModal(null);
    setNewSkill('');
  };

  const completionItems = useMemo(() => getCareerProfileCompletionItems(profile), [profile]);
  const completedItemsCount = completionItems.filter((item) => item.done).length;
  const completionPercent = Math.round((completedItemsCount / completionItems.length) * 100);
  const missingItems = completionItems.filter((item) => !item.done).slice(0, 3);

  const addExperience = () => {
    updateDraftProfile((current) => ({
      ...current,
      experience: [...current.experience, { ...newExp, id: Date.now().toString() }],
    }));
    toast.success('Experience added. Save changes to apply.');
    setActiveModal(null);
    setNewExp(createEmptyExperienceItem());
  };

  const deleteExperience = (id: string) => {
    toast('Delete this role?', {
      action: {
        label: 'Delete',
        onClick: () => {
          updateDraftProfile((current) => ({
            ...current,
            experience: current.experience.filter((item) => item.id !== id),
          }));
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
    updateDraftProfile((current) => ({
      ...current,
      education: [...current.education, { ...newEdu, id: Date.now().toString() }],
    }));
    toast.success('Education added. Save changes to apply.');
    setActiveModal(null);
    setNewEdu(createEmptyEducationItem());
  };

  const deleteEducation = (id: string) => {
    toast('Delete this school?', {
      action: {
        label: 'Delete',
        onClick: () => {
          updateDraftProfile((current) => ({
            ...current,
            education: current.education.filter((item) => item.id !== id),
          }));
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
    const normalizedSkill = (newSkill || '').trim();
    if (!normalizedSkill) return;

    event.preventDefault();
    if (profile.skills.some((skill) => skill.toLowerCase() === normalizedSkill.toLowerCase())) {
      setNewSkill('');
      return;
    }

    updateDraftProfile((current) => ({
      ...current,
      skills: [...current.skills, normalizedSkill],
    }));
    setNewSkill('');
  };

  const deleteSkill = (skillToDelete: string) => {
    updateDraftProfile((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill !== skillToDelete),
    }));
  };

  return {
    loading: userId !== null && profileQuery.isPending && profileQuery.data === undefined,
    saving: saveProfileMutation.isPending,
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
    saveProfile: () => {
      void saveProfileMutation.mutateAsync(profile).catch(() => {
        // Error toast is handled by the mutation.
      });
    },
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
