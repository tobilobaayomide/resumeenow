import test from "node:test";
import assert from "node:assert/strict";
import {
  PAGE_HEIGHT_PX,
  PAGE_PADDING_BOTTOM_PX,
  PAGE_PADDING_TOP_PX,
  calculatePageBreaksFromUnits,
  mergeRectFragmentsIntoLineUnits,
} from "../src/components/builder/preview/pagination.js";

const CONTENT_HEIGHT_PER_PAGE =
  PAGE_HEIGHT_PX - PAGE_PADDING_TOP_PX - PAGE_PADDING_BOTTOM_PX;

test("calculatePageBreaksFromUnits breaks at the next line instead of moving a whole paragraph block", () => {
  const lineUnits = [
    { top: CONTENT_HEIGHT_PER_PAGE - 42, bottom: CONTENT_HEIGHT_PER_PAGE - 24 },
    { top: CONTENT_HEIGHT_PER_PAGE - 24, bottom: CONTENT_HEIGHT_PER_PAGE - 6 },
    { top: CONTENT_HEIGHT_PER_PAGE, bottom: CONTENT_HEIGHT_PER_PAGE + 18 },
  ];

  assert.deepEqual(calculatePageBreaksFromUnits(lineUnits, false, 0), [
    0,
    CONTENT_HEIGHT_PER_PAGE,
  ]);
});

test("calculatePageBreaksFromUnits still moves keep-together sized blocks as a whole", () => {
  const blockUnits = [
    { top: CONTENT_HEIGHT_PER_PAGE - 42, bottom: CONTENT_HEIGHT_PER_PAGE + 18 },
  ];

  assert.deepEqual(calculatePageBreaksFromUnits(blockUnits, false, 0), [
    0,
    CONTENT_HEIGHT_PER_PAGE - 42,
  ]);
});

test("mergeRectFragmentsIntoLineUnits merges inline fragments that share one visual line", () => {
  assert.deepEqual(
    mergeRectFragmentsIntoLineUnits([
      { top: 20, bottom: 34, left: 0, right: 48 },
      { top: 20.4, bottom: 34.2, left: 52, right: 112 },
      { top: 40, bottom: 54, left: 0, right: 72 },
    ]),
    [
      { top: 20, bottom: 34.2 },
      { top: 40, bottom: 54 },
    ],
  );
});
