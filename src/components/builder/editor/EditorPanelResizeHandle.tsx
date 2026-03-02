import React from 'react';

interface EditorPanelResizeHandleProps {
  onMouseDown: (event: React.MouseEvent) => void;
}

const EditorPanelResizeHandle: React.FC<EditorPanelResizeHandleProps> = ({
  onMouseDown,
}) => (
  <div
    onMouseDown={onMouseDown}
    className="hidden lg:flex absolute top-0 bottom-0 right-0 w-4 items-center justify-center cursor-col-resize group z-30"
  >
    <div className="absolute top-0 bottom-0 w-px bg-gray-200 group-hover:bg-gray-400 transition-colors" />
    <div className="relative flex flex-col gap-1 pointer-events-none">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-gray-500 transition-colors"
        />
      ))}
    </div>
  </div>
);

export default EditorPanelResizeHandle;
