import React, { useEffect, useId, useReducer, useRef, useState } from "react";
import {
  FiAlignLeft,
  FiArrowDown,
  FiArrowUp,
  FiLink,
  FiList,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import type { DescriptionBulletEditorProps } from "../../../types/builder";
import {
  formatEditableDescriptionBullets,
  normalizeDescriptionBulletText,
  toEditableDescriptionBullets,
} from "../../../lib/descriptionBullets";
import {
  renderInlineFormattingHtml,
  serializeInlineFormattingRoot,
} from "../../../lib/inlineFormatting";

const buildInitialBulletDrafts = (value: string): string[] => {
  const bullets = toEditableDescriptionBullets(value);
  return bullets.length > 0 ? bullets : [""];
};

const isSelectionWithinRoot = (root: HTMLElement): boolean => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  return root.contains(range.startContainer) && root.contains(range.endContainer);
};

const placeCaretAtEnd = (root: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
};

const getSelectionOffsets = (
  root: HTMLElement,
): { start: number; end: number } | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
    return null;
  }

  const prefixRange = range.cloneRange();
  prefixRange.selectNodeContents(root);
  prefixRange.setEnd(range.startContainer, range.startOffset);

  const start = prefixRange.toString().length;
  return { start, end: start + range.toString().length };
};

const getTextNodePoint = (root: HTMLElement, targetOffset: number) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = Math.max(targetOffset, 0);
  let lastNode: Text | null = null;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    lastNode = node;
    const length = node.textContent?.length ?? 0;
    if (remaining <= length) {
      return { node, offset: remaining };
    }
    remaining -= length;
  }

  if (!lastNode) return null;
  return { node: lastNode, offset: lastNode.textContent?.length ?? 0 };
};

const getElementOffsets = (
  root: HTMLElement,
  element: HTMLElement,
): { start: number; end: number } | null => {
  if (!root.contains(element)) return null;

  const elementRange = document.createRange();
  elementRange.selectNodeContents(element);

  const prefixRange = document.createRange();
  prefixRange.selectNodeContents(root);
  prefixRange.setEnd(elementRange.startContainer, elementRange.startOffset);

  const start = prefixRange.toString().length;
  return { start, end: start + elementRange.toString().length };
};

const restoreSelectionOffsets = (
  root: HTMLElement,
  start: number,
  end: number,
) => {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  const startPoint = getTextNodePoint(root, start);
  const endPoint = getTextNodePoint(root, end);

  if (!startPoint || !endPoint) {
    range.selectNodeContents(root);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    return;
  }

  range.setStart(startPoint.node, startPoint.offset);
  range.setEnd(endPoint.node, endPoint.offset);
  selection.removeAllRanges();
  selection.addRange(range);
};

