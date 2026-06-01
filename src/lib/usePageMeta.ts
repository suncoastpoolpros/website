import { useEffect } from 'react';
import { setSsrMeta } from './serverMeta';

const SITE_ORIGIN = 'https://suncoastpoolpros.com';

// `window` is undefined in Node — used to detect whether we're rendering on
// the server (where we populate the serverMeta singleton) vs. the client
// (where useEffect updates the real DOM head). Vite externalizes this for SSR.
const IS_SERVER = typeof window === 'undefined';

type PageMeta = {
  title: string;
  description: string;
  /** Path-only (e.g. "/treasure-island-fl") or omit for homepage. */
  canonicalPath?: string;
  /** Deprecated/ignored: link shares no longer emit og:image (no preview photo).
   *  Kept so existing callers compile; the value is not used. */
  ogImage?: string;
  /** Per-page LCP hero to preload (server-injected). Lets each route preload
   *  its own hero rather than the global default in index.html. */
  heroPreload?: { mobile: string; desktop: string; wide?: string };
  /** Per-page above-the-fold font files to preload, so each route preloads only
   *  the weights it actually paints. A string preloads unconditionally; use
   *  `{ href, media }` to scope a font to a viewport (e.g. a desktop-only
   *  decorative font shouldn't preload on mobile). See FONTS. */
  fontPreload?: Array<string | { href: string; media: string }>;
  /** Keep this page out of search results (transactional/thank-you pages).
   *  Emits <meta name="robots" content="noindex,follow"> — page stays
   *  crawlable and prerendered, just not indexed. */
  noindex?: boolean;
};

/** Named font weights, so pages declare above-the-fold fonts semantically.
 *  Inter = body (--font-sans), Montserrat = display (--font-display),
 *  Caveat = script accent. */
export const FONTS = {
  inter400: '/fonts/inter-400.woff2',
  inter600: '/fonts/inter-600.woff2',
  inter700: '/fonts/inter-700.woff2',
  montserrat400: '/fonts/montserrat-400.woff2',
  montserrat700: '/fonts/montserrat-700.woff2',
  montserrat900: '/fonts/montserrat-900.woff2',
  caveat700: '/fonts/caveat-700.woff2',
} as const;

/** Above-the-fold fonts shared by every page (the Navbar): body semibold +
 *  the display weight used in the nav. Pages spread this then add hero weights. */
export const NAV_FONTS = [FONTS.inter600, FONTS.montserrat700];

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

  const { title, description, canonicalPath, heroPreload, fontPreload, noindex } = meta;
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath ?? '/'}`;

  // Server: populate the SSR meta singleton during render. The prerender script
  // reads this after renderToString and writes it into the static HTML head.
  // No og:image is emitted — link shares render as a plain card with no photo.
  if (IS_SERVER) {
    setSsrMeta({ title, description, canonicalUrl, heroPreload, fontPreload, noindex });
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
    // No og:image / twitter:image — shares render as a plain card (no photo).
    const twCard = setTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary');
    const twTitle = setTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    const twDesc = setTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    const restore = [desc, ogTitle, ogDesc, ogUrl, ogType, twCard, twTitle, twDesc];

    // Robots noindex — only present on pages that opt in. On SPA nav away from
    // a noindex page, the cleanup removes it so the next (indexable) page isn't
    // accidentally suppressed.
    const robots = noindex
      ? setTag('meta[name="robots"]', 'name', 'robots', 'noindex,follow')
      : null;

    return () => {
      document.title = prevTitle;
      for (const r of restore) {
        if (r.created) r.el.remove();
        else if (r.prev !== null) r.el.setAttribute('content', r.prev);
      }
      if (canon.created) canon.el.remove();
      else if (canon.prev !== null) canon.el.setAttribute('href', canon.prev);
      if (robots) {
        if (robots.created) robots.el.remove();
        else if (robots.prev !== null) robots.el.setAttribute('content', robots.prev);
      }
    };
  }, [title, description, canonicalUrl, noindex]);
}
