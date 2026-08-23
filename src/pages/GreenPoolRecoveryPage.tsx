import React, { useState } from 'react';
import { m } from 'motion/react';
import {
  Sprout,
  Bug,
  Waves,
  TestTube,
  Brush,
  Filter,
  Droplets,
  Sun,
  Search,
  Sparkles,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
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
import { serviceSchema } from '@/lib/businessSchema';
import { breadcrumbSchema } from '@/lib/breadcrumbSchema';

const CANONICAL = '/services/green-pool-recovery/';

// ── The three tiers ────────────────────────────────────────────────
// This page's centrepiece and its whole credibility. Competitors advertise
// "clear in 24 hours" against every pool regardless of what's in it; naming
// three honest tiers with real timelines is both more trustworthy and a better
// match for what people actually search ("how long to clear a green pool").
//
// TIMELINES ARE THE ONE THING TO CHECK before this goes public — they should be
// the ranges from real jobs, not an industry average.
const TIERS: Array<{
  icon: typeof Sprout;
  label: string;
  headline: string;
  see: string;
  whatHappened: string;
  timeline: string;
  takes: string;
}> = [
  {
    icon: Sprout,
    label: 'Tier one',
    headline: 'Hazy and tinted',
    see: 'The water has gone cloudy with a green cast, but you can still make out the main drain.',
    whatHappened:
      'Chlorine dipped in the last few days — a missed week, a heavy rain, or a stabilizer level that let the sun burn it off — and algae has just started.',
    timeline: 'Usually clear in 2–3 days',
    takes: 'One shock pass, the filter running around the clock, and a couple of brushings.',
  },
  {
    icon: Waves,
    label: 'Tier two',
    headline: "Green, and the steps are gone",
    see: "Solid green. You can't see the second step, let alone the floor.",
    whatHappened:
      'The bloom has been established for a week or two and has colonised the walls and floor, not just the water.',
    timeline: 'Usually 4–7 days',
    takes:
      'Repeat shock doses over several days, aggressive brushing, and the filter cleaned more than once as it blinds up.',
  },
  {
    icon: Bug,
    label: 'Tier three',
    headline: 'Dark, still, and living',
    see: 'Dark green to near-black, a debris layer on the bottom, and often frogs or mosquito larvae.',
    whatHappened:
      'Months without service. There is a real layer of sludge on the floor now, and that has to come out physically before any chemistry is worth adding.',
    timeline: 'Usually one to two weeks',
    takes:
      'The sludge layer gets vacuumed out first with our own filtered vacuum — water stays in the pool — then an extended shock-and-hold while the water clears. Even at this state we very rarely drain.',
  },
];

// ── What recovery actually involves ────────────────────────────────
const PROCESS = [
  {
    icon: TestTube,
    title: 'Test before anything else',
    body:
      "Specifically stabilizer. If cyanuric acid has climbed high enough, chlorine is chemically locked and you can pour it in all week for nothing. Knowing that number up front is the difference between a plan that works and a fortnight of wasted shock — and it's the step most people skip.",
  },
  {
    icon: Sparkles,
    title: 'Vacuum the sludge out — not the water',
    body:
      "We run vacuums with their own integrated filtration, so the leaf litter and dead-algae sludge on the floor comes out of the pool instead of being pushed through your filter or flushed out with the water. It's the reason we can clean pools other services quote a drain on, and why the chemistry then works on water rather than on a pile of debris.",
  },
  {
    icon: Droplets,
    title: 'Fix pH, then shock',
    body:
      "Chlorine loses most of its punch at high pH, so pH is corrected before the shock goes in — otherwise you're paying for chemicals that can't do the job. Then it's dosed to a level that actually holds, not a token amount.",
  },
  {
    icon: Brush,
    title: 'Brush everything, repeatedly',
    body:
      'Algae anchored to plaster is shielded from the water chemistry. Brushing walls, steps, and corners is what exposes it — and it is the difference between clearing in days and fighting it for weeks.',
  },
  {
    icon: Filter,
    title: 'Keep filtering what is left in suspension',
    body:
      "Our vacuum takes out everything that has settled. What stays behind is the fine dead algae still suspended in the water, and that has to clear through the filter — which is the part that takes days. It gets cleaned or backwashed as it loads up, not once at the end.",
  },
  {
    icon: CalendarClock,
    title: 'Come back until it holds',
    body:
      'Chlorine crashes again as dead algae keeps breaking down. We return and keep the numbers up until they stay where we put them, rather than declaring it finished the first time it looks blue.',
  },
];

const GREEN_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'How long does it take to clear a green pool?',
    answer:
      "It depends entirely on how far gone it is. A pool that's just hazy and tinted is usually clear in two to three days. A solid green pool where you can't see the steps is more like four to seven. A dark, neglected pool with a debris layer on the bottom can take one to two weeks, most of which is filtration time after we've vacuumed the sludge out. Anyone promising 24 hours regardless of what's in your pool is guessing.",
  },
  {
    question: 'Do I have to drain the pool?',
    answer:
      "Very rarely, and it's usually the wrong answer. We run vacuums with integrated filtration, which means we pull the dead algae and sludge out of the pool directly rather than draining the water to get rid of it — so pools that other services quote a full drain and acid wash on generally come back with cleaning and chemistry instead. Draining also carries real risk in saturated Florida ground. The one situation where dilution genuinely is the fix is a stabilizer level so high that chlorine can't work at any dose, and that's uncommon.",
  },
  {
    question: "Can't I just shock it myself?",
    answer:
      "Often, yes — plenty of tier-one pools come back with a bag of shock and a weekend of running the filter, and we've written the whole process up if you want to try. Where it usually goes wrong is stabilizer (chlorine that can't work no matter how much goes in), not brushing enough, and not running the filter long enough. If you've already shocked it twice and it's still green, one of those three is why.",
  },
  {
    question: "The green is gone but it's cloudy now. Is something wrong?",
    answer:
      "No — that's the normal middle stage and a good sign. Cloudy grey or milky water is dead algae suspended in the pool, and clearing it is purely a filtration problem now. It needs the filter running continuously and cleaned as it loads up. This is the phase where people give up a day too early.",
  },
  {
    question: 'Will the stains come out?',
    answer:
      "Most do. Algae that sat against plaster can leave a shadow that brushes out over the following weeks once the water is balanced. Deeper staining — usually metal rather than organic — sometimes needs a separate treatment. We'll tell you honestly which kind you have once the water is clear enough to see the surface.",
  },
  {
    question: 'Is it safe to swim as soon as it looks blue?',
    answer:
      "Not automatically. Clear water and sanitized water aren't the same thing, and during a recovery the chlorine is often still well above swimming range anyway. We'll tell you when the numbers are actually in a safe band — usually a day or two after it looks finished.",
  },
  {
    question: 'What does a green pool cleanup cost?',
    answer:
      "It's a flat quote, given up front from photos, and it varies with the size of the pool, which tier it's in, and whether the filter can keep up. What it isn't is an hourly meter — storm and recovery work is the easiest place in this industry to run one, and we'd rather you knew the number before anyone turns up.",
  },
];

