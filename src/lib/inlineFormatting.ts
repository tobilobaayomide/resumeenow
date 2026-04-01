export type InlineFormattingSegment =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "boldItalic"; text: string }
  | { type: "link"; text: string; url: string };

export type SelectionTransformResult = {
  nextValue: string;
  selectionStart: number;
  selectionEnd: number;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const clampSelectionIndex = (value: number, textLength: number): number =>
  Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), textLength);

const replaceSelection = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  replacement: string,
  nextSelectionStart: number,
  nextSelectionEnd: number,
): SelectionTransformResult => {
  const start = clampSelectionIndex(selectionStart, value.length);
  const end = clampSelectionIndex(selectionEnd, value.length);
  const orderedStart = Math.min(start, end);
  const orderedEnd = Math.max(start, end);

  return {
    nextValue:
      value.slice(0, orderedStart) + replacement + value.slice(orderedEnd),
    selectionStart: orderedStart + nextSelectionStart,
    selectionEnd: orderedStart + nextSelectionEnd,
  };
};

type ParseResult = {
  segments: InlineFormattingSegment[];
  index: number;
  closed: boolean;
  closeStart: number;
};

const parseLinkSegment = (
  value: string,
  startIndex: number,
): { segment: InlineFormattingSegment; nextIndex: number } | null => {
  if (value[startIndex] !== "[") return null;

  const closeBracketIndex = value.indexOf("]", startIndex + 1);
  if (closeBracketIndex < 0 || value[closeBracketIndex + 1] !== "(") {
    return null;
  }

  const closeParenIndex = value.indexOf(")", closeBracketIndex + 2);
  if (closeParenIndex < 0) {
    return null;
  }

  return {
    segment: {
      type: "link",
      text: value.slice(startIndex + 1, closeBracketIndex),
      url: value.slice(closeBracketIndex + 2, closeParenIndex).trim(),
    },
    nextIndex: closeParenIndex + 1,
  };
};

const parseInlineFormattingRange = (
  value: string,
  startIndex = 0,
  stopToken?: string,
): ParseResult => {
  const segments: InlineFormattingSegment[] = [];
  let textBuffer = "";
  let index = startIndex;

  const flushText = () => {
    if (!textBuffer) return;
    segments.push({ type: "text", text: textBuffer });
    textBuffer = "";
  };

  while (index < value.length) {
    if (stopToken && value.startsWith(stopToken, index)) {
      flushText();
      return {
        segments,
        index: index + stopToken.length,
        closed: true,
        closeStart: index,
      };
    }

    const linkMatch = parseLinkSegment(value, index);
    if (linkMatch) {
      flushText();
      segments.push(linkMatch.segment);
      index = linkMatch.nextIndex;
      continue;
    }

    if (value.startsWith("***", index)) {
      const inner = parseInlineFormattingRange(value, index + 3, "***");
      if (inner.closed) {
        flushText();
        segments.push({
          type: "boldItalic",
          text: value.slice(index + 3, inner.closeStart),
        });
        index = inner.index;
        continue;
      }
    }

    if (value.startsWith("**", index)) {
      const inner = parseInlineFormattingRange(value, index + 2, "**");
      if (inner.closed) {
        flushText();
        segments.push({
          type: "bold",
          text: value.slice(index + 2, inner.closeStart),
        });
        index = inner.index;
        continue;
      }
    }

    if (value.startsWith("*", index)) {
      const inner = parseInlineFormattingRange(value, index + 1, "*");
      if (inner.closed) {
        flushText();
        segments.push({
          type: "italic",
          text: value.slice(index + 1, inner.closeStart),
        });
        index = inner.index;
        continue;
      }
    }

    textBuffer += value[index];
    index += 1;
  }

  flushText();

  return {
    segments,
    index,
    closed: false,
    closeStart: index,
  };
};

export const parseInlineFormattingSegments = (
  value: string,
): InlineFormattingSegment[] => {
  if (!value) return [];
  return parseInlineFormattingRange(value).segments;
};

