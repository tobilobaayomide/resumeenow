import type { WheelEvent } from 'react';

export const handleHorizontalWheelScroll = (event: WheelEvent<HTMLDivElement>) => {
  const node = event.currentTarget;
  if (node.scrollWidth <= node.clientWidth || event.deltaY === 0) return;

  const canScrollLeft = event.deltaY < 0 && node.scrollLeft > 0;
  const canScrollRight =
    event.deltaY > 0 && node.scrollLeft + node.clientWidth < node.scrollWidth;

  if (!canScrollLeft && !canScrollRight) return;
  if (event.cancelable) {
    event.preventDefault();
  }
  node.scrollLeft += event.deltaY;
};

export const hasValueIgnoreCase = (list: string[], value: string): boolean =>
  list.some((item) => item.toLowerCase() === value.toLowerCase());
