export type ResumeCollectionViewState =
  | 'loading'
  | 'error'
  | 'empty'
  | 'no_matches'
  | 'ready';

interface ResumeCollectionStateArgs {
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  filteredCount: number;
}

export const getResumeCollectionViewState = ({
  isLoading,
  error,
  totalCount,
  filteredCount,
}: ResumeCollectionStateArgs): ResumeCollectionViewState => {
  if (isLoading) {
    return 'loading';
  }

  if (error) {
    return 'error';
  }

  if (totalCount === 0) {
    return 'empty';
  }

  if (filteredCount === 0) {
    return 'no_matches';
  }

  return 'ready';
};
