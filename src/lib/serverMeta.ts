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
