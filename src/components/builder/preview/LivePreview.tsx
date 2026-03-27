import React, { useEffect, useRef } from 'react';
import { HtmlTemplateDocument } from './HtmlTemplateDocument';
import type { LivePreviewProps } from '../../../types/builder';
import {
  getBuilderAiHighlightAnchor,
  getBuilderAiHighlightCount,
  hasBuilderAiHighlights,
} from '../../../lib/builder/aiHighlights';
import { useBuilderStore } from '../../../store/builderStore';

const LivePreview: React.FC<LivePreviewProps> = ({
  data,
  zoom = 0.8,
  templateId = 'executive',
  allowPan = false,
}) => {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const recentAiHighlights = useBuilderStore((store) => store.recentAiHighlights);
  const aiHighlightFocus = useBuilderStore((store) => store.aiHighlightFocus);
  const aiHighlightFocusNonce = useBuilderStore((store) => store.aiHighlightFocusNonce);
  const clearAiHighlights = useBuilderStore((store) => store.clearAiHighlights);
  const requestAiHighlightFocus = useBuilderStore((store) => store.requestAiHighlightFocus);
  const highlightCount = getBuilderAiHighlightCount(recentAiHighlights);
  const hasHighlights = hasBuilderAiHighlights(recentAiHighlights);

  useEffect(() => {
    if (!aiHighlightFocus || !previewRef.current) return;

    let frameId = 0;
    frameId = window.requestAnimationFrame(() => {
      const anchor = getBuilderAiHighlightAnchor(aiHighlightFocus);
      const target = Array.from(
        previewRef.current?.querySelectorAll<HTMLElement>(
          `[data-ai-highlight-anchor="${anchor}"]`,
        ) ?? [],
      ).find(
        (node) => node.closest('[data-preview-measurement="true"]') === null,
      );

      target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [aiHighlightFocus, aiHighlightFocusNonce]);

  return (
    <div
      ref={previewRef}
      className={`${allowPan ? 'w-max min-w-full lg:w-full' : 'w-full'} relative bg-[#525659]`}
    >
      {hasHighlights && (
        <div className="pointer-events-none fixed inset-x-3 top-[5.5rem] z-30 lg:absolute lg:left-1/2 lg:right-auto lg:top-4 lg:inset-x-auto lg:z-20 lg:-translate-x-1/2">
          <div className="pointer-events-auto flex w-full max-w-sm flex-col gap-2 rounded-2xl border border-amber-200/80 bg-white/95 px-3 py-2 text-[11px] font-medium text-gray-700 shadow-lg backdrop-blur-sm lg:w-auto lg:max-w-none lg:flex-row lg:items-center lg:gap-2 lg:rounded-full lg:px-3 lg:py-1.5">
            <span className="min-w-0 text-center lg:text-left">
              {highlightCount} recent AI change{highlightCount === 1 ? '' : 's'}
            </span>
            <div className="flex w-full items-center gap-2 lg:w-auto">
              <button
                type="button"
                onClick={() => requestAiHighlightFocus()}
                className="flex-1 rounded-full bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700 transition-colors hover:bg-amber-100 lg:flex-none lg:py-1"
              >
                Jump
              </button>
              <button
                type="button"
                onClick={clearAiHighlights}
                className="flex-1 rounded-full px-2.5 py-1.5 text-[10px] font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:flex-none lg:py-1"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`relative flex flex-col ${allowPan ? 'items-start lg:items-center' : 'items-center'} py-8`}
      >
        <HtmlTemplateDocument
          data={data}
          templateId={templateId}
          zoom={zoom}
          withShadow
          aiHighlights={hasHighlights ? recentAiHighlights : undefined}
        />
      </div>
    </div>
  );
};

export default LivePreview;
