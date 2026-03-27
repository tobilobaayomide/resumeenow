import { useEffect } from 'react';
import {
  SEO_DEFAULT_IMAGE_URL,
  SEO_SITE_NAME,
  buildSeoUrl,
  type SeoStructuredData,
} from '../../lib/seo';

interface SeoProps {
  title: string;
  description: string;
  path?: string;
  robots?: string;
  type?: 'website' | 'article';
  imageUrl?: string;
  imageAlt?: string;
  structuredData?: SeoStructuredData;
}

const JSON_LD_ID = 'page-seo-jsonld';

const ensureMetaTag = (
  selector: string,
  attributes: Record<string, string>,
): HTMLMetaElement => {
  const existing = document.head.querySelector(selector);
  const tag = existing instanceof HTMLMetaElement
    ? existing
    : document.createElement('meta');

  Object.entries(attributes).forEach(([name, value]) => {
    tag.setAttribute(name, value);
  });

  if (!existing) {
    document.head.appendChild(tag);
  }

  return tag;
};

const ensureLinkTag = (
  selector: string,
  attributes: Record<string, string>,
): HTMLLinkElement => {
  const existing = document.head.querySelector(selector);
  const tag = existing instanceof HTMLLinkElement
    ? existing
    : document.createElement('link');

  Object.entries(attributes).forEach(([name, value]) => {
    tag.setAttribute(name, value);
  });

  if (!existing) {
    document.head.appendChild(tag);
  }

  return tag;
};

const Seo = ({
  title,
  description,
  path = '/',
  robots = 'index,follow',
  type = 'website',
  imageUrl = SEO_DEFAULT_IMAGE_URL,
  imageAlt = `${SEO_SITE_NAME} logo`,
  structuredData,
}: SeoProps) => {
  const canonicalUrl = buildSeoUrl(path);
  const structuredDataJson = structuredData ? JSON.stringify(structuredData) : null;

  useEffect(() => {
    document.title = title;

    ensureMetaTag('meta[name="description"]', { name: 'description' }).content = description;
    ensureMetaTag('meta[name="robots"]', { name: 'robots' }).content = robots;

    ensureLinkTag('link[rel="canonical"]', { rel: 'canonical' }).href = canonicalUrl;

    ensureMetaTag('meta[property="og:type"]', { property: 'og:type' }).content = type;
    ensureMetaTag('meta[property="og:site_name"]', { property: 'og:site_name' }).content = SEO_SITE_NAME;
    ensureMetaTag('meta[property="og:title"]', { property: 'og:title' }).content = title;
    ensureMetaTag('meta[property="og:description"]', { property: 'og:description' }).content = description;
    ensureMetaTag('meta[property="og:url"]', { property: 'og:url' }).content = canonicalUrl;
    ensureMetaTag('meta[property="og:image"]', { property: 'og:image' }).content = imageUrl;
    ensureMetaTag('meta[property="og:image:alt"]', { property: 'og:image:alt' }).content = imageAlt;

    ensureMetaTag('meta[name="twitter:card"]', { name: 'twitter:card' }).content = 'summary';
    ensureMetaTag('meta[name="twitter:title"]', { name: 'twitter:title' }).content = title;
    ensureMetaTag('meta[name="twitter:description"]', { name: 'twitter:description' }).content = description;
    ensureMetaTag('meta[name="twitter:image"]', { name: 'twitter:image' }).content = imageUrl;
    ensureMetaTag('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }).content = imageAlt;

    const existingJsonLd = document.getElementById(JSON_LD_ID);
    if (structuredDataJson) {
      const tag = existingJsonLd instanceof HTMLScriptElement
        ? existingJsonLd
        : document.createElement('script');

      tag.id = JSON_LD_ID;
      tag.type = 'application/ld+json';
      tag.text = structuredDataJson;

      if (!existingJsonLd) {
        document.head.appendChild(tag);
      }
    } else if (existingJsonLd) {
      existingJsonLd.remove();
    }
  }, [
    canonicalUrl,
    description,
    imageAlt,
    imageUrl,
    robots,
    structuredDataJson,
    title,
    type,
  ]);

  return null;
};

export default Seo;
