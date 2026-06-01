// Server entry for static prerendering. Used only at build time
// (scripts/prerender.mjs) to walk each public route and emit a fully-rendered
// dist/<route>/index.html. The client entry (main.tsx + App.tsx) eagerly
// imports every page too, so SSR and CSR produce matching DOM during hydrate.
//
// Why no React.lazy() anywhere: renderToString is synchronous and bails on
// Suspense, swapping in the fallback. We avoid Suspense entirely on prerender
// routes so the rendered HTML is the real content.
// Ref: https://react.dev/reference/react-dom/server/renderToString

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
import { CareersPage } from '@/pages/CareersPage';
import { FaqPage } from '@/pages/FaqPage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { ToolsPage } from '@/pages/ToolsPage';
import { PoolVolumeCalculatorPage } from '@/pages/PoolVolumeCalculatorPage';
import { PoolHeatingCostCalculatorPage } from '@/pages/PoolHeatingCostCalculatorPage';
import { ContactPage } from '@/pages/ContactPage';
import { SignupPage } from '@/pages/SignupPage';
import { ServiceAgreementPage } from '@/pages/ServiceAgreementPage';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';

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
  '/careers',
  '/faq',
  '/how-it-works',
  '/tools',
  '/tools/pool-volume-calculator',
  '/tools/pool-heating-cost-calculator',
  '/contact',
  '/signup',
  '/service-agreement',
  '/privacy-policy',
];

const Routing = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/belleair-beach-fl" element={<BelleairBeachPage />} />
    <Route path="/treasure-island-fl" element={<TreasureIslandPage />} />
    <Route path="/st-pete-beach-fl" element={<StPeteBeachPage />} />
    <Route path="/snell-isle-fl" element={<SnellIslePage />} />
    <Route path="/careers" element={<CareersPage />} />
    <Route path="/faq" element={<FaqPage />} />
    <Route path="/how-it-works" element={<HowItWorksPage />} />
    <Route path="/tools" element={<ToolsPage />} />
    <Route path="/tools/pool-volume-calculator" element={<PoolVolumeCalculatorPage />} />
    <Route path="/tools/pool-heating-cost-calculator" element={<PoolHeatingCostCalculatorPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/service-agreement" element={<ServiceAgreementPage />} />
    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
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
            <Routing />
          </QuoteSheetProvider>
        </LazyMotion>
      </MotionConfig>
    </StaticRouter>
  );
  return { html, meta: readSsrMeta() };
}
