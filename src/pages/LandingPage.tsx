import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { FeatureGrid } from '@/components/FeatureGrid';
import { QuoteForm } from '@/components/QuoteForm';
import { Process } from '@/components/Process';
import { Services } from '@/components/Services';
import { ServiceAreas } from '@/components/ServiceAreas';
import { CtaBand } from '@/components/CtaBand';
import { StickyMobileCta } from '@/components/StickyMobileCta';
// import { Testimonials } from '@/components/Testimonials'; // Re-enable once real reviews are added
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';
import { usePageMeta } from '@/lib/usePageMeta';

export const LandingPage = () => {
  usePageMeta({
    title: 'Pool Cleaning St. Petersburg, FL | Flat-Rate, Always Blue',
    description:
      'Flat-rate weekly pool cleaning in St. Petersburg — one price covers standard chemicals, plus a photo report every visit. Homes, HOAs & commercial pools.',
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
        <QuoteForm />

        <Footer />
      </div>
      <StickyMobileCta />
    </div>
  );
};
