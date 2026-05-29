import React, { useEffect, useState } from 'react';
import { m } from 'motion/react';
import {
  Phone,
  Star,
  MapPin,
  ShieldCheck,
  Sun,
  Camera,
  UserCheck,
  CalendarCheck,
  MessageSquareText,
  Plus,
  Minus,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Glass } from '@/components/Glass';
import { Container } from '@/components/Container';
import { CtaBand } from '@/components/CtaBand';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { StickyMobileCta } from '@/components/StickyMobileCta';

import { PHONE_E164 as PHONE, PHONE_DISPLAY } from '@/lib/contact';

const PAGE_TITLE =
  'Pool Service Belleair Beach, FL | Discreet Weekly Pool Care';
const PAGE_DESC =
  'Discreet, reliable pool service for Belleair Beach waterfront homes. The same trusted technician every week, coastal-grade care, and a photo report after every visit.';
const PAGE_URL = 'https://suncoastpoolpros.com/belleair-beach-fl/';

/* Coastal pain → our answer. Maintenance-first framing, no hard price lead. */
const coastalCare = [
  {
    icon: UserCheck,
    title: 'The same technician, every week',
    body:
      "You get one dedicated, background-checked technician who learns your pool and your property — not a rotating crew. Discreet, respectful service that fits your schedule and your home.",
  },
  {
    icon: Sun,
    title: 'Built for salt air & relentless sun',
    body:
      'Gulf-front pools take a beating — UV burns off chlorine fast and salt air accelerates wear. We stay ahead of it with consistent weekly chemistry and close equipment care.',
  },
  {
    icon: ShieldCheck,
    title: 'Equipment protected, not just cleaned',
    body:
      'Maintenance is the whole point. We monitor pumps, filters, and salt cells closely so coastal wear gets caught early — long before it becomes a costly repair or replacement.',
  },
  {
    icon: Camera,
    title: "Looked after when you're away",
    body:
      'Many island homes sit empty for stretches. GPS-verified visits and a photo report after every clean mean your pool stays guest-ready and protected whether you are in town or not.',
  },
];

const process = [
  {
    icon: CalendarCheck,
    step: 'Structured weekly service',
    body:
      'A set day, every week, with a documented checklist. No missed visits, no guesswork — your pool is maintained on a rhythm you can count on.',
  },
  {
    icon: Camera,
    step: 'Proof after every visit',
    body:
      'A photo-backed service report lands in your inbox after each clean, showing exactly what was done and the state of your water. Total transparency, even when you are away.',
  },
  {
    icon: MessageSquareText,
    step: 'A real person, one call away',
    body:
      'Questions or a special request? You reach the same local team directly — same-day response, no call centers, no runaround.',
  },
];

const faqs = [
  {
    q: 'Do you service waterfront and seasonal homes in Belleair Beach?',
    a: "Yes — it's much of what we do here. Whether you live in Belleair Beach year-round or your home sits empty for part of the season, your pool is maintained on a structured weekly schedule with a photo report after every visit, so it stays guest-ready and protected even when you're away.",
  },
  {
    q: 'Will I have the same pool technician each week?',
    a: 'Yes. You get one dedicated technician assigned to your property who learns your pool, your equipment, and how you like things handled. Consistency is the point — it means better care, fewer surprises, and a service person you actually know and trust on your property.',
  },
  {
    q: 'How do you handle the salt air and harsh coastal conditions?',
    a: 'Gulf-front pools face heavy sun, salt spray, and wind-blown debris that throw off water chemistry and wear on equipment faster than an inland pool. We counter it with consistent weekly balancing and close monitoring of your pump, filter, and salt cell, catching coastal wear early so small issues never become expensive ones.',
  },
  {
    q: 'What happens with my pool during storm season?',
    a: 'Routine weekly service includes clearing normal rain and debris and rebalancing your water. After a major storm — heavy debris, contamination, or a post-hurricane cleanup — we prioritize getting our Belleair Beach customers back to clear and safe as quickly as routes allow, and we quote any major recovery work before starting.',
  },
  {
    q: 'Is your service discreet and respectful of my privacy?',
    a: 'Always. Our technicians work quietly and professionally, respect your property and your time, and keep disruptions to none. For many of our waterfront homeowners, discretion is exactly why they choose us.',
  },
];