// JSON-LD in the PRERENDERED head via usePageMeta({ jsonLd }) — not a useEffect,
// which never runs during renderToString and would leave the crawler's first
// fetch with no schema at all.
//
// NOTE: two-level breadcrumb until the /services/ hub exists.
const RECOVERY_SCHEMA = [
  serviceSchema({
    serviceType: 'Green Pool Recovery & Cleanup',
    description:
      'Green pool cleanup and recovery across St. Petersburg and Pinellas County, FL — severity assessment, stabilizer testing, shock-and-hold treatment, repeated filtration and brushing, and a flat quote given up front from photos.',
    url: CANONICAL,
  }),
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: GREEN_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  },
  breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Green Pool Recovery', path: CANONICAL },
  ]),
];

const GreenPoolRecoveryPageInner = () => {
  const { open: openQuoteSheet } = useQuoteSheet();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  usePageMeta({
    title: 'Green Pool Cleanup St. Petersburg — Flat-Rate Recovery',
    description:
      'Green pool cleanup and recovery in St. Petersburg & Pinellas County, FL. Honest timelines by severity, flat quote from photos, no hourly meter. Back to blue.',
    canonicalPath: CANONICAL,
    fontPreload: [...NAV_FONTS, FONTS.inter400, FONTS.montserrat900],
    jsonLd: RECOVERY_SCHEMA,
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
            <Sprout className="w-3.5 h-3.5 text-brand-blue-light" />
            <span className="text-gray-300 font-semibold tracking-wide text-xs">
              Green Pool Recovery
            </span>
          </div>
          <h1 className="font-display font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
            Green pool cleanup and recovery in St.&nbsp;Petersburg.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto mb-8">
            Send us a photo and we&rsquo;ll tell you which of three states your pool is in, how
            long it will actually take, and what it costs — as one flat number, before anyone
            turns up.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#quote" onClick={handleQuoteClick} className="btn btn-orange w-full sm:w-auto">
              <MessageSquare className="w-[18px] h-[18px]" />
              Send a Photo, Get a Quote
            </a>
            <a href={PHONE_HREF} className="btn btn-glass w-full sm:w-auto">
              <Phone className="w-[18px] h-[18px]" />
              {PHONE_DISPLAY}
            </a>
          </div>
        </section>

        {/* ── THE LIGHT BAND — the three tiers ──────────────────── */}
        {/* The page's one polarity flip. It lands on the tiers because that's
            the section doing the persuading: naming the honest timeline is the
            whole differentiator against "clear in 24 hours". Site rule is
            exactly ONE light band per page. */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-b from-[#e4e9f0] to-[#d6dde7]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-brand-blue/[0.05] rounded-full blur-[140px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
              <span className="text-brand-blue font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                Which Green Is Yours
              </span>
              <h2 className="section-heading text-[#0a1628] leading-tight mb-4">
                Not all green pools are the same job.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Anyone quoting the same turnaround for every pool hasn&rsquo;t looked at yours.
                Here are the three states we actually find, and what each one honestly takes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
              {TIERS.map((tier, i) => (
                <m.div
                  key={tier.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl bg-white border border-brand-blue/15 shadow-[0_10px_30px_-18px_rgba(10,22,40,0.45)] p-6 flex flex-col"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-4">
                    <tier.icon className="w-5 h-5 text-brand-blue" />
                  </span>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue mb-1.5">
                    {tier.label}
                  </p>
                  <h3 className="text-[#0a1628] font-display font-bold text-lg mb-3 leading-snug">
                    {tier.headline}
                  </h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed mb-3">{tier.see}</p>
                  <p className="text-slate-600 text-[15px] leading-relaxed mb-4">
                    {tier.whatHappened}
                  </p>

                  <div className="mt-auto pt-4 border-t border-black/10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1">
                      Realistic timeline
                    </p>
                    <p className="text-[#0a1628] font-semibold text-[15px] mb-3">{tier.timeline}</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{tier.takes}</p>
                  </div>
                </m.div>
              ))}
            </div>

            <p className="text-center text-slate-500 text-sm max-w-xl mx-auto mt-10">
              Not sure which one you&rsquo;re looking at? Text us a photo and we&rsquo;ll tell you
              straight — including if it&rsquo;s a tier one you could handle yourself.
            </p>
          </Container>
        </section>

        {/* ── What recovery involves ────────────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-[#07111c]">
          <div className="absolute top-0 right-1/4 w-[50%] h-[40%] bg-brand-blue/[0.06] rounded-full blur-[150px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="max-w-2xl mb-10 md:mb-12">
              <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                How We Run It
              </span>
              <h2 className="section-heading text-white leading-[1.1] mb-4">
                Same order every time, because the order is what matters.
              </h2>
              <p className="section-subtext">
                Most failed green pool recoveries aren&rsquo;t short of chemicals. They&rsquo;re
                done out of sequence — shock poured into water that was never going to hold it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {PROCESS.map((step, i) => (
                <m.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 2) * 0.06 }}
                  className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 md:p-7 flex gap-5 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.8)]"
                >
                  <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-brand-blue-light" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-white mb-2 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed text-[15px]">{step.body}</p>
                  </div>
                </m.div>
              ))}
            </div>

            {/* Contextual link to the stabilizer guide. High CYA is the one
                genuine case for dilution — and the thing competitors point at
                when they quote a drain — so this is where the science belongs. */}
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-6 rounded-2xl border border-brand-orange/20 bg-brand-orange/[0.04] p-6 md:p-7 flex flex-col sm:flex-row sm:items-center gap-5"
            >
              <p className="text-gray-300 leading-relaxed text-[15px] flex-1">
                Stabilizer is the number that decides whether your chlorine can work at all —
                and it&rsquo;s the one most services never mention until they&rsquo;re quoting you
                a drain for it. Here&rsquo;s what it actually does.
              </p>
              <SmartLink
                to="/pool-care/cyanuric-acid/"
                className="group inline-flex items-center gap-2 shrink-0 text-brand-orange-light font-semibold text-[15px] hover:text-white transition-colors"
              >
                Read the stabilizer guide
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </SmartLink>
            </m.div>
          </Container>
        </section>

        {/* ── Why it isn't one visit ────────────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -right-28 w-[460px] h-[460px] rounded-full bg-brand-blue/[0.05] blur-[150px] pointer-events-none" />
          <Container className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8 lg:gap-12 items-start">
              <div className="lg:pt-2">
                <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  Set Expectations
                </span>
                <h2 className="section-heading text-white leading-[1.1] mb-4">
                  It is not a one-visit job, and nobody should tell you it is.
                </h2>
                <p className="section-subtext mb-6">
                  Killing the algae is the fast part — often the first afternoon. Our vacuum
                  pulls the settled sludge straight out, but the fine material left suspended in
                  the water still has to clear through the filter, and that is what takes days.
                </p>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">
                    The stage people quit on
                  </p>
                  <p className="text-white font-semibold text-[15px] leading-relaxed">
                    Grey, milky water is not a setback. It is dead algae in suspension — the
                    proof it worked, and a filtration problem from that point on.
                  </p>
                </div>
              </div>

              <div className="relative glass-panel rounded-3xl p-6 sm:p-8 overflow-hidden">
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-4">
                  What the days look like
                </p>
                <ul className="flex flex-col gap-4">
                  {[
                    'Day one — test, vacuum the sludge out with our filtered unit, correct pH, first shock. The colour often shifts within hours.',
                    'Day two — green turns grey or milky. Brush again, hold the chlorine, filter runs continuously.',
                    'Day three onward — the filter does the work. Cleaned or backwashed each time it loads up.',
                    'Then — chlorine drops back into normal range and holds there. That is when it is finished, not when it first looks blue.',
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-blue-light shrink-0 mt-0.5" />
                      <span className="text-[15px] text-gray-300 leading-snug">{line}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-gray-500 text-sm mt-5 pt-5 border-t border-white/10">
                  Tier three runs longer at every stage, and the first day is mostly debris
                  removal before any chemistry is worth adding.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* ── Pricing + the DIY exit ────────────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden bg-[#07111c]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          <Container className="relative z-10">
            <div className="max-w-2xl mb-10 md:mb-12">
              <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                What It Costs
              </span>
              <h2 className="section-heading text-white leading-[1.1] mb-4">
                One flat number, quoted from photos.
              </h2>
              <p className="section-subtext">
                Recovery work is the easiest place in this industry to run an hourly meter, and
                a green pool is the easiest customer to run it on. We quote the job up front
                instead.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-6">
              {[
                {
                  icon: Search,
                  title: 'What moves the number',
                  body:
                    'Pool size, which tier it is in, how deep the debris layer is, and what shape the filter is in once the water starts clearing.',
                },
                {
                  icon: ShieldCheck,
                  title: 'What does not',
                  body:
                    'How many visits it ends up taking. The return trips to hold the chemistry are part of the quoted job, not add-ons.',
                },
                {
                  icon: ClipboardCheck,
                  title: 'What you get',
                  body:
                    'The same photo-backed report as our weekly service, after every visit — so you can watch the numbers move rather than take our word for it.',
                },
              ].map((c) => (
                <m.div
                  key={c.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.8)]"
                >
                  <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <span className="w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-4">
                    <c.icon className="w-5 h-5 text-brand-blue-light" />
                  </span>
                  <h3 className="font-display font-bold text-white text-base mb-2 leading-snug">
                    {c.title}
                  </h3>
                  <p className="text-gray-400 text-[15px] leading-relaxed">{c.body}</p>
                </m.div>
              ))}
            </div>

            {/* The DIY exit. Deliberate: this page is the hire-us path and the
                guide is the do-it-yourself path. Linking out honestly is what
                makes the tier-one advice above credible. */}
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 md:p-7 flex flex-col sm:flex-row sm:items-center gap-5"
            >
              <p className="text-gray-300 leading-relaxed text-[15px] flex-1">
                If it&rsquo;s a tier one and you&rsquo;d rather have a go yourself, we&rsquo;re not
                going to pretend you can&rsquo;t. The full step-by-step is written up — the same
                order we use.
              </p>
              <SmartLink
                to="/pool-care/green-pool/"
                className="group inline-flex items-center gap-2 shrink-0 text-brand-blue-light font-semibold text-[15px] hover:text-white transition-colors"
              >
                The DIY walkthrough
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </SmartLink>
            </m.div>
          </Container>
        </section>

        {/* ── Keeping it ───────────────────────────────────────── */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[80%] h-[100%] bg-brand-blue/[0.07] rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="section-heading text-white leading-tight mb-4">
                Clearing it is the easy half. Keeping it is the point.
              </h2>
              <p className="section-subtext max-w-2xl mx-auto mb-8">
                Nearly every green pool we recover was on nobody&rsquo;s schedule. Once it&rsquo;s
                blue you can roll straight onto weekly service — same flat monthly rate as any
                other pool, chemicals included, and the recovery is done being an emergency.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-300 mb-8">
                <span className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-brand-blue-light" /> Stabilizer kept in band
                </span>
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-brand-blue-light" /> Slipping numbers flagged early
                </span>
                <span className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-brand-blue-light" /> Photo report every visit
                </span>
              </div>
              <p className="text-[13px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Green pool recovery across Pinellas County — St.&nbsp;Petersburg,{' '}
                <SmartLink to="/clearwater-fl/" className="text-gray-400 hover:text-white transition-colors">
                  Clearwater
                </SmartLink>
                ,{' '}
                <SmartLink to="/largo-fl/" className="text-gray-400 hover:text-white transition-colors">
                  Largo
                </SmartLink>
                ,{' '}
                <SmartLink to="/seminole-fl/" className="text-gray-400 hover:text-white transition-colors">
                  Seminole
                </SmartLink>
                , and the beaches. Storm damage instead?{' '}
                <SmartLink
                  to="/services/storm-cleanup/"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  See storm cleanup
                </SmartLink>
                .
              </p>
            </m.div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section className="py-16 md:py-24 bg-[#07111c] relative">
          <Container>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10 md:mb-12">
                <span className="text-brand-blue-light font-bold tracking-[0.2em] uppercase text-xs mb-3 block">
                  Green Pool Questions
                </span>
                <h2 className="section-heading text-white mb-3">The ones we get asked first.</h2>
                <p className="text-gray-400">
                  Straight answers, including when you don&rsquo;t need us.{' '}
                  <SmartLink to="/faq/" className="text-brand-orange hover:text-brand-orange-dark font-semibold">
                    See all FAQs &rarr;
                  </SmartLink>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/[0.08]">
                {GREEN_FAQ.map((faq) => {
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
                Send us a photo of it.
              </h2>
              <p className="text-gray-400 mb-7 max-w-md mx-auto">
                We&rsquo;ll tell you which tier it&rsquo;s in, roughly how long it&rsquo;ll take,
                and what it costs — one flat number, same day.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="#quote" onClick={handleQuoteClick} className="btn btn-orange w-full sm:w-auto">
                  <MessageSquare className="w-[18px] h-[18px]" />
                  Send a Photo, Get a Quote
                </a>
                <a href={PHONE_HREF} className="btn btn-glass w-full sm:w-auto">
                  <Phone className="w-[18px] h-[18px]" />
                  {PHONE_DISPLAY}
                </a>
              </div>
              <p className="text-gray-500 text-sm max-w-lg mx-auto mt-6">
                No obligation, and if it&rsquo;s a tier one we&rsquo;ll say so.
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </div>
      <StickyMobileCta />
    </div>
  );
};

export const GreenPoolRecoveryPage = () => (
  <QuoteSheetProvider>
    <GreenPoolRecoveryPageInner />
  </QuoteSheetProvider>
);
