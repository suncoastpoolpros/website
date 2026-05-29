import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { QuoteSheetProvider } from '@/components/QuoteSheet';

// Each page is code-split into its own chunk so a visitor only downloads
// the page they actually land on.
const LandingPage = lazy(() => import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const BelleairBeachPage = lazy(() => import('@/pages/BelleairBeachPage').then((m) => ({ default: m.BelleairBeachPage })));
const CareersPage = lazy(() => import('@/pages/CareersPage').then((m) => ({ default: m.CareersPage })));
const FaqPage = lazy(() => import('@/pages/FaqPage').then((m) => ({ default: m.FaqPage })));
const HowItWorksPage = lazy(() => import('@/pages/HowItWorksPage').then((m) => ({ default: m.HowItWorksPage })));
const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const SignupPage = lazy(() => import('@/pages/SignupPage').then((m) => ({ default: m.SignupPage })));
const ServiceAgreementPage = lazy(() => import('@/pages/ServiceAgreementPage').then((m) => ({ default: m.ServiceAgreementPage })));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));

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
      <Suspense fallback={<div className="min-h-screen bg-[#07111c]" />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/belleair-beach-fl" element={<BelleairBeachPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/service-agreement" element={<ServiceAgreementPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        </Routes>
      </Suspense>
    </QuoteSheetProvider>
  );
}
