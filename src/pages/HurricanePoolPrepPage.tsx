import React, { useState } from 'react';
import { m } from 'motion/react';
import {
  Droplets,
  Waves,
  TestTube,
  Zap,
  Wrench,
  Ban,
  Wind,
  Sprout,
  Camera,
  AlertTriangle,
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
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

const CANONICAL = '/pool-care/hurricane-pool-prep/';

// The prep checklist. Moved here off the storm-cleanup service page: that page
// serves someone standing over a wrecked pool who wants it handled, and mixing
// "here is what you should have done" into a sell served neither audience. This
// is the informational half — it is also the half that earns links, which a
// service page never will.
const PREP_STEPS: Array<{ icon: typeof Wind; title: string; body: string }> = [
  {
    icon: Droplets,
    title: 'Leave the water in it',
    body:
      "The water is what's holding your pool down. Days of rain saturate the ground around the shell and raise the water table, and that pressure pushes up underneath it — a full pool has the weight to push back. Drain it first and you have removed the ballast at the exact moment you need it most.",
  },
  {
    icon: Waves,
    title: 'Lower it a foot or two — no further',
    body:
      'If you want a buffer for the rainfall, take it down twelve to twenty-four inches. That is enough to stop it spilling over the deck and into the house, and shallow enough that the remaining water still anchors the shell. Below about half full you are back to the problem in the first step.',
  },
  {
    icon: TestTube,
    title: 'Shock it to 3–5 ppm the day before',
    body:
      'Put free chlorine at the top of its normal band before the weather arrives. You are building a buffer that has to survive several days with no pump, no filtration, and a lot of organic debris landing in the water. A pool that goes into a storm at the low end is green on the other side.',
  },
  {
    icon: Zap,
    title: 'Cut the power at the breaker',
    body:
      'Shut the pump, heater, and salt system off at the panel — not just at the timer. It protects the equipment from the surge when power comes back, and means nothing is energised if the pad ends up underwater. Anything that unplugs and can be moved is better off inside.',
  },
  {
    icon: Wrench,
    title: 'Pull the cleaner out',
    body:
      'Robotic and suction cleaners come out of the water and get stored dry. Left in, they are one more thing to be damaged by debris, and one more thing tangled under a pile of branches when you are trying to see the floor afterwards.',
  },
  {
    icon: Ban,
    title: 'Leave the cover off',
    body:
      'A cover does not protect a pool in a hurricane — it collects branches and roof debris, then tears, sinks, or drags all of it across the finish. The water itself handles falling debris better than a cover does, and an uncovered pool is far easier to clean out after.',
  },
  {
    icon: Wind,
    title: 'Anything loose goes inside',
    body:
      'Furniture, toys, planters, the float pile. The old advice was to throw it all in the pool — it does stop a chair going through a window, but it can chip plaster and leave rust marks, and cushions turn into a soup that stains. Garage first if there is room; the pool only if there is not.',
  },
  {
    icon: Sprout,
    title: 'Trim what hangs over the water',
    body:
      'Overhanging limbs are the single biggest source of what gets pulled out afterwards. An hour with a saw before the season starts is the difference between netting a few leaves and hauling half a tree out of the deep end.',
  },
  {
    icon: Camera,
    title: 'Photograph the pool and the pad',
    body:
      'Before-and-after photos are worth having if you end up making a claim, and they take two minutes. Get the water, the deck, the screen enclosure, and a clear shot of the equipment so there is a record of what condition it was in.',
  },
];

const PREP_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'Should I drain my pool before a hurricane?',
    answer:
      'No — this is the single most common and most expensive storm mistake. The water in your pool is ballast holding the shell in the ground. Saturated soil around an empty or half-empty pool puts upward pressure on it, and that is how shells crack or lift. Leave the water in. If flooding is forecast and you want extra room, lower it twelve to twenty-four inches and no more.',
  },
  {
    question: 'How much should I lower the water?',
    answer:
      'A foot to two feet, if anything at all. That gives you room for the rainfall without giving up the weight that keeps the shell anchored. Going much below half full starts trading a manageable overflow for a structural problem, and an overflow is far easier to deal with than a floated pool.',
  },
  {
    question: 'How much chlorine should I add before a storm?',
    answer:
      'Get free chlorine to the top of its normal range — around 3 to 5 ppm — the day before it arrives. You are not trying to shock it; you are giving it a buffer that has to last several days with no pump and a lot of debris landing in the water. Afterwards is when it needs a proper shock, and that is a much bigger dose.',
  },
  {
    question: 'Can I run my pump during the storm?',
    answer:
      'No. Shut it down at the breaker before the weather arrives. Running through a storm risks the motor if the pad floods, and leaves the equipment exposed to the surge when the grid comes back. Leave it off until someone has looked at the pad and confirmed nothing got wet.',
  },
  {
    question: 'Should I put my patio furniture in the pool?',
    answer:
      'Only if there is genuinely nowhere else. It does stop a chair going through a window, but metal can leave rust marks, hard edges chip plaster, and cushions break down into a mess that stains. A garage, a shed, or even a hallway is better. If the pool is the only option, cushions still come inside.',
  },
  {
    question: 'Do I need to cover the pool?',
    answer:
      'No, and it usually makes things worse. Covers collect branches and roof debris, then tear or sink under the weight and drag all of it across the finish on the way down. An open pool takes falling debris better and is far quicker to clean afterwards.',
  },
];

