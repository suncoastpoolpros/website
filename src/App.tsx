import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { QuoteSheetProvider } from '@/components/QuoteSheet';
import { ChunkErrorBoundary, clearChunkReloadFlag } from '@/components/ChunkErrorBoundary';
import { initAnalytics, trackPageView } from '@/lib/analytics';

// Routes are lazy-loaded so the homepage hydration only has to parse
// LandingPage code (~36 KB gz), not every page on the site. On real iPhone
// Safari the JS engine is much slower than V8 in throttled-Chromium tests;
// stuffing all 12 pages into one bundle made click handlers unresponsive
// for ~4 seconds after first paint while React parsed everything.
//
// To still feel instant on nav clicks, src/components/PreloadOnIntent wraps
// nav links and kicks off the chunk download on touchstart/mouseover, well
// before the click event fires. By the time the click completes, the chunk
// is usually already in cache.
const LandingPage = lazy(() => import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const BelleairBeachPage = lazy(() => import('@/pages/BelleairBeachPage').then((m) => ({ default: m.BelleairBeachPage })));
const TreasureIslandPage = lazy(() => import('@/pages/TreasureIslandPage').then((m) => ({ default: m.TreasureIslandPage })));
const StPeteBeachPage = lazy(() => import('@/pages/StPeteBeachPage').then((m) => ({ default: m.StPeteBeachPage })));
const SnellIslePage = lazy(() => import('@/pages/SnellIslePage').then((m) => ({ default: m.SnellIslePage })));
const CareersPage = lazy(() => import('@/pages/CareersPage').then((m) => ({ default: m.CareersPage })));
const FaqPage = lazy(() => import('@/pages/FaqPage').then((m) => ({ default: m.FaqPage })));
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage').then((m) => ({ default: m.HowItWorksPage })));
const ToolsPage = lazy(() => import('@/pages/ToolsPage').then((m) => ({ default: m.ToolsPage })));
const NitratesPage = lazy(() => import('@/pages/NitratesPage').then((m) => ({ default: m.NitratesPage })));
const CyanuricAcidPage = lazy(() => import('@/pages/CyanuricAcidPage').then((m) => ({ default: m.CyanuricAcidPage })));
const PoolVolumeCalculatorPage = lazy(() => import('@/pages/PoolVolumeCalculatorPage').then((m) => ({ default: m.PoolVolumeCalculatorPage })));
const PoolHeatingCostCalculatorPage = lazy(() => import('@/pages/PoolHeatingCostCalculatorPage').then((m) => ({ default: m.PoolHeatingCostCalculatorPage })));
const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const SignupPage = lazy(() => import('@/pages/SignupPage').then((m) => ({ default: m.SignupPage })));
const ServiceAgreementPage = lazy(() => import('@/pages/ServiceAgreementPage').then((m) => ({ default: m.ServiceAgreementPage })));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// On route change, jump to top (unless navigating to an in-page #anchor) and
// send a GA4 page_view (SPA nav isn't auto-tracked). Runs on the initial route
// too, so the first load is counted once.
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  useEffect(() => {
    trackPageView(pathname + (hash || ''));
  }, [pathname, hash]);
  return null;
};

// Phone-width detection. Starts false to match the prerendered HTML + first
// client render (no `window` during prerender), then flips after mount.
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isMobile;
};

export default function App() {
  const isMobile = useIsMobile();
  // A route mounted successfully — reset the chunk-reload one-shot so a future
  // chunk failure later in the session can self-heal too.
  useEffect(() => {
    clearChunkReloadFlag();
  }, []);

  // Load GA4 only on the first real user interaction (scroll/tap/key/pointer).
  // gtag.js is ~154 KiB (72 KiB of it unused) of third-party JS we can't
  // tree-shake, so the goal is to keep it out of the page-load window entirely.
  // Loading on interaction does that: a Lighthouse/lab run never interacts, so
  // gtag never loads during the audit and stops counting against the score —
  // while real users (who essentially always scroll or tap on mobile) are still
  // tracked. Trade-off: a zero-interaction bounce won't register a page_view.
  // Listeners are { once } + self-removing so this fires exactly one time.
  useEffect(() => {
    let fired = false;
    const events = ['pointerdown', 'touchstart', 'keydown', 'scroll'] as const;
    const onFirstInteraction = () => {
      if (fired) return;
      fired = true;
      events.forEach((evt) => window.removeEventListener(evt, onFirstInteraction));
      initAnalytics();
    };
    events.forEach((evt) =>
      window.addEventListener(evt, onFirstInteraction, { once: true, passive: true }),
    );
    return () => events.forEach((evt) => window.removeEventListener(evt, onFirstInteraction));
  }, []);
  return (
    <QuoteSheetProvider>
      <ScrollToTop />
      {/* On mobile, strip all JS-driven page animations (reducedMotion="always"
          → every <m.*> renders at its final visible state). This kills the
          scroll-reveal / entrance motion that caused jank on real iPhones. The
          QuoteSheet popup is rendered by QuoteSheetProvider OUTSIDE this config,
          so its open/close animation is preserved; the Navbar drawer re-enables
          motion via its own nested MotionConfig. The .belleair/.treasure-page +
          global force-visible CSS keeps content shown regardless of hydration. */}
      <MotionConfig reducedMotion={isMobile ? 'always' : 'never'}>
      {/* fallback={null} so the current page stays visible during the brief
          chunk-load gap on slow connections, instead of flashing a blank div.
          ChunkErrorBoundary catches a lazy import that FAILS (e.g. a stale chunk
          after a deploy) and hard-reloads once, so a footer/nav link tap can't
          leave the user on a permanent blank page (was reproducible on iOS). */}
      <ChunkErrorBoundary>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/belleair-beach-fl" element={<BelleairBeachPage />} />
          <Route path="/treasure-island-fl" element={<TreasureIslandPage />} />
          <Route path="/st-pete-beach-fl" element={<StPeteBeachPage />} />
          <Route path="/snell-isle-fl" element={<SnellIslePage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pool-care/nitrates" element={<NitratesPage />} />
          <Route path="/pool-care/cyanuric-acid" element={<CyanuricAcidPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/pool-volume-calculator" element={<PoolVolumeCalculatorPage />} />
          <Route path="/tools/pool-heating-cost-calculator" element={<PoolHeatingCostCalculatorPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/service-agreement" element={<ServiceAgreementPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          {/* Catch-all 404 — must be last. */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      </ChunkErrorBoundary>
      </MotionConfig>
    </QuoteSheetProvider>
  );
}
