import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { clampSummary, isRecord, toString, toStringArray } from '../../lib/builder/page';
import { getErrorMessage } from '../../lib/errors';
import { supabase } from '../../lib/supabase';
import type { BuilderPageMobileView } from '../../types/builder';
import {
  normalizeEducationList,
  normalizeExperienceList,
  normalizeLinkList,
  normalizeProjectList,
  type ResumeData,
} from '../../types/resume';

interface UseBuilderProfileImportArgs {
  user: User | null;
  setResumeData: Dispatch<SetStateAction<ResumeData>>;
  setMobileView: Dispatch<SetStateAction<BuilderPageMobileView>>;
}

interface UseBuilderProfileImportResult {
  isImporting: boolean;
  handleImportProfile: () => void;
}

export const useBuilderProfileImport = ({
  user,
  setResumeData,
  setMobileView,
}: UseBuilderProfileImportArgs): UseBuilderProfileImportResult => {
  const [isImporting, setIsImporting] = useState(false);

  const executeImport = async () => {
    if (!user) {
      toast.error('Login required.');
      return;
    }

    setIsImporting(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data || !isRecord(data)) {
        toast.error('No Career Profile found.');
        return;
      }

      const profileWebsite = toString(data.website);
      const parsedLinks = normalizeLinkList(data.links);
      const links =
        parsedLinks.length > 0
          ? parsedLinks
          : profileWebsite
            ? [{ id: 'link-1', label: 'Website', url: profileWebsite }]
            : [];

      const mappedData: ResumeData = {
        personalInfo: {
          fullName: toString(data.full_name),
          email: user.email || '',
          phone: toString(data.phone),
          jobTitle: toString(data.headline),
          location: toString(data.location),
          website: profileWebsite,
          links,
        },
        summary: clampSummary(toString(data.bio)),
        experience: normalizeExperienceList(data.experience),
        volunteering: normalizeExperienceList(data.volunteering),
        projects: normalizeProjectList(data.projects),
        education: normalizeEducationList(data.education),
        certifications: toStringArray(data.certifications),
        skills: toStringArray(data.skills),
        languages: toStringArray(data.languages),
        achievements: toStringArray(data.achievements ?? data.awards),
      };

      setResumeData(mappedData);
      setMobileView('editor');
      toast.success('Profile imported successfully!');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to import profile.'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportProfile = () => {
    if (!user) {
      toast.error('Login required.');
      return;
    }

    toast('Overwrite current resume with Profile data?', {
      action: {
        label: 'Overwrite',
        onClick: () => {
          void executeImport();
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  return {
    isImporting,
    handleImportProfile,
  };
};
