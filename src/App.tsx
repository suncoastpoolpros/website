import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { QuoteSheetProvider } from '@/components/QuoteSheet';

// Each page is its own code-split chunk so first paint on the landing route
// doesn't pull every other page's code. After the landing chunk hydrates we
// prefetch the rest (see prefetchRoutes() below) so a click on the nav doesn't
// wait on a network round-trip — by the time the user taps, the chunk is
// already in cache.
const LandingPage = lazy(() => import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const BelleairBeachPage = lazy(() => import('@/pages/BelleairBeachPage').then((m) => ({ default: m.BelleairBeachPage })));
const TreasureIslandPage = lazy(() => import('@/pages/TreasureIslandPage').then((m) => ({ default: m.TreasureIslandPage })));
const CareersPage = lazy(() => import('@/pages/CareersPage').then((m) => ({ default: m.CareersPage })));
const FaqPage = lazy(() => import('@/pages/FaqPage').then((m) => ({ default: m.FaqPage })));
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage').then((m) => ({ default: m.HowItWorksPage })));
const ToolsPage = lazy(() => import('@/pages/ToolsPage').then((m) => ({ default: m.ToolsPage })));
const PoolVolumeCalculatorPage = lazy(() => import('@/pages/PoolVolumeCalculatorPage').then((m) => ({ default: m.PoolVolumeCalculatorPage })));
const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const SignupPage = lazy(() => import('@/pages/SignupPage').then((m) => ({ default: m.SignupPage })));
const ServiceAgreementPage = lazy(() => import('@/pages/ServiceAgreementPage').then((m) => ({ default: m.ServiceAgreementPage })));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Warm the chunk cache for routes the user hasn't visited yet so clicking nav
// links doesn't wait on a network fetch. Runs once, after the current page has
// settled (requestIdleCallback / setTimeout fallback), and skips the route the
// user is already on.
const prefetchRoutes = (currentPath: string) => {
  const others: Array<[string, () => Promise<unknown>]> = [
    ['/', () => import('@/pages/LandingPage')],
    ['/belleair-beach-fl', () => import('@/pages/BelleairBeachPage')],
    ['/treasure-island-fl', () => import('@/pages/TreasureIslandPage')],
    ['/careers', () => import('@/pages/CareersPage')],
    ['/faq', () => import('@/pages/FaqPage')],
    ['/how-it-works', () => import('@/pages/HowItWorksPage')],
    ['/tools', () => import('@/pages/ToolsPage')],
    ['/tools/pool-volume-calculator', () => import('@/pages/PoolVolumeCalculatorPage')],
    ['/contact', () => import('@/pages/ContactPage')],
    ['/signup', () => import('@/pages/SignupPage')],
  ];
  for (const [p, load] of others) {
    if (p !== currentPath) load().catch(() => {});
  }
};

// On route change, jump to top (unless navigating to an in-page #anchor).
// Also kicks off prefetching of the other page chunks once the initial route
// has hydrated, so nav clicks don't have to wait on a network fetch.
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => {
    const idle = (cb: () => void) => {
      // requestIdleCallback isn't in Safari yet — fall back to a short timeout
      // so we still get a prefetch, just slightly less battery-friendly.
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
      if (ric) ric(cb);
      else setTimeout(cb, 600);
    };
    idle(() => prefetchRoutes(pathname));
  }, [pathname]);

  return null;
};

export default function App() {
  return (
    <QuoteSheetProvider>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/belleair-beach-fl" element={<BelleairBeachPage />} />
          <Route path="/treasure-island-fl" element={<TreasureIslandPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/pool-volume-calculator" element={<PoolVolumeCalculatorPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/service-agreement" element={<ServiceAgreementPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          {/* Catch-all 404 — must be last. */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </QuoteSheetProvider>
  );
}
