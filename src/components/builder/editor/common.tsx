import React, { useId } from 'react';
import {
  FiCalendar,
  FiChevronDown,
  FiPlus,
  FiX,
} from 'react-icons/fi';
import type {
  EditorAddButtonProps,
  EditorCardProps,
  EditorDateRowProps,
  EditorInputProps,
  EditorItemSwitcherProps,
  EditorSectionProps,
  EditorTextareaProps,
} from '../../../types/builder';
import { handleHorizontalWheelScroll } from './utils';

export const Input: React.FC<EditorInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  name,
  id,
}) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputName = name ?? inputId;

  return (
    <div className="min-w-0 space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-[10px] font-semibold text-gray-500">
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={inputName}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 bg-white border border-[#E4E8F0] rounded-xl text-[12px] text-gray-800 font-medium placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40 focus:ring-2 focus:ring-[#0F172A]/10 transition-all"
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

  return (
    <div className="min-w-0 space-y-1">
      {label && (
        <label htmlFor={textareaId} className="block text-[10px] font-semibold text-gray-500">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        name={textareaName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2.5 bg-white border border-[#E4E8F0] rounded-xl text-[12px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40 focus:ring-2 focus:ring-[#0F172A]/10 transition-all resize-y min-h-24 leading-relaxed"
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div className="space-y-1">
        <label htmlFor={startId} className="block text-[10px] font-semibold text-gray-500">
          Start
        </label>
        <div className="relative">
          <FiCalendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" size={11} />
          <input
            id={startId}
            name="start-date"
            type="text"
            value={startDate}
            onChange={(event) => onStartChange(event.target.value)}
            placeholder="Jan 2022"
            className="w-full h-9 pl-7 pr-3 bg-white border border-[#E4E8F0] rounded-xl text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40 focus:ring-2 focus:ring-[#0F172A]/10 transition-all"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor={endId} className="block text-[10px] font-semibold text-gray-500">
          End
        </label>
        <div className="relative">
          <FiCalendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" size={11} />
          <input
            id={endId}
            name="end-date"
            type="text"
            value={endDate}
            onChange={(event) => onEndChange(event.target.value)}
            placeholder="Present"
            className="w-full h-9 pl-7 pr-3 bg-white border border-[#E4E8F0] rounded-xl text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#0F172A]/40 focus:ring-2 focus:ring-[#0F172A]/10 transition-all"
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
      className="rounded-xl border border-[#E3E8EF] bg-white transition-colors overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between bg-white hover:bg-[#FAFBFD] transition-colors px-3.5 py-3"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg flex items-center justify-center transition-colors bg-[#EEF2F7] text-[#0F172A] w-7 h-7">
            {React.cloneElement(icon, { size: 13 })}
          </div>
          <span className="font-semibold text-gray-800 text-[13px]">{label}</span>
          {count !== undefined && count > 0 && (
            <span className="bg-[#F4F6FA] text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#E3E8EF]">
              {count}
            </span>
          )}
        </div>
        <FiChevronDown size={14} className="text-gray-400 transition-transform duration-200 rotate-180" />
      </button>
      <div className="bg-white border-t border-[#EDF0F6] px-3.5 pb-3.5 pt-2.5">{children}</div>
    </div>
  );
};

export const AddButton: React.FC<EditorAddButtonProps> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full h-9 mt-2 rounded-xl border border-[#DEE4ED] bg-white font-semibold text-[11px] text-gray-600 hover:text-gray-900 hover:border-[#C9D2DE] hover:bg-[#F8FAFD] transition-all flex items-center justify-center gap-1.5"
  >
    <FiPlus size={13} /> {label}
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
    <label className="block text-[10px] font-semibold text-gray-500">{title}</label>
    <div
      className="flex items-center gap-1.5 overflow-x-auto overflow-y-hidden pb-1 touch-pan-x"
      onWheel={handleHorizontalWheelScroll}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`group flex items-center min-w-0 shrink-0 rounded-lg border transition-colors ${
            activeId === item.id
              ? 'bg-[#111827] border-[#111827] text-white shadow-sm'
              : 'bg-white border-[#DEE4EF] text-gray-600 hover:border-[#C7D0DE]'
          }`}
        >
          <button
            onClick={() => onSelect(item.id)}
            className="font-semibold whitespace-nowrap truncate px-2.5 py-1.5 text-[11px] max-w-45"
            title={item.label}
          >
            {index + 1}. {item.label}
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className={`mr-1 rounded-md flex items-center justify-center transition-colors w-6 h-6 ${
              activeId === item.id
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            aria-label={`Remove ${item.label}`}
          >
            <FiX size={11} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

export const Card: React.FC<EditorCardProps> = ({ label, index, onRemove, children }) => (
  <div className="group relative border border-[#E6EAF1] bg-[#FCFDFE] rounded-xl px-3 py-2.5 space-y-2.5">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] font-semibold text-gray-500">
        {label} {index + 1}
      </span>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all w-6 h-6"
      >
        <FiX size={12} />
      </button>
    </div>
    {children}
  </div>
);
