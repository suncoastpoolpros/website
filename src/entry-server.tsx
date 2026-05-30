// Server entry for static prerendering. Bypasses React.lazy / Suspense (which
// don't resolve synchronously with renderToString) by importing every page
// directly. The client entry (main.tsx + App.tsx) still uses lazy() for SPA
// code-splitting; this file is only used at build time to produce static HTML.

import { renderToString } from 'react-dom/server';
import { StaticRouter, Routes, Route } from 'react-router-dom';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { QuoteSheetProvider } from '@/components/QuoteSheet';
import { resetSsrMeta, readSsrMeta } from '@/lib/serverMeta';

// Eager imports — no lazy() here.
import { LandingPage } from '@/pages/LandingPage';
import { BelleairBeachPage } from '@/pages/BelleairBeachPage';
import { TreasureIslandPage } from '@/pages/TreasureIslandPage';
import { CareersPage } from '@/pages/CareersPage';
import { FaqPage } from '@/pages/FaqPage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { ToolsPage } from '@/pages/ToolsPage';
import { PoolVolumeCalculatorPage } from '@/pages/PoolVolumeCalculatorPage';
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
  '/careers',
  '/faq',
  '/how-it-works',
  '/tools',
  '/tools/pool-volume-calculator',
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
    <Route path="/careers" element={<CareersPage />} />
    <Route path="/faq" element={<FaqPage />} />
    <Route path="/how-it-works" element={<HowItWorksPage />} />
    <Route path="/tools" element={<ToolsPage />} />
    <Route path="/tools/pool-volume-calculator" element={<PoolVolumeCalculatorPage />} />
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
