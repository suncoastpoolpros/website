import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  Scale,
  ThumbsUp,
  PiggyBank,
  Clock,
  DollarSign,
  Wrench,
  AlertTriangle,
  Brush,
  ShieldCheck,
  Droplets,
  Sprout,
  Wind,
  Gauge,
  ArrowRight,
  Plus,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { QuoteSheetProvider, useQuoteSheet } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// Set an honest, non-salesy tone up front — light band. The page earns trust by
// giving DIY real credit, which is what actually converts the on-the-fence reader.
const HONEST_CARDS = [
  {
    icon: ThumbsUp,
    title: 'You can absolutely DIY it',
    text: 'Plenty of owners keep a great pool themselves. With a real test kit, the right chemicals, and a weekly routine, it’s a learnable skill — not a dark art. Anyone telling you it’s impossible is selling something.',
  },
  {
    icon: PiggyBank,
    title: 'The savings are smaller than they look',
    text: 'DIY feels free until you add it up: chemicals, a decent test kit, a vacuum and brushes, filter media. The gap between doing it yourself and hiring out is real — but narrower than most people expect.',
  },
  {
    icon: Clock,
    title: 'It really comes down to time',
    text: 'The honest deciding factor usually isn’t money — it’s whether you want to spend an hour or two of every week testing, brushing, and hauling chemicals. Some people enjoy it. Most would rather just swim.',
  },
];

// What DIY actually costs — dark 2x2 grid. Numbers are honest industry ranges,
// framed as "figure roughly," not Suncoast's pricing.
const COST_CARDS = [
  {
    icon: DollarSign,
    title: 'Chemicals, every month',
    text: 'Chlorine, acid, shock, stabilizer, and the odd bag of algaecide add up — figure roughly $30 to $80 a month for an average Florida pool, and more in summer when the heat burns chlorine off fast.',
  },
  {
    icon: Wrench,
    title: 'Gear and a test kit upfront',
    text: 'A vacuum, brushes, a telescoping pole, and a proper test kit (not just strips) run a few hundred dollars to get started — plus replacement filter cartridges, sand, or DE down the line.',
  },
  {
    icon: Clock,
    title: 'An hour or two, every week',
    text: 'Test, skim, brush, empty the baskets, vacuum, dose, and backwash. Most owners spend one to two hours a week on it — a pro does the same job in 30 to 45 minutes because they do it all day.',
  },
  {
    icon: AlertTriangle,
    title: 'The mistake tax',
    text: 'The pricey part isn’t the routine — it’s the week you get it wrong. A missed chlorine reading becomes a green pool you fight all weekend; a bad pH or calcium balance quietly chews on your heater and pump.',
  },
];

// The cost that doesn't show up on a receipt — amber caution band. This is the
// real argument for a pro: the trained eye, not the brushing.
const HIDDEN_COSTS = [
  'A pump or heater starting to fail — spotted early, while it’s still a small repair instead of a full replacement.',
  'Chemistry drifting toward scale or corrosion that slowly damages your plaster, fittings, and equipment.',
  'Early algae or a faint haze caught and shut down before it turns into a weekend-eating green pool.',
  'Stabilizer (CYA) creeping up until your chlorine quietly stops working — the slow problem DIYers miss most.',
];