const insertPlainTextAtSelection = (root: HTMLElement, text: string) => {
  root.focus();

  if (!isSelectionWithinRoot(root)) {
    placeCaretAtEnd(root);
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const fragment = document.createDocumentFragment();
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  lines.forEach((line, lineIndex) => {
    if (line) {
      fragment.append(document.createTextNode(line));
    }

    if (lineIndex < lines.length - 1) {
      fragment.append(document.createElement("br"));
    }
  });

  if (!fragment.childNodes.length) {
    return;
  }

  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  const nextRange = document.createRange();
  if (lastNode?.nodeType === Node.TEXT_NODE) {
    nextRange.setStart(lastNode, lastNode.textContent?.length ?? 0);
  } else if (lastNode) {
    nextRange.setStartAfter(lastNode);
  } else {
    nextRange.selectNodeContents(root);
    nextRange.collapse(false);
  }
  nextRange.collapse(true);

  selection.removeAllRanges();
  selection.addRange(nextRange);
};

const findClosestAnchor = (node: Node | null): HTMLAnchorElement | null => {
  if (!node) return null;
  if (node instanceof HTMLAnchorElement) return node;
  if (node.nodeType === Node.ELEMENT_NODE) {
    return (node as Element).closest("a") as HTMLAnchorElement | null;
  }
  return (node.parentElement?.closest("a") as HTMLAnchorElement | null) ?? null;
};

const runEditorCommand = (command: string, value?: string) => {
  document.execCommand("styleWithCSS", false, "false");
  document.execCommand(command, false, value);
};

type LinkPopoverState = {
  index: number;
  url: string;
  selection: { start: number; end: number };
  linkRange: { start: number; end: number } | null;
  canApply: boolean;
};

type ActiveInlineFormattingState = {
  bold: boolean;
  italic: boolean;
  link: boolean;
};

const EMPTY_ACTIVE_FORMATTING: ActiveInlineFormattingState = {
  bold: false,
  italic: false,
  link: false,
};

const draftBulletsReducer = (_state: string[], nextState: string[]) => nextState;

const DescriptionBulletEditor: React.FC<DescriptionBulletEditorProps> = ({
  label,
  placeholder,
  value,
  onChange,
  minRows = 3,
  maxBullets,
  allowRawMode = true,
  name,
  id,
}) => {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const textareaName = name ?? textareaId;
  const lastCommittedValueRef = useRef(value);
  const draftBulletsRef = useRef<string[]>(buildInitialBulletDrafts(value));
  const editorRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pendingFocusIndexRef = useRef<number | null>(null);
  const pendingSelectionRef = useRef<{
    start: number;
    end: number;
  } | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const lastFocusedLinkPopoverKeyRef = useRef<string | null>(null);
  const [isRawMode, setIsRawMode] = useState(false);
  const [activeEditorIndex, setActiveEditorIndex] = useState<number | null>(null);
  const [activeInlineFormatting, setActiveInlineFormatting] =
    useState<ActiveInlineFormattingState>(EMPTY_ACTIVE_FORMATTING);
  const [linkPopoverState, setLinkPopoverState] =
    useState<LinkPopoverState | null>(null);
  const [draftBullets, setDraftBullets] = useReducer(
    draftBulletsReducer,
    value,
    buildInitialBulletDrafts,
  );

  useEffect(() => {
    if (value === lastCommittedValueRef.current) return;

    const nextDraftBullets = buildInitialBulletDrafts(value);
    lastCommittedValueRef.current = value;
    draftBulletsRef.current = nextDraftBullets;
    setDraftBullets(nextDraftBullets);
  }, [value]);

  useEffect(() => {
    if (isRawMode) return;

    const pendingFocusIndex = pendingFocusIndexRef.current;
    if (pendingFocusIndex == null) return;

    const editor = editorRefs.current[pendingFocusIndex];
    if (!editor) return;

    pendingFocusIndexRef.current = null;
    editor.focus();
    const pendingSelection = pendingSelectionRef.current;
    if (pendingSelection) {
      pendingSelectionRef.current = null;
      restoreSelectionOffsets(
        editor,
        pendingSelection.start,
        pendingSelection.end,
      );
      return;
    }

    placeCaretAtEnd(editor);
  }, [draftBullets, isRawMode]);

  useEffect(() => {
    if (isRawMode) return;

    draftBullets.forEach((bullet, index) => {
      const editor = editorRefs.current[index];
      if (!editor) return;
      if (serializeInlineFormattingRoot(editor) === bullet) return;
      editor.innerHTML = renderInlineFormattingHtml(bullet);
    });
  }, [draftBullets, isRawMode]);

  useEffect(() => {
    if (!linkPopoverState) {
      lastFocusedLinkPopoverKeyRef.current = null;
      return;
    }

    const focusKey = `${linkPopoverState.index}:${linkPopoverState.linkRange?.start ?? -1}:${linkPopoverState.linkRange?.end ?? -1}`;
    if (lastFocusedLinkPopoverKeyRef.current === focusKey) return;
    lastFocusedLinkPopoverKeyRef.current = focusKey;

    const input = linkInputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [linkPopoverState]);

  useEffect(() => {
    if (isRawMode || activeEditorIndex == null) return;

    const updateSelectionFormatting = () => {
      const editor = editorRefs.current[activeEditorIndex];
      if (!editor || !isSelectionWithinRoot(editor)) {
        setActiveInlineFormatting(EMPTY_ACTIVE_FORMATTING);
        return;
      }

      const selection = window.getSelection();
      const linkActive = Boolean(
        findClosestAnchor(selection?.anchorNode ?? null) ??
          findClosestAnchor(selection?.focusNode ?? null),
      );

      setActiveInlineFormatting({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        link: linkActive,
      });
    };

    document.addEventListener("selectionchange", updateSelectionFormatting);
    return () => {
      document.removeEventListener("selectionchange", updateSelectionFormatting);
    };
  }, [activeEditorIndex, isRawMode]);

  const commitBulletDrafts = (nextDraftBullets: string[]) => {
    const nextValue = formatEditableDescriptionBullets(nextDraftBullets);
    if (nextValue === lastCommittedValueRef.current) return;
    lastCommittedValueRef.current = nextValue;
    onChange(nextValue);
  };

  const syncDraftBullets = (nextDraftBullets: string[]) => {
    draftBulletsRef.current = nextDraftBullets;
    setDraftBullets(nextDraftBullets);
  };

  const requestBulletFocus = (
    index: number,
    selection?: { start: number; end: number },
  ) => {
    pendingFocusIndexRef.current = Math.max(0, index);
    pendingSelectionRef.current = selection ?? null;
  };

  const commitDraftBullet = (index: number, nextBullet: string) => {
    const nextDraftBullets = [...draftBulletsRef.current];
    nextDraftBullets[index] = nextBullet;
    syncDraftBullets(nextDraftBullets);

    if (
      nextDraftBullets.every((bullet) => normalizeDescriptionBulletText(bullet))
    ) {
      commitBulletDrafts(nextDraftBullets);
    }
  };

  const syncBulletFromEditor = (index: number) => {
    const editor = editorRefs.current[index];
    if (!editor) return;

    commitDraftBullet(index, serializeInlineFormattingRoot(editor));
  };

  const handleBulletBlur = (index: number) => {
    syncBulletFromEditor(index);

    const nextDraftBullets = draftBulletsRef.current.filter((bullet) =>
      normalizeDescriptionBulletText(bullet),
    );
    const resolvedDraftBullets =
      nextDraftBullets.length > 0 ? nextDraftBullets : [""];

    syncDraftBullets(resolvedDraftBullets);
    commitBulletDrafts(nextDraftBullets);
  };

  const handleAddBullet = () => {
    setIsRawMode(false);
    if (
      typeof maxBullets === "number" &&
      draftBulletsRef.current.length >= maxBullets
    ) {
      return;
    }

    const nextIndex = draftBulletsRef.current.length;
    syncDraftBullets([...draftBulletsRef.current, ""]);
    requestBulletFocus(nextIndex);
  };

  const handleRemoveBullet = (index: number) => {
    if (activeEditorIndex === index) {
      setActiveEditorIndex(null);
      setActiveInlineFormatting(EMPTY_ACTIVE_FORMATTING);
    } else if (activeEditorIndex != null && activeEditorIndex > index) {
      setActiveEditorIndex(activeEditorIndex - 1);
    }

    setLinkPopoverState((current) => {
      if (!current) return current;
      if (current.index === index) return null;
      if (current.index > index) {
        return { ...current, index: current.index - 1 };
      }
      return current;
    });

    const nextDraftBullets = draftBulletsRef.current.filter(
      (_bullet, bulletIndex) => bulletIndex !== index,
    );
    const resolvedDraftBullets =
      nextDraftBullets.length > 0 ? nextDraftBullets : [""];

    syncDraftBullets(resolvedDraftBullets);
    commitBulletDrafts(nextDraftBullets);
    requestBulletFocus(Math.max(0, index - 1));
  };

  const handleMoveBullet = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draftBulletsRef.current.length) {
      return;
    }

    if (activeEditorIndex === index) {
      setActiveEditorIndex(targetIndex);
    } else if (activeEditorIndex === targetIndex) {
      setActiveEditorIndex(index);
    }

    setLinkPopoverState((current) => {
      if (!current) return current;
      if (current.index === index) {
        return { ...current, index: targetIndex };
      }
      if (current.index === targetIndex) {
        return { ...current, index };
      }
      return current;
    });

    const nextDraftBullets = [...draftBulletsRef.current];
    const [movedBullet] = nextDraftBullets.splice(index, 1);
    nextDraftBullets.splice(targetIndex, 0, movedBullet);
    syncDraftBullets(nextDraftBullets);
    commitBulletDrafts(nextDraftBullets);
    requestBulletFocus(targetIndex);
  };

  const handleRawChange = (nextValue: string) => {
    lastCommittedValueRef.current = nextValue;
    onChange(nextValue);
  };

  const toggleRawMode = () => {
    if (isRawMode) {
      const nextDraftBullets = buildInitialBulletDrafts(value);
      syncDraftBullets(nextDraftBullets);
      commitBulletDrafts(nextDraftBullets);
      setIsRawMode(false);
      requestBulletFocus(0);
      return;
    }

    setLinkPopoverState(null);
    setActiveInlineFormatting(EMPTY_ACTIVE_FORMATTING);
    setIsRawMode(true);
  };

  const handleBulletKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      runEditorCommand("insertLineBreak");
      syncBulletFromEditor(index);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (
        typeof maxBullets === "number" &&
        draftBulletsRef.current.length >= maxBullets
      ) {
        return;
      }

      const nextDraftBullets = [...draftBulletsRef.current];
      nextDraftBullets.splice(index + 1, 0, "");
      syncDraftBullets(nextDraftBullets);
      requestBulletFocus(index + 1);
      return;
    }

    if (
      event.key === "Backspace" &&
      !normalizeDescriptionBulletText(
        serializeInlineFormattingRoot(event.currentTarget),
      )
    ) {
      if (draftBulletsRef.current.length <= 1) {
        return;
      }

      event.preventDefault();

      const nextDraftBullets = draftBulletsRef.current.filter(
        (_bullet, bulletIndex) => bulletIndex !== index,
      );
      syncDraftBullets(nextDraftBullets);
      commitBulletDrafts(nextDraftBullets);
      requestBulletFocus(Math.max(0, index - 1));
    }
  };

  const handleToolbarMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const focusEditorSelection = (editor: HTMLDivElement) => {
    editor.focus();

    if (!isSelectionWithinRoot(editor)) {
      placeCaretAtEnd(editor);
    }
  };

  const syncActiveFormattingForEditor = (index: number) => {
    const editor = editorRefs.current[index];
    setActiveEditorIndex(index);

    if (!editor || !isSelectionWithinRoot(editor)) {
      setActiveInlineFormatting(EMPTY_ACTIVE_FORMATTING);
      return;
    }

    const selection = window.getSelection();
    const linkActive = Boolean(
      findClosestAnchor(selection?.anchorNode ?? null) ??
        findClosestAnchor(selection?.focusNode ?? null),
    );

    setActiveInlineFormatting({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      link: linkActive,
    });
  };

  const handleBold = (index: number) => {
    const editor = editorRefs.current[index];
    if (!editor) return;

    focusEditorSelection(editor);
    runEditorCommand("bold");
    syncBulletFromEditor(index);
    syncActiveFormattingForEditor(index);
  };

  const handleItalic = (index: number) => {
    const editor = editorRefs.current[index];
    if (!editor) return;

    focusEditorSelection(editor);
    runEditorCommand("italic");
    syncBulletFromEditor(index);
    syncActiveFormattingForEditor(index);
  };

  const handleLink = (index: number) => {
    const editor = editorRefs.current[index];
    if (!editor) return;

    const currentSelection =
      getSelectionOffsets(editor) ??
      (() => {
        const contentLength = editor.textContent?.length ?? 0;
        return { start: contentLength, end: contentLength };
      })();
    const selection = window.getSelection();
    const existingLink =
      findClosestAnchor(selection?.anchorNode ?? null) ??
      findClosestAnchor(selection?.focusNode ?? null);

    setLinkPopoverState({
      index,
      url:
        existingLink?.getAttribute("data-link-url") ||
        existingLink?.getAttribute("href") ||
        "https://",
      selection: currentSelection,
      linkRange: existingLink ? getElementOffsets(editor, existingLink) : null,
      canApply:
        Boolean(existingLink) || currentSelection.start !== currentSelection.end,
    });
  };

  const closeLinkPopover = () => {
    const activeState = linkPopoverState;
    setLinkPopoverState(null);

    if (!activeState) return;
    requestBulletFocus(activeState.index, activeState.selection);
  };

  const handleLinkUrlChange = (nextUrl: string) => {
    setLinkPopoverState((current) =>
      current ? { ...current, url: nextUrl } : current,
    );
  };

  const handleApplyLink = () => {
    const activeState = linkPopoverState;
    if (!activeState) return;

    const editor = editorRefs.current[activeState.index];
    if (!editor) return;

    const trimmedUrl = activeState.url.trim();
    if (!trimmedUrl || !activeState.canApply) return;

    const targetSelection = activeState.linkRange ?? activeState.selection;
    restoreSelectionOffsets(editor, targetSelection.start, targetSelection.end);
    focusEditorSelection(editor);
    runEditorCommand("createLink", trimmedUrl);

    const selection = window.getSelection();
    const link =
      findClosestAnchor(selection?.anchorNode ?? null) ??
      findClosestAnchor(selection?.focusNode ?? null);
    if (link) {
      link.setAttribute("href", trimmedUrl);
      link.setAttribute("data-link-url", trimmedUrl);
    }

    syncBulletFromEditor(activeState.index);
    setLinkPopoverState(null);
    requestBulletFocus(activeState.index, targetSelection);
    syncActiveFormattingForEditor(activeState.index);
  };

  const handleRemoveLink = () => {
    const activeState = linkPopoverState;
    if (!activeState?.linkRange) {
      closeLinkPopover();
      return;
    }

    const editor = editorRefs.current[activeState.index];
    if (!editor) return;

    restoreSelectionOffsets(
      editor,
      activeState.linkRange.start,
      activeState.linkRange.end,
    );
    runEditorCommand("unlink");
    syncBulletFromEditor(activeState.index);
    setLinkPopoverState(null);
    requestBulletFocus(activeState.index, activeState.linkRange);
    syncActiveFormattingForEditor(activeState.index);
  };

  const handleBulletInput = (index: number) => {
    syncBulletFromEditor(index);
    syncActiveFormattingForEditor(index);
  };

  const handleBulletPaste = (
    event: React.ClipboardEvent<HTMLDivElement>,
    index: number,
  ) => {
    event.preventDefault();

    const editor = editorRefs.current[index];
    if (!editor) return;

    insertPlainTextAtSelection(
      editor,
      event.clipboardData.getData("text/plain"),
    );
    syncBulletFromEditor(index);
    syncActiveFormattingForEditor(index);
  };

  const showAddBulletAction =
    typeof maxBullets !== "number" || draftBullets.length < maxBullets;

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        {label ? (
          <label
            htmlFor={textareaId}
            className="block text-[10.5px] font-semibold text-gray-500 tracking-wide"
          >
            {label}
          </label>
        ) : (
          <span />
        )}

        {allowRawMode ? (
          <button
            type="button"
            onClick={toggleRawMode}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-semibold tracking-wide text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
          >
            {isRawMode ? <FiList size={11} /> : <FiAlignLeft size={11} />}
            {isRawMode ? "Structured Bullets" : "Raw Text"}
          </button>
        ) : null}
      </div>

      {isRawMode ? (
        <textarea
          id={textareaId}
          name={textareaName}
          value={value}
          onChange={(event) => handleRawChange(event.target.value)}
          placeholder={placeholder}
          rows={Math.max(minRows + 2, 6)}
          className="
            w-full px-3 py-2.5 rounded-lg text-[12.5px]
            bg-white border border-gray-200
            text-gray-800 placeholder:text-gray-300
            focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300
            hover:border-gray-300
            transition-all duration-150
            resize-y leading-relaxed scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]
          "
        />
      ) : (
        <div className="space-y-2">
          {draftBullets.map((bullet, index) => (
            <div
              key={`${textareaId}-bullet-${index}`}
              className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-start gap-2.5">
                <div className="pt-2 text-[12px] font-bold text-gray-400">
                  •
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="relative">
                    {!normalizeDescriptionBulletText(bullet) ? (
                      <span
                        className="pointer-events-none absolute left-3 top-2 text-[12.5px] leading-relaxed text-gray-300"
                        aria-hidden="true"
                      >
                        {placeholder ||
                          "Describe what you delivered, how you did it, and the outcome."}
                      </span>
                    ) : null}

                    <div
                      id={index === 0 ? textareaId : undefined}
                      role="textbox"
                      aria-multiline="true"
                      contentEditable
                      suppressContentEditableWarning
                      spellCheck
                      ref={(node) => {
                        editorRefs.current[index] = node;
                      }}
                      onFocus={() => syncActiveFormattingForEditor(index)}
                      onInput={() => handleBulletInput(index)}
                      onKeyUp={() => syncActiveFormattingForEditor(index)}
                      onMouseUp={() => syncActiveFormattingForEditor(index)}
                      onKeyDown={(event) => handleBulletKeyDown(event, index)}
                      onBlur={() => {
                        handleBulletBlur(index);
                        if (linkPopoverState?.index !== index) {
                          setActiveInlineFormatting(EMPTY_ACTIVE_FORMATTING);
                        }
                      }}
                      onPaste={(event) => handleBulletPaste(event, index)}
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest("a")) {
                          event.preventDefault();
                        }
                      }}
                      data-name={
                        index === 0
                          ? textareaName
                          : `${textareaName}-bullet-${index + 1}`
                      }
                      className="
                        relative z-[1] w-full rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2 text-[12.5px] leading-relaxed text-gray-800
                        whitespace-pre-wrap break-words [overflow-wrap:anywhere]
                        transition-all duration-150
                        hover:border-gray-300 hover:bg-white
                        focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300
                        [&_a]:text-inherit [&_a]:underline [&_a]:decoration-current [&_a]:underline-offset-2
                      "
                      style={{ minHeight: `${Math.max(minRows, 2) * 1.65}rem` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onMouseDown={handleToolbarMouseDown}
                      onClick={() => handleBold(index)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold tracking-wide transition-colors ${
                        activeEditorIndex === index && activeInlineFormatting.bold
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                      aria-pressed={
                        activeEditorIndex === index && activeInlineFormatting.bold
                      }
                    >
                      <span className="text-[11px] font-black">B</span>
                      Bold
                    </button>
                    <button
                      type="button"
                      onMouseDown={handleToolbarMouseDown}
                      onClick={() => handleItalic(index)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold tracking-wide transition-colors ${
                        activeEditorIndex === index && activeInlineFormatting.italic
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                      aria-pressed={
                        activeEditorIndex === index && activeInlineFormatting.italic
                      }
                    >
                      <span className="text-[11px] italic font-semibold">I</span>
                      Italic
                    </button>
                    <button
                      type="button"
                      onMouseDown={handleToolbarMouseDown}
                      onClick={() => handleLink(index)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold tracking-wide transition-colors ${
                        activeEditorIndex === index && activeInlineFormatting.link
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                      aria-pressed={
                        activeEditorIndex === index && activeInlineFormatting.link
                      }
                    >
                      <FiLink size={11} />
                      Link
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveBullet(index, -1)}
                      disabled={index === 0}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[10px] font-semibold tracking-wide text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiArrowUp size={11} />
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveBullet(index, 1)}
                      disabled={index === draftBullets.length - 1}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[10px] font-semibold tracking-wide text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiArrowDown size={11} />
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveBullet(index)}
                      disabled={draftBullets.length === 1 && !bullet.trim()}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiTrash2 size={11} />
                      Delete
                    </button>
                  </div>

                  {linkPopoverState?.index === index ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50/90 p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-2 min-w-0 flex-1">
                          <label className="block text-[10px] font-semibold tracking-wide text-gray-500">
                            {linkPopoverState.linkRange ? "Edit Link" : "Add Link"}
                          </label>
                          <input
                            ref={linkInputRef}
                            type="url"
                            inputMode="url"
                            value={linkPopoverState.url}
                            onChange={(event) =>
                              handleLinkUrlChange(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                handleApplyLink();
                              }

                              if (event.key === "Escape") {
                                event.preventDefault();
                                closeLinkPopover();
                              }
                            }}
                            placeholder="https://example.com"
                            className="
                              w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-800 placeholder:text-gray-300
                              focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300
                            "
                          />
                        </div>

                        <button
                          type="button"
                          onClick={closeLinkPopover}
                          className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-1.5 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600"
                          aria-label="Close link editor"
                        >
                          <FiX size={12} />
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleApplyLink}
                          disabled={
                            !linkPopoverState.url.trim() || !linkPopoverState.canApply
                          }
                          className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FiLink size={11} />
                          {linkPopoverState.linkRange ? "Update Link" : "Add Link"}
                        </button>
                        {linkPopoverState.linkRange ? (
                          <button
                            type="button"
                            onClick={handleRemoveLink}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-100 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50"
                          >
                            <FiTrash2 size={11} />
                            Remove Link
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={closeLinkPopover}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>

                      {!linkPopoverState.canApply ? (
                        <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
                          Select text in the bullet first, then add a link.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-3 py-2.5">
            <p className="text-[10.5px] leading-relaxed text-gray-500">
              Keep each bullet focused on one outcome, tool, or measurable win.
            </p>

            {showAddBulletAction ? (
              <button
                type="button"
                onClick={handleAddBullet}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-[10.5px] font-semibold tracking-wide text-white transition-colors hover:bg-black"
              >
                <FiPlus size={11} />
                Add Bullet
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default DescriptionBulletEditor;
