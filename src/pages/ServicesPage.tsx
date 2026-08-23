import React, { useState } from 'react';
import { m } from 'motion/react';
import {
  Check,
  ClipboardCheck,
  ShieldCheck,
  CalendarClock,
  Camera,
  ArrowRight,
  Plus,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { QuoteSheetProvider, useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { SmartLink } from '@/components/SmartLink';
import { StickyMobileCta } from '@/components/StickyMobileCta';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta, FONTS, NAV_FONTS } from '@/lib/usePageMeta';
import { serviceSchema, poolServiceSchema } from '@/lib/businessSchema';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';
import { services, serviceHref } from '@/lib/services';

const CANONICAL = '/services/';

// The weekly visit, split the way it actually happens: the work done in the
// water, and the reporting that means you never have to wonder.
const VISIT_GROUPS = [
  {
    icon: ClipboardCheck,
    label: 'In the water, every visit',
    items: [
      'Surface skimmed, walls and waterline brushed, floor vacuumed as needed',
      'Skimmer and pump baskets emptied',
      'Filter checked, and cleaned or backwashed on schedule',
      'Full panel tested — chlorine, pH, alkalinity, stabilizer, salt',
      'Every standard chemical dosed and included in the flat rate',
    ],
  },
  {
    icon: Camera,
    label: 'On the pad, and in your inbox',
    items: [
      'Pump, heater and salt cell looked at while we are there',
      'Small problems flagged in writing before they become invoices',
      'Anything needing your decision quoted before we touch it',
      'A photo-backed report sent before we leave the property',
    ],
  },
];

const SERVICES_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'What does weekly pool service actually cost?',
    answer:
      "Most residential pools land around $150 a month, all standard chemicals included. It moves with the size of the pool, how much tree cover it sits under, and whether it is salt or chlorine — but you get one flat number before we start, and that is the number on the invoice every month. No chemical surcharges, no fuel fees.",
  },
  {
    question: 'Do I need a contract?',
    answer:
      "No. There is no term, no cancellation fee, and no auto-renewal to catch you out. If the service is not worth what you are paying, you should be able to stop — and the fact that we have to keep earning it every month is rather the point.",
  },
  {
    question: 'Are chemicals really included, or is that a starting price?',
    answer:
      "Genuinely included. Chlorine, acid, stabilizer, shock, salt where a salt pool needs topping up — all standard weekly chemistry is in the flat rate. The only things quoted separately are big one-off jobs: a recovery on a pool that is already green, a part, or real storm damage. Those are priced and approved before any work happens.",
  },
  {
    question: 'Can you handle a one-off job instead of weekly service?',
    answer:
      "Yes. Green pool recoveries, storm cleanups, filter cleans and equipment repairs are all quoted as standalone jobs — you do not have to sign up for anything ongoing to get one done. Plenty of people call us for a recovery, then stay on weekly because that is what stops it happening again.",
  },
  {
    question: 'What areas do you cover?',
    answer:
      "St. Petersburg and across Pinellas County — Clearwater, Largo, Seminole, Dunedin, Palm Harbor, Safety Harbor, the beaches from Belleair down through Treasure Island and St. Pete Beach — plus South Tampa and Davis Island. If you are near any of those, we are almost certainly already on your street.",
  },
  {
    question: 'How do I know the visit actually happened?',
    answer:
      "Every visit is GPS-confirmed at your address and written up with the chemistry numbers, what was done, and photos — sent to your inbox before the tech leaves. You never have to take anyone's word for it, which matters most if you are away from the property.",
  },
];

const SERVICES_SCHEMA = [
  poolServiceSchema(),
  ...services
    .filter((s) => s.slug !== 'weekly')
    .map((s) =>
      serviceSchema({
        serviceType: s.title,
        description: s.blurb,
        url: serviceHref(s).startsWith('/services/#') ? CANONICAL : serviceHref(s),
      }),
    ),
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SERVICES_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  },
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Services', path: CANONICAL },
  ]),
];

const ServicesPageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  usePageMeta({
    title: 'Pool Services St. Petersburg, FL — Weekly, Repairs & Cleanup',
    description:
      'Pool services across St. Petersburg & Pinellas County — flat-rate weekly cleaning with chemicals included, plus green pool recovery, storm cleanup, filters and equipment repair.',
    canonicalPath: CANONICAL,
    fontPreload: [...NAV_FONTS, FONTS.inter400, FONTS.montserrat900],
    jsonLd: SERVICES_SCHEMA,
  });

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-40 pointer-events-none" />

      <div className="absolute top-0 inset-x-0 h-[520px] pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[520px] rounded-full bg-brand-blue/20 blur-[140px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-blue-light" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">
              Pinellas County &amp; South Tampa
            </span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            Pool services in St.&nbsp;Petersburg, FL.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-8">
            One flat rate for the weekly service, and straight quotes for everything else —
            recoveries, storms, filters and equipment. No contracts, and no chemical bill
            arriving separately at the end of the month.
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

        {/* ── Everything we do ──────────────────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-[#07111c]">
          <div className="absolute top-0 right-1/4 w-[50%] h-[40%] bg-brand-blue/[0.06] rounded-full blur-[150px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="max-w-2xl mb-10 md:mb-12">
              <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Everything We Do
              </span>
              <h2 className="section-heading text-white leading-[1.1] mb-4">
                Six things, and we do all of them ourselves.
              </h2>
              <p className="section-subtext">
                No subcontracting the repairs out to someone you have never met, and no
                handing a green pool to a different company. Same crew, same phone number.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {services.map((s, i) => (
                <m.div
                  key={s.slug}
                  id={s.slug}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.06 }}
                  className="scroll-mt-24"
                >
                  <SmartLink
                    to={serviceHref(s)}
                    className="group relative block h-full rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.8)] hover:bg-white/[0.06] hover:border-white/15 transition-colors"
                  >
                    <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    <span className="w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-4">
                      <s.icon className="w-5 h-5 text-brand-blue-light" />
                    </span>
                    <h3 className="font-display font-bold text-white text-base mb-2 leading-snug flex items-center gap-1.5">
                      {s.title}
                      <ArrowRight className="w-4 h-4 text-gray-500 transition-all group-hover:text-brand-blue-light group-hover:translate-x-0.5" />
                    </h3>
                    <p className="text-gray-400 text-[15px] leading-relaxed">{s.blurb}</p>
                  </SmartLink>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── THE LIGHT BAND — the weekly offer ─────────────────── */}
        {/* Finding 1 from the services plan: there is deliberately NO separate
            weekly-pool-cleaning page, because it would compete with the
            homepage for the same query. The hub carries that offer instead, and
            it gets the light band because it is the thing being sold. */}
        <section
          id="weekly"
          className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7] scroll-mt-16"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                The Weekly Service
              </span>
              <h2 className="section-heading text-[#0a1628] leading-tight mb-4">
                One rate, every week, chemicals in the price.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                The service most people are actually looking for. Here is exactly what
                happens and what it costs, with nothing held back for a phone call.
              </p>
            </div>

            {/* Price anchor */}
            <div className="max-w-5xl mx-auto mb-6">
              <div className="rounded-2xl bg-white border border-brand-blue/15 shadow-[0_10px_30px_-18px_rgba(10,22,40,0.45)] p-6 sm:p-8 text-center">
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="font-display font-black text-[#0a1628] text-4xl md:text-5xl leading-none">
                    ~$150
                  </span>
                  <span className="text-slate-600 font-semibold text-lg">/ month</span>
                </div>
                <p className="text-[#0a1628] font-semibold mb-1">
                  Flat rate · all standard chemicals included · no contract
                </p>
                <p className="text-slate-500 text-sm max-w-lg mx-auto">
                  Typical for an average pool. The number moves with size, tree cover, and
                  whether it is salt or chlorine — you get yours in writing before we start.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 max-w-5xl mx-auto">
              {VISIT_GROUPS.map((group) => (
                <m.div
                  key={group.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-2xl bg-white border border-brand-blue/15 shadow-[0_10px_30px_-18px_rgba(10,22,40,0.45)] p-6 sm:p-7"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-10 h-10 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0">
                      <group.icon className="w-5 h-5 text-brand-blue" />
                    </span>
                    <h3 className="text-[#0a1628] font-display font-bold text-lg leading-snug">
                      {group.label}
                    </h3>
                  </div>
                  <ul className="flex flex-col gap-3">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="mt-0.5 w-5 h-5 rounded-md bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-brand-blue" />
                        </span>
                        <span className="text-slate-600 text-[15px] leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </m.div>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              <button type="button" onClick={openQuoteSheet} className="btn btn-orange">
                Get My Flat-Rate Quote
              </button>
              <p className="text-gray-500 text-sm text-center">
                Same-day response · No contracts · No obligation
              </p>
            </div>
          </Container>
        </section>

        {/* ── How it works, condensed ───────────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -right-28 w-[460px] h-[460px] rounded-full bg-brand-blue/[0.05] blur-[150px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8 lg:gap-12 items-center">
              <div>
                <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  Getting Started
                </span>
                <h2 className="section-heading text-white leading-[1.1] mb-4">
                  Three messages and you are on the route.
                </h2>
                <p className="section-subtext mb-6">
                  There is no site survey to schedule and nobody coming out to sell you
                  anything. Tell us about the pool, get a number, pick a start date.
                </p>
                <SmartLink to="/how-it-works/" className="btn btn-blue">
                  See how it works
                  <ArrowRight className="w-4 h-4" />
                </SmartLink>
              </div>

              <div className="relative glass-panel rounded-3xl p-6 sm:p-8 overflow-hidden">
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <ul className="flex flex-col gap-5">
                  {[
                    {
                      icon: MessageSquare,
                      t: 'Send a couple of photos',
                      b: 'Of the pool and the equipment pad. Text is fine — most quotes start that way.',
                    },
                    {
                      icon: ClipboardCheck,
                      t: 'Get a flat number back',
                      b: 'Usually the same day, in writing, with what is included spelled out.',
                    },
                    {
                      icon: CalendarClock,
                      t: 'Pick a start date',
                      b: 'You get a set day each week and the same tech on the route.',
                    },
                  ].map((step) => (
                    <li key={step.t} className="flex items-start gap-4">
                      <span className="w-11 h-11 shrink-0 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-brand-blue-light" />
                      </span>
                      <span>
                        <span className="block font-display font-bold text-white text-[15px] leading-snug mb-1">
                          {step.t}
                        </span>
                        <span className="block text-gray-400 text-[15px] leading-snug">{step.b}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section className="py-16 md:py-24 bg-[#07111c] relative">
          <Container>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10 md:mb-12">
                <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  Before You Call
                </span>
                <h2 className="section-heading text-white mb-3">Service questions, answered.</h2>
                <p className="text-gray-400">
                  Pricing, contracts, and what is actually included.{' '}
                  <SmartLink to="/faq/" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </SmartLink>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {SERVICES_FAQ.map((faq) => {
                  const isOpen = openFaq === faq.question;
                  return (
                    <div key={faq.question} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : faq.question)}
                        aria-expanded={isOpen}
                        className="w-full flex items-start justify-between gap-4 text-left px-5 sm:px-6 py-4"
                      >
                        <span className="font-display font-normal text-white text-[15px] sm:text-base leading-snug">
                          {faq.question}
                        </span>
                        <span
                          className={`shrink-0 mt-0.5 text-gray-400 transition-transform duration-200 ${
                            isOpen ? 'rotate-45 text-brand-blue-light' : ''
                          }`}
                        >
                          <Plus className="w-5 h-5" />
                        </span>
                      </button>
                      <div className="faq-answer">
                        <div className="faq-answer-inner">
                          <p className="px-5 sm:px-6 pb-5 -mt-1 text-gray-400 leading-relaxed text-[15px]">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        {/* ── Closing CTA ───────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-blue/12 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Tell us about your pool.
              </h2>
              <p className="text-gray-400 mb-7 max-w-md mx-auto">
                Weekly service, a one-off job, or you are not sure which you need — either
                way you get a straight number back the same day.
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

export const ServicesPage = () => (
  <QuoteSheetProvider>
    <ServicesPageInner />
  </QuoteSheetProvider>
);