// The honest side-by-side — the centerpiece. DIY gets genuine pros; the pro card
// closes on the flat-rate differentiator (truthful, not a hard sell).
const COMPARE = [
  {
    icon: Brush,
    title: 'Doing it yourself',
    points: [
      'Lower out-of-pocket cost — if you have the time',
      'Full control of your own schedule and chemicals',
      'You learn your pool and get more confident over time',
      'But the hours, the learning curve, and any mistakes are on you',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'A weekly pool service',
    points: [
      'Your time back — someone else handles all of it',
      'A trained eye on your equipment every single week',
      'Steady, dialed-in water instead of guess-and-check',
      'Flat-rate billing means one predictable price — no surprise chemical charges',
    ],
  },
];

// If you DIY, here's what you're signing up to manage — internal-link band. The
// list quietly shows how much there is to it, and spreads link equity to the guides.
const MANAGING = [
  {
    to: '/pool-care/cloudy-pool-water',
    icon: Droplets,
    title: 'Cloudy water',
    text: 'Diagnosing whether it’s filtration, balance, or chlorine — and clearing it.',
  },
  {
    to: '/pool-care/green-pool',
    icon: Sprout,
    title: 'A green pool',
    text: 'Identifying the algae and running the balance-brush-shock-filter fix.',
  },
  {
    to: '/pool-care/pool-smells-like-chlorine',
    icon: Wind,
    title: 'That chlorine smell',
    text: 'Knowing it means too little chlorine, and shocking past breakpoint.',
  },
  {
    to: '/pool-care/cyanuric-acid',
    icon: Gauge,
    title: 'Stabilizer balance',
    text: 'Keeping CYA in range so your chlorine actually works in the Florida sun.',
  },
];

// Page-specific FAQ — drives both the on-page accordion and the FAQPage JSON-LD.
// Questions are the real searches pulled from keyword research.
const DIY_FAQ = [
  {
    question: 'Is a pool service worth it?',
    answer:
      'If you value your time and want consistent, swim-ready water without thinking about it, yes. A weekly service handles the testing, cleaning, and chemistry, and a trained tech catches equipment and chemistry problems early — before they become expensive repairs. If you actually enjoy the routine and have the time, DIY can be rewarding too. It mostly comes down to how you want to spend your week.',
  },
  {
    question: 'Is it cheaper to maintain your own pool?',
    answer:
      'A little — but less than most people expect. Once you add up chemicals, a real test kit, tools, and replacement filter media, DIY runs cheaper than a service but not by a huge margin. And that math assumes nothing goes wrong: one missed reading that turns into a green pool, or a balance mistake that damages your heater, can erase a year of savings.',
  },
  {
    question: 'How much does pool service cost in Florida?',
    answer:
      'In the Tampa Bay area, weekly pool service typically runs about $100 to $200 a month depending on your pool and the level of service. Watch how it’s billed: some companies charge a low base rate and then add chemicals on top, so the bill jumps in summer. Flat-rate service folds chemicals in for one predictable price.',
  },
  {
    question: 'How long does it take to maintain a pool yourself?',
    answer:
      'Plan on one to two hours a week — testing, skimming, brushing, vacuuming, emptying baskets, dosing chemicals, and backwashing the filter — plus extra time troubleshooting when something’s off. A professional does the same visit in 30 to 45 minutes because they’re doing it all day with commercial-grade tools.',
  },
  {
    question: 'What can a pool service do that I can’t?',
    answer:
      'Mostly it’s the trained eye. A good tech reads early warning signs on your pump, heater, and surfaces, dials in chemistry precisely, and knows things like breakpoint shocking and how to keep stabilizer from locking up your chlorine. You can learn all of it — a service just means you don’t have to.',
  },
  {
    question: 'Can I do my own pool maintenance?',
    answer:
      'Absolutely. With a weekly routine and a willingness to learn a little water chemistry, plenty of owners keep beautiful pools themselves. Our pool care guides walk through the common problems — cloudy water, algae, chlorine that won’t hold — so you know what you’re managing before you decide which way to go.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: DIY_FAQ.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const PoolServiceVsDiyPageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  usePageMeta({
    title: 'Pool Service vs. DIY: Is a Pool Service Worth It?',
    description:
      'Pool service vs. doing it yourself: the real cost in time and money in Florida — and why DIY saves less than you think. An honest look from St. Pete pros.',
    canonicalPath: '/pool-care/pool-service-vs-diy/',
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify([
      faqSchema,
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Pool Care', path: '/pool-care/' },
        { name: 'Pool Service vs. DIY', path: '/pool-care/pool-service-vs-diy/' },
      ]),
    ]);
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
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-50 pointer-events-none" />

      <div className="absolute top-0 inset-x-0 h-[520px] pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[520px] rounded-full bg-brand-blue/20 blur-[140px]" />
        <div className="absolute left-1/2 -translate-x-1/4 -top-16 w-[440px] h-[440px] rounded-full bg-brand-orange/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[10px] px-3.5 py-1.5">
            <Scale className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">DIY vs. Pro</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            Pool service, or do it yourself?
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-8">
            Plenty of people keep their own pool just fine &mdash; so the real question isn&rsquo;t
            whether you can. It&rsquo;s what it actually costs you in time, gear, and the odd
            green-pool weekend. Here&rsquo;s the honest math, both ways.
          </p>
        </section>

        {/* ── 1. The honest framing — light band, 3-card grid ──────── */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Start Here
              </span>
              <h2 className="font-display font-bold text-[#0a1628] text-3xl sm:text-4xl leading-tight mb-3">
                The honest part first
              </h2>
              <p className="text-slate-600 leading-relaxed">
                We&rsquo;re a pool service, so take this however you like &mdash; but the real answer
                isn&rsquo;t &ldquo;always hire someone.&rdquo; It depends on three things.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
              {HONEST_CARDS.map((card, i) => (
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

        {/* ── 2. What DIY really costs — dark 2x2 grid ─────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                The Real Cost Of DIY
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                What &ldquo;doing it yourself&rdquo; actually costs
              </h2>
              <p className="text-gray-400 leading-relaxed">
                DIY is cheaper than a service &mdash; just not as much cheaper as the sticker math
                suggests. Here&rsquo;s everything that goes into the real number.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 max-w-4xl mx-auto">
              {COST_CARDS.map((card, i) => (
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
          </Container>
        </section>

        {/* ── The hidden cost — amber caution band ─────────────────── */}
        <section className="pb-4 sm:pb-8">
          <Container>
            <div className="max-w-4xl mx-auto rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/[0.12] via-amber-500/[0.04] to-transparent p-7 sm:p-9 relative overflow-hidden">
              <div className="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-start gap-3.5 mb-4">
                  <span className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </span>
                  <div>
                    <span className="text-amber-400 font-bold tracking-[0.2em] uppercase text-xs block mb-1">
                      The Cost That Isn&rsquo;t On The Receipt
                    </span>
                    <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight">
                      What a trained eye catches that a test kit won&rsquo;t
                    </h2>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl">
                  The real value of a pro isn&rsquo;t the brushing &mdash; it&rsquo;s catching the
                  small things early, before they turn into the big things. That&rsquo;s the part DIY
                  can&rsquo;t easily replace.
                </p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {HIDDEN_COSTS.map((sign) => (
                    <li key={sign} className="flex items-start gap-2.5 text-gray-200 text-[15px] leading-snug">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* ── 3. The honest comparison — centerpiece ───────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Side By Side
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                The honest comparison
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Neither one is wrong. Here&rsquo;s what you&rsquo;re really choosing between, laid out
                straight.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-4xl mx-auto">
              {COMPARE.map((card, i) => (
                <m.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                      <card.icon className="w-5 h-5 text-brand-orange" />
                    </span>
                    <h3 className="text-white font-display font-bold text-lg leading-tight">
                      {card.title}
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {card.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-gray-300 text-[14px] leading-snug">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </m.div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── If you DIY, here's what you'll manage — internal links ── */}
        <section className="pb-16 sm:pb-20">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 max-w-2xl mx-auto">
                <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  Going The DIY Route?
                </span>
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight mb-3">
                  These are the calls you&rsquo;ll be making
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  If you take it on yourself, this is the kind of thing that lands on your plate. Our
                  guides walk through each one &mdash; free to read, no catch.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {MANAGING.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20 transition-colors p-5"
                  >
                    <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-brand-orange" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-white font-semibold text-[15px] leading-tight">
                        {item.title}
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all" />
                      </span>
                      <span className="block text-gray-400 text-sm mt-1 leading-relaxed">
                        {item.text}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ── Quick answers — mini FAQ accordion ───────────────────── */}
        <section className="pb-16 sm:pb-20">
          <Container>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                  DIY vs. service, answered
                </h2>
                <p className="text-gray-400">
                  The questions homeowners ask most when they&rsquo;re weighing it up.{' '}
                  <a href="/faq" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {DIY_FAQ.map((faq) => {
                  const isOpen = openFaq === faq.question;
                  return (
                    <div key={faq.question}>
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

        {/* Closing CTA — for the reader who's decided they'd rather just swim */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Decided you&rsquo;d rather just swim?
              </h2>
              <p className="text-gray-400 mb-7 max-w-md mx-auto">
                We keep pools dialed in across St. Petersburg and the Tampa Bay area for one flat rate
                &mdash; chemicals included, no surprise bills. You get your weekends back.
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
    </div>
  );
};

export const PoolServiceVsDiyPage = () => (
  <QuoteSheetProvider>
    <PoolServiceVsDiyPageInner />
  </QuoteSheetProvider>
);
