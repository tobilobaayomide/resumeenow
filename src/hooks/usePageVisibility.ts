import { useEffect, useState } from 'react';

const getIsPageVisible = (): boolean => {
  if (typeof document === 'undefined') {
    return true;
  }

  return document.visibilityState !== 'hidden';
};

export const usePageVisibility = (): boolean => {
  const [isPageVisible, setIsPageVisible] = useState(getIsPageVisible);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState !== 'hidden');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isPageVisible;
};
