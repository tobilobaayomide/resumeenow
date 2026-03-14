import React from "react";

interface EditorPanelResizeHandleProps {
  onMouseDown: (event: React.MouseEvent) => void;
}

const EditorPanelResizeHandle: React.FC<EditorPanelResizeHandleProps> = ({
  onMouseDown,
}) => (
  <div
    onMouseDown={onMouseDown}
    className="hidden lg:flex absolute top-0 bottom-0 right-0 w-3 items-center justify-center cursor-col-resize group z-30"
  >
    <div className="absolute top-0 bottom-0 right-0 w-0.75 bg-transparent group-hover:bg-gray-200 group-active:bg-gray-400 transition-all duration-150" />

    <div
      className="
      relative z-10 flex flex-col items-center justify-center gap-0.75
      w-0.75 h-10 rounded-full
      opacity-0 group-hover:opacity-100
      transition-all duration-150
      pointer-events-none
    "
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="w-0.75 h-0.75 rounded-full bg-gray-400 group-active:bg-gray-600 transition-colors"
        />
      ))}
    </div>
  </div>
);

export default EditorPanelResizeHandle;
