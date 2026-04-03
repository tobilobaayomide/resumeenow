const MM_TO_CSS_PX = 96 / 25.4;
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

export const PAGE_WIDTH_PX = A4_WIDTH_MM * MM_TO_CSS_PX;
export const PAGE_HEIGHT_PX = A4_HEIGHT_MM * MM_TO_CSS_PX;
export const PAGE_WIDTH_PRINT_CSS = `${A4_WIDTH_MM}mm`;
export const PAGE_HEIGHT_PRINT_CSS = `${A4_HEIGHT_MM}mm`;
export const PAGE_PADDING_TOP_PX = 47;
export const PAGE_PADDING_BOTTOM_PX = 47;
export const PAGE_PADDING_SIDE_PX = 57;

const CONTENT_HEIGHT_PER_PAGE =
  PAGE_HEIGHT_PX - PAGE_PADDING_TOP_PX - PAGE_PADDING_BOTTOM_PX;
const BREAK_TOLERANCE_PX = 0.5;
const LINE_RECT_MERGE_TOLERANCE_PX = 1;

export interface PageBreakMeasurementUnit {
  top: number;
  bottom: number;
}

interface RectFragment {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const getContentHeightForPage = (pageIndex: number, flushHeader: boolean) =>
  pageIndex === 0 && flushHeader
    ? CONTENT_HEIGHT_PER_PAGE + PAGE_PADDING_TOP_PX
    : CONTENT_HEIGHT_PER_PAGE;

const getPageHeightForBreakIndex = (
  breakIndex: number,
  flushHeader: boolean,
  headerHeight: number,
) =>
  breakIndex === 0
    ? getContentHeightForPage(0, flushHeader) - headerHeight
    : CONTENT_HEIGHT_PER_PAGE;

export const mergeRectFragmentsIntoLineUnits = (
  rects: RectFragment[],
): PageBreakMeasurementUnit[] => {
  const sortedRects = rects
    .filter((rect) => rect.bottom - rect.top > 0 && rect.right - rect.left > 0)
    .sort((leftRect, rightRect) => {
      if (Math.abs(leftRect.top - rightRect.top) > LINE_RECT_MERGE_TOLERANCE_PX) {
        return leftRect.top - rightRect.top;
      }

      return leftRect.left - rightRect.left;
    });

  const lines: PageBreakMeasurementUnit[] = [];

  sortedRects.forEach((rect) => {
    const previousLine = lines[lines.length - 1];

    if (
      previousLine &&
      Math.abs(previousLine.top - rect.top) <= LINE_RECT_MERGE_TOLERANCE_PX &&
      Math.abs(previousLine.bottom - rect.bottom) <=
        LINE_RECT_MERGE_TOLERANCE_PX + 0.5
    ) {
      previousLine.top = Math.min(previousLine.top, rect.top);
      previousLine.bottom = Math.max(previousLine.bottom, rect.bottom);
      return;
    }

    lines.push({
      top: rect.top,
      bottom: rect.bottom,
    });
  });

  return lines;
};

export const calculatePageBreaksFromUnits = (
  units: PageBreakMeasurementUnit[],
  flushHeader: boolean,
  headerHeight: number,
): number[] => {
  const sortedUnits = [...units].sort((leftUnit, rightUnit) => {
    if (Math.abs(leftUnit.top - rightUnit.top) > BREAK_TOLERANCE_PX) {
      return leftUnit.top - rightUnit.top;
    }

    return leftUnit.bottom - rightUnit.bottom;
  });

  const breaks: number[] = [0];
  let currentPageStart = 0;

  sortedUnits.forEach((unit) => {
    let pageHeight = getPageHeightForBreakIndex(
      breaks.length - 1,
      flushHeader,
      headerHeight,
    );
    let pageBoundary = currentPageStart + pageHeight;

    while (unit.bottom > pageBoundary + BREAK_TOLERANCE_PX) {
      const nextBreak =
        unit.top > currentPageStart + BREAK_TOLERANCE_PX
          ? unit.top
          : pageBoundary;

      currentPageStart = nextBreak;
      breaks.push(nextBreak);

      pageHeight = getPageHeightForBreakIndex(
        breaks.length - 1,
        flushHeader,
        headerHeight,
      );
      pageBoundary = currentPageStart + pageHeight;
    }
  });

  return breaks;
};

const hasMarkedDescendant = (element: HTMLElement): boolean =>
  element.querySelector('[data-no-split="true"], [data-break-point="true"]') !==
  null;

const getDeepestMarkedCandidates = (container: HTMLDivElement): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      '[data-no-split="true"], [data-break-point="true"]',
    ),
  ).filter((element) => !hasMarkedDescendant(element));

