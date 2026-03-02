export const AI_FLOW_FEATURES = ["ai_tailor", "cover_letter", "ats_audit"] as const;

export type AiFlowFeature = (typeof AI_FLOW_FEATURES)[number];

export interface AiWorkflowItem {
  feature: AiFlowFeature;
  title: string;
  description: string;
}

export const AI_WORKFLOW_ITEMS: AiWorkflowItem[] = [
  {
    feature: "ai_tailor",
    title: "AI Tailor",
    description: "Rewrite your resume for a target job in one click.",
  },
  {
    feature: "ats_audit",
    title: "ATS Audit",
    description: "Scan keyword match and formatting for ATS checks.",
  },
  {
    feature: "cover_letter",
    title: "Cover Letter",
    description: "Generate role-specific cover letters from your resume.",
  },
];

export const isAiFlowFeature = (value: string): value is AiFlowFeature =>
  AI_FLOW_FEATURES.includes(value as AiFlowFeature);
