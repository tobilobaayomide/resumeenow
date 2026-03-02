import type { LandingStepItem } from "../../types/landing";

export const LANDING_STEP_ROTATION_MS = 5200;

export const LANDING_STEP_ITEMS: LandingStepItem[] = [
  {
    number: "01",
    title: "Start from upload or template",
    description:
      "Upload a PDF to parse sections automatically, or pick a template to start from scratch.",
    video: "/loops/step-01.mp4",
  },
  {
    number: "02",
    title: "Edit with live preview",
    description:
      "Update every section in the editor and watch the resume preview respond instantly.",
    video: "/loops/step-02.mp4",
  },
  {
    number: "03",
    title: "Run AI and ship",
    description:
      "Use AI Tailor, ATS Audit, and Cover Letter workflows, then save and export your final resume.",
    video: "/loops/step-03.mp4",
  },
];
