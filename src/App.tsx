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
const SeminolePage = lazy(() => import('@/pages/SeminolePage').then((m) => ({ default: m.SeminolePage })));
const LargoPage = lazy(() => import('@/pages/LargoPage').then((m) => ({ default: m.LargoPage })));
const ClearwaterPage = lazy(() => import('@/pages/ClearwaterPage').then((m) => ({ default: m.ClearwaterPage })));
const CareersPage = lazy(() => import('@/pages/CareersPage').then((m) => ({ default: m.CareersPage })));
const FaqPage = lazy(() => import('@/pages/FaqPage').then((m) => ({ default: m.FaqPage })));
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage').then((m) => ({ default: m.HowItWorksPage })));
const ToolsPage = lazy(() => import('@/pages/ToolsPage').then((m) => ({ default: m.ToolsPage })));
const PoolCarePage = lazy(() => import('@/pages/PoolCarePage').then((m) => ({ default: m.PoolCarePage })));
const NitratesPage = lazy(() => import('@/pages/NitratesPage').then((m) => ({ default: m.NitratesPage })));
const CloudyPoolWaterPage = lazy(() => import('@/pages/CloudyPoolWaterPage').then((m) => ({ default: m.CloudyPoolWaterPage })));
const PoolSmellPage = lazy(() => import('@/pages/PoolSmellPage').then((m) => ({ default: m.PoolSmellPage })));
const PoolServiceVsDiyPage = lazy(() => import('@/pages/PoolServiceVsDiyPage').then((m) => ({ default: m.PoolServiceVsDiyPage })));
const CyanuricAcidPage = lazy(() => import('@/pages/CyanuricAcidPage').then((m) => ({ default: m.CyanuricAcidPage })));
const GreenPoolPage = lazy(() => import('@/pages/GreenPoolPage').then((m) => ({ default: m.GreenPoolPage })));
const VariableSpeedPumpsPage = lazy(() => import('@/pages/VariableSpeedPumpsPage').then((m) => ({ default: m.VariableSpeedPumpsPage })));
const SaltWaterVsChlorinePage = lazy(() => import('@/pages/SaltWaterVsChlorinePage').then((m) => ({ default: m.SaltWaterVsChlorinePage })));
const DrainPoolPage = lazy(() => import('@/pages/DrainPoolPage').then((m) => ({ default: m.DrainPoolPage })));
const PoolVolumeCalculatorPage = lazy(() => import('@/pages/PoolVolumeCalculatorPage').then((m) => ({ default: m.PoolVolumeCalculatorPage })));
const PoolHeatingCostCalculatorPage = lazy(() => import('@/pages/PoolHeatingCostCalculatorPage').then((m) => ({ default: m.PoolHeatingCostCalculatorPage })));
const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const SignupPage = lazy(() => import('@/pages/SignupPage').then((m) => ({ default: m.SignupPage })));
const ServiceAgreementPage = lazy(() => import('@/pages/ServiceAgreementPage').then((m) => ({ default: m.ServiceAgreementPage })));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
// Private admin proposal builder. Intentionally NOT in entry-server.tsx /
// PRERENDER_ROUTES — it's a client-only app route (no SEO, no static HTML), and
// it's Disallow-ed in robots.txt.
const AdminPage = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })));
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
      // Defer gtag injection well clear of this interaction's UI. Calling
      // initAnalytics() inline ran ~200ms of gtag.js parse/exec on the very tap
      // that opens the nav drawer (the first interaction is often the
      // hamburger), freezing the main thread so the drawer lagged on open —
      // invisible to the lab because analytics only runs on the prod hostname.
      //
      // requestIdleCallback alone wasn't enough: the drawer slide runs on the
      // compositor, so the main thread goes idle almost immediately and rIC
      // fired gtag back into the ~300ms animation window (traced: a 59ms task at
      // 239ms). So we first wait out the open animation with a timeout, THEN
      // load at the next idle. ~200ms later analytics is fine for a marketing
      // site; a frozen menu is not.
      const loadAnalytics = () => {
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(() => initAnalytics(), { timeout: 2000 });
        } else {
          initAnalytics();
        }
      };
      window.setTimeout(loadAnalytics, 1200);
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
          <Route path="/seminole-fl" element={<SeminolePage />} />
          <Route path="/largo-fl" element={<LargoPage />} />
          <Route path="/clearwater-fl" element={<ClearwaterPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pool-care" element={<PoolCarePage />} />
          <Route path="/pool-care/nitrates" element={<NitratesPage />} />
          <Route path="/pool-care/cloudy-pool-water" element={<CloudyPoolWaterPage />} />
          <Route path="/pool-care/pool-smells-like-chlorine" element={<PoolSmellPage />} />
          <Route path="/pool-care/pool-service-vs-diy" element={<PoolServiceVsDiyPage />} />
          <Route path="/pool-care/cyanuric-acid" element={<CyanuricAcidPage />} />
          <Route path="/pool-care/green-pool" element={<GreenPoolPage />} />
          <Route path="/pool-care/variable-speed-pumps" element={<VariableSpeedPumpsPage />} />
          <Route path="/pool-care/salt-water-vs-chlorine" element={<SaltWaterVsChlorinePage />} />
          <Route path="/pool-care/how-to-drain-a-pool" element={<DrainPoolPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/pool-volume-calculator" element={<PoolVolumeCalculatorPage />} />
          <Route path="/tools/pool-heating-cost-calculator" element={<PoolHeatingCostCalculatorPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/service-agreement" element={<ServiceAgreementPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* Catch-all 404 — must be last. */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      </ChunkErrorBoundary>
      </MotionConfig>
    </QuoteSheetProvider>
  );
}