const renderInlineFormattingSegmentsToHtml = (
  segments: InlineFormattingSegment[],
): string =>
  segments
    .map((segment) => {
      if (segment.type === "text") {
        return escapeHtml(segment.text);
      }

      if (segment.type === "bold") {
        return `<strong>${renderInlineFormattingHtml(segment.text)}</strong>`;
      }

      if (segment.type === "italic") {
        return `<em>${renderInlineFormattingHtml(segment.text)}</em>`;
      }

      if (segment.type === "boldItalic") {
        return `<strong><em>${renderInlineFormattingHtml(
          segment.text,
        )}</em></strong>`;
      }

      const safeUrl = escapeHtml(segment.url.trim());
      return `<a href="${safeUrl}" data-link-url="${safeUrl}">${renderInlineFormattingHtml(
        segment.text,
      )}</a>`;
    })
    .join("");

export const renderInlineFormattingHtml = (value: string): string =>
  renderInlineFormattingSegmentsToHtml(parseInlineFormattingSegments(value));

const flattenInlineFormattingSegments = (
  segments: InlineFormattingSegment[],
): string =>
  segments
    .map((segment) => {
      if (segment.type === "text") {
        return segment.text;
      }

      return flattenInlineFormattingSegments(
        parseInlineFormattingSegments(segment.text),
      );
    })
    .join("");

export const stripInlineFormattingText = (value: string): string =>
  flattenInlineFormattingSegments(parseInlineFormattingSegments(value));

const serializeInlineFormattingNode = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.replace(/\u00a0/g, " ") ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();
  const childText = Array.from(element.childNodes)
    .map((childNode) => serializeInlineFormattingNode(childNode))
    .join("");

  if (tagName === "strong" || tagName === "b") {
    return `**${childText}**`;
  }

  if (tagName === "em" || tagName === "i") {
    return `*${childText}*`;
  }

  if (tagName === "a") {
    const url =
      element.getAttribute("data-link-url") ||
      element.getAttribute("href") ||
      "";
    return `[${childText}](${url})`;
  }

  if (tagName === "br") {
    return "\n";
  }

  return childText;
};

export const serializeInlineFormattingRoot = (root: HTMLElement): string =>
  Array.from(root.childNodes)
    .map((childNode) => serializeInlineFormattingNode(childNode))
    .join("");

export const applyInlineWrapToSelection = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string,
  placeholder: string,
): SelectionTransformResult => {
  const start = clampSelectionIndex(selectionStart, value.length);
  const end = clampSelectionIndex(selectionEnd, value.length);
  const orderedStart = Math.min(start, end);
  const orderedEnd = Math.max(start, end);
  const selectedText = value.slice(orderedStart, orderedEnd);

  if (selectedText) {
    const replacement = `${prefix}${selectedText}${suffix}`;
    return replaceSelection(
      value,
      orderedStart,
      orderedEnd,
      replacement,
      prefix.length,
      prefix.length + selectedText.length,
    );
  }

  const replacement = `${prefix}${placeholder}${suffix}`;
  return replaceSelection(
    value,
    orderedStart,
    orderedEnd,
    replacement,
    prefix.length,
    prefix.length + placeholder.length,
  );
};

export const applyInlineLinkToSelection = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  url: string,
  placeholder = "link text",
): SelectionTransformResult => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return {
      nextValue: value,
      selectionStart,
      selectionEnd,
    };
  }

  const start = clampSelectionIndex(selectionStart, value.length);
  const end = clampSelectionIndex(selectionEnd, value.length);
  const orderedStart = Math.min(start, end);
  const orderedEnd = Math.max(start, end);
  const selectedText = value.slice(orderedStart, orderedEnd) || placeholder;
  const replacement = `[${selectedText}](${trimmedUrl})`;

  return replaceSelection(
    value,
    orderedStart,
    orderedEnd,
    replacement,
    1,
    1 + selectedText.length,
  );
};
