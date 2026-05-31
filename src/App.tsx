import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { QuoteSheetProvider } from '@/components/QuoteSheet';

// All routes are eagerly imported into one bundle. For a 13-page marketing
// site that's prerendered, this is the right tradeoff: a slightly bigger
// first-load JS (one ~150 KB gzipped chunk that includes every page) buys
// post-hydration nav that needs zero network requests. The previous lazy()
// pattern made nav clicks feel slow on mobile because each click waited on
// the next page's chunk to download + parse before painting.
// Reference: https://reactrouter.com/how-to/spa, https://reactrouter.com/how-to/pre-rendering
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
import { NotFoundPage } from '@/pages/NotFoundPage';

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
    </QuoteSheetProvider>
  );
}
