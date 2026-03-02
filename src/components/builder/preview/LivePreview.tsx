import React, { useRef, useState, useEffect } from 'react';
import TemplateRenderer from '../templates/TemplateRenderer'; 
import type { LivePreviewProps } from '../../../types/builder';

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const PAGE_GAP_PX = 24;

const PAGE_MARGIN_TOP_PX = 57;
const PAGE_MARGIN_BOTTOM_PX = 57;
const PAGE_MARGIN_SIDE_PX = 57;

const CONTENT_HEIGHT_PER_PAGE = A4_HEIGHT_PX - PAGE_MARGIN_TOP_PX - PAGE_MARGIN_BOTTOM_PX;

const LivePreview: React.FC<LivePreviewProps> = ({ data, zoom = 0.8, templateId = 'executive' }) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageBreaks, setPageBreaks] = useState<number[]>([0]);

  useEffect(() => {
    const calculatePageBreaks = () => {
      if (!measureRef.current) return;

      const container = measureRef.current;
      const containerTop = container.getBoundingClientRect().top;

      // Get ALL smallest visible elements - these are the actual text/content nodes
      const allElements = Array.from(
        container.querySelectorAll<HTMLElement>(
          'p, h1, h2, h3, h4, h5, h6, li, td, th, span, div'
        )
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        const hasHeight = rect.height > 0;
        
        // CRITICAL FIX: Use textContent. innerText fails on hidden elements.
        const hasText = (el.textContent || '').trim().length > 0;
        
        // Exclude elements that are just wrappers (have block children)
        const hasBlockChildren = Array.from(el.children).some((child) => {
          const style = window.getComputedStyle(child);
          return style.display === 'block' || style.display === 'flex' || style.display === 'grid';
        });
        
        return hasHeight && hasText && !hasBlockChildren;
      });

      const breaks: number[] = [0];
      let currentPageStart = 0;

      allElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const elTop = rect.top - containerTop;
        const elBottom = rect.bottom - containerTop;

        // How far is the bottom of this element from the start of the current page?
        const relativeBottom = elBottom - currentPageStart;

        if (relativeBottom > CONTENT_HEIGHT_PER_PAGE) {
          const newPageStart = elTop;

          if (newPageStart > currentPageStart) {
            breaks.push(newPageStart);
            currentPageStart = newPageStart;
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

      return (
        <div
          key={pageIndex}
          style={isForPrint ? {
            width: '100%',
            height: `${A4_HEIGHT_PX}px`,
            overflow: 'hidden',
            position: 'relative',
            pageBreakAfter: pageIndex < totalPages - 1 ? 'always' : 'auto',
            breakAfter: pageIndex < totalPages - 1 ? 'page' : 'auto',
            backgroundColor: 'white',
          } : {
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            width: A4_WIDTH_PX,
            height: A4_HEIGHT_PX,
            marginBottom: zoom < 1 ? `${(A4_HEIGHT_PX * zoom) - A4_HEIGHT_PX}px` : 0,
          }}
          className={isForPrint ? '' : 'relative bg-white shadow-2xl shrink-0'}
        >
          {/* Page Number Badge (Screen Only) */}
          {!isForPrint && (
            <div className="absolute bottom-3 right-4 text-[10px] text-gray-300 font-medium z-50 pointer-events-none select-none">
              {pageIndex + 1} / {totalPages}
            </div>
          )}

          {/* TOP MARGIN */}
          <div style={{ height: PAGE_MARGIN_TOP_PX, width: '100%', backgroundColor: 'white' }} />

          {/* CONTENT AREA */}
          <div
            style={{
              height: CONTENT_HEIGHT_PER_PAGE,
              overflow: 'hidden',
              paddingLeft: PAGE_MARGIN_SIDE_PX,
              paddingRight: PAGE_MARGIN_SIDE_PX,
            }}
          >
            <div style={{ marginTop: `-${pageStart}px` }}>
              <TemplateRenderer templateId={templateId} data={data} />
            </div>
          </div>

          {/* BOTTOM MARGIN */}
          <div style={{ height: PAGE_MARGIN_BOTTOM_PX, width: '100%', backgroundColor: 'white' }} />
        </div>
      );
    });
  };

  return (
    <div className="w-full bg-[#525659] print:bg-white print:p-0 print:m-0">

      {/* ============================================================
          HIDDEN MEASUREMENT DIV
          CRITICAL FIX: Using opacity: 0 instead of visibility: hidden
          so the browser still calculates text heights perfectly.
      ============================================================ */}
      <div
        style={{
          width: A4_WIDTH_PX,
          position: 'absolute',
          top: 0,
          left: -9999,
          opacity: 0, 
          pointerEvents: 'none',
          paddingLeft: PAGE_MARGIN_SIDE_PX,
          paddingRight: PAGE_MARGIN_SIDE_PX,
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
