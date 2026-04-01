import test from "node:test";
import assert from "node:assert/strict";
import {
  applyInlineLinkToSelection,
  applyInlineWrapToSelection,
  parseInlineFormattingSegments,
  renderInlineFormattingHtml,
  stripInlineFormattingText,
} from "../src/lib/inlineFormatting.js";

test("stripInlineFormattingText removes markdown-like markers but keeps visible text", () => {
  assert.equal(
    stripInlineFormattingText(
      "Built **faster** flows with *clearer* docs and [demo](https://example.com).",
    ),
    "Built faster flows with clearer docs and demo.",
  );
});

test("stripInlineFormattingText keeps nested bold and italic readable", () => {
  assert.equal(
    stripInlineFormattingText(
      "Built ***clearer*** flows and **[demo](https://example.com)** results.",
    ),
    "Built clearer flows and demo results.",
  );
});

test("applyInlineWrapToSelection wraps selected text and preserves inner selection", () => {
  const result = applyInlineWrapToSelection(
    "Improved conversion rate",
    9,
    19,
    "**",
    "**",
    "bold text",
  );

  assert.equal(result.nextValue, "Improved **conversion** rate");
  assert.deepEqual(
    { start: result.selectionStart, end: result.selectionEnd },
    { start: 11, end: 21 },
  );
});

test("applyInlineWrapToSelection inserts placeholder text when there is no selection", () => {
  const result = applyInlineWrapToSelection(
    "Improved conversion rate",
    9,
    9,
    "*",
    "*",
    "italic text",
  );

  assert.equal(result.nextValue, "Improved *italic text*conversion rate");
  assert.deepEqual(
    { start: result.selectionStart, end: result.selectionEnd },
    { start: 10, end: 21 },
  );
});

test("applyInlineLinkToSelection wraps the selection in link markdown", () => {
  const result = applyInlineLinkToSelection(
    "View live demo",
    5,
    9,
    "https://example.com/demo",
  );

  assert.equal(
    result.nextValue,
    "View [live](https://example.com/demo) demo",
  );
  assert.deepEqual(
    { start: result.selectionStart, end: result.selectionEnd },
    { start: 6, end: 10 },
  );
});

test("parseInlineFormattingSegments returns ordered inline tokens", () => {
  assert.deepEqual(
    parseInlineFormattingSegments(
      "Built **faster** flows with *clearer* docs and [demo](example.com).",
    ),
    [
      { type: "text", text: "Built " },
      { type: "bold", text: "faster" },
      { type: "text", text: " flows with " },
      { type: "italic", text: "clearer" },
      { type: "text", text: " docs and " },
      { type: "link", text: "demo", url: "example.com" },
      { type: "text", text: "." },
    ],
  );
});

test("parseInlineFormattingSegments supports nested bold-italic and linked emphasis", () => {
  assert.deepEqual(
    parseInlineFormattingSegments(
      "Built ***faster*** flows with **[demo](example.com)** links.",
    ),
    [
      { type: "text", text: "Built " },
      { type: "boldItalic", text: "faster" },
      { type: "text", text: " flows with " },
      { type: "bold", text: "[demo](example.com)" },
      { type: "text", text: " links." },
    ],
  );
});

test("renderInlineFormattingHtml turns stored inline markers into safe display markup", () => {
  assert.equal(
    renderInlineFormattingHtml(
      "Built **faster** flows with *clearer* docs and [demo](https://example.com).",
    ),
    'Built <strong>faster</strong> flows with <em>clearer</em> docs and <a href="https://example.com" data-link-url="https://example.com">demo</a>.',
  );
});

test("renderInlineFormattingHtml preserves nested formatting combinations", () => {
  assert.equal(
    renderInlineFormattingHtml(
      "Built ***faster*** flows with **[demo](https://example.com)**.",
    ),
    'Built <strong><em>faster</em></strong> flows with <strong><a href="https://example.com" data-link-url="https://example.com">demo</a></strong>.',
  );
});
