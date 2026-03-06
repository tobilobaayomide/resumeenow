import React, { useId } from "react";
import { FiCalendar, FiChevronDown, FiPlus, FiX } from "react-icons/fi";
import type {
  EditorAddButtonProps,
  EditorCardProps,
  EditorDateRowProps,
  EditorInputProps,
  EditorItemSwitcherProps,
  EditorSectionProps,
  EditorTextareaProps,
} from "../../../types/builder";
import { handleHorizontalWheelScroll } from "./utils";

export const Input: React.FC<EditorInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  name,
  id,
}) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputName = name ?? inputId;

  return (
    <div className="min-w-0 space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[10.5px] font-semibold text-gray-500 tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={inputName}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full h-9 px-3 rounded-lg text-[12.5px] font-medium
          bg-white border border-gray-200
          text-gray-800 placeholder:text-gray-300
          focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300
          hover:border-gray-300
          transition-all duration-150
        "
      />
    </div>
  );
};

export const Textarea: React.FC<EditorTextareaProps> = ({
  label,
  placeholder,
  value,
  onChange,
  maxLength,
  name,
  id,
}) => {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const textareaName = name ?? textareaId;
  const charCount = value?.length ?? 0;

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[10.5px] font-semibold text-gray-500 tracking-wide"
          >
            {label}
          </label>
        )}
        {maxLength && (
          <span
            className={`text-[10px] font-medium tabular-nums ${
              charCount > maxLength * 0.9 ? "text-amber-500" : "text-gray-300"
            }`}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={textareaId}
        name={textareaName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="
          w-full px-3 py-2.5 rounded-lg text-[12.5px]
          bg-white border border-gray-200
          text-gray-800 placeholder:text-gray-300
          focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300
          hover:border-gray-300
          transition-all duration-150
          resize-y min-h-60 leading-relaxed scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]
        "
      />
    </div>
  );
};

export const DateRow: React.FC<EditorDateRowProps> = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}) => {
  const startId = useId();
  const endId = useId();

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1.5">
        <label
          htmlFor={startId}
          className="block text-[10.5px] font-semibold text-gray-500 tracking-wide"
        >
          Start
        </label>
        <div className="relative">
          <FiCalendar
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
            size={11}
          />
          <input
            id={startId}
            name="start-date"
            type="text"
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
            placeholder="Jan 2022"
            className="
              w-full h-9 pl-7 pr-3 rounded-lg text-[12px]
              bg-white border border-gray-200
              text-gray-700 placeholder:text-gray-300
              focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300
              hover:border-gray-300 transition-all duration-150
            "
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor={endId}
          className="block text-[10.5px] font-semibold text-gray-500 tracking-wide"
        >
          End
        </label>
        <div className="relative">
          <FiCalendar
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
            size={11}
          />
          <input
            id={endId}
            name="end-date"
            type="text"
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
            placeholder="Present"
            className="
              w-full h-9 pl-7 pr-3 rounded-lg text-[12px]
              bg-white border border-gray-200
              text-gray-700 placeholder:text-gray-300
              focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300
              hover:border-gray-300 transition-all duration-150
            "
          />
        </div>
      </div>
    </div>
  );
};

export const Section: React.FC<EditorSectionProps> = ({
  sectionId,
  icon,
  label,
  isOpen,
  onToggle,
  children,
  count,
}) => {
  if (!isOpen) return null;

  return (
    <div
      data-editor-section={sectionId}
      className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3.5 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
            <span className="text-white">
              {React.cloneElement(icon, { size: 12 })}
            </span>
          </div>
          <span className="font-bold text-gray-900 text-[13px] tracking-tight">
            {label}
          </span>
          {count !== undefined && count > 0 && (
            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        <FiChevronDown
          size={14}
          className="text-gray-400 transition-transform duration-200 rotate-180 shrink-0"
        />
      </button>

      <div
        className="border-t border-gray-100 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]"
        style={{ maxHeight: "70vh", scrollbarWidth: "none" }}
      >
        <div className="px-3.5 pb-4 pt-3">{children}</div>
      </div>
    </div>
  );
};

export const AddButton: React.FC<EditorAddButtonProps> = ({
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="
      w-full h-9 mt-2 rounded-lg border border-dashed border-gray-300
      bg-transparent text-[11.5px] font-semibold text-gray-500
      hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50
      transition-all duration-150 flex items-center justify-center gap-1.5
    "
  >
    <FiPlus size={13} />
    {label}
  </button>
);

export const ItemSwitcher: React.FC<EditorItemSwitcherProps> = ({
  title,
  items,
  activeId,
  onSelect,
  onRemove,
}) => (
  <div className="space-y-1.5">
    <label className="block text-[10.5px] font-semibold text-gray-500 tracking-wide">
      {title}
    </label>
    <div
      className="flex items-center gap-1.5 overflow-x-auto overflow-y-hidden pb-1 touch-pan-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]"
      onWheel={handleHorizontalWheelScroll}
      style={{ scrollbarWidth: "none" }}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`
            group flex items-center min-w-0 shrink-0 rounded-lg border transition-all duration-150
            ${
              activeId === item.id
                ? "bg-gray-900 border-gray-900 text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }
          `}
        >
          <button
            onClick={() => onSelect(item.id)}
            className="font-semibold whitespace-nowrap truncate px-2.5 py-1.5 text-[11px] max-w-35"
            title={item.label}
          >
            {index + 1}. {item.label}
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className={`
              mr-1 rounded-md flex items-center justify-center transition-all w-5 h-5
              ${
                activeId === item.id
                  ? "text-white/50 hover:text-white hover:bg-white/10"
                  : "text-gray-300 hover:text-red-500 hover:bg-red-50"
              }
            `}
            aria-label={`Remove ${item.label}`}
          >
            <FiX size={10} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

export const Card: React.FC<EditorCardProps> = ({
  label,
  index,
  onRemove,
  children,
}) => (
  <div className="group relative border border-gray-200 bg-gray-50/50 rounded-xl px-3.5 py-3 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wide">
        {label} {index + 1}
      </span>
      <button
        onClick={onRemove}
        className="
          opacity-0 group-hover:opacity-100
          flex items-center justify-center rounded-lg
          w-6 h-6 text-gray-300
          hover:text-red-500 hover:bg-red-50
          transition-all duration-150
        "
      >
        <FiX size={11} />
      </button>
    </div>
    {children}
  </div>
);
