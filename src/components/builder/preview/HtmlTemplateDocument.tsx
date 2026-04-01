import React, { useEffect, useMemo, useRef, useState } from "react";
import TemplateRenderer from "../templates/TemplateRenderer";
import type { ResumeData } from "../../../domain/resume";
import type { TemplateId } from "../../../domain/templates";
import type { BuilderAiHighlights } from "../../../types/builder";
import {
  PAGE_HEIGHT_PX,
  PAGE_PADDING_BOTTOM_PX,
  PAGE_PADDING_SIDE_PX,
  PAGE_PADDING_TOP_PX,
  PAGE_WIDTH_PX,
  calculatePageBreaks,
} from "./pagination";

const DEFAULT_PAGE_GAP_PX = 24;
const CONTENT_HEIGHT_PER_PAGE =
  PAGE_HEIGHT_PX - PAGE_PADDING_TOP_PX - PAGE_PADDING_BOTTOM_PX;

const getContentHeightForPage = (pageIndex: number, flushHeader: boolean) =>
  pageIndex === 0 && flushHeader
    ? CONTENT_HEIGHT_PER_PAGE + PAGE_PADDING_TOP_PX
    : CONTENT_HEIGHT_PER_PAGE;

interface HtmlTemplateDocumentProps {
  data: ResumeData;
  templateId: TemplateId;
  aiHighlights?: BuilderAiHighlights;
  zoom?: number;
  pageGap?: number;
  withShadow?: boolean;
  pageClassName?: string;
  pageLimit?: number;
}

export const HtmlTemplateDocument: React.FC<HtmlTemplateDocumentProps> = ({
  data,
  templateId,
  aiHighlights,
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
    let animationFrameId = 0;
    let cancelled = false;

    const runMeasurement = () => {
      if (cancelled) return;

      const selfPadded =
        element.querySelector('[data-self-padded="true"]') !== null;
      const hasFlushHeader =
        element.querySelector('[data-flush-header="true"]') !== null;

      setIsSelfPadded(selfPadded);
      setFlushHeader(hasFlushHeader);
      setPageBreaks(calculatePageBreaks(element, hasFlushHeader));
    };

    const scheduleMeasurement = (delay = 150) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        animationFrameId = window.requestAnimationFrame(() => {
          runMeasurement();
        });
      }, delay);
    };

    scheduleMeasurement(0);

    const observer = new ResizeObserver(() => scheduleMeasurement());
    observer.observe(element);

    const fonts = "fonts" in document ? document.fonts : null;
    const handleFontsSettled = () => scheduleMeasurement(0);

    if (fonts) {
      void fonts.ready.then(handleFontsSettled).catch(() => {
        // Ignore font readiness failures and keep the current layout.
      });

      if ("addEventListener" in fonts) {
        fonts.addEventListener("loadingdone", handleFontsSettled);
        fonts.addEventListener("loadingerror", handleFontsSettled);
      }
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      window.cancelAnimationFrame(animationFrameId);
      observer.disconnect();

      if (fonts && "removeEventListener" in fonts) {
        fonts.removeEventListener("loadingdone", handleFontsSettled);
        fonts.removeEventListener("loadingerror", handleFontsSettled);
      }
    };
  }, [data, templateId, aiHighlights]);

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
        data-preview-measurement="true"
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
          <TemplateRenderer
            templateId={templateId}
            data={data}
            aiHighlights={aiHighlights}
          />
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
                        <TemplateRenderer
                          templateId={templateId}
                          data={data}
                          aiHighlights={aiHighlights}
                        />
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
