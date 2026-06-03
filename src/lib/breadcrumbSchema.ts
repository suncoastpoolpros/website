// Builds a schema.org BreadcrumbList describing a page's place in the site
// hierarchy. Google renders this as the breadcrumb trail under a result's title
// (e.g. "suncoastpoolpros.com › Tools › Pool Volume Calculator") instead of the
// raw URL.
//
// Rule of thumb: only include a crumb for a level that actually exists as a real
// prerendered route. A middle crumb pointing at a 404 (e.g. /pool-care, which
// has no hub page) is worse than omitting it — so those pages get a 2-level
// trail (Home › Page) rather than a broken parent.
//
// Injected client-side via each page's JSON-LD effect — the documented
// exception to usePageMeta (see CLAUDE.md #9), same as the LocalBusiness/FAQ
// schema already on these pages.

const SITE_ORIGIN = 'https://suncoastpoolpros.com';

export type Crumb = {
  name: string;
  /** Path-only, matching the page's canonical (keep the trailing slash). */
  path: string;
};

export const breadcrumbSchema = (crumbs: Crumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: `${SITE_ORIGIN}${c.path}`,
  })),
});
