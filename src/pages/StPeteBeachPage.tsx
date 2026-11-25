import React from 'react';
import { Phone, Star } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Glass } from '@/components/Glass';
import { Container } from '@/components/Container';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { StickyQuoteBar } from '@/components/landing/StickyQuoteBar';
import { PHONE_E164 as PHONE, PHONE_DISPLAY } from '@/lib/contact';
import { stPeteBeachFaqs } from '@/pages/stPeteBeachFaqs';
import { ServiceQuoteForm } from '@/components/ServiceQuoteForm';
import { StPeteBeachHeroPhone } from '@/components/StPeteBeachHeroPhone';
import StPeteBeachBelowFold from '@/pages/StPeteBeachBelowFold';
import { usePageMeta, NAV_FONTS } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

const PAGE_TITLE = 'St. Pete Beach Pool Service & Cleaning | Suncoast Pool Pros';
const PAGE_DESC =
  'Weekly pool service for St. Pete Beach, FL — built for salt air, sun & heavy use. Consistent tech, equipment checked, flat rate, photo report every visit.';

const HeroSection = () => {
  const { open } = useQuoteSheet();
  const handleQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    open();
  };

  return (
    <div className="relative min-h-dvh flex items-center overflow-hidden pt-24 pb-16">
      {/* Background — bright, open-beach feel. Reuses the Pinellas interlude
          image set via the city hero classes; swap to a dedicated St. Pete
          Beach photo when one is uploaded (see heroPreload + index.css). */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#02060c]" />
        <div
          className="hero-bg-stpetebeach-desktop absolute inset-0 hidden md:block bg-cover bg-center"
          aria-hidden
        />
        <div
          className="hero-bg-stpetebeach-mobile absolute inset-x-0 top-0 h-[100lvh] md:hidden bg-cover bg-center"
          aria-hidden
        />

        <div
          className="hero-stpetebeach-tint absolute inset-0 pointer-events-none"
          aria-hidden
        />

        {/* Single readability scrim — merged gradients (see
            .hero-stpetebeach-scrim in index.css). */}
        <div className="hero-stpetebeach-scrim absolute inset-0 pointer-events-none" aria-hidden />

        {/* Spotlight glow behind the phone, deep-blue ambient lower-left for
            balance — same pairing as the homepage hero. This used to be a warm
            orange bloom, which read as a different brand before you'd scrolled
            a pixel. */}
        <div className="hidden md:block absolute top-[20%] right-[8%] w-[42vw] h-[52vh] bg-brand-blue/12 rounded-full blur-[130px] animate-float" />
        <div className="hidden md:block absolute bottom-[5%] left-[-12%] w-[42vw] h-[42vw] bg-[#0a2540]/35 rounded-full blur-[130px] animate-morph" />

        {/* Bottom blend into the next section (#07111c). */}
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#07111c] from-25% via-[#07111c]/70 to-transparent pointer-events-none" />
      </div>

      <Container className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Slides in on desktop with motion allowed (.spb-hero-in); simply
              there on phones and for reduced motion. */}
          <div className="spb-hero-in lg:col-span-7">
            {/* The page's one h1. Two lines from 768px; on phones it wraps
                where it falls, never inside "St. Pete Beach, FL". */}
            <h1 className="font-display font-semibold tracking-[-0.02em] text-white text-4xl sm:text-5xl md:text-[3.4rem] leading-[1.04] mb-5">
              <span className="md:block">Pool Cleaning Service</span>{' '}
              <span className="md:block">
                in <span className="whitespace-nowrap">St. Pete Beach, FL</span>
              </span>
            </h1>

            <p className="text-shadow-city-h1 font-display font-medium text-white/90 text-lg md:text-[1.375rem] leading-snug mb-5">
              Salt-tested. Always clear.
            </p>

            <p className="text-shadow-city-body text-[15px] sm:text-base text-gray-200 max-w-[38rem] leading-[1.65] mb-7">
              Balanced water, inspected equipment and a photo report after every visit, built for salt air, sand and
              full sun.
            </p>

            {/* #get-price: the phone bar appears once this row scrolls away. */}
            <div id="get-price" className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <a href="#quote" onClick={handleQuote} className="btn bg-[#f7b500] text-[#243a55] hover:bg-[#ffc01f]">
                Get a Free Quote
              </a>
              <Glass
                href={`tel:${PHONE}`}
                className="glass-mobile-blur inline-flex items-center justify-center gap-2 px-6 py-3 text-white/90 hover:text-white rounded-lg font-semibold text-[15px]"
              >
                <Phone className="w-4 h-4 text-brand-blue-light" />
                {PHONE_DISPLAY}
              </Glass>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-gray-400">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5 text-[#f7b500]">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="font-semibold text-white/90">5.0</span>
                <span className="text-gray-500">on Google</span>
              </div>
            </div>
          </div>

          {/* Right column: phone mockup. DESKTOP ONLY (lg+); on mobile it
              renders in its own section below the hero. */}
          <div className="hidden lg:flex lg:col-span-5 justify-center items-center relative">
            <StPeteBeachHeroPhone />
          </div>
        </div>
      </Container>
    </div>
  );
};

