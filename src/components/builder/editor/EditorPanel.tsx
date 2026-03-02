import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BUILDER_EDITOR_SECTION_TABS } from '../../../data/builder';
import type { EditorPanelProps } from '../../../types/builder';
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

const MIN_WIDTH = 360;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 420;

const EditorPanel: React.FC<EditorPanelProps> = ({
  data,
  onPersonalInfoChange,
  onLinksChange,
  onSummaryChange,
  onExperienceChange,
  onEducationChange,
  onVolunteeringChange,
  onProjectsChange,
  onCertificationsChange,
  onSkillsChange,
  onLanguagesChange,
  onAchievementsChange,
}) => {
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  );
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);
  const panelScrollRef = useRef<HTMLDivElement | null>(null);

  const state = useEditorPanelState({
    data,
    onLinksChange,
    onExperienceChange,
    onEducationChange,
    onVolunteeringChange,
    onProjectsChange,
    onCertificationsChange,
    onSkillsChange,
    onLanguagesChange,
    onAchievementsChange,
    onSectionToggle: () => {
      if (panelScrollRef.current) panelScrollRef.current.scrollTop = 0;
    },
  });

  const { openSection, toggle } = state;

  useEffect(() => {
    const onResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      isResizing.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
  }, [isDesktop]);

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
      className="relative flex flex-col bg-[#F6F7F9] border-r border-[#E1E6EE] z-20 shrink-0 h-full min-h-0 overflow-hidden"
      style={{ width: isDesktop ? `${panelWidth}px` : '100%' }}
    >
      <EditorPanelHeader activeSectionLabel={activeSectionLabel} />

      <EditorPanelTabs data={data} openSection={openSection} toggle={toggle} />

      <div
        ref={panelScrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y flex flex-col bg-transparent px-3 py-3 pr-2.5 gap-2.5 pb-6"
      >
        <EditorPersonalSection
          data={data}
          openSection={openSection}
          toggle={toggle}
          onPersonalInfoChange={onPersonalInfoChange}
          state={state}
        />

        <EditorSummarySection
          data={data}
          openSection={openSection}
          toggle={toggle}
          onSummaryChange={onSummaryChange}
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
          data={data}
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

      <EditorPanelResizeHandle onMouseDown={onMouseDown} />
    </div>
  );
};

export default EditorPanel;
