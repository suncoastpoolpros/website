import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  Zap,
  Gauge,
  Waves,
  Timer,
  TrendingDown,
  Volume2,
  Wrench,
  ShieldCheck,
  DollarSign,
  Calculator,
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

// The science — why a single-speed pump quietly drains the wallet (light band).
const SCIENCE_CARDS = [
  {
    icon: Gauge,
    title: 'Power follows the cube of speed',
    text: 'A pool pump is a centrifugal pump, so its power draw scales with the cube of motor speed. Slow it to half speed and it pulls just one-eighth the watts. That single fact is where all the savings come from.',
  },
  {
    icon: Waves,
    title: 'Flow only drops in step',
    text: 'Cut the speed in half and you move half the water per minute — so you run about twice as long to turn the pool over once. Power down 8×, time up 2×: the same clean water for roughly a quarter of the energy.',
  },
  {
    icon: Zap,
    title: 'Single-speed only knows full blast',
    text: 'An old single-speed pump has one setting: 100%. It roars at full power whether it’s vacuuming the pool or just gently skimming on a quiet Tuesday — burning peak wattage every hour it runs.',
  },
  {
    icon: Timer,
    title: 'Your pool rarely needs the surge',
    text: 'Day to day, a pool only needs slow, steady circulation to skim and filter. High flow is for short jobs — vacuuming, heating, running a spa or water feature. A variable-speed pump gives you the surge only when you ask for it.',
  },
];

// Beyond the dollar savings (brand-blue accent cards).
const BENEFIT_CARDS = [
  {
    icon: Volume2,
    title: 'Noticeably quieter',
    text: 'At low RPM a variable-speed pump is a quiet hum instead of a constant roar. If your equipment pad sits near a lanai, a bedroom window, or a neighbor, that alone is worth it.',
  },
  {
    icon: Waves,
    title: 'Cleaner, clearer water',
    text: 'Slow, steady flow gives your filter more contact time and avoids the channeling you get at full blast. Many owners see clearer water running long-and-low than a single-speed run hard and short.',
  },
  {
    icon: Wrench,
    title: 'Equipment that lasts longer',
    text: 'Gentler starts and lower running speeds mean less heat and stress on the motor, plumbing, and filter. A pump that loafs along most of the day simply wears out more slowly.',
  },
  {
    icon: ShieldCheck,
    title: 'Basically the standard now',
    text: 'Since July 2021 a U.S. Department of Energy rule has effectively required variable- or two-speed motors on most replacement pool pumps above 1.1 total HP. Replace a big single-speed today and you’re getting a VSP anyway — so you may as well capture the savings.',
  },
];

// Real pumps we install — a value, popular, and premium pick across the two
// brands we trust most (Pentair + Hayward). Savings are worked at $0.15/kWh
// using the ~75% affinity-law reduction; prices are approximate street cost
// (pump only, before install) and move with the market.
const PUMPS = [
  {
    tier: 'Value pick',
    name: 'Pentair SuperFlo VS',
    thp: '1.5 THP',
    bestFor:
      'Small-to-mid pools and simple setups. Compact, quiet, and a near drop-in upgrade from the everyday SuperFlo single-speed.',
    price: '$850–$950',
    savings: '$625',
    scenario: 'vs a 1.5 HP single-speed run 8 hrs/day',
    featured: false,
  },
  {
    tier: 'Most popular',
    name: 'Hayward TriStar VS',
    thp: '2.7 THP',
    bestFor:
      'The workhorse for standard-to-large residential pools. Eight programmable speeds and a genuinely quiet, efficient motor.',
    price: '$1,100–$1,300',
    savings: '$945',
    scenario: 'vs a 2 HP single-speed run 10 hrs/day',
    featured: true,
  },
  {
    tier: 'Premium',
    name: 'Pentair IntelliFlo3 VSF',
    thp: '3.0 THP',
    bestFor:
      'Large pools, water features, heaters, or pool-and-spa combos. Variable-flow tech holds a set flow rate automatically, no matter the filter.',
    price: '$1,300–$1,600',
    savings: '$1,110',
    scenario: 'vs a 2.5 HP single-speed run 10 hrs/day',
    featured: false,
  },
];

