import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  Workflow,
  Phone,
  MessageSquare,
  Wallet,
  Receipt,
  ShieldQuestion,
  Droplets,
  FlaskConical,
  Waves,
  ClipboardCheck,
  Plus,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { QuoteSheetProvider, useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { Container } from '@/components/Container';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta } from '@/lib/usePageMeta';
import { faqs } from '@/data/faqs';

// Onboarding steps — also the source for the HowTo JSON-LD below.
const ONBOARDING_STEPS = [
  {
    title: 'Reach out',
    text: `Text photos of your pool and equipment with your address, call ${PHONE_DISPLAY}, or use the quick form. Same-day reply.`,
  },
  {
    title: 'Get your flat-rate quote',
    text: 'A clear, flat monthly rate — often without a visit. No pressure, no obligation.',
  },
  {
    title: 'Approve & sign up',
    text: 'Month-to-month, no long-term contract. Approve your quote and we set up billing.',
  },
  {
    title: 'We schedule your route',
    text: 'Routes are concentrated around St. Petersburg and Pinellas — we usually start within days.',
  },
  {
    title: 'First visit & report',
    text: "We service your pool and leave a written report. You don't need to be home — just safe access.",
  },
];

const BILLING_CARDS = [
  {
    icon: Wallet,
    title: 'One flat monthly rate',
    text: 'Your weekly cleaning and all standard chemicals are bundled into a single flat monthly price — no per-visit chemical surcharges when demand spikes in summer, and no contracts.',
  },
  {
    icon: Receipt,
    title: 'How you pay',
    text: 'We accept bank transfers (ACH) and all major credit cards. ACH is free; cards include a small processing fee — so ACH is the way to go to avoid any fee.',
  },
  {
    icon: ShieldQuestion,
    title: "What's billed separately",
    text: 'Major repairs, replacement parts, green-to-clean recoveries, and major storm cleanups are the only extras — and we always quote and get your approval before any work.',
  },
];

const CARE_CARDS = [
  {
    icon: Droplets,
    title: 'What every visit includes',
    text: 'Brush walls, steps, and waterline; skim; vacuum; empty baskets. Then we test and balance your chemistry — chlorine, pH, alkalinity, stabilizer — and check the pump, filter, and salt system.',
  },
  {
    icon: FlaskConical,
    title: 'Stabilizer (CYA) & your chlorine',
    text: 'CYA is sunscreen for chlorine — essential in Florida sun, but too much "locks up" your chlorine, so a pool can read normal and still go green. We track the ratio every visit and adjust early.',
  },
  {
    icon: Waves,
    title: 'Saltwater pools',
    text: 'A saltwater pool makes its own chlorine from salt. We clean the salt cell, check salinity, and balance the rest of your chemistry — all on the same flat-rate weekly plan.',
  },
  {
    icon: ClipboardCheck,
    title: 'Report & Always Blue Guarantee',
    text: 'You get a written report with your water readings after every clean — backed by our Always Blue Guarantee: stay on a weekly plan and your water stays clear, or we come back and make it right.',
  },
];

