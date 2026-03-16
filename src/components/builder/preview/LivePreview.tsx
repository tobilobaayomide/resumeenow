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

      const selfPadded = container.querySelector('[data-self-padded="true"]') !== null;
      setIsSelfPadded(selfPadded);

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

        const hasBlockChildren = Array.from(el.children).some((child) => {
          const style = window.getComputedStyle(child);
          return (
            style.display === 'block' ||
            style.display === 'flex' ||
            style.display === 'grid'
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
            ? CONTENT_HEIGHT_PER_PAGE - headerHeight
            : CONTENT_HEIGHT_PER_PAGE;

          const pageBoundary = currentPageStart + pageHeight;

          if (lineBottom > pageBoundary) {
            if (lineTop > currentPageStart + 0.5) {
              breaks.push(lineTop);
              currentPageStart = lineTop;
              isFirstPage = false;
            } else {
              breaks.push(pageBoundary);
              currentPageStart = pageBoundary;
              isFirstPage = false;
            }
            break;
          }
        }
      });

      setPageBreaks(breaks);
    };

    if (measureRef.current) {
      let timeoutId: ReturnType<typeof setTimeout>;

      const debouncedCalculate = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(calculatePageBreaks, 150);
      };

      const resizeObserver = new ResizeObserver(debouncedCalculate);
      resizeObserver.observe(measureRef.current);

      debouncedCalculate();
      
      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
      };
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
          data-export-page="true"
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
          {!isForPrint && (
            <div className="absolute bottom-3 right-4 text-[10px] text-gray-300 font-medium z-50 pointer-events-none select-none">
              {pageIndex + 1} / {totalPages}
            </div>
          )}

          <div
            style={{
              height: PAGE_MARGIN_TOP_PX,
              width: '100%',
              backgroundColor: 'white',
            }}
          />

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

      <div
        id="resume-preview-container"
        className="print:hidden flex flex-col items-center py-8"
        style={{ gap: PAGE_GAP_PX }}
      >
        {renderPages(false)}
      </div>

      <div className="hidden print:block print:w-full print:bg-white">
        {renderPages(true)}
      </div>

    </div>
  );
};

export default LivePreview;