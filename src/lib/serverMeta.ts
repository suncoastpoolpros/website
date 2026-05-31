// Mutable singleton populated during server-side render. The prerender script
// reads it after renderToString to know what <title>, description, canonical,
// and OG tags to inject into the HTML head for the current route.
//
// On the client this module exists but is never read — usePageMeta updates the
// real DOM head via useEffect. The synchronous part runs during render too,
// which is the only path that runs on the server.

export type SsrMeta = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  /** Per-page LCP hero image to preload, responsive by viewport. The prerender
   *  writes these as <link rel="preload" as="image"> into the page's head so
   *  each route preloads its OWN hero instead of the global default. */
  heroPreload?: {
    mobile: string;
    desktop: string;
    wide?: string;
  };
  /** Per-page above-the-fold font files to preload (paths under /fonts). Each
   *  route preloads only the weights it actually paints above the fold, so the
   *  critical request chain isn't spent on fonts the page doesn't use. */
  fontPreload?: string[];
};

let current: SsrMeta = {};

export const setSsrMeta = (m: SsrMeta) => {
  // Last writer wins. In practice usePageMeta is called once per page, so this
  // is fine. If multiple pages ever render to one HTML doc, this needs scoping.
  current = { ...current, ...m };
};

export const readSsrMeta = (): SsrMeta => current;

export const resetSsrMeta = () => {
  current = {};
};
