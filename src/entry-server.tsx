// Server entry for static prerendering. Used only at build time
// (scripts/prerender.mjs) to walk each public route and emit a fully-rendered
// dist/<route>/index.html. The client entry (main.tsx + App.tsx) eagerly
// imports every page too, so SSR and CSR produce matching DOM during hydrate.
//
// Why no React.lazy() anywhere: renderToString is synchronous and bails on
// Suspense, swapping in the fallback. So nothing here may SUSPEND — every page
// is imported eagerly below.
//
// There IS a <Suspense> boundary in the tree, though, and it must stay: the
// client (App.tsx) wraps its routes in one, React represents a boundary in the
// HTML with comment markers, and a tree that has the boundary hydrating over
// HTML that lacks it is a structural mismatch — this was the minified #418 the
// site threw on EVERY route, which made React discard the whole prerendered DOM.
// A boundary whose children never suspend renders them inline and simply emits
// the markers, so this is safe and is what makes the two trees line up. (Verify
// after any change here: no `<template data-msg="Switched to client rendering"`
// in dist, and `<!--$-->` present.)
// Ref: https://react.dev/reference/react-dom/server/renderToString

import { Suspense } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter, Routes, Route } from 'react-router-dom';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { QuoteSheetProvider } from '@/components/QuoteSheet';
import { resetSsrMeta, readSsrMeta } from '@/lib/serverMeta';

// Eager imports — no lazy() here.
import { LandingPage } from '@/pages/LandingPage';
import { BelleairBeachPage } from '@/pages/BelleairBeachPage';
import { TreasureIslandPage } from '@/pages/TreasureIslandPage';
import { StPeteBeachPage } from '@/pages/StPeteBeachPage';
import { SnellIslePage } from '@/pages/SnellIslePage';
import { SeminolePage } from '@/pages/SeminolePage';
import { LargoPage } from '@/pages/LargoPage';
import { ClearwaterPage } from '@/pages/ClearwaterPage';
import { CareersPage } from '@/pages/CareersPage';
import { FaqPage } from '@/pages/FaqPage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { ToolsPage } from '@/pages/ToolsPage';
import { PoolCarePage } from '@/pages/PoolCarePage';
import { NitratesPage } from '@/pages/NitratesPage';
import { CloudyPoolWaterPage } from '@/pages/CloudyPoolWaterPage';
import { PoolSmellPage } from '@/pages/PoolSmellPage';
import { PoolServiceVsDiyPage } from '@/pages/PoolServiceVsDiyPage';
import { CyanuricAcidPage } from '@/pages/CyanuricAcidPage';
import { GreenPoolPage } from '@/pages/GreenPoolPage';
import { StormCleanupPage } from '@/pages/StormCleanupPage';
import { GreenPoolRecoveryPage } from '@/pages/GreenPoolRecoveryPage';
import { ServicesPage } from '@/pages/ServicesPage';
import { VariableSpeedPumpsPage } from '@/pages/VariableSpeedPumpsPage';
import { SaltWaterVsChlorinePage } from '@/pages/SaltWaterVsChlorinePage';
import { DrainPoolPage } from '@/pages/DrainPoolPage';
import { PoolVolumeCalculatorPage } from '@/pages/PoolVolumeCalculatorPage';
import { PoolHeatingCostCalculatorPage } from '@/pages/PoolHeatingCostCalculatorPage';
import { ContactPage } from '@/pages/ContactPage';
import { SignupPage } from '@/pages/SignupPage';
import { ServiceAgreementPage } from '@/pages/ServiceAgreementPage';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';
import { AdminPage } from '@/pages/AdminPage';
import { ApprovePage } from '@/pages/ApprovePage';

// Routes to prerender. Marketing pages benefit most from static HTML for SEO
// and instant first paint; the calculator and signup are heavily interactive
// (kept SPA-only — they're still rendered, but their main value is post-mount).
// Keep this in sync with App.tsx's route table.
export const PRERENDER_ROUTES = [
  '/',
  '/belleair-beach-fl',
  '/treasure-island-fl',
  '/st-pete-beach-fl',
  '/snell-isle-fl',
  '/seminole-fl',
  '/largo-fl',
  '/clearwater-fl',
  '/careers',
  '/faq',
  '/how-it-works',
  '/pool-care',
  '/pool-care/nitrates',
  '/pool-care/cloudy-pool-water',
  '/pool-care/pool-smells-like-chlorine',
  '/pool-care/pool-service-vs-diy',
  '/pool-care/cyanuric-acid',
  '/pool-care/green-pool',
  '/pool-care/variable-speed-pumps',
  '/pool-care/salt-water-vs-chlorine',
  '/pool-care/how-to-drain-a-pool',
  '/services',
  '/services/storm-cleanup',
  '/services/green-pool-recovery',
  '/tools',
  '/tools/pool-volume-calculator',
  '/tools/pool-heating-cost-calculator',
  '/contact',
  '/signup',
  '/service-agreement',
  '/privacy-policy',
  // /admin is prerendered for ROUTING reasons, not SEO. Cloudflare Pages needs a
  // real file at the path: rewriting to /index.html in _redirects doesn't work
  // (Pages canonicalises /index.html → / and turns the rewrite into a 308), and
  // the old `/*` SPA catch-all that used to cover it made every nonexistent URL
  // return 200 — a soft 404. It stays out of search via noindex (usePageMeta)
  // plus a robots.txt Disallow, and out of the sitemap automatically because the
  // generator skips noindex routes. The HTML it emits is just the auth spinner.
  '/admin',
  // Reached from an emailed link carrying ?t=<token>. Prerendered like every
  // other route — the SPA catch-all is gone, so an unlisted path 404s. The
  // token lives in the query string precisely so this can stay a static file;
  // usePageMeta marks it noindex.
  '/approve',
];

const Routing = () => (
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
    <Route path="/services" element={<ServicesPage />} />
    <Route path="/services/storm-cleanup" element={<StormCleanupPage />} />
    <Route path="/services/green-pool-recovery" element={<GreenPoolRecoveryPage />} />
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
    <Route path="/approve" element={<ApprovePage />} />
  </Routes>
);

/**
 * Render a single route to an HTML body string, plus any meta the page declared
 * via usePageMeta (collected synchronously during render via the serverMeta
 * singleton). Caller is responsible for splicing both into the HTML template.
 */
export function render(url: string) {
  resetSsrMeta();
  const html = renderToString(
    <StaticRouter location={url}>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation} strict>
          <QuoteSheetProvider>
            {/* Mirrors App.tsx's boundary exactly, fallback included. */}
            <Suspense fallback={null}>
              <Routing />
            </Suspense>
          </QuoteSheetProvider>
        </LazyMotion>
      </MotionConfig>
    </StaticRouter>
  );
  return { html, meta: readSsrMeta() };
}
