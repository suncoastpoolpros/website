import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero, HomeHeroPhoneSection } from '@/components/Hero';
import { FeatureGrid } from '@/components/FeatureGrid';
import { Process } from '@/components/Process';
import { Services } from '@/components/Services';
import { ServiceAreas } from '@/components/ServiceAreas';
import { CtaBand } from '@/components/CtaBand';
import { StickyMobileCta } from '@/components/StickyMobileCta';
// import { Testimonials } from '@/components/Testimonials'; // Re-enable once real reviews are added
import { FAQ, homepageFaqs } from '@/components/FAQ';
import { QuoteForm } from '@/components/QuoteForm';
import { Footer } from '@/components/Footer';
import { usePageMeta, FONTS, NAV_FONTS } from '@/lib/usePageMeta';
import { webSiteSchema, poolServiceSchema } from '@/lib/businessSchema';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// Homepage JSON-LD. The canonical LocalBusiness entity ships statically in
// index.html (crawlable on every page); here we add only the homepage-specific
// nodes — WebSite, the priced Service, the homepage FAQ, and a one-level
// breadcrumb — referencing the business by @id.
//
// Passed through usePageMeta({ jsonLd }) so it lands in the PRERENDERED head.
// It used to be appended from a useEffect, which meant the HTML a crawler reads
// on first fetch carried none of these four nodes.
const HOMEPAGE_SCHEMA = [
  webSiteSchema(),
  poolServiceSchema(),
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homepageFaqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  },
  breadcrumbSchema([{ name: 'Home', path: '/' }]),
];

export const LandingPage = () => {
  usePageMeta({
    title: 'Pool Service St. Petersburg, FL — Flat-Rate Weekly Cleaning',
    description:
      'Flat-rate weekly pool cleaning in St. Petersburg, Clearwater, Largo & Palm Harbor — chemicals included, vetted techs, a photo report every visit.',
    canonicalPath: '/',
    heroPreload: {
      // Must stay in lockstep with .hero-bg-mobile in index.css — preloading a
      // different file than the CSS paints downloads both.
      mobile: '/treasure-island-hero-mobile-v2.webp',
      desktop: '/treasure-island-hero.webp',
      wide: '/treasure-island-hero-1920.webp',
    },
    // One variable file per family covers every weight above the fold (nav,
    // hero body, H1, and the "One Flat Rate" headline). Caveat is a separate
    // file and the accent it draws is hidden lg:flex, so it stays lg+ only.
    fontPreload: [
      ...NAV_FONTS,
      { href: FONTS.caveat, media: '(min-width: 1024px)' },
    ],
    jsonLd: HOMEPAGE_SCHEMA,
  });

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      {/* Global Background Gradient */}
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />
        <Hero />
        {/* Mobile/tablet-only phone showcase (lg:hidden — desktop shows the
            phone inside the hero) sits AFTER the "why us" section: the value
            props follow the hero directly, then the report mockup proves them. */}
        <FeatureGrid />
        {/* "Do you serve me?" is the first question a local visitor has, so it
            gets answered right after the value props — before the (long) report
            mockup. The value props still follow the hero directly; that ordering
            is deliberate and stays. */}
        <ServiceAreas />
        <HomeHeroPhoneSection />
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