// Page-specific FAQ — drives the accordion and the FAQPage JSON-LD.
const VSP_FAQ = [
  {
    question: 'How much does a variable speed pump actually save?',
    answer:
      'It depends on your pump size, how long you run it, and your power rate — but most Florida pool owners save somewhere between $400 and $1,200 a year, often cutting pump electricity by around 70–80%. Use the calculator above with your own numbers to get a realistic figure.',
  },
  {
    question: 'Are variable speed pumps worth it?',
    answer:
      'For almost any pool that runs daily, yes. The pump is usually the second-biggest electricity user in a home after the air conditioner, and a variable-speed pump attacks the largest, most controllable part of that. The energy savings typically cover the price difference in one to three years, and the pump keeps saving long after.',
  },
  {
    question: 'How long until it pays for itself?',
    answer:
      'A variable-speed pump costs a few hundred dollars more than a comparable single-speed, plus install. At $500–$1,000 a year in savings, most pay back the difference in roughly one to three years — and Florida utilities sometimes offer rebates that shorten that further.',
  },
  {
    question: 'Do I have to run it 24/7?',
    answer:
      'No. The usual setup is a long, low-speed circulation block for filtering and skimming, plus a short higher-speed burst for vacuuming, heating, or running a spa. Once it’s programmed to your pool, it runs that schedule automatically — you never touch it.',
  },
  {
    question: 'Are single-speed pumps still legal?',
    answer:
      'You can keep running an existing single-speed pump, but as of July 2021 a federal Department of Energy efficiency rule effectively blocks the sale of most new single-speed pumps above 1.1 total HP. In practice, when it’s time to replace a larger pump, the replacement will be variable- or two-speed.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: VSP_FAQ.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Variable Speed Pool Pumps: How Much They Save',
  description:
    'Why a variable-speed pool pump cuts pump electricity by around 70–80% — the pump affinity laws behind the savings, the extra benefits, and a calculator to estimate your own annual savings.',
  about: ['Variable speed pool pump', 'Pool energy savings', 'Pool equipment', 'Pump affinity laws'],
};

// Typical single-speed motor draw (kW) by nameplate HP — used by the calculator.
const HP_OPTIONS = [1, 1.5, 2, 2.5];
const KW_BY_HP: Record<number, number> = { 1: 1.5, 1.5: 1.9, 2: 2.3, 2.5: 2.7 };

// A variable-speed pump uses ~75% less energy for the same daily turnover —
// the figure the affinity laws predict (energy ∝ speed²; half speed → a quarter
// of the energy) and where most real-world installs land.
const VSP_SAVINGS_FRACTION = 0.75;

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const VariableSpeedPumpsPageInner = () => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const { open: openQuoteSheet } = useQuoteSheet();
  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  // Interactive savings calculator. These defaults render identically on the
  // server and the first client paint, so hydration matches (no React #418).
  const [rate, setRate] = useState(0.15); // $/kWh — Florida average-ish
  const [hp, setHp] = useState(1.5); // single-speed nameplate HP
  const [hours, setHours] = useState(8); // single-speed daily run hours

  const singleKw = KW_BY_HP[hp] ?? 1.9;
  const singleAnnual = singleKw * hours * 365 * rate;
  const vspAnnual = singleAnnual * (1 - VSP_SAVINGS_FRACTION);
  const annualSavings = singleAnnual - vspAnnual;

  usePageMeta({
    title: 'Variable Speed Pool Pumps: How Much They Save',
    description:
      'How much does a variable-speed pool pump save? Often 70–80% off your pump’s electric bill. The physics behind why, the added benefits, and a live calculator to estimate your own annual savings.',
    canonicalPath: '/pool-care/variable-speed-pumps/',
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify([
      articleSchema,
      faqSchema,
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Pool Care', path: '/pool-care/' },
        { name: 'Variable Speed Pumps', path: '/pool-care/variable-speed-pumps/' },
      ]),
    ]);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="force-static-motion min-h-screen bg-[#07111c] relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
      <div className="absolute md:fixed inset-0 bg-mesh opacity-50 pointer-events-none" />

      <div className="absolute top-0 inset-x-0 h-[520px] pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[520px] rounded-full bg-brand-blue/20 blur-[140px]" />
        <div className="absolute left-1/2 -translate-x-1/4 -top-16 w-[440px] h-[440px] rounded-full bg-brand-orange/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[10px] px-3.5 py-1.5">
            <Zap className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">Pool Equipment &amp; Energy</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            The single biggest way to cut your{' '}
            <span className="bg-gradient-to-r from-brand-blue-light via-cyan-300 to-brand-orange bg-clip-text text-transparent">
              pool’s electric bill
            </span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
            Your pool pump is usually the second-hungriest thing in the house after the air
            conditioner. Swapping a single-speed pump for a variable-speed one is the rare upgrade
            that pays for itself — here’s the physics behind why, with a live savings calculator.
          </p>
        </section>

        {/* Pull stat */}
        <section className="pb-16">
          <Container>
            <div className="max-w-5xl mx-auto text-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-10 sm:py-12">
              <div className="font-display font-bold text-white leading-none text-5xl sm:text-6xl mb-4">
                ≈&nbsp;75%
              </div>
              <p className="text-gray-300 text-lg leading-relaxed max-w-xl mx-auto">
                less electricity a variable-speed pump uses to keep the same pool just as clean. On a
                typical St. Pete pool that’s often{' '}
                <span className="text-white font-semibold">$600–$1,000 off your power bill</span>{' '}
                every year — for doing nothing differently.
              </p>
            </div>
          </Container>
        </section>

        {/* ── 1. The science — light band, card grid ───────────────── */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                The Science
              </span>
              <h2 className="font-display font-bold text-[#0a1628] text-3xl sm:text-4xl leading-tight mb-3">
                Why a single-speed pump quietly drains your wallet
              </h2>
              <p className="text-slate-600 leading-relaxed">
                It comes down to one quirk of how pumps work — and it’s the same reason a fan on low
                sips power while a fan on high gulps it.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 max-w-5xl mx-auto">
              {SCIENCE_CARDS.map((card, i) => (
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

            {/* The math, stated plainly for the curious. */}
            <div className="max-w-5xl mx-auto mt-8 rounded-2xl border border-brand-blue/20 bg-brand-blue/[0.06] p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <TrendingDown className="w-[18px] h-[18px] text-brand-blue" />
                <h3 className="text-[#0a1628] font-display font-bold text-base">The math, in one line</h3>
              </div>
              <p className="text-slate-700 text-[15px] leading-relaxed">
                For the same daily turnover, energy use scales with the{' '}
                <span className="font-semibold">square of pump speed</span> &mdash; because{' '}
                <span className="font-semibold">power ∝ speed³</span> and{' '}
                <span className="font-semibold">time ∝ 1 ÷ speed</span>. Run at half speed and you use
                about a quarter of the electricity. Half the speed, a quarter of the bill.
              </p>
            </div>
          </Container>
        </section>

        {/* ── 2. The savings calculator ────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Your Savings
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                What a variable-speed pump would save you
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Three numbers from your own pool — your power rate, your pump size, and how long it
                runs — and you’ll see the difference a switch makes.
              </p>
            </div>

            <div className="max-w-5xl mx-auto rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              {/* Electricity rate */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <label htmlFor="rate-range" className="text-white font-semibold flex items-center gap-2">
                  <DollarSign className="w-[18px] h-[18px] text-brand-orange" />
                  Your electricity rate
                </label>
                <span className="font-display font-bold text-white text-2xl tabular-nums">
                  ${rate.toFixed(2)}{' '}
                  <span className="text-gray-500 text-base font-sans font-normal">/ kWh</span>
                </span>
              </div>
              <input
                id="rate-range"
                type="range"
                min={0.1}
                max={0.3}
                step={0.01}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-brand-orange cursor-pointer"
                aria-label="Electricity rate in dollars per kilowatt-hour"
              />
              <div className="flex justify-between text-[11px] text-gray-500 mb-6 px-0.5">
                <span>$0.10</span>
                <span>$0.20</span>
                <span>$0.30</span>
              </div>

              {/* Pump size */}
              <div className="mb-6">
                <span className="text-white font-semibold flex items-center gap-2 mb-3">
                  <Gauge className="w-[18px] h-[18px] text-brand-orange" />
                  Your current pump size
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {HP_OPTIONS.map((opt) => {
                    const active = hp === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setHp(opt)}
                        aria-pressed={active}
                        className={`rounded-xl border py-3 text-center font-display font-bold tabular-nums transition-colors ${
                          active
                            ? 'border-brand-orange bg-brand-orange/[0.12] text-white'
                            : 'border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/[0.05]'
                        }`}
                      >
                        {opt} <span className="text-xs font-sans font-normal">HP</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daily run hours */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <label htmlFor="hours-range" className="text-white font-semibold flex items-center gap-2">
                  <Timer className="w-[18px] h-[18px] text-brand-orange" />
                  Hours you run it per day
                </label>
                <span className="font-display font-bold text-white text-2xl tabular-nums">
                  {hours} <span className="text-gray-500 text-base font-sans font-normal">hrs</span>
                </span>
              </div>
              <input
                id="hours-range"
                type="range"
                min={4}
                max={12}
                step={1}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full accent-brand-orange cursor-pointer"
                aria-label="Hours the pump runs per day"
              />
              <div className="flex justify-between text-[11px] text-gray-500 mb-8 px-0.5">
                <span>4</span>
                <span>8</span>
                <span>12</span>
              </div>

              {/* Results */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Single-speed
                  </div>
                  <div className="font-display font-bold text-white text-2xl tabular-nums">
                    {usd(singleAnnual)}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">per year</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Variable-speed
                  </div>
                  <div className="font-display font-bold text-white text-2xl tabular-nums">
                    {usd(vspAnnual)}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">per year</div>
                </div>
                <div className="rounded-2xl border border-brand-orange/40 bg-brand-orange/[0.1] p-4 text-center">
                  <div className="text-brand-orange-light text-xs font-semibold uppercase tracking-wider mb-1.5">
                    You’d save
                  </div>
                  <div className="font-display font-bold text-white text-2xl tabular-nums">
                    {usd(annualSavings)}
                  </div>
                  <div className="text-brand-orange-light/70 text-xs mt-0.5">every year</div>
                </div>
              </div>

              <p className="text-center text-gray-300 text-[15px] mt-5">
                That’s about{' '}
                <span className="text-white font-semibold">{usd(annualSavings * 5)}</span> over 5 years
                — and <span className="text-white font-semibold">{usd(annualSavings * 10)}</span> over 10.
              </p>

              <p className="text-gray-500 text-xs mt-4 text-center max-w-2xl mx-auto leading-relaxed">
                Assumes a variable-speed pump uses about 75% less electricity than a single-speed for
                the same daily turnover — the figure the affinity laws above predict and most installs
                land near. Single-speed wattage is estimated from typical motor draw at each size; your
                real savings depend on your pump, schedule, and rate.
              </p>
            </div>

            {/* Cross-link to the heating cost calculator (same energy theme). */}
            <Link
              to="/tools/pool-heating-cost-calculator"
              className="max-w-5xl mx-auto mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-colors p-5 group"
            >
              <span className="flex items-center gap-4 min-w-0">
                <span className="w-11 h-11 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5 text-brand-blue-light" />
                </span>
                <span className="min-w-0">
                  <span className="block text-white font-semibold text-[15px] leading-tight">
                    Heating the pool too?
                  </span>
                  <span className="block text-gray-400 text-sm mt-0.5">
                    See what it costs to warm your pool with our free heating-cost calculator.
                  </span>
                </span>
              </span>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          </Container>
        </section>

        {/* ── 3. Pumps we install — real models, worked savings ────── */}
        <section className="py-16 sm:py-20 bg-white/[0.015] border-y border-white/[0.06]">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Pumps We Install
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                Three pumps we’d actually put on your pad
              </h2>
              <p className="text-gray-400 leading-relaxed">
                We supply, install, and program every one of these — then keep it dialed in on weekly
                service. Here’s where each one fits, and what it tends to save.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3 max-w-5xl mx-auto">
              {PUMPS.map((pump, i) => (
                <m.div
                  key={pump.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative flex flex-col rounded-2xl border p-6 ${
                    pump.featured
                      ? 'border-brand-orange/50 bg-brand-orange/[0.06]'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  {pump.featured && (
                    <span className="absolute -top-3 left-6 rounded-full bg-brand-orange px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                      Most popular
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                        pump.featured ? 'text-brand-orange-light' : 'text-brand-blue-light'
                      }`}
                    >
                      {pump.tier}
                    </span>
                    <span className="text-gray-400 text-xs font-semibold tabular-nums">
                      {pump.thp}
                    </span>
                  </div>
                  <h3 className="text-white font-display font-bold text-xl mb-2">{pump.name}</h3>
                  <p className="text-gray-400 text-[14px] leading-relaxed mb-6">{pump.bestFor}</p>

                  <div className="mt-auto">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-display font-bold text-white text-3xl tabular-nums">
                        ≈&nbsp;{pump.savings}
                      </span>
                      <span className="text-gray-400 text-sm">/ yr saved</span>
                    </div>
                    <p className="text-gray-500 text-xs mb-4">{pump.scenario}</p>
                    <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                      <span className="text-gray-400">Approx. price</span>
                      <span className="text-white font-semibold tabular-nums">{pump.price}</span>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>

            <p className="max-w-3xl mx-auto mt-6 text-center text-gray-500 text-xs leading-relaxed">
              Savings shown at $0.15/kWh for the scenario noted, using the ~75% reduction the affinity
              laws above predict. All three are ENERGY STAR certified. Prices are approximate street
              cost (pump only, before install) and move with the market — we’ll quote your exact pump
              and install.
            </p>
          </Container>
        </section>

        {/* ── 4. Beyond the savings (brand-blue accent) ────────────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Beyond the Savings
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                The bill is just the start
              </h2>
              <p className="text-gray-400 leading-relaxed">
                The lower power draw gets the headlines, but the everyday upgrades are what owners end
                up loving most.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 max-w-5xl mx-auto">
              {BENEFIT_CARDS.map((card, i) => (
                <m.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-brand-blue/20 bg-brand-blue/[0.04] p-6 hover:bg-brand-blue/[0.08] transition-colors"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center mb-4">
                    <card.icon className="w-5 h-5 text-brand-blue-light" />
                  </span>
                  <h3 className="text-white font-display font-bold text-lg mb-2">{card.title}</h3>
                  <p className="text-gray-400 text-[15px] leading-relaxed">{card.text}</p>
                </m.div>
              ))}
            </div>

            <p className="max-w-3xl mx-auto mt-8 text-center text-gray-500 text-xs leading-relaxed">
              Sources: pump affinity laws (centrifugal pump theory); U.S. Department of Energy
              Dedicated-Purpose Pool Pump conservation standard, effective July 2021; ENERGY STAR pool
              pump program. Dollar figures are estimates — your actual savings depend on pump size, run
              time, and local electricity rates.
            </p>
          </Container>
        </section>

        {/* ── Quick answers — FAQ accordion ────────────────────────── */}
        <section className="pb-16 sm:pb-20">
          <Container>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                  Variable-speed pumps, answered
                </h2>
                <p className="text-gray-400">
                  The questions homeowners ask most before they upgrade.{' '}
                  <a href="/faq" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {VSP_FAQ.map((faq) => {
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

              {/* Back to the pool-care hub for the rest of the guides. */}
              <Link
                to="/pool-care"
                className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-colors p-5 group"
              >
                <span className="flex items-center gap-4 min-w-0">
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                    <Waves className="w-5 h-5 text-brand-blue-light" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-white font-semibold text-[15px] leading-tight">
                      More pool-care guides
                    </span>
                    <span className="block text-gray-400 text-sm mt-0.5">
                      Water chemistry, green-pool rescue, and the numbers that keep a pool clear.
                    </span>
                  </span>
                </span>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </div>
          </Container>
        </section>

        {/* Closing CTA — direct install offer */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Ready to stop overpaying to run your pool?
              </h2>
              <p className="text-gray-400 mb-7 max-w-lg mx-auto">
                We’ll spec the right variable-speed pump for your pool, install it, and program a
                schedule that captures the savings from day one — then keep it running right on every
                weekly visit. Get a straight answer on which pump fits and what you’ll save.
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

export const VariableSpeedPumpsPage = () => (
  <QuoteSheetProvider>
    <VariableSpeedPumpsPageInner />
  </QuoteSheetProvider>
);
