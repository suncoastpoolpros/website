import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'motion/react';
import {
  FlaskConical,
  Sun,
  Shield,
  Droplets,
  Beaker,
  Lock,
  AlertTriangle,
  HeartPulse,
  Microscope,
  Scale,
  ShieldCheck,
  Gauge,
  RefreshCw,
  Calculator,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { QuoteSheetProvider } from '@/components/QuoteSheet';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { usePageMeta } from '@/lib/usePageMeta';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

// The science — what CYA actually does to chlorine (light-band cards).
const SCIENCE_CARDS = [
  {
    icon: Sun,
    title: 'Sunscreen for chlorine',
    text: 'Ultraviolet light tears free chlorine apart. In open Florida sun, an unstabilized pool can lose 75–90% of its chlorine in a couple of hours. Cyanuric acid (CYA) acts like sunscreen — it shields chlorine from UV so it survives the day.',
  },
  {
    icon: Beaker,
    title: 'A chemical reservoir',
    text: 'CYA doesn’t neutralize chlorine — it holds it. Most of your free chlorine binds reversibly to CYA as chlorinated isocyanurates, forming a reservoir that slowly releases active chlorine back into the water as it gets used up.',
  },
  {
    icon: Droplets,
    title: 'Only a sliver is “active”',
    text: 'The real sanitizer is hypochlorous acid (HOCl). At any instant only a tiny fraction of your free chlorine is unbound, active HOCl — the rest is parked on CYA. That reserve is good… until there’s so much CYA that almost nothing stays active.',
  },
  {
    icon: Scale,
    title: 'It’s a balance, not a max',
    text: 'More CYA means more chlorine gets bound up, so you need a higher chlorine reading to keep the same killing power. That’s the whole correlation: chlorine and CYA have to move together, in ratio — not independently.',
  },
];

// FC:CYA ratio reference table. Target FC = 7.5% of CYA, min ≈ 5%, SLAM ≈ 40%.
const RATIO_ROWS = [
  { cya: 30, min: '1.5', target: '2–3', status: 'Ideal', tone: 'good' },
  { cya: 40, min: '2', target: '3', status: 'Ideal', tone: 'good' },
  { cya: 50, min: '2.5', target: '4', status: 'Good', tone: 'good' },
  { cya: 60, min: '3', target: '4–5', status: 'Getting high', tone: 'warn' },
  { cya: 80, min: '4', target: '6', status: 'Hard to hold', tone: 'warn' },
  { cya: 100, min: '5', target: '7–8', status: 'Health-code max', tone: 'warn' },
  { cya: 120, min: '6+', target: '9+', status: 'Chlorine lock — dilute', tone: 'bad' },
];

// Chlorine-lock red flags (amber warning band).
const LOCK_SIGNS = [
  'Algae or cloudy water even though your chlorine “tests fine”',
  'Chlorine demand that never quits — you add it, it’s gone, the pool still isn’t clear',
  'A CYA test reading north of 100 ppm',
  'A pool that drinks chlorine all summer and slowly creeps green',
];

// Health-department / safety section (brand-blue accent).
const HEALTH_CARDS = [
  {
    icon: Scale,
    title: 'Why health codes cap CYA',
    text: 'The CDC’s Model Aquatic Health Code recommends keeping CYA at or below 90 ppm, and Florida’s public-pool code (64E-9) caps it at 100 ppm. The reason is disinfection: as CYA climbs, the same chlorine reading kills germs far more slowly.',
  },
  {
    icon: Microscope,
    title: 'Slower kill times for pathogens',
    text: 'High CYA increases the contact time chlorine needs to inactivate bacteria and parasites. Cryptosporidium is the worst case — the CDC notes CYA dramatically lengthens the time (and chlorine level) required to kill it, which is why hyperchlorination guidance says to lower CYA first.',
  },
  {
    icon: ShieldCheck,
    title: 'Home pools follow the same rules',
    text: 'A backyard pool isn’t inspected like a public one, but the chemistry is identical. Keeping CYA in range and chlorine in ratio is exactly how you keep a private pool genuinely sanitary — not just clear-looking.',
  },
];

// Page-specific FAQ — drives the accordion and the FAQPage JSON-LD.
const CYA_FAQ = [
  {
    question: 'What is the ideal cyanuric acid level for a pool?',
    answer:
      'For most chlorine pools, 30–50 ppm is the sweet spot — enough UV protection without choking your chlorine’s strength. Saltwater pools often run a bit higher (60–80 ppm) because the cell adds chlorine continuously. Above 100 ppm you’re into health-code and chlorine-lock territory.',
  },
  {
    question: 'Why isn’t my chlorine working even though it tests normal?',
    answer:
      'Almost always high CYA. If your CYA is very high, a “normal” chlorine reading of 3 ppm leaves too little active hypochlorous acid to sanitize, so algae grows in water that looks chemically fine. It’s the ratio that matters, not the chlorine number alone.',
  },
  {
    question: 'How do I lower cyanuric acid?',
    answer:
      'There’s no chemical that removes CYA reliably. The only practical fixes are dilution — partially draining and refilling with fresh water — or reverse-osmosis filtration. It comes down the same way nitrates do: you replace water.',
  },
  {
    question: 'Is cyanuric acid harmful to swimmers?',
    answer:
      'At normal pool levels CYA itself isn’t considered a swimmer hazard. The real risk is indirect: too much CYA weakens chlorine’s ability to kill germs, so the water can be under-sanitized even when it looks clear. That’s exactly why health departments cap it.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: CYA_FAQ.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Cyanuric Acid & Chlorine: The Ratio That Runs Your Pool',
  description:
    'How cyanuric acid (CYA) protects and binds pool chlorine, why the free-chlorine-to-CYA ratio determines whether your pool is actually sanitized, chlorine lock, and the health-department limits behind it.',
  about: ['Cyanuric acid', 'Chlorine', 'Pool water chemistry', 'Pool sanitation'],
};

const toneStyles: Record<string, string> = {
  good: 'text-brand-blue-light',
  warn: 'text-amber-300',
  bad: 'text-red-300',
};

const CyanuricAcidPageInner = () => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  // Interactive FC:CYA ratio calculator. Initial 40 renders identically on the
  // server and first client paint, so hydration matches (no #418).
  const [cya, setCya] = useState(40);
  const minFc = Math.round(cya * 0.05 * 10) / 10;
  const targetFc = Math.round(cya * 0.075 * 10) / 10;
  const slamFc = Math.round(cya * 0.4);
  const locked = cya >= 100;

  usePageMeta({
    title: 'Cyanuric Acid & Chlorine: The Pool Ratio Explained',
    description:
      'How does cyanuric acid affect chlorine? CYA shields it from the sun but too much locks it up — and the FC:CYA ratio decides if your pool is sanitized.',
    canonicalPath: '/pool-care/cyanuric-acid/',
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
        { name: 'Cyanuric Acid', path: '/pool-care/cyanuric-acid/' },
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

      <div className="absolute top-0 inset-x-0 h-[520px] pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,#000_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-[760px] h-[520px] rounded-full bg-brand-blue/20 blur-[140px]" />
        <div className="absolute left-1/2 -translate-x-1/4 -top-16 w-[440px] h-[440px] rounded-full bg-brand-orange/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-14 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-[10px] px-3.5 py-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">Pool Water Science</span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            The hidden ratio that decides whether your{' '}
            <span className="bg-gradient-to-r from-brand-blue-light via-cyan-300 to-brand-orange bg-clip-text text-transparent">
              chlorine actually works
            </span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
            Cyanuric acid protects your chlorine from the sun &mdash; and quietly holds most of it
            hostage. Get the ratio wrong and a pool can read &ldquo;perfect&rdquo; and still grow
            algae. Here&rsquo;s the real science, and the health-department limits behind it.
          </p>
        </section>

        {/* Pull stat */}
        <section className="pb-16">
          <Container>
            <div className="max-w-5xl mx-auto text-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-10 sm:py-12">
              <div className="font-display font-bold text-white leading-none text-5xl sm:text-6xl mb-4">
                &lt;&nbsp;3%
              </div>
              <p className="text-gray-300 text-lg leading-relaxed max-w-xl mx-auto">
                of the chlorine in a typical CYA-stabilized pool is actually active sanitizer at any
                given moment. The other ~97% is held in reserve, bound to cyanuric acid &mdash;
                which is exactly why the <span className="text-white font-semibold">ratio</span>{' '}
                matters more than the chlorine number alone.
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
                What cyanuric acid actually does to chlorine
              </h2>
              <p className="text-slate-600 leading-relaxed">
                CYA (also called stabilizer or conditioner) and chlorine aren&rsquo;t two separate
                dials &mdash; they&rsquo;re chemically tied together. Here&rsquo;s how.
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

            {/* The chemistry, stated plainly for the curious. */}
            <div className="max-w-5xl mx-auto mt-8 rounded-2xl border border-brand-blue/20 bg-brand-blue/[0.06] p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <Beaker className="w-[18px] h-[18px] text-brand-blue" />
                <h3 className="text-[#0a1628] font-display font-bold text-base">The reaction, in one line</h3>
              </div>
              <p className="text-slate-700 text-[15px] leading-relaxed">
                The active killer is hypochlorous acid (HOCl). Cyanuric acid reversibly binds it
                &mdash; <span className="font-semibold">HOCl + CYA ⇌ chlorinated&nbsp;isocyanurate</span>{' '}
                &mdash; pulling most of it out of play and feeding it back slowly. Raise CYA and the
                equilibrium shifts: less active HOCl for the same chlorine reading.
              </p>
            </div>
          </Container>
        </section>

        {/* ── 2. The correlation — interactive ratio calculator ────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-orange font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                The Correlation
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                Your chlorine target moves with your CYA
              </h2>
              <p className="text-gray-400 leading-relaxed">
                The rule pros use: keep free chlorine around <span className="text-white font-semibold">7.5% of your CYA</span>,
                and never below ~5%. Slide your CYA and watch the chlorine you actually need.
              </p>
            </div>

            {/* Interactive calculator */}
            <div className="max-w-5xl mx-auto rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 mb-2">
                <label htmlFor="cya-range" className="text-white font-semibold flex items-center gap-2">
                  <Gauge className="w-[18px] h-[18px] text-brand-orange" />
                  Your CYA level
                </label>
                <span className="font-display font-bold text-white text-2xl tabular-nums">
                  {cya} <span className="text-gray-500 text-base font-sans font-normal">ppm</span>
                </span>
              </div>
              <input
                id="cya-range"
                type="range"
                min={0}
                max={140}
                step={5}
                value={cya}
                onChange={(e) => setCya(Number(e.target.value))}
                className="w-full accent-brand-orange cursor-pointer"
                aria-label="Cyanuric acid level in ppm"
              />
              <div className="flex justify-between text-[11px] text-gray-500 mb-6 px-0.5">
                <span>0</span>
                <span>40</span>
                <span>80</span>
                <span>120</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Minimum FC</div>
                  <div className="font-display font-bold text-white text-2xl tabular-nums">{minFc}</div>
                  <div className="text-gray-500 text-xs mt-0.5">don&rsquo;t drop below</div>
                </div>
                <div className="rounded-2xl border border-brand-blue/40 bg-brand-blue/[0.08] p-4 text-center">
                  <div className="text-brand-blue-light text-xs font-semibold uppercase tracking-wider mb-1.5">Target FC</div>
                  <div className="font-display font-bold text-white text-2xl tabular-nums">{targetFc}</div>
                  <div className="text-brand-blue-light/70 text-xs mt-0.5">aim for this</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">To clear algae</div>
                  <div className="font-display font-bold text-white text-2xl tabular-nums">{slamFc}</div>
                  <div className="text-gray-500 text-xs mt-0.5">shock / SLAM level</div>
                </div>
              </div>

              {locked && (
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-400/30 bg-amber-500/[0.08] p-4">
                  <Lock className="w-[18px] h-[18px] text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-amber-100/90 text-sm leading-relaxed">
                    At {cya} ppm CYA you&rsquo;d need <span className="font-semibold">{targetFc} ppm</span> of chlorine
                    just to keep up &mdash; and ~{slamFc} ppm to clear algae. That&rsquo;s the start of{' '}
                    <span className="font-semibold">chlorine lock</span>. The fix isn&rsquo;t more chlorine; it&rsquo;s
                    diluting the CYA back down.
                  </p>
                </div>
              )}
              <p className="text-gray-500 text-xs mt-4 text-center">
                A guideline, not a prescription &mdash; salt pools, indoor pools, and active algae all shift the numbers.
              </p>
            </div>

            {/* Ratio reference table */}
            <div className="max-w-5xl mx-auto mt-8 overflow-hidden rounded-3xl border border-white/10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.05] text-gray-300 text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6 font-semibold">CYA (ppm)</th>
                    <th className="py-3.5 px-2 sm:px-4 font-semibold">Min FC</th>
                    <th className="py-3.5 px-2 sm:px-4 font-semibold">Target FC</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {RATIO_ROWS.map((row) => (
                    <tr key={row.cya} className="bg-white/[0.015] hover:bg-white/[0.04] transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-display font-bold text-white tabular-nums">{row.cya}</td>
                      <td className="py-3.5 px-2 sm:px-4 text-gray-300 tabular-nums">{row.min}</td>
                      <td className="py-3.5 px-2 sm:px-4 text-gray-300 tabular-nums">{row.target}</td>
                      <td className={`py-3.5 px-4 sm:px-6 font-semibold ${toneStyles[row.tone]}`}>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Container>
        </section>

        {/* ── Chlorine-lock warning band ───────────────────────────── */}
        <section className="pb-4 sm:pb-8">
          <Container>
            <div className="max-w-5xl mx-auto rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/[0.12] via-amber-500/[0.04] to-transparent p-7 sm:p-9 relative overflow-hidden">
              <div className="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-start gap-3.5 mb-4">
                  <span className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-amber-400" />
                  </span>
                  <div>
                    <span className="text-amber-400 font-bold tracking-[0.2em] uppercase text-xs block mb-1">
                      Chlorine Lock Warning
                    </span>
                    <h2 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight">
                      When CYA climbs too high to manage
                    </h2>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl">
                  Stabilizer only goes up &mdash; every stabilized chlorine tablet (&ldquo;trichlor&rdquo;) adds more.
                  Once it&rsquo;s too high, no amount of chlorine is practical. Watch for:
                </p>
                <ul className="grid gap-3 sm:grid-cols-2 mb-6">
                  {LOCK_SIGNS.map((sign) => (
                    <li key={sign} className="flex items-start gap-2.5 text-gray-200 text-[15px] leading-snug">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-gray-300 leading-relaxed max-w-2xl">
                  The only real fix is dilution &mdash; partly draining and refilling to bring CYA back into range.
                  It comes down the same way nitrates do.{' '}
                  <Link to="/pool-care/nitrates" className="text-amber-300 hover:text-amber-200 font-semibold whitespace-nowrap">
                    See our nitrates guide &rarr;
                  </Link>
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* ── Health & safety / regulations (brand-blue accent) ────── */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Health &amp; Safety
              </span>
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl leading-tight mb-3">
                Why health departments regulate CYA
              </h2>
              <p className="text-gray-400 leading-relaxed">
                This isn&rsquo;t just about clear water &mdash; it&rsquo;s about whether the water is
                actually killing what&rsquo;s in it. That&rsquo;s why CYA is written into pool code.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
              {HEALTH_CARDS.map((card, i) => (
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
              Sources: CDC Model Aquatic Health Code (MAHC); Florida Administrative Code 64E-9
              (public swimming pools); CDC guidance on cyanuric acid and{' '}
              <span className="whitespace-nowrap">Cryptosporidium</span> inactivation. Limits cited are for
              public pools; private-pool chemistry is identical but unregulated.
            </p>
          </Container>
        </section>

        {/* ── Quick answers — FAQ accordion ────────────────────────── */}
        <section className="pb-16 sm:pb-20">
          <Container>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                  CYA &amp; chlorine, answered
                </h2>
                <p className="text-gray-400">
                  The questions homeowners ask most about stabilizer.{' '}
                  <a href="/faq" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {CYA_FAQ.map((faq) => {
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

              {/* Cross-link to the volume calculator for dilution math. */}
              <Link
                to="/tools/pool-volume-calculator"
                className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-colors p-5 group"
              >
                <span className="flex items-center gap-4 min-w-0">
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                    <Calculator className="w-5 h-5 text-brand-blue-light" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-white font-semibold text-[15px] leading-tight">
                      Need to dilute high CYA?
                    </span>
                    <span className="block text-gray-400 text-sm mt-0.5">
                      Get your pool&rsquo;s gallons first &mdash; free volume calculator, any shape.
                    </span>
                  </span>
                </span>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </div>
          </Container>
        </section>

        {/* Closing note — resource page for existing customers */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center border border-white/10 bg-gradient-to-br from-brand-blue/15 via-white/[0.03] to-brand-orange/10">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-2xl sm:text-3xl mb-3">
                Not sure where your CYA stands?
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto">
                We test stabilizer and balance your chlorine to match on every visit &mdash; so your
                pool is genuinely sanitized, not just clear. Questions? Reach us anytime at{' '}
                <a href={PHONE_HREF} className="text-brand-orange hover:text-brand-orange-dark font-semibold whitespace-nowrap">
                  {PHONE_DISPLAY}
                </a>
                .
              </p>
              <p className="text-gray-500 text-sm max-w-lg mx-auto mt-4">
                Got a full-sun pool out on the barrier island? See how we handle{' '}
                <Link to="/st-pete-beach-fl/" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                  pool service in St. Pete Beach
                </Link>
                , where stabilizer is the whole ballgame.
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </div>

    </div>
  );
};

export const CyanuricAcidPage = () => (
  <QuoteSheetProvider>
    <CyanuricAcidPageInner />
  </QuoteSheetProvider>
);