const HeroSection = () => {
  const { open } = useQuoteSheet();
  const handleQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    open();
  };

  return (
    <div className="relative min-h-[calc(100vh-2rem)] lg:min-h-[720px] flex items-center overflow-hidden pt-24 pb-20">
      {/* Background — coastal, calm, premium */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#02060c]" />
        <div
          className="absolute -inset-y-[18%] inset-x-0 hidden md:block bg-cover bg-center"
          style={{
            backgroundImage:
              "image-set(url('/hero-bg-1280.webp') type('image/webp') 1x, url('/hero-bg-1920.webp') type('image/webp') 2x, url('/hero-bg-1280.jpg') type('image/jpeg') 1x)",
            filter: 'saturate(1.3) brightness(0.8) contrast(1.1) hue-rotate(-4deg)',
          }}
          aria-hidden
        />
        <div
          className="absolute top-0 inset-x-0 h-screen md:hidden bg-cover bg-center"
          style={{
            backgroundImage:
              "image-set(url('/hero-bg-mobile.webp') type('image/webp'), url('/hero-bg-mobile.jpg') type('image/jpeg'))",
            filter: 'saturate(1.3) brightness(0.8) contrast(1.1) hue-rotate(-4deg)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 92%)',
            maskImage: 'linear-gradient(to bottom, black 55%, transparent 92%)',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: '#0f4d80', mixBlendMode: 'overlay', opacity: 0.45 }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02060c]/40 via-[#04090f]/55 to-[#07111c] md:via-[#04090f]/70" />
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#02060c]/85 via-[#02060c]/35 to-transparent pointer-events-none" />
        <div className="absolute top-[12%] left-[-8%] w-[45vw] h-[55vh] bg-brand-blue/15 rounded-full blur-[130px] animate-float" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[#07111c] from-25% to-transparent pointer-events-none" />
      </div>

      <Container className="relative z-10 w-full">
        <div className="max-w-2xl">
          <m.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <Glass className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8">
              <MapPin className="w-3.5 h-3.5 text-brand-blue-light" />
              <span className="text-xs font-medium text-cyan-50 tracking-wider uppercase">
                Belleair Beach · Gulf Barrier Island
              </span>
            </Glass>

            {/* Visual headline — a div, so the SEO h1 below carries keyword weight */}
            <div className="font-display font-bold text-white tracking-tight mb-6 leading-[1.08]">
              <span className="block text-4xl sm:text-5xl md:text-[3.4rem] leading-[1.04]">
                Your pool, in
              </span>
              <span
                className="block text-brand-blue-light text-4xl sm:text-5xl md:text-[3.4rem] leading-[1.04]"
                style={{ textShadow: '0 0 50px rgba(74,147,209,0.35)' }}
              >
                trusted hands.
              </span>
            </div>

            {/* SEO H1 — local keyword for this city page */}
            <h1
              className="font-display font-medium text-white/90 text-[17px] sm:text-lg md:text-[1.1875rem] leading-snug mb-5 tracking-tight"
              style={{ textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}
            >
              Belleair Beach's trusted pool cleaning &amp; maintenance company.
            </h1>

            <p
              className="text-[15px] sm:text-base text-gray-200 font-light max-w-[34rem] leading-[1.65] mb-7"
              style={{ textShadow: '0 1px 10px rgba(0,0,0,0.55)' }}
            >
              <span className="text-white">The same trusted technician every week</span> —
              discreet, reliable service that respects your time and your home. Salt air and
              Gulf sun are hard on a beachside pool; we keep yours clear, balanced, and
              guest-ready year-round, whether you're here or away.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <a href="#quote" onClick={handleQuote} className="btn btn-blue">
                Get a Free Quote
              </a>
              <Glass
                href={`tel:${PHONE}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white/90 hover:text-white rounded-lg font-medium text-[15px]"
              >
                <Phone className="w-4 h-4 text-brand-blue-light" />
                {PHONE_DISPLAY}
              </Glass>
            </div>
            <p className="mt-3 text-[13px] text-gray-400">
              Prefer to talk it through? Call us directly — a real person, same day.
            </p>

            {/* Trust strip */}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-gray-400">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5 text-brand-orange">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="font-medium text-white/90">5.0</span>
                <span className="text-gray-500">on Google</span>
              </div>
              <span className="hidden sm:inline text-gray-700">•</span>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-blue-light" />
                <span>Always Blue Guarantee</span>
              </div>
            </div>
          </m.div>
        </div>
      </Container>
    </div>
  );
};

const CoastalCareSection = () => (
  <section className="py-20 md:py-28 bg-[#07111c] relative overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-brand-blue/[0.06] rounded-full blur-[140px] pointer-events-none" />
    <Container className="relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-14"
      >
        <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          Island Pool Care
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          Service built for homes that demand consistency.
        </h2>
        <p className="section-subtext">
          Belleair Beach sits right on the Gulf, and that environment is unforgiving on
          pools and equipment. Our weekly service is built around staying ahead of it —
          quietly, reliably, and on a schedule you never have to think about.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {coastalCare.map((item, i) => (
          <m.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="glass-panel rounded-2xl p-6 md:p-7 flex gap-5"
          >
            <div className="shrink-0 w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
              <item.icon className="w-6 h-6 text-brand-blue-light" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-[15px]">{item.body}</p>
            </div>
          </m.div>
        ))}
      </div>
    </Container>
  </section>
);

const ProcessSection = () => (
  <section className="py-20 md:py-24 bg-gradient-to-b from-[#07111c] to-[#0a1628] relative">
    <Container>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mb-12"
      >
        <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
          How It Works
        </span>
        <h2 className="section-heading text-white leading-tight mb-4">
          No surprises. No missed visits. No headaches.
        </h2>
        <p className="section-subtext">
          A structured service with professional oversight and clear communication at
          every step — so your pool is simply handled.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {process.map((item, i) => (
          <m.div
            key={item.step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel rounded-2xl p-7"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-5">
              <item.icon className="w-6 h-6 text-brand-blue-light" />
            </div>
            <h3 className="text-lg font-display font-bold text-white mb-2">
              {item.step}
            </h3>
            <p className="text-gray-400 leading-relaxed text-[15px]">{item.body}</p>
          </m.div>
        ))}
      </div>
    </Container>
  </section>
);

const PromiseStrip = () => (
  <section className="py-16 md:py-20 bg-[#0a1628] relative">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="section-heading text-white leading-tight mb-4">
          Consistent care. Protected equipment. Always swim-ready.
        </h2>
        <p className="section-subtext max-w-2xl mx-auto mb-8">
          The same dedicated technician every week, full chemical balancing, and a
          documented report after every visit — all for one flat monthly rate, with no
          contracts and no surprise chemical bills.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-300">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-blue-light" /> Always Blue Guarantee
          </span>
          <span className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-brand-blue-light" /> Photo report every visit
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-blue-light" /> GPS-verified service
          </span>
        </div>
      </m.div>
    </div>
  </section>
);

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section className="py-20 md:py-24 bg-[#07111c] relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
            Belleair Beach Pool Service
          </span>
          <h2 className="section-heading text-white">Questions, answered.</h2>
        </m.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="glass-panel rounded-2xl overflow-hidden transition-colors hover:bg-white/10"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left gap-4"
                aria-expanded={openIndex === index}
              >
                <span className="text-white font-medium text-[17px]">{faq.q}</span>
                {openIndex === index ? (
                  <Minus className="w-5 h-5 shrink-0 text-brand-blue-light" />
                ) : (
                  <Plus className="w-5 h-5 shrink-0 text-gray-400" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const usePageSeo = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = PAGE_TITLE;

    // Meta + OG tags — created if missing, restored on unmount.
    const ensureMeta = (selector: string, attrs: Record<string, string>) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      const created = !el;
      if (!el) {
        el = document.createElement('meta');
        document.head.appendChild(el);
      }
      const prev: Record<string, string | null> = {};
      Object.entries(attrs).forEach(([k, v]) => {
        prev[k] = el!.getAttribute(k);
        el!.setAttribute(k, v);
      });
      return () => {
        if (created) el!.remove();
        else Object.entries(prev).forEach(([k, v]) => (v === null ? el!.removeAttribute(k) : el!.setAttribute(k, v)));
      };
    };

    const cleanups = [
      ensureMeta('meta[name="description"]', { name: 'description', content: PAGE_DESC }),
      ensureMeta('meta[property="og:title"]', { property: 'og:title', content: PAGE_TITLE }),
      ensureMeta('meta[property="og:description"]', { property: 'og:description', content: PAGE_DESC }),
      ensureMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' }),
      ensureMeta('meta[property="og:url"]', { property: 'og:url', content: PAGE_URL }),
      ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' }),
    ];

    // JSON-LD: LocalBusiness scoped to Belleair Beach + FAQPage.
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': 'https://suncoastpoolpros.com/#business',
        name: 'Suncoast Pool Pros',
        url: PAGE_URL,
        telephone: '+1-727-295-3621',
        priceRange: '$$',
        areaServed: { '@type': 'City', name: 'Belleair Beach', addressRegion: 'FL' },
        description:
          'Discreet, reliable weekly pool cleaning and maintenance for Belleair Beach waterfront and seasonal homes.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ]);
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      cleanups.forEach((fn) => fn());
      ld.remove();
    };
  }, []);
};

export const BelleairBeachPage = () => {
  usePageSeo();

  return (
    <>
      <div className="min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#1669AE] selection:text-white">
        <div className="fixed inset-0 bg-mesh opacity-40 pointer-events-none" />
        <div className="relative z-10">
          <Navbar />
          <HeroSection />
          <CoastalCareSection />
          <ProcessSection />
          <PromiseStrip />
          <FaqSection />
          <CtaBand />
          <Footer />
        </div>
        <StickyMobileCta />
      </div>
    </>
  );
};
