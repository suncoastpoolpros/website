import React, { useEffect } from 'react';
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
// breadcrumb — referencing the business by @id. Title/desc/canonical/OG are
// handled by usePageMeta (SSR); usePageMeta doesn't do JSON-LD, so this effect
// adds it client-side. See CLAUDE.md #9.
const usePageSchema = () => {
  useEffect(() => {
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify([
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
    ]);
    document.head.appendChild(ld);
    return () => ld.remove();
  }, []);
};

export const LandingPage = () => {
  usePageMeta({
    title: 'Pool Cleaning St. Petersburg — Flat-Rate Weekly Service',
    description:
      'Flat-rate weekly pool cleaning across St. Petersburg & Tampa Bay — chemicals included, the same tech every week, a photo report after each visit.',
    canonicalPath: '/',
    // OG image matches the hero the page actually shows (the waterfront/Treasure
    // scene after the hero swap), not the default St-Pete image.
    ogImage: '/treasure-island-hero.jpg',
    heroPreload: {
      mobile: '/treasure-island-hero-mobile.webp',
      desktop: '/treasure-island-hero.webp',
      wide: '/treasure-island-hero-1920.webp',
    },
    // Above-the-fold: nav (Inter 600 + Montserrat 700), hero body (Inter 400),
    // hero H1 (font-display font-normal = Montserrat 400). The "One Flat Rate"
    // headline is font-bold md:font-black (Montserrat 700 mobile, 900 desktop),
    // so preload 900 only at md+. Caveat (the "Sent after every visit" script
    // accent) is hidden lg:flex — desktop only — so preload it only at lg+.
    // Mobile thus loads just inter-400/600 + montserrat-400/700.
    fontPreload: [
      ...NAV_FONTS,
      FONTS.inter400,
      FONTS.montserrat400,
      { href: FONTS.montserrat900, media: '(min-width: 768px)' },
      { href: FONTS.caveat700, media: '(min-width: 1024px)' },
    ],
  });
  usePageSchema();

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      {/* Global Background Gradient */}
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <HomeHeroPhoneSection />
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
