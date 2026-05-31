import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { QuoteSheetProvider } from '@/components/QuoteSheet';

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

// On route change, jump to top (unless navigating to an in-page #anchor).
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};

export default function App() {
  return (
    <QuoteSheetProvider>
      <ScrollToTop />
      {/* fallback={null} so the current page stays visible during the brief
          chunk-load gap on slow connections, instead of flashing a blank div. */}
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
