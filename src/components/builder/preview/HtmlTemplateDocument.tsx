import React, { useEffect, useMemo, useRef, useState } from "react";
import TemplateRenderer from "../templates/TemplateRenderer";
import type { ResumeData } from "../../../domain/resume";
import type { TemplateId } from "../../../domain/templates";

export const PAGE_WIDTH_PX = 794;
export const PAGE_HEIGHT_PX = 1123;
export const PAGE_PADDING_TOP_PX = 47;
export const PAGE_PADDING_BOTTOM_PX = 47;
export const PAGE_PADDING_SIDE_PX = 57;

const DEFAULT_PAGE_GAP_PX = 24;
const CONTENT_HEIGHT_PER_PAGE =
  PAGE_HEIGHT_PX - PAGE_PADDING_TOP_PX - PAGE_PADDING_BOTTOM_PX;

const getContentHeightForPage = (pageIndex: number, flushHeader: boolean) =>
  pageIndex === 0 && flushHeader
    ? CONTENT_HEIGHT_PER_PAGE + PAGE_PADDING_TOP_PX
    : CONTENT_HEIGHT_PER_PAGE;

const calculatePageBreaks = (
  container: HTMLDivElement,
  flushHeader: boolean,
): number[] => {
  const containerTop = container.getBoundingClientRect().top;

  const headerEl = container.querySelector<HTMLElement>(
    '[data-page-header="true"]',
  );
  const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 0;

  const allElements = Array.from(
    container.querySelectorAll<HTMLElement>(
      "p, h1, h2, h3, h4, h5, h6, li, td, th, span, div",
    ),
  ).filter((el) => {
    const rect = el.getBoundingClientRect();
    const hasHeight = rect.height > 0;
    const hasText = (el.textContent || "").trim().length > 0;
    const hasBlockChildren = Array.from(el.children).some((child) => {
      const style = window.getComputedStyle(child);
      return (
        style.display === "block" ||
        style.display === "flex" ||
        style.display === "grid"
      );
    });
    return hasHeight && hasText && !hasBlockChildren;
  });

  const breaks: number[] = [0];
  let currentPageStart = 0;
  let isFirstPage = true;

  allElements.forEach((el) => {
    const rects = Array.from(el.getClientRects());
    if (rects.length === 0) return;

    for (const rect of rects) {
      const lineTop = rect.top - containerTop;
      const lineBottom = rect.bottom - containerTop;

      const pageHeight = isFirstPage
        ? getContentHeightForPage(0, flushHeader) - headerHeight
        : CONTENT_HEIGHT_PER_PAGE;

      const pageBoundary = currentPageStart + pageHeight;

      if (lineBottom > pageBoundary) {
        if (lineTop > currentPageStart + 0.5) {
          breaks.push(lineTop);
          currentPageStart = lineTop;
        } else {
          breaks.push(pageBoundary);
          currentPageStart = pageBoundary;
        }
        isFirstPage = false;
        break;
      }
    }
  });

  return breaks;
};

interface HtmlTemplateDocumentProps {
  data: ResumeData;
  templateId: TemplateId;
  zoom?: number;
  pageGap?: number;
  withShadow?: boolean;
  pageClassName?: string;
  pageLimit?: number;
}

export const HtmlTemplateDocument: React.FC<HtmlTemplateDocumentProps> = ({
  data,
  templateId,
  zoom = 1,
  pageGap = DEFAULT_PAGE_GAP_PX,
  withShadow = true,
  pageClassName = "",
  pageLimit,
}) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageBreaks, setPageBreaks] = useState<number[]>([0]);
  const [isSelfPadded, setIsSelfPadded] = useState(false);
  const [flushHeader, setFlushHeader] = useState(false);

  useEffect(() => {
    const element = measureRef.current;
    if (!element) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const update = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const selfPadded =
          element.querySelector('[data-self-padded="true"]') !== null;
        const hasFlushHeader =
          element.querySelector('[data-flush-header="true"]') !== null;

        setIsSelfPadded(selfPadded);
        setFlushHeader(hasFlushHeader);
        setPageBreaks(calculatePageBreaks(element, hasFlushHeader));
      }, 150);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [data, templateId]);

  const totalPages =
    typeof pageLimit === "number"
      ? Math.min(pageBreaks.length, Math.max(1, pageLimit))
      : pageBreaks.length;

  const totalPreviewHeight = useMemo(
    () => totalPages * PAGE_HEIGHT_PX + Math.max(0, totalPages - 1) * pageGap,
    [totalPages, pageGap],
  );
  const scaledPreviewWidth = PAGE_WIDTH_PX * zoom;
  const scaledPreviewHeight = totalPreviewHeight * zoom;

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute print:hidden"
        style={{
          width: PAGE_WIDTH_PX,
          top: 0,
          left: -9999,
          opacity: 0,
          paddingLeft: isSelfPadded ? 0 : PAGE_PADDING_SIDE_PX,
          paddingRight: isSelfPadded ? 0 : PAGE_PADDING_SIDE_PX,
        }}
      >
        <div ref={measureRef}>
          <TemplateRenderer templateId={templateId} data={data} />
        </div>
      </div>

      <div
        style={{
          width: scaledPreviewWidth,
          height: scaledPreviewHeight,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: PAGE_WIDTH_PX,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <div className="flex flex-col" style={{ gap: `${pageGap}px` }}>
            {Array.from({ length: totalPages }).map((_, pageIndex) => {
              const pageStart = pageBreaks[pageIndex];
              const nextPageStart = pageBreaks[pageIndex + 1];
              const pageContentHeight = getContentHeightForPage(
                pageIndex,
                flushHeader,
              );

              const visibleContentHeight =
                typeof nextPageStart === "number"
                  ? Math.min(
                      pageContentHeight,
                      Math.max(0, nextPageStart - pageStart),
                    )
                  : pageContentHeight;

              const topPadding =
                pageIndex === 0 && flushHeader ? 0 : PAGE_PADDING_TOP_PX;

              return (
                <div
                  key={`${templateId}-page-${pageIndex + 1}`}
                  className={`resume-print-page relative bg-white ${
                    withShadow ? "shadow-2xl" : ""
                  } ${pageClassName}`.trim()}
                  style={{
                    width: PAGE_WIDTH_PX,
                    height: PAGE_HEIGHT_PX,
                    breakAfter: pageIndex < totalPages - 1 ? "page" : "auto",
                    pageBreakAfter:
                      pageIndex < totalPages - 1 ? "always" : "auto",
                  }}
                >
                  <div
                    style={{
                      height: topPadding,
                      width: "100%",
                      backgroundColor: "white",
                    }}
                  />

                  <div
                    style={{
                      height: pageContentHeight,
                      overflow: "hidden",
                      paddingLeft: isSelfPadded ? 0 : PAGE_PADDING_SIDE_PX,
                      paddingRight: isSelfPadded ? 0 : PAGE_PADDING_SIDE_PX,
                    }}
                  >
                    <div
                      style={{
                        height: visibleContentHeight,
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ marginTop: `-${pageStart}px` }}>
                        <TemplateRenderer templateId={templateId} data={data} />
                      </div>
                    </div>

                    {visibleContentHeight < pageContentHeight && (
                      <div
                        style={{
                          height: pageContentHeight - visibleContentHeight,
                        }}
                      />
                    )}
                  </div>

                  <div
                    style={{
                      height: PAGE_PADDING_BOTTOM_PX,
                      width: "100%",
                      backgroundColor: "white",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
