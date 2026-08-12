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
  /** Path-only (e.g. "/treasure-island-fl/") or omit for homepage. */
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
  /** Structured data for this route. Passed here (not injected in a useEffect)
   *  so it lands in the prerendered HTML — see SsrMeta.jsonLd. The client path
   *  also mounts it, so SPA navigation still swaps schema correctly. */
  jsonLd?: unknown[];
  /** Keep this page out of search results (transactional/thank-you pages).
   *  Emits <meta name="robots" content="noindex,follow"> — page stays
   *  crawlable and prerendered, just not indexed. */
  noindex?: boolean;
};

/** Font FILES to preload. Inter = body (--font-sans), Montserrat = display
 *  (--font-display), Caveat = script accent.
 *
 *  One file per family: these are variable fonts covering wght 100–900, so
 *  there is no longer a per-weight file to choose between (see the @font-face
 *  block in index.css for why the old per-weight duplicates were removed).
 *  Weight-specific preloading is therefore meaningless now — a page either
 *  paints the family above the fold or it doesn't. */
const INTER = '/fonts/inter-var.woff2';
const MONTSERRAT = '/fonts/montserrat-var.woff2';

export const FONTS = {
  inter: INTER,
  montserrat: MONTSERRAT,
  caveat: '/fonts/caveat-700.woff2',

  /** Legacy per-weight keys. The weights no longer map to separate files, so
   *  these all resolve to their family's single variable file. Kept so pages
   *  that still declare weights individually keep working (duplicates are
   *  de-duped when the tags are emitted). Prefer `inter`/`montserrat`. */
  inter400: INTER,
  inter600: INTER,
  inter700: INTER,
  montserrat400: MONTSERRAT,
  montserrat700: MONTSERRAT,
  montserrat900: MONTSERRAT,
  caveat700: '/fonts/caveat-700.woff2',
} as const;

/** Above-the-fold fonts shared by every page: the Navbar paints Inter (body)
 *  and Montserrat (wordmark), so both families are needed everywhere. Pages
 *  spread this and add only Caveat if they actually paint the script accent. */
export const NAV_FONTS = [FONTS.inter, FONTS.montserrat];

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

  const { title, description, canonicalPath, heroPreload, fontPreload, noindex, jsonLd } = meta;
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath ?? '/'}`;

  // Server: populate the SSR meta singleton during render. The prerender script
  // reads this after renderToString and writes it into the static HTML head.
  // No og:image is emitted — link shares render as a plain card with no photo.
  if (IS_SERVER) {
    setSsrMeta({ title, description, canonicalUrl, heroPreload, fontPreload, noindex, jsonLd });
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

  // JSON-LD on the client. This lives in <head>, outside the hydrated tree, so
  // it can't cause a hydration mismatch.
  //
  // On a cold load the prerendered HTML already carries this graph, so the
  // effect ADOPTS that tag rather than appending a second copy. It still takes
  // ownership either way, so navigating away removes it — otherwise the
  // homepage's Service/FAQPage nodes would leak onto whatever route the user
  // clicked into next. Keyed on the serialized graph so unrelated re-renders
  // don't churn the tag.
  const jsonLdText = jsonLd && jsonLd.length ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    if (!jsonLdText) return;
    const adopted = document.head.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"][data-page-schema]',
    );
    const el = adopted ?? document.createElement('script');
    if (el.textContent !== jsonLdText) el.textContent = jsonLdText;
    if (!adopted) {
      el.type = 'application/ld+json';
      el.setAttribute('data-page-schema', '');
      document.head.appendChild(el);
    }
    return () => el.remove();
  }, [jsonLdText]);
}
