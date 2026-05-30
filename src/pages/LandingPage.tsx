import React, { lazy, Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { FeatureGrid } from '@/components/FeatureGrid';
import { Process } from '@/components/Process';
import { Services } from '@/components/Services';
import { ServiceAreas } from '@/components/ServiceAreas';
import { CtaBand } from '@/components/CtaBand';
import { StickyMobileCta } from '@/components/StickyMobileCta';
// import { Testimonials } from '@/components/Testimonials'; // Re-enable once real reviews are added
import { FAQ } from '@/components/FAQ';
import { usePageMeta } from '@/lib/usePageMeta';

// Deep below-the-fold pieces are loaded after first paint. The quote form is
// interactive (heavier) and the footer is a separate chunk shared by all pages;
// neither needs to block the hero from showing up.
const QuoteForm = lazy(() => import('@/components/QuoteForm').then((m) => ({ default: m.QuoteForm })));
const Footer = lazy(() => import('@/components/Footer').then((m) => ({ default: m.Footer })));

export const LandingPage = () => {
  usePageMeta({
    title: 'Pool Cleaning in St. Petersburg, FL — Done Right, Every Week',
    description:
      'Flat-rate weekly pool cleaning in St. Petersburg and the Tampa Bay area. One price covers standard chemicals, the same tech shows up every week, and you get a photo report after every visit.',
    canonicalPath: '/',
  });

  return (
    <div className="min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      {/* Global Background Gradient */}
      <div className="fixed inset-0 bg-mesh opacity-40 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <FeatureGrid />
        <ServiceAreas />
        <Process />
        <Services />
        <CtaBand />
        {/* <Testimonials /> */}
        <FAQ />
        <Suspense fallback={null}>
          <QuoteForm />
          <Footer />
        </Suspense>
      </div>
      <StickyMobileCta />
    </div>
  );
};