const collectTextRectFragments = (element: HTMLElement): RectFragment[] => {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) =>
        (node.textContent || "").trim().length > 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    },
  );

  const rects: RectFragment[] = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    const range = document.createRange();
    range.selectNodeContents(currentNode);

    rects.push(
      ...Array.from(range.getClientRects()).map((rect) => ({
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
      })),
    );

    currentNode = walker.nextNode();
  }

  return rects;
};

const getGenericLeafCandidates = (container: HTMLDivElement): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      "p, h1, h2, h3, h4, h5, h6, li, td, th, span, div",
    ),
  ).filter((element) => {
    const rect = element.getBoundingClientRect();
    const hasHeight = rect.height > 0;
    const hasText = (element.textContent || "").trim().length > 0;
    const hasBlockChildren = Array.from(element.children).some((child) => {
      const style = window.getComputedStyle(child);
      return (
        style.display === "block" ||
        style.display === "flex" ||
        style.display === "grid"
      );
    });

    return hasHeight && hasText && !hasBlockChildren;
  });

export const collectPageBreakMeasurementUnits = (
  container: HTMLDivElement,
): PageBreakMeasurementUnit[] => {
  const containerTop = container.getBoundingClientRect().top;

  const pushBlockUnit = (
    units: PageBreakMeasurementUnit[],
    element: HTMLElement,
  ) => {
    const rect = element.getBoundingClientRect();

    if (rect.height <= 0) return;

    units.push({
      top: rect.top - containerTop,
      bottom: rect.bottom - containerTop,
    });
  };

  const pushLineUnits = (
    units: PageBreakMeasurementUnit[],
    element: HTMLElement,
  ) => {
    const lineUnits = mergeRectFragmentsIntoLineUnits(
      collectTextRectFragments(element).map((rect) => ({
        ...rect,
        top: rect.top - containerTop,
        bottom: rect.bottom - containerTop,
      })),
    );

    if (lineUnits.length > 0) {
      units.push(...lineUnits);
      return;
    }

    pushBlockUnit(units, element);
  };

  const units: PageBreakMeasurementUnit[] = [];
  const markedCandidates = getDeepestMarkedCandidates(container);

  if (markedCandidates.length > 0) {
    markedCandidates.forEach((element) => {
      if (element.dataset.noSplit === "true") {
        pushBlockUnit(units, element);
        return;
      }

      pushLineUnits(units, element);
    });

    const genericLeafCandidates = getGenericLeafCandidates(container).filter(
      (element) =>
        !markedCandidates.some(
          (candidate) => candidate === element || candidate.contains(element),
        ),
    );

    genericLeafCandidates.forEach((element) => {
      pushLineUnits(units, element);
    });

    return units;
  }

  getGenericLeafCandidates(container).forEach((element) => {
    pushLineUnits(units, element);
  });

  return units;
};

export const calculatePageBreaks = (
  container: HTMLDivElement,
  flushHeader: boolean,
): number[] => {
  const headerEl = container.querySelector<HTMLElement>(
    '[data-page-header="true"]',
  );
  const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 0;

  return calculatePageBreaksFromUnits(
    collectPageBreakMeasurementUnits(container),
    flushHeader,
    headerHeight,
  );
};
