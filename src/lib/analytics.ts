// Google Analytics 4 — loaded deferred so it never touches the critical render
// chain (CLAUDE.md: defer third-party scripts; nothing render-blocking). The
// gtag script is injected async AFTER mount.
//
// The Measurement ID is NOT secret (it ships in the client bundle and is
// visible in page source), so it's hardcoded as the default rather than
// requiring a build-time env var — VITE_GA_ID can still override it. To avoid
// polluting the property with dev/preview traffic, analytics only activates on
// the production hostname (see initAnalytics).
//
// What we track:
//   - page_view on every SPA route change (GA4 won't see client-side nav on its
//     own, so we send it manually — send_page_view is off in config)
//   - generate_lead when a quote/signup form submits successfully
//   - contact (method: phone) when any tel: link is tapped, via one delegated
//     click listener so every phone link site-wide is covered

const GA_ID = (import.meta.env.VITE_GA_ID as string | undefined) || 'G-X5B7LL8BSV';

// Only send data from the live site — never localhost, the dev server, or
// *.pages.dev preview deploys.
const PROD_HOSTS = ['suncoastpoolpros.com', 'www.suncoastpoolpros.com'];

let initialized = false;

/** Inject gtag.js (async) and configure GA4. Safe to call more than once. */
export function initAnalytics(): void {
  if (initialized || !GA_ID || typeof window === 'undefined') return;
  if (!PROD_HOSTS.includes(window.location.hostname)) return;
  initialized = true;

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  // gtag must push the `arguments` object itself (not a rest array) for GA to
  // parse it — this mirrors Google's canonical snippet exactly.
  function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  }
  window.gtag = gtag as Gtag;
  window.gtag('js', new Date());
  // send_page_view:false — this is an SPA, so we emit page_view manually on each
  // route change (see trackPageView) to avoid missing or double-counting.
  window.gtag('config', GA_ID, { send_page_view: false });

  // Because gtag now loads lazily (on first interaction), the page_view that
  // ScrollToTop fired on mount happened before gtag existed and was dropped.
  // Emit the current page's view here so the landing page is still counted;
  // subsequent SPA route changes are covered by trackPageView as before.
  trackPageView(window.location.pathname + window.location.hash);

  // One delegated listener catches every tel: link on the site (hero, footer,
  // sticky CTA, quote chooser, etc.) without wiring each one individually.
  document.addEventListener(
    'click',
    (e) => {
      const link = (e.target as HTMLElement)?.closest?.('a[href^="tel:"]');
      if (link) trackEvent('contact', { method: 'phone' });
    },
    { capture: true },
  );
}

/** Manual SPA page_view. Called on every route change. */
export function trackPageView(path: string): void {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/** Generic event helper (used for generate_lead, contact, etc.). */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, params ?? {});
}

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}
