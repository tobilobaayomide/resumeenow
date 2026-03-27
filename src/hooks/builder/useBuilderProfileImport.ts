import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { clampSummary, isRecord } from '../../lib/builder/page';
import { getErrorMessage } from '../../lib/errors';
import {
  fetchProfileRecord,
  getProfileQueryKey,
  PROFILE_QUERY_STALE_TIME,
} from '../../lib/queries/profile';
import { parseProfileResumeImport } from '../../schemas/integrations/profile';
import type { BuilderPageMobileView } from '../../types/builder';
import type { ResumeData } from '../../types/resume';

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
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);

  const executeImport = async () => {
    if (!user) {
      toast.error('Login required.');
      return;
    }

    setIsImporting(true);

    try {
      const profileRecord = await queryClient.ensureQueryData({
        queryKey: getProfileQueryKey(user.id),
        queryFn: () => fetchProfileRecord(user.id),
        staleTime: PROFILE_QUERY_STALE_TIME,
      });

      if (!profileRecord || !isRecord(profileRecord)) {
        toast.error('No Career Profile found.');
        return;
      }

      const parsedProfile = parseProfileResumeImport(profileRecord, user.email || '');
      const mappedData: ResumeData = {
        ...parsedProfile,
        summary: clampSummary(parsedProfile.summary),
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
