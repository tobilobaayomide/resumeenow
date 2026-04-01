import test from "node:test";
import assert from "node:assert/strict";
import {
  findMatchingDescriptionBullet,
  formatEditableDescriptionBullets,
  insertDescriptionBulletAtIndex,
  moveDescriptionBullet,
  replaceDescriptionBullet,
  removeDescriptionBulletAtIndex,
  replaceDescriptionBulletAtIndex,
  toEditableDescriptionBullets,
} from "../src/lib/descriptionBullets.js";

test("toEditableDescriptionBullets normalizes prefixed bullets", () => {
  assert.deepEqual(
    toEditableDescriptionBullets("• Built dashboard\n- Reduced churn by 12%"),
    ["Built dashboard", "Reduced churn by 12%"],
  );
});

test("formatEditableDescriptionBullets emits plain ATS-friendly bullet strings", () => {
  assert.equal(
    formatEditableDescriptionBullets([
      " Built dashboard ",
      "",
      "Reduced churn by 12%",
    ]),
    "• Built dashboard\n• Reduced churn by 12%",
  );
});

test("replaceDescriptionBulletAtIndex updates one bullet without affecting others", () => {
  assert.equal(
    replaceDescriptionBulletAtIndex(
      "• Built dashboard\n• Reduced churn by 12%",
      1,
      "Reduced churn by 18%",
    ),
    "• Built dashboard\n• Reduced churn by 18%",
  );
});

test("removeDescriptionBulletAtIndex removes the targeted bullet", () => {
  assert.equal(
    removeDescriptionBulletAtIndex(
      "• Built dashboard\n• Reduced churn by 12%",
      0,
    ),
    "• Reduced churn by 12%",
  );
});

test("insertDescriptionBulletAtIndex inserts at the requested position", () => {
  assert.equal(
    insertDescriptionBulletAtIndex(
      "• Built dashboard\n• Reduced churn by 12%",
      1,
      "Mentored two engineers",
    ),
    "• Built dashboard\n• Mentored two engineers\n• Reduced churn by 12%",
  );
});

test("moveDescriptionBullet reorders bullets", () => {
  assert.equal(
    moveDescriptionBullet(
      "• Built dashboard\n• Reduced churn by 12%\n• Mentored two engineers",
      2,
      0,
    ),
    "• Mentored two engineers\n• Built dashboard\n• Reduced churn by 12%",
  );
});

test("findMatchingDescriptionBullet matches formatted bullets against plain AI text", () => {
  assert.equal(
    findMatchingDescriptionBullet(
      "• Improved **conversion rate** by 12%\n• Shipped onboarding refresh",
      "Improved conversion rate by 12%",
    ),
    "Improved **conversion rate** by 12%",
  );
});

test("replaceDescriptionBullet can replace a formatted bullet using plain comparison text", () => {
  assert.equal(
    replaceDescriptionBullet(
      "• Improved **conversion rate** by 12%\n• Shipped onboarding refresh",
      "Improved conversion rate by 12%",
      "Improved conversion rate by 18%",
    ),
    "• Improved conversion rate by 18%\n• Shipped onboarding refresh",
  );
});
