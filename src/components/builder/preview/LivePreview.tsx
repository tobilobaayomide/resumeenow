import React, { useRef, useState, useEffect } from 'react';
import TemplateRenderer from '../templates/TemplateRenderer'; 
import type { LivePreviewProps } from '../../../types/builder';

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const PAGE_GAP_PX = 24;

const PAGE_MARGIN_TOP_PX = 47;
const PAGE_MARGIN_BOTTOM_PX = 47;
const PAGE_MARGIN_SIDE_PX = 57;

const CONTENT_HEIGHT_PER_PAGE = A4_HEIGHT_PX - PAGE_MARGIN_TOP_PX - PAGE_MARGIN_BOTTOM_PX;

const LivePreview: React.FC<LivePreviewProps> = ({ data, zoom = 0.8, templateId = 'executive' }) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageBreaks, setPageBreaks] = useState<number[]>([0]);
  const [isSelfPadded, setIsSelfPadded] = useState(false);

  useEffect(() => {
    const calculatePageBreaks = () => {
      if (!measureRef.current) return;

      const container = measureRef.current;
      const containerTop = container.getBoundingClientRect().top;

      // Detect if the template manages its own internal padding.
      // If so, the measurement div must NOT add extra side padding — otherwise
      // the template renders narrower in measurement than on screen, causing
      // text to wrap more, elements to be taller, and break points to fire too early.
      const selfPadded = container.querySelector('[data-self-padded="true"]') !== null;
      setIsSelfPadded(selfPadded);

      // Detect if the template has a header that only appears on page 1.
      // The header's height is already consumed in the rendered layout, so the
      // first page has less usable content height than subsequent pages.
      // Without this, the first page boundary fires too late and clips content.
      const headerEl = container.querySelector(
        '[data-page-header="true"]'
      ) as HTMLElement | null;
      const headerHeight = headerEl
        ? headerEl.getBoundingClientRect().height
        : 0;

      const allElements = Array.from(
        container.querySelectorAll<HTMLElement>(
          'p, h1, h2, h3, h4, h5, h6, li, td, th, span, div'
        )
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        const hasHeight = rect.height > 0;
        const hasText = (el.textContent || '').trim().length > 0;

        // Skip elements inside no-split containers (sidebars, flex/grid rows, headers)
        const insideNoSplit = el.closest('[data-no-split="true"]') !== null;

        // Always include explicit break point elements regardless of children.
        // data-break-point marks precise content elements inside flex/grid wrappers.
        if (el.dataset.breakPoint === 'true') {
          return hasHeight && hasText && !insideNoSplit;
        }

        // Exclude layout wrappers that contain block/flex/grid children
        const hasBlockChildren = Array.from(el.children).some((child) => {
          const style = window.getComputedStyle(child);
          return (
            style.display === 'block' ||
            style.display === 'flex' ||
            style.display === 'grid'
          );
        });

        return hasHeight && hasText && !hasBlockChildren && !insideNoSplit;
      });

      const breaks: number[] = [0];
      let currentPageStart = 0;
      let isFirstPage = true;

      allElements.forEach((el) => {
        // getClientRects() returns one rect per rendered visual line of text —
        // line-level precision means breaks never land mid-line
        const rects = Array.from(el.getClientRects());
        if (rects.length === 0) return;

        for (const rect of rects) {
          const lineTop = rect.top - containerTop;
          const lineBottom = rect.bottom - containerTop;

          // Page 1 has less usable height when a header is present —
          // subtract its height so the boundary fires at the right position.
          // Pages 2+ use the full content height since the header isn't repeated.
          const pageHeight = isFirstPage
            ? CONTENT_HEIGHT_PER_PAGE - headerHeight
            : CONTENT_HEIGHT_PER_PAGE;

          const pageBoundary = currentPageStart + pageHeight;

          if (lineBottom > pageBoundary) {
            if (lineTop < pageBoundary && lineTop > currentPageStart + 0.5) {
              // Break just before this line so it moves whole to the next page
              breaks.push(lineTop);
              currentPageStart = lineTop;
              isFirstPage = false;
            } else {
              breaks.push(pageBoundary);
              currentPageStart = pageBoundary;
              isFirstPage = false;
            }
            // Break set — stop checking remaining lines in this element
            break;
          }
        }
      });

      setPageBreaks(breaks);
    };

    if (measureRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        setTimeout(calculatePageBreaks, 100);
      });
      resizeObserver.observe(measureRef.current);
      setTimeout(calculatePageBreaks, 100);
      return () => resizeObserver.disconnect();
    }
  }, [data, templateId]);

  const totalPages = pageBreaks.length;

  const renderPages = (isForPrint = false) => {
    return Array.from({ length: totalPages }).map((_, pageIndex) => {
      const pageStart = pageBreaks[pageIndex];
      const nextPageStart = pageBreaks[pageIndex + 1];
      const visibleContentHeight =
        typeof nextPageStart === 'number'
          ? Math.min(
              CONTENT_HEIGHT_PER_PAGE,
              Math.max(0, nextPageStart - pageStart),
            )
          : CONTENT_HEIGHT_PER_PAGE;

      return (
        <div
          key={pageIndex}
          style={
            isForPrint
              ? {
                  width: '100%',
                  height: `${A4_HEIGHT_PX}px`,
                  overflow: 'hidden',
                  position: 'relative',
                  pageBreakAfter: pageIndex < totalPages - 1 ? 'always' : 'auto',
                  breakAfter: pageIndex < totalPages - 1 ? 'page' : 'auto',
                  backgroundColor: 'white',
                }
              : {
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  width: A4_WIDTH_PX,
                  height: A4_HEIGHT_PX,
                  marginBottom:
                    zoom < 1 ? `${A4_HEIGHT_PX * zoom - A4_HEIGHT_PX}px` : 0,
                }
          }
          className={isForPrint ? '' : 'relative bg-white shadow-2xl shrink-0'}
        >
          {/* Page Number Badge — screen only */}
          {!isForPrint && (
            <div className="absolute bottom-3 right-4 text-[10px] text-gray-300 font-medium z-50 pointer-events-none select-none">
              {pageIndex + 1} / {totalPages}
            </div>
          )}

          {/* TOP MARGIN */}
          <div
            style={{
              height: PAGE_MARGIN_TOP_PX,
              width: '100%',
              backgroundColor: 'white',
            }}
          />

          {/* CONTENT AREA
              Self-padded templates handle their own side padding internally,
              so we skip paddingLeft/paddingRight here to avoid double-padding. */}
          <div
            style={{
              height: CONTENT_HEIGHT_PER_PAGE,
              overflow: 'hidden',
              paddingLeft: isSelfPadded ? 0 : PAGE_MARGIN_SIDE_PX,
              paddingRight: isSelfPadded ? 0 : PAGE_MARGIN_SIDE_PX,
            }}
          >
            <div style={{ height: visibleContentHeight, overflow: 'hidden' }}>
              <div style={{ marginTop: `-${pageStart}px` }}>
                <TemplateRenderer templateId={templateId} data={data} />
              </div>
            </div>
            {visibleContentHeight < CONTENT_HEIGHT_PER_PAGE && (
              <div
                style={{
                  height: CONTENT_HEIGHT_PER_PAGE - visibleContentHeight,
                }}
              />
            )}
          </div>

          {/* BOTTOM MARGIN */}
          <div
            style={{
              height: PAGE_MARGIN_BOTTOM_PX,
              width: '100%',
              backgroundColor: 'white',
            }}
          />
        </div>
      );
    });
  };

  return (
    <div className="w-full bg-[#525659] print:bg-white print:p-0 print:m-0">

      {/* ============================================================
          HIDDEN MEASUREMENT DIV
          - print:hidden removes it from the print render tree entirely
          - opacity: 0 + left: -9999 hides it on screen only
          - Self-padded templates get zero side padding here so the
            measurement width exactly matches the rendered width on screen
      ============================================================ */}
      <div
        className="print:hidden"
        style={{
          width: A4_WIDTH_PX,
          position: 'absolute',
          top: 0,
          left: -9999,
          opacity: 0,
          pointerEvents: 'none',
          paddingLeft: isSelfPadded ? 0 : PAGE_MARGIN_SIDE_PX,
          paddingRight: isSelfPadded ? 0 : PAGE_MARGIN_SIDE_PX,
        }}
      >
        <div ref={measureRef}>
          <TemplateRenderer templateId={templateId} data={data} />
        </div>
      </div>

      {/* SCREEN VIEW */}
      <div
        className="print:hidden flex flex-col items-center py-8"
        style={{ gap: PAGE_GAP_PX }}
      >
        {renderPages(false)}
      </div>

      {/* PRINT VIEW */}
      <div className="hidden print:block print:w-full print:bg-white">
        {renderPages(true)}
      </div>

    </div>
  );
};

export default LivePreview;