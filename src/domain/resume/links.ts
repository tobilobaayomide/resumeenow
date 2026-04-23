import type { ResumeLinkItem, ResumePersonalInfo } from "./types.js";

const normalizeLinkUrl = (value: string): string => value.trim();
const EXTERNAL_LINK_PROTOCOL_PATTERN = /^(https?:\/\/|mailto:|tel:)/i;
const HAS_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

export const toExternalLinkHref = (value: string): string => {
  const url = normalizeLinkUrl(value);
  if (!url) return "";
  if (EXTERNAL_LINK_PROTOCOL_PATTERN.test(url)) return url;
  if (HAS_SCHEME_PATTERN.test(url)) return "";
  return `https://${url}`;
};

const inferLinkLabelFromUrl = (url: string): string => {
  const lower = normalizeLinkUrl(url).toLowerCase();
  if (!lower) return "Link";
  if (lower.includes("linkedin.com")) return "LinkedIn";
  if (lower.includes("github.com")) return "GitHub";
  if (lower.includes("gitlab.com")) return "GitLab";
  if (lower.includes("behance.net")) return "Behance";
  if (lower.includes("dribbble.com")) return "Dribbble";
  if (lower.includes("portfolio")) return "Portfolio";
  if (lower.includes("netlify.app") || lower.includes("vercel.app")) return "Portfolio";
  return "Link";
};

export const getPersonalLinkDisplayLabel = (link: ResumeLinkItem): string => {
  const explicitLabel = link.label.trim();
  if (explicitLabel) return explicitLabel;
  return inferLinkLabelFromUrl(link.url);
};

export const getVisiblePersonalLinks = (
  personalInfo: ResumePersonalInfo,
): ResumeLinkItem[] => {
  const links: ResumeLinkItem[] = [];
  const seen = new Set<string>();

  const websiteUrl = normalizeLinkUrl(personalInfo.website);
  if (websiteUrl) {
    links.push({
      id: "link-website",
      label: "Portfolio",
      url: websiteUrl,
    });
    seen.add(websiteUrl.toLowerCase());
  }

  for (const link of personalInfo.links) {
    const url = normalizeLinkUrl(link.url);
    if (!url) continue;

    const key = url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    links.push({
      id: link.id,
      label: link.label.trim(),
      url,
    });
  }

  return links;
};