// Mobile-only phone-mockup section, rendered immediately after the hero — keeps
// the heavy phone out of the above-the-fold 100vh hero on phones.
const PhoneShowcaseMobile = () => (
  <section className="lg:hidden relative bg-[#07111c] py-12 flex justify-center">
    <StPeteBeachHeroPhone />
  </section>
);

// Page JSON-LD, through usePageMeta so it lands in the PRERENDERED head.
// No LocalBusiness node of its own: the site-wide one in index.html (same
// @id, full NAP, St. Pete Beach in its areaServed) is the page's one business
// entity. A second node with that @id but a different url and areaServed
// read as two conflicting businesses.
const PAGE_SCHEMA = [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: stPeteBeachFaqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'St. Pete Beach', path: '/st-pete-beach-fl/' },
      ]),
    ];

export const StPeteBeachPage = () => {
  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESC,
    canonicalPath: '/st-pete-beach-fl/',
    // Mirrors .hero-bg-stpetebeach-* in index.css.
    heroPreload: {
      mobile: '/st-pete-beach-hero-mobile-v2.webp',
      desktop: '/st-pete-beach-hero-1600.webp',
      wide: '/st-pete-beach-hero-1920.webp',
    },
    // Geist for the whole hero, Montserrat for the header's wordmark.
    fontPreload: [...NAV_FONTS],
    jsonLd: PAGE_SCHEMA,
  });

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#1f7fdb] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />
      <div className="relative z-10">
        <Navbar goldCta />
        <HeroSection />
        <PhoneShowcaseMobile />
        <StPeteBeachBelowFold />
        {/* On-page quote form in place of the shared call-to-action band, so the page ships
            a real <form> in its prerendered HTML (CLAUDE.md #13). The copy and the
            two qualifying questions are this page's own. */}
        <ServiceQuoteForm
          layout="form-left"
          accent="gold"
          eyebrow="St. Pete Beach Quote"
          heading="Pool service built for the beach, priced the same day."
          intro={<>Salt air, full sun and heavy use are harder on a pool than anywhere inland. Tell us what it runs on and how close to the Gulf it sits, and you&rsquo;ll get one flat monthly price back today.</>}
          points={[
            "Equipment checked every visit for salt-air corrosion",
            "Chemistry adjusted for sun, splash-out and summer rain",
            "Flat monthly rate, chemicals included, no contract",
          ]}
          service={{ value: 'weekly', label: 'Weekly pool service' }}
          extraFields={[
            {
              id: "sanitizer",
              label: "Is the pool salt or chlorine?",
              type: 'select',
              required: false,
              options: [
                { value: "salt", label: "Salt system" },
                { value: "chlorine", label: "Chlorine" },
                { value: "unsure", label: "Not sure" },
              ],
            },
            {
              id: "location",
              label: "Where does the home sit?",
              type: 'select',
              required: false,
              options: [
                { value: "gulf-front", label: "Gulf-front" },
                { value: "bay-canal", label: "On the bay or a canal" },
                { value: "inland", label: "A few streets back" },
              ],
            },
          ]}
          source="st-pete-beach-quote-form"
          submitLabel="Get My St. Pete Beach Quote"
          successTitle="Got it — we will be in touch today."
          successBody="We will come back with your flat weekly rate and what we would keep an eye on for a pool that close to the water."
          footnote={<>A photo of the equipment pad tells us a lot — text it to {PHONE_DISPLAY}.</>}
          cardId="quote-form"
        />
        <Footer />
      </div>
      {/* Phones only: Call + Get a free quote, to the form above. */}
      <StickyQuoteBar label="Get a free quote" formId="quote-form" hideFrom="md" tone="dark" />
    </div>
  );
};
