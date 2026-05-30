import { useEffect } from 'react';
import { setSsrMeta } from './serverMeta';

const SITE_ORIGIN = 'https://suncoastpoolpros.com';
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/pool-service-st-petersburg-hero.jpg`;

// `window` is undefined in Node — used to detect whether we're rendering on
// the server (where we populate the serverMeta singleton) vs. the client
// (where useEffect updates the real DOM head). Vite externalizes this for SSR.
const IS_SERVER = typeof window === 'undefined';

type PageMeta = {
  title: string;
  description: string;
  /** Path-only (e.g. "/treasure-island-fl") or omit for homepage. */
  canonicalPath?: string;
  /** Absolute URL or path. Defaults to the St. Pete hero. */
  ogImage?: string;
};

const setTag = (selector: string, attrName: 'name' | 'property', attrValue: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  const created = !el;
  const prev = el?.getAttribute('content') ?? null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return { el, created, prev };
};

const setLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  const created = !el;
  const prev = el?.getAttribute('href') ?? null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return { el, created, prev };
};

/**
 * Sets per-page <title>, description, canonical, and Open Graph / Twitter tags
 * for the duration the route is mounted. Restores previous values on unmount so
 * the index.html defaults aren't permanently overwritten when SPA navigation
 * moves away.
 *
 * Accepts the legacy 2-arg signature (title, description) for back-compat with
 * existing callers; new callers should pass the object form for canonical/OG.
 */
export function usePageMeta(meta: PageMeta): void;
export function usePageMeta(title: string, description: string): void;
export function usePageMeta(metaOrTitle: PageMeta | string, maybeDesc?: string) {
  const meta: PageMeta =
    typeof metaOrTitle === 'string'
      ? { title: metaOrTitle, description: maybeDesc ?? '' }
      : metaOrTitle;

  const { title, description, canonicalPath, ogImage } = meta;
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath ?? '/'}`;
  const image = ogImage
    ? ogImage.startsWith('http')
      ? ogImage
      : `${SITE_ORIGIN}${ogImage}`
    : DEFAULT_OG_IMAGE;

  // Server: populate the SSR meta singleton during render. The prerender script
  // reads this after renderToString and writes it into the static HTML head.
  if (IS_SERVER) {
    setSsrMeta({ title, description, canonicalUrl, ogImage: image });
  }

  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const desc = setTag('meta[name="description"]', 'name', 'description', description);
    const canon = setLink('canonical', canonicalUrl);
    const ogTitle = setTag('meta[property="og:title"]', 'property', 'og:title', title);
    const ogDesc = setTag('meta[property="og:description"]', 'property', 'og:description', description);
    const ogUrl = setTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    const ogType = setTag('meta[property="og:type"]', 'property', 'og:type', 'website');
    const ogImg = setTag('meta[property="og:image"]', 'property', 'og:image', image);
    const twCard = setTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    const twTitle = setTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    const twDesc = setTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    const twImg = setTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    const restore = [desc, ogTitle, ogDesc, ogUrl, ogType, ogImg, twCard, twTitle, twDesc, twImg];

    return () => {
      document.title = prevTitle;
      for (const r of restore) {
        if (r.created) r.el.remove();
        else if (r.prev !== null) r.el.setAttribute('content', r.prev);
      }
      if (canon.created) canon.el.remove();
      else if (canon.prev !== null) canon.el.setAttribute('href', canon.prev);
    };
  }, [title, description, canonicalUrl, image]);
}
