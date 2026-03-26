import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BUILDER_EDITOR_SECTION_TABS } from '../../../data/builder';
import EditorPanelHeader from './EditorPanelHeader';
import EditorPanelResizeHandle from './EditorPanelResizeHandle';
import EditorPanelTabs from './EditorPanelTabs';
import {
  EditorAchievementsSection,
  EditorCertificationsSection,
  EditorEducationSection,
  EditorExperienceSection,
  EditorLanguagesSection,
  EditorPersonalSection,
  EditorProjectsSection,
  EditorSkillsSection,
  EditorSummarySection,
  EditorVolunteeringSection,
} from './sections';
import { useEditorPanelState } from './useEditorPanelState';
import { getBuilderAiHighlightAnchor } from '../../../lib/builder/aiHighlights';
import { useBuilderStore } from '../../../store/builderStore';

const MIN_WIDTH = 550;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 550;

const EditorPanel: React.FC = () => {
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  );
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);
  const panelScrollRef = useRef<HTMLDivElement | null>(null);
  const aiHighlightFocus = useBuilderStore((store) => store.aiHighlightFocus);
  const aiHighlightFocusNonce = useBuilderStore((store) => store.aiHighlightFocusNonce);

  const state = useEditorPanelState(() => {
    if (panelScrollRef.current) panelScrollRef.current.scrollTop = 0;
  });

  const data = state.data;
  const { openSection, toggle } = state;

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      isResizing.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
  }, [isDesktop]);

  useEffect(() => {
    if (!aiHighlightFocus || !panelScrollRef.current) return;

    let frameId = 0;
    frameId = window.requestAnimationFrame(() => {
      const anchor = getBuilderAiHighlightAnchor(aiHighlightFocus);
      const target = panelScrollRef.current?.querySelector<HTMLElement>(
        `[data-ai-highlight-anchor="${anchor}"]`,
      );

      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [aiHighlightFocus, aiHighlightFocusNonce, openSection, state.resolvedActiveExperienceId]);

  const onMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!isDesktop) return;
      event.preventDefault();
      isResizing.current = true;
      startX.current = event.clientX;
      startWidth.current = panelWidth;

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      const onMouseMove = (mouseEvent: MouseEvent) => {
        if (!isResizing.current) return;
        const delta = mouseEvent.clientX - startX.current;
        const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
        setPanelWidth(newWidth);
      };

      const onMouseUp = () => {
        isResizing.current = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [isDesktop, panelWidth],
  );

  const activeSectionLabel =
    BUILDER_EDITOR_SECTION_TABS.find((tab) => tab.id === openSection)?.label ?? 'Section';

  return (
    <div
      className="relative z-20 flex shrink-0 flex-col overflow-visible bg-[#F8F9FB] border-r border-gray-100 min-h-full md:h-full md:min-h-0 md:overflow-hidden"
      style={{ width: isDesktop ? `${panelWidth}px` : '100%' }}
    >
      {/* Header */}
      <EditorPanelHeader activeSectionLabel={activeSectionLabel} />

      {/* Section tabs */}
      <EditorPanelTabs data={data} openSection={openSection} toggle={toggle} />

      {/* Scrollable content */}
      <div
        ref={panelScrollRef}
        className="flex flex-col gap-2 bg-transparent px-3 py-3 pb-24 md:flex-1 md:min-h-0 md:overflow-y-auto md:overflow-x-hidden md:overscroll-contain md:touch-pan-y md:pb-8"
      >
        <EditorPersonalSection
          data={data}
          openSection={openSection}
          toggle={toggle}
          state={state}
        />
        <EditorSummarySection
          data={data}
          openSection={openSection}
          toggle={toggle}
          state={state}
        />
        <EditorExperienceSection
          data={data}
          openSection={openSection}
          toggle={toggle}
          state={state}
        />
        <EditorEducationSection
          data={data}
          openSection={openSection}
          toggle={toggle}
          state={state}
        />
        <EditorVolunteeringSection
          data={data}
          openSection={openSection}
          toggle={toggle}
          state={state}
        />
        <EditorProjectsSection
          data={data}
          openSection={openSection}
          toggle={toggle}
          state={state}
        />
        <EditorSkillsSection
          openSection={openSection}
          toggle={toggle}
          state={state}
        />
        <EditorLanguagesSection
          data={data}
          openSection={openSection}
          toggle={toggle}
          state={state}
        />
        <EditorAchievementsSection
          data={data}
          openSection={openSection}
          toggle={toggle}
          state={state}
        />
        <EditorCertificationsSection
          data={data}
          openSection={openSection}
          toggle={toggle}
          state={state}
        />
      </div>

      {/* Drag-to-resize handle — desktop only */}
      <EditorPanelResizeHandle onMouseDown={onMouseDown} />
    </div>
  );
};

export default EditorPanel;
