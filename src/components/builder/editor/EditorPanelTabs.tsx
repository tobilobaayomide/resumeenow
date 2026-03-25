import React, { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { BUILDER_EDITOR_SECTION_TABS } from "../../../data/builder";
import { getActiveSkillItems } from "../../../types/resume";
import type { EditorPanelState } from "./useEditorPanelState";
import type { ResumeData } from "../../../types/resume";
import { handleHorizontalWheelScroll } from "./utils";

interface EditorPanelTabsProps {
  data: ResumeData;
  openSection: EditorPanelState["openSection"];
  toggle: EditorPanelState["toggle"];
}

const EditorPanelTabs: React.FC<EditorPanelTabsProps> = ({
  data,
  openSection,
  toggle,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  });

  const syncScrollState = () => {
    const node = scrollRef.current;
    if (!node) return;

    const hasOverflow = node.scrollWidth > node.clientWidth + 8;
    const canScrollLeft = node.scrollLeft > 4;
    const canScrollRight =
      node.scrollLeft + node.clientWidth < node.scrollWidth - 4;

    setScrollState((current) => {
      if (
        current.hasOverflow === hasOverflow &&
        current.canScrollLeft === canScrollLeft &&
        current.canScrollRight === canScrollRight
      ) {
        return current;
      }

      return {
        hasOverflow,
        canScrollLeft,
        canScrollRight,
      };
    });
  };

  useEffect(() => {
    syncScrollState();
  });

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => syncScrollState())
        : null;

    resizeObserver?.observe(node);
    window.addEventListener("resize", syncScrollState);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncScrollState);
    };
  }, []);

  const scrollTabs = (direction: "left" | "right") => {
    const node = scrollRef.current;
    if (!node) return;

    node.scrollBy({
      left: direction === "left" ? -180 : 180,
      behavior: "smooth",
    });
  };

  return (
    <div className="shrink-0 border-b border-gray-100 bg-white">
      <div className="relative">
        {scrollState.canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-white via-white/95 to-transparent" />
        )}
        {scrollState.canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-white via-white/95 to-transparent" />
        )}

        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden touch-pan-x scroll-smooth"
          onWheel={handleHorizontalWheelScroll}
          onScroll={syncScrollState}
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex items-center gap-1 min-w-max px-3 py-2.5">
            {BUILDER_EDITOR_SECTION_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = openSection === tab.id;

              const itemCount = tab.countField
                ? tab.countField === "skills"
                  ? getActiveSkillItems(data.skills).length
                  : data[tab.countField as keyof ResumeData] instanceof Array
                    ? (data[tab.countField as keyof ResumeData] as unknown[])
                        .length
                    : undefined
                : undefined;

              return (
                <button
                  key={tab.id}
                  onClick={() => toggle(tab.id)}
                  className={`
                    relative inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full
                    text-[11px] font-semibold transition-all duration-150 shrink-0
                    ${
                      isActive
                        ? "bg-gray-900 text-white shadow-sm"
                        : "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon size={11} />
                  <span>{tab.label}</span>

                  {typeof itemCount === "number" && itemCount > 0 && (
                    <span
                      className={`
                        inline-flex items-center justify-center min-w-4 h-4 px-1
                        rounded-full text-[9px] font-bold leading-none
                        ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-gray-200 text-gray-500"
                        }
                      `}
                    >
                      {itemCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {scrollState.hasOverflow && (
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/80 px-3 py-1.5">
          <p className="min-w-0 text-[10px] font-medium text-gray-400">
            Swipe or use the arrows to reach more sections.
          </p>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => scrollTabs("left")}
              disabled={!scrollState.canScrollLeft}
              aria-label="Scroll section tabs left"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <FiChevronLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => scrollTabs("right")}
              disabled={!scrollState.canScrollRight}
              aria-label="Scroll section tabs right"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <FiChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPanelTabs;