const PREP_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to prepare your pool for a hurricane',
    description:
      'What to do with a swimming pool before a hurricane or tropical storm in Florida — including why draining it is the one thing not to do.',
    step: PREP_STEPS.map((c, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: c.title,
      text: c.body,
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PREP_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  },
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Pool Care', path: '/pool-care/' },
    { name: 'Hurricane Pool Prep', path: CANONICAL },
  ]),
];

const HurricanePoolPrepPageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  usePageMeta({
    title: 'How to Prepare Your Pool for a Hurricane — Florida Guide',
    description:
      'Do not drain it. The nine things to do with a Florida pool before a hurricane — water level, chlorine, the breaker, the cover — and why draining is the costly mistake.',
    canonicalPath: CANONICAL,
    fontPreload: [...NAV_FONTS, FONTS.inter400, FONTS.montserrat900],
    jsonLd: PREP_SCHEMA,
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

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5">
            <Wind className="w-3.5 h-3.5 text-brand-blue-light" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">
              Hurricane Season Prep
            </span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            How to prepare your pool for a hurricane.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
            Nine things worth doing before the weather arrives — and one thing that will cost
            you far more than the storm would have. Written by people who spend every September
            cleaning up the aftermath in Pinellas County.
          </p>
        </section>

        {/* The one mistake, up front — it is what people came to ask */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          <div className="rounded-2xl border border-brand-orange/25 bg-brand-orange/[0.06] p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <span className="w-11 h-11 shrink-0 rounded-xl bg-brand-orange/15 border border-brand-orange/25 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-brand-orange-light" />
              </span>
              <div>
                <h2 className="font-display font-bold text-white text-lg mb-2">
                  Do not drain your pool.
                </h2>
                <p className="text-gray-300 text-[15px] leading-relaxed">
                  It is the first instinct and the most expensive one. Your pool water is ballast
                  holding the shell in the ground, and the rain that comes with a hurricane raises
                  the water table underneath it. An empty pool in saturated Florida soil can crack
                  or lift out of the ground entirely — a repair that dwarfs anything the storm was
                  going to do to the water.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── THE LIGHT BAND — the checklist ────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                The Checklist
              </span>
              <h2 className="section-heading text-[#0a1628] leading-tight mb-4">
                Nine things to do before it hits.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                None of it takes long, and together they decide how bad the other side looks.
                Most of what we haul out of pools in September was avoidable in about an hour.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
              {PREP_STEPS.map((card, i) => (
                <m.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.08 }}
                  className="rounded-2xl bg-white border border-brand-blue/15 shadow-[0_10px_30px_-18px_rgba(10,22,40,0.45)] p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center shrink-0">
                      <card.icon className="w-5 h-5 text-brand-blue" />
                    </span>
                    <span className="font-display font-black text-brand-blue/30 text-2xl leading-none">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-[#0a1628] font-display font-bold text-lg mb-2 leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed">{card.body}</p>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── After it passes → the service page ────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-[#07111c]">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Afterwards
              </span>
              <h2 className="section-heading text-white leading-tight mb-4">
                Prep is the easy half. The cleanup is the other one.
              </h2>
              <p className="section-subtext max-w-2xl mx-auto mb-8">
                Even a well-prepped pool comes out of a hurricane full of debris, with its
                chlorine diluted to nothing and runoff in the water. That is not a
                skim-and-shock job — it is a health question before it is a clarity one, and
                it is what we do.
              </p>
              <SmartLink to="/services/storm-cleanup/" className="btn btn-orange">
                See storm &amp; hurricane cleanup
                <ArrowRight className="w-4 h-4" />
              </SmartLink>
            </div>
          </Container>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section className="py-16 md:py-24 relative">
          <Container>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10 md:mb-12">
                <h2 className="section-heading text-white mb-3">Hurricane prep questions.</h2>
                <p className="text-gray-400">
                  The ones we field every June.{' '}
                  <SmartLink to="/faq/" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </SmartLink>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {PREP_FAQ.map((faq) => {
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

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-blue/12 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Or let us handle the whole season.
              </h2>
              <p className="text-gray-400 mb-7 max-w-md mx-auto">
                Weekly customers get the shock-and-shutdown pass on the last visit before a
                storm, and priority in the queue afterwards.
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

export const HurricanePoolPrepPage = () => (
  <QuoteSheetProvider>
    <HurricanePoolPrepPageInner />
  </QuoteSheetProvider>
);
