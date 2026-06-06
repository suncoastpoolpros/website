// Maps each public route to the dynamic import for its page chunk. Used by
// nav links to prefetch the chunk on intent (touchstart / mouseenter), so by
// the time the click event fires, the JS is already in the browser cache.
//
// This is the "instant nav" mechanism: routes are lazy-imported (keeping the
// homepage hydration cost small), but we cheat by starting the download as
// soon as the user shows intent — which on touch devices is usually 100-300ms
// before the click registers.

const PRELOADERS: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/LandingPage'),
  '/belleair-beach-fl': () => import('@/pages/BelleairBeachPage'),
  '/treasure-island-fl': () => import('@/pages/TreasureIslandPage'),
  '/seminole-fl': () => import('@/pages/SeminolePage'),
  '/careers': () => import('@/pages/CareersPage'),
  '/faq': () => import('@/pages/FaqPage'),
  '/how-it-works': () => import('@/pages/HowItWorksPage'),
  '/pool-care/cyanuric-acid': () => import('@/pages/CyanuricAcidPage'),
  '/tools': () => import('@/pages/ToolsPage'),
  '/tools/pool-volume-calculator': () => import('@/pages/PoolVolumeCalculatorPage'),
  '/contact': () => import('@/pages/ContactPage'),
  '/signup': () => import('@/pages/SignupPage'),
  '/service-agreement': () => import('@/pages/ServiceAgreementPage'),
  '/privacy-policy': () => import('@/pages/PrivacyPolicyPage'),
};

const preloaded = new Set<string>();

export const preloadRoute = (path: string) => {
  if (preloaded.has(path)) return;
  const loader = PRELOADERS[path];
  if (!loader) return;
  preloaded.add(path);
  // Fire and forget — failures don't matter, the real click will re-import.
  loader().catch(() => {
    preloaded.delete(path);
  });
};