// Quick FAQ — pulled by question text so answers stay in sync with faqs.ts.
const QUICK_FAQ_QUESTIONS = [
  'Do I need to be home for service?',
  'Do you require a long-term contract?',
  'Will I have the same technician each week?',
  'How quickly can you start service?',
];
const QUICK_FAQ = QUICK_FAQ_QUESTIONS
  .map((q) => faqs.find((f) => f.question === q))
  .filter((f): f is NonNullable<typeof f> => Boolean(f));

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
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  usePageMeta({
    title: 'How Suncoast Pool Service Actually Works',
    description:
      "From your first quote to the weekly photo report in your inbox — here's exactly what working with Suncoast Pool Pros looks like, week one through year five.",
    canonicalPath: '/how-it-works',
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(howToSchema);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  return (
    <div className="min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="fixed inset-0 bg-mesh opacity-50 pointer-events-none" />

      <div className="absolute top-0 inset-x-0 h-[520px] pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[520px] rounded-full bg-brand-blue/20 blur-[140px]" />
        <div className="absolute left-1/2 -translate-x-1/4 -top-16 w-[440px] h-[440px] rounded-full bg-brand-orange/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm px-3.5 py-1.5">
            <Workflow className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-medium tracking-wide text-xs">How It Works</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            How our pool service works in St. Petersburg
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-8">
            From your first quote to crystal-clear water every week — here's exactly how weekly
            flat-rate pool care works across Pinellas County and the Tampa Bay area.
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
        </section>

        {/* ── 1. Getting started — step timeline ───────────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Getting Started
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                Quick and easy to get your pool service started
              </h2>
              <p className="text-gray-400 leading-relaxed">
                No contract, no obligation — here's the whole path from first hello to your first
                weekly visit.
              </p>
            </div>

            <ol className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-5 max-w-6xl mx-auto">
              {ONBOARDING_STEPS.map((step, i) => (
                <m.li
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors"
                >
                  <span className="inline-flex w-9 h-9 rounded-full bg-brand-orange text-white font-display font-bold items-center justify-center mb-3">
                    {i + 1}
                  </span>
                  <h3 className="text-white font-semibold mb-1.5 leading-snug">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.text}</p>
                </m.li>
              ))}
            </ol>
          </Container>
        </section>

        {/* ── 2. Billing — light band, 3-card grid ─────────────────── */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Billing &amp; Invoicing
              </span>
              <h2 className="font-display font-bold text-[#0a1628] text-3xl sm:text-4xl leading-tight mb-3">
                One flat price. No surprises.
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Pool care budgets like any other monthly bill — predictable, with nothing tacked on
                at the end of the month.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
              {BILLING_CARDS.map((card, i) => (
                <m.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl bg-white border border-black/5 shadow-sm shadow-black/5 p-6"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-4">
                    <card.icon className="w-5 h-5 text-brand-blue" />
                  </span>
                  <h3 className="text-[#0a1628] font-display font-bold text-lg mb-2">{card.title}</h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed">{card.text}</p>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── 3. Chemical care — 2x2 feature grid ──────────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Chemical Care &amp; Cleaning
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                What happens at every weekly visit
              </h2>
              <p className="text-gray-400 leading-relaxed">
                A full-service clean plus a careful water balance — the difference between a pool
                that's always swim-ready and one that's a constant battle.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 max-w-4xl mx-auto">
              {CARE_CARDS.map((card, i) => (
                <m.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center mb-4">
                    <card.icon className="w-5 h-5 text-brand-orange" />
                  </span>
                  <h3 className="text-white font-display font-bold text-lg mb-2">{card.title}</h3>
                  <p className="text-gray-400 text-[15px] leading-relaxed">{card.text}</p>
                </m.div>
              ))}
            </div>

            {/* Cross-link: dosing chemicals correctly requires knowing the
                pool's gallons. The calculator is the natural next step. */}
            <Link
              to="/tools/pool-volume-calculator"
              className="mt-6 mx-auto max-w-4xl flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-colors p-5 group"
            >
              <span className="flex items-center gap-4 min-w-0">
                <span className="w-11 h-11 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5 text-brand-blue-light" />
                </span>
                <span className="min-w-0">
                  <span className="block text-white font-semibold text-[15px] leading-tight">
                    Need your pool's gallons for dosing?
                  </span>
                  <span className="block text-gray-400 text-sm mt-0.5">
                    Free pool volume calculator — any shape, no email needed.
                  </span>
                </span>
              </span>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          </Container>
        </section>

        {/* ── Quick answers — mini FAQ accordion ───────────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                  Quick answers
                </h2>
                <p className="text-gray-400">
                  The questions homeowners ask most.{' '}
                  <a href="/faq" className="text-brand-orange hover:text-brand-orange-dark font-medium">
                    See all FAQs →
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {QUICK_FAQ.map((faq) => {
                  const isOpen = openFaq === faq.question;
                  return (
                    <div key={faq.question}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : faq.question)}
                        aria-expanded={isOpen}
                        className="w-full flex items-start justify-between gap-4 text-left px-5 sm:px-6 py-4"
                      >
                        <span className="font-display font-semibold text-white text-[15px] sm:text-base leading-snug">
                          {faq.question}
                        </span>
                        <span
                          className={`shrink-0 mt-0.5 text-gray-400 transition-transform duration-200 ${
                            isOpen ? 'rotate-45 text-brand-orange' : ''
                          }`}
                        >
                          <Plus className="w-5 h-5" />
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <m.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <p className="px-5 sm:px-6 pb-5 -mt-1 text-gray-400 leading-relaxed text-[15px]">
                              {faq.answer}
                            </p>
                          </m.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        {/* Closing CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Ready for an always-blue pool?
              </h2>
              <p className="text-gray-400 mb-7 max-w-md mx-auto">
                Text us photos of your pool for the fastest flat-rate quote, or give us a call — we
                answer Monday through Saturday.
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
