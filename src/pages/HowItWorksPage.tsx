import React, { useEffect, useRef, useState } from 'react';
import { m } from 'motion/react';
import {
  Workflow,
  Phone,
  MessageSquare,
  CalendarCheck,
  ClipboardCheck,
  CreditCard,
  FlaskConical,
} from 'lucide-react';
import { QuoteSheetProvider, useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { Container } from '@/components/Container';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';

const SECTIONS = [
  { id: 'getting-started', number: 1, title: 'Getting Started' },
  { id: 'billing', number: 2, title: 'Billing & Invoicing' },
  { id: 'chemical-care', number: 3, title: 'Chemical Care & Cleaning' },
] as const;

// Onboarding steps — also the source for the HowTo JSON-LD below.
const ONBOARDING_STEPS = [
  {
    title: 'Reach out',
    text: `Text us a couple of photos of your pool and equipment pad with your address, call us at ${PHONE_DISPLAY}, or fill out the quick quote form. We reply the same day during business hours.`,
  },
  {
    title: 'Get your flat-rate quote',
    text: 'We send back a clear, flat monthly rate — often without needing a visit. No pressure, no obligation, and no drawn-out sales process.',
  },
  {
    title: 'Approve & sign up',
    text: 'Service is month-to-month with no long-term contract. Once you approve your quote, we set up billing and get you onto the schedule.',
  },
  {
    title: 'We schedule your weekly route',
    text: 'Because our routes are concentrated around St. Petersburg, Pinellas County, and West Tampa, we can usually start within days rather than weeks.',
  },
  {
    title: 'First visit & written report',
    text: 'We service your pool and leave a written report with your water readings. You never need to be home — we just need safe access to the pool and equipment.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to start pool service with Suncoast Pool Pros in St. Petersburg, FL',
  description:
    'How weekly flat-rate pool service works with Suncoast Pool Pros — from your first quote to your recurring weekly visit in St. Petersburg and the Tampa Bay area.',
  step: ONBOARDING_STEPS.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.text,
  })),
};

const HowItWorksPageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  // Title + HowTo JSON-LD injection (mirrors FaqPage's schema pattern).
  useEffect(() => {
    document.title = 'How Pool Service Works — Suncoast Pool Pros | St. Pete';
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(howToSchema);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Scroll-spy: light up the TOC entry nearest the top of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -65% 0px', threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleTocClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  return (
    <div className="min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="fixed inset-0 bg-mesh opacity-50 pointer-events-none" />

      {/* Ambient brand glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[720px] h-[520px] rounded-full bg-brand-blue/15 blur-[140px]" />
        <div className="absolute bottom-[-12%] right-[-8%] w-[520px] h-[520px] rounded-full bg-brand-orange/10 blur-[130px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm px-3.5 py-1.5">
            <Workflow className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-medium tracking-wide text-xs">
              How It Works
            </span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            How our pool service works in St. Petersburg
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
            From your first quote to crystal-clear water every week — here's exactly how
            weekly flat-rate pool care works with Suncoast Pool Pros across Pinellas County
            and the Tampa Bay area.
          </p>
        </section>

        {/* TOC sidebar + content */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-12 items-start">
            {/* Table of contents */}
            <nav aria-label="Sections" className="mb-8 lg:mb-0">
              <div className="lg:sticky lg:top-24">
                <p className="text-gray-500 font-semibold tracking-[0.15em] uppercase text-[11px] mb-3 px-3">
                  On this page
                </p>
                <ul className="space-y-0.5">
                  {SECTIONS.map((section) => {
                    const active = section.id === activeId;
                    return (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          onClick={(e) => handleTocClick(e, section.id)}
                          aria-current={active ? 'true' : undefined}
                          className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                            active
                              ? 'text-white bg-white/[0.05]'
                              : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                          }`}
                        >
                          <span className="text-gray-500 mr-1.5">{section.number}.</span>
                          {section.title}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>

            {/* Content */}
            <div className="min-w-0 space-y-16">
              {/* 1 — Getting Started */}
              <article id="getting-started" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-10 h-10 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-5 h-5 text-brand-orange" />
                  </span>
                  <h2 className="font-display font-bold text-white text-2xl sm:text-3xl">
                    Getting Started
                  </h2>
                </div>
                <p className="text-gray-300 leading-relaxed text-[15px] mb-7 max-w-2xl">
                  Signing up takes about two minutes. There's no contract and no obligation —
                  here's the whole process from first contact to your first weekly visit.
                </p>

                <ol className="space-y-4">
                  {ONBOARDING_STEPS.map((step, i) => (
                    <m.li
                      key={step.title}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                    >
                      <span className="w-8 h-8 rounded-full bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center shrink-0 font-display font-bold text-brand-blue-light text-sm">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold mb-1">{step.title}</h3>
                        <p className="text-gray-400 leading-relaxed text-[15px]">{step.text}</p>
                      </div>
                    </m.li>
                  ))}
                </ol>
              </article>

              {/* 2 — Billing & Invoicing */}
              <article id="billing" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-10 h-10 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-brand-orange" />
                  </span>
                  <h2 className="font-display font-bold text-white text-2xl sm:text-3xl">
                    Billing &amp; Invoicing
                  </h2>
                </div>
                <p className="text-gray-300 leading-relaxed text-[15px] mb-7 max-w-2xl">
                  You're billed one predictable flat rate every month — so pool care budgets
                  like any other monthly bill, with no end-of-month surprises.
                </p>

                <div className="space-y-4 max-w-2xl">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-white font-semibold mb-1.5">One flat monthly rate</h3>
                    <p className="text-gray-400 leading-relaxed text-[15px]">
                      Your weekly cleaning and all standard chemicals are bundled into a single
                      flat monthly price — no per-visit chemical surcharges when chlorine demand
                      spikes in summer, and no contracts.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-white font-semibold mb-1.5">How you pay</h3>
                    <p className="text-gray-400 leading-relaxed text-[15px]">
                      We accept bank transfers (ACH) and all major credit cards. ACH is free;
                      card payments include a small processing fee to cover what the card
                      networks charge us — so ACH is the way to go if you'd like to avoid any fee.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-white font-semibold mb-1.5">What's billed separately</h3>
                    <p className="text-gray-400 leading-relaxed text-[15px]">
                      Major equipment repairs, replacement parts, green-to-clean recoveries, and
                      major storm cleanups are the only things billed outside your flat rate — and
                      we always quote those and get your approval before doing any work.
                    </p>
                  </div>
                </div>
              </article>

              {/* 3 — Chemical Care & Cleaning */}
              <article id="chemical-care" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-10 h-10 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-5 h-5 text-brand-orange" />
                  </span>
                  <h2 className="font-display font-bold text-white text-2xl sm:text-3xl">
                    Chemical Care &amp; Cleaning
                  </h2>
                </div>
                <p className="text-gray-300 leading-relaxed text-[15px] mb-7 max-w-2xl">
                  Every weekly visit is a full-service clean plus a careful water balance. In
                  Florida's heat and rain, consistent chemistry is the difference between a pool
                  that's always swim-ready and one that's a constant battle.
                </p>

                <div className="space-y-4 max-w-2xl">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-white font-semibold mb-1.5">What every visit includes</h3>
                    <p className="text-gray-400 leading-relaxed text-[15px]">
                      We brush the walls, steps, and waterline, skim the surface, vacuum the floor,
                      and empty the skimmer and pump baskets. Then we test your water and balance
                      the chemistry — chlorine, pH, alkalinity, stabilizer, and more — adding the
                      chemicals your pool needs that week. A quick equipment check on the pump,
                      filter, and any salt system catches small issues before they get expensive.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-white font-semibold mb-1.5">
                      Stabilizer (CYA) and your chlorine
                    </h3>
                    <p className="text-gray-400 leading-relaxed text-[15px]">
                      Cyanuric acid (CYA, or stabilizer) is sunscreen for your chlorine — a little
                      is essential in Florida sun, but too much "locks up" your chlorine, so a pool
                      can read normal chlorine and still turn green. We track the CYA-to-chlorine
                      ratio on every visit and adjust before it becomes a problem.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-white font-semibold mb-1.5">Saltwater pools</h3>
                    <p className="text-gray-400 leading-relaxed text-[15px]">
                      A saltwater pool is a chlorine pool that makes its own chlorine from salt. We
                      clean the salt cell to remove calcium buildup, check your salinity, and balance
                      the rest of your chemistry — all on the same flat-rate weekly plan.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h3 className="text-white font-semibold mb-1.5 inline-flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-brand-orange" />
                      A written report &amp; the Always Blue Guarantee
                    </h3>
                    <p className="text-gray-400 leading-relaxed text-[15px]">
                      After every clean you get a written report documenting what was done and your
                      water readings. It's all backed by our Always Blue Guarantee: as long as you're
                      on a weekly plan and we keep exclusive control of your water chemistry, your
                      water stays clear — or we come back and make it right.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Ready for an always-blue pool?
              </h2>
              <p className="text-gray-400 mb-7 max-w-md mx-auto">
                Text us photos of your pool for the fastest flat-rate quote, or give us a call —
                we answer Monday through Saturday.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="#quote" onClick={handleQuoteClick} className="btn btn-orange w-full sm:w-auto">
                  <MessageSquare className="w-[18px] h-[18px]" />
                  Get a Free Quote
                </a>
                <a href={PHONE_HREF} className="btn btn-glass w-full sm:w-auto">
                  <Phone className="w-[18px] h-[18px]" />
                  {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      <StickyMobileCta />
    </div>
  );
};

export const HowItWorksPage = () => (
  <QuoteSheetProvider>
    <HowItWorksPageInner />
  </QuoteSheetProvider>
);
