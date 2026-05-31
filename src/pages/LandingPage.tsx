import React from 'react';
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
import { QuoteForm } from '@/components/QuoteForm';
import { Footer } from '@/components/Footer';
import { usePageMeta, FONTS, NAV_FONTS } from '@/lib/usePageMeta';

export const LandingPage = () => {
  usePageMeta({
    title: 'Pool Cleaning in St. Petersburg, FL — Done Right, Every Week',
    description:
      'Flat-rate weekly pool cleaning in St. Petersburg and the Tampa Bay area. One price covers standard chemicals, the same tech shows up every week, and you get a photo report after every visit.',
    canonicalPath: '/',
    heroPreload: {
      mobile: '/pool-service-st-petersburg-hero-mobile.webp',
      desktop: '/pool-service-st-petersburg-hero.webp',
      wide: '/pool-service-st-petersburg-hero-1920.webp',
    },
    // Above-the-fold: nav (Inter 600 + Montserrat 700), hero body (Inter 400),
    // hero headline (Montserrat 900), hero H1 (font-display font-normal =
    // Montserrat 400). Caveat (the "Sent after every visit" script accent) is
    // hidden lg:flex — desktop only — so only preload it at lg+; on mobile it
    // would be a wasted font fetch on the LCP critical path.
    fontPreload: [
      ...NAV_FONTS,
      FONTS.inter400,
      FONTS.montserrat400,
      FONTS.montserrat900,
      { href: FONTS.caveat700, media: '(min-width: 1024px)' },
    ],
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
