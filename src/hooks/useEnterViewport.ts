import { useEffect, useState, type RefObject } from 'react';

export const useEnterViewport = <T extends Element>(
  ref: RefObject<T | null>,
  rootMargin = '240px 0px',
): boolean => {
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasEnteredViewport) return;

    if (typeof IntersectionObserver === 'undefined') {
      setHasEnteredViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setHasEnteredViewport(true);
        observer.disconnect();
      },
      {
        rootMargin,
        threshold: 0.05,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasEnteredViewport, ref, rootMargin]);

  return hasEnteredViewport;
};
