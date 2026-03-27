import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createResumeRecord, deleteResumeRecord, fetchResumes, getResumesQueryKey } from '../lib/queries/resumes';
import type { ResumeRecord, TemplateId } from '../types/resume';
import type { UseResumesResult } from '../types/hooks';

const getResumeErrorMessage = (error: unknown): string =>
  error instanceof Error && error.message.trim()
    ? error.message
    : 'Failed to load resumes.';

export const useResumes = (userId: string | undefined): UseResumesResult => {
  const hasUser = Boolean(userId);
  const queryClient = useQueryClient();
  const queryKey = getResumesQueryKey(userId);

  const resumesQuery = useQuery({
    queryKey,
    queryFn: async () => fetchResumes(userId as string),
    enabled: hasUser,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const createResumeMutation = useMutation({
    mutationFn: async ({
      title,
      templateId,
    }: {
      title: string;
      templateId?: TemplateId;
    }) => {
      if (!userId) {
        throw new Error('Login required.');
      }

      return createResumeRecord(userId, title, templateId);
    },
    onSuccess: (createdResume) => {
      queryClient.setQueryData<ResumeRecord[]>(queryKey, (currentResumes = []) => [
        createdResume,
        ...currentResumes.filter((resume) => resume.id !== createdResume.id),
      ]);
    },
  });

  const deleteResumeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) {
        throw new Error('Login required.');
      }

      await deleteResumeRecord(userId, id);
      return id;
    },
    onSuccess: (deletedResumeId) => {
      queryClient.setQueryData<ResumeRecord[]>(queryKey, (currentResumes = []) =>
        currentResumes.filter((resume) => resume.id !== deletedResumeId),
      );
    },
  });

  const refreshResumes = async (): Promise<void> => {
    if (!hasUser) {
      return;
    }

    await queryClient.invalidateQueries({ queryKey, exact: true });
  };

  return {
    resumes: hasUser ? resumesQuery.data ?? [] : [],
    loading: hasUser ? resumesQuery.isPending : false,
    error: hasUser && resumesQuery.error ? getResumeErrorMessage(resumesQuery.error) : null,
    createResume: async (title, templateId) =>
      createResumeMutation.mutateAsync({ title, templateId }),
    deleteResume: async (id) => {
      await deleteResumeMutation.mutateAsync(id);
    },
    refreshResumes,
  };
};
