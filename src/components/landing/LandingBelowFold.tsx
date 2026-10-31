import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Brush,
  Camera,
  Check,
  ChevronDown,
  ClipboardList,
  FlaskConical,
  Gauge,
  Handshake,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { SmartLink as Link } from '@/components/SmartLink';
import { useLandingQuoteSheet } from '@/components/landing/LandingQuoteSheet';
import { HomeHeroPhone, useLiveClock } from '@/components/Hero';
import { cities } from '@/lib/cities';
import {
  ADDRESS_CITY_STATE_ZIP,
  ADDRESS_LINE,
  BUSINESS_NAME,
  HOURS_SHORT,
  PHONE_DISPLAY,
  PHONE_HREF,
  SMS_QUOTE_HREF,
} from '@/lib/contact';
import { amberButton, focusQuoteForm } from '@/components/landing/HeroQuoteForm';

/*
 * /landing below the hero, in the order a visitor's questions come:
 *   what does the flat rate cover → what do I actually get each week → how do
 *   I start → what if I'm unhappy → do you come to me → the rest → go.
 *
 * EVERY CLAIM HERE IS SOURCED from the site: the FAQ (src/data/faqs.ts), the
 * Service Agreement (src/pages/ServiceAgreementPage.tsx: guarantee,
 * money-back, cancellation), How It Works (src/pages/HowItWorksPage.tsx), the
 * homepage's included lists (src/components/Services.tsx) and the sample
 * report (src/components/ServiceReport.tsx). If a term changes there, change
 * it here. The wording is written fresh rather than copied: near-duplicate
 * copy across the site's own pages gets discounted by search engines.
 * No reviews, counts or prices that aren't real; no price anchor (the ~$150
 * average only appears elsewhere next to its caveats).
 *
 * Plain CSS only: the one motion is the scroll reveal (data-reveal, driven by
 * PoolLandingPage), and images below the fold are lazy. The FAQ is native
 * <details>, so every answer ships in the prerendered HTML.
 */

const Container = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-8 ${className}`}>{children}</div>
);

// A 22px rule before the label (and after it too when the heading is centered).
const Eyebrow = ({
  children,
  light = false,
  centered = false,
}: {
  children: React.ReactNode;
  light?: boolean;
  centered?: boolean;
}) => (
  <p
    className={`inline-flex items-center gap-2.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] before:h-px before:w-[22px] before:bg-current before:opacity-60 ${
      centered ? 'after:h-px after:w-[22px] after:bg-current after:opacity-60' : ''
    } ${light ? 'text-sc-sky' : 'text-sc-blue'}`}
  >
    {children}
  </p>
);

const h2 = 'mt-3 text-balance text-[30px] font-[650] leading-[1.12] tracking-[-0.035em] sm:text-[40px]';
const lead = 'mt-4 text-pretty text-[17px] leading-[1.6] text-sc-navy/[0.78]';
// Section padding: 112px top and bottom on desktop.
const sectionY = 'py-20 sm:py-24 lg:py-28';

const inlineLink =
  'font-semibold text-sc-navy underline decoration-sc-navy/30 decoration-1 underline-offset-[3px] transition hover:decoration-sc-navy';

// Every "Get my price" below the hero opens the quote popup (LandingQuoteSheet).
const QuoteButton = ({ label = 'Get my price', className = '' }: { label?: string; className?: string }) => {
  const { open, warm } = useLandingQuoteSheet();
  const ref = useRef<HTMLButtonElement>(null);

  // Pre-mount the popup once this button is on screen, so the tap only runs
  // the open transition. Not on pointerdown: changing the DOM mid-tap made
  // iOS swallow the first click (see the mobile menu's CTA in Navbar).
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        warm();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [warm]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={open}
      className={`${amberButton} h-12 whitespace-nowrap px-6 text-base ${className}`}
    >
      {label}
      <ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-[3px]" strokeWidth={2.5} />
    </button>
  );
};

// ── 1. What's included ──────────────────────────────────────────────────────

// The flat rate as an equation: the four parts of every visit add up to one
// monthly price. Lines from the FAQ, How It Works, the homepage's included
// lists and the sample report.
const PARTS = [
  {
    icon: Brush,
    title: 'Weekly cleaning',
    lines: ['Walls and waterline brushed', 'Skimmed and vacuumed', 'Baskets emptied'],
  },
  {
    icon: FlaskConical,
    title: 'Water chemistry',
    lines: ['Tested and balanced', 'Every standard chemical', 'Salt cell care on salt pools'],
  },
  {
    icon: Gauge,
    title: 'Equipment check',
    lines: ['Pump, filter and salt system', 'Issues flagged early', 'Caught before they’re costly'],
  },
  {
    icon: ClipboardList,
    title: 'Visit report',
    lines: ['Readings, chemicals, photos', 'GPS-verified at your address', 'Sent before we leave'],
  },
];

const Included = () => (
  <section aria-labelledby="included-title" className={`bg-white ${sectionY}`}>
    <Container>
      <div data-reveal="" className="mx-auto max-w-3xl text-center">
        <Eyebrow centered>What's included</Eyebrow>
        <h2 id="included-title" className={`${h2} text-sc-navy`}>
          Weekly pool service in St.&nbsp;Petersburg, all in one flat rate.
        </h2>
        <p className={`${lead} mx-auto max-w-2xl`}>
          No chemical surcharges when summer pushes chlorine demand up, and no surprise line items. Here’s what
          every visit adds up to.
        </p>
      </div>

      {/* The four parts, then the price card they add up to. */}
      <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {PARTS.map(({ icon: Icon, title, lines }, i) => (
          <div key={title} data-reveal="" data-reveal-delay={i * 90} className="w-card flex h-full flex-col bg-white p-6">
            {/* Phones: icon beside the title, to keep the stacked cards short. */}
            <div className="flex items-center gap-3.5 lg:block">
              <span className="icon-tile grid h-11 w-11 shrink-0 place-items-center rounded-[12px] lg:h-12 lg:w-12">
                <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
              </span>
              <h3 className="text-[18px] font-bold tracking-[-0.015em] text-sc-navy lg:mt-5">{title}</h3>
            </div>
            <ul className="mt-4 space-y-2 lg:mt-3">
              {lines.map((l) => (
                <li key={l} className="flex items-start gap-2.5 text-[14.5px] leading-snug text-sc-navy/75">
                  <span className="mt-[1px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-emerald-500/[0.12] text-emerald-700">
                    <Check className="h-3 w-3" strokeWidth={3.25} />
                  </span>
                  {l}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div data-reveal="" data-reveal-delay={120} className="w-card mt-5 bg-white px-6 py-8 text-sc-navy sm:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#3b7fb6]">Your price</p>
            <p className="mt-1.5 text-[28px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[34px]">
              One flat monthly rate
            </p>
          </div>
          <ul className="flex flex-col gap-1.5 text-[15px] text-sc-navy/80">
            {['$0 chemical surcharges', 'No contract, month to month', '2-week money-back guarantee'].map((t) => (
              <li key={t} className="flex items-center gap-2 whitespace-nowrap">
                <Check className="h-4 w-4 shrink-0 text-[#10b981]" strokeWidth={3} />
                {t}
              </li>
            ))}
          </ul>
          <QuoteButton className="self-start lg:self-auto" />
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-[14px] leading-[1.55] text-sc-navy/60">
        <Wrench className="mr-1.5 inline h-4 w-4 -translate-y-px text-sc-navy/40" strokeWidth={2.25} />
        Only ever quoted separately: major repairs, replacement parts, green-to-clean recovery and major storm
        cleanup, always approved by you first.
      </p>
    </Container>
  </section>
);

// ── 2. The report ───────────────────────────────────────────────────────────

const REPORT_POINTS = [
  {
    icon: Gauge,
    title: 'Every reading',
    body: 'Chlorine, pH, alkalinity, salt and filter pressure, plus a balance score.',
  },
  {
    icon: FlaskConical,
    title: 'Every chemical, logged',
    body: 'Exactly what we added and how much, all covered by your flat rate.',
  },
  {
    icon: Camera,
    title: 'Photos of your pool',
    body: 'See exactly how we left your pool, even on days you’re not home.',
  },
  {
    icon: MapPin,
    title: 'GPS-verified',
    body: 'Time-stamped at your address, so every visit is proven, not promised.',
  },
];

// The homepage's phone mockup (Hero.tsx): an iPhone with a live clock, showing
// the real Gmail service-report email. The email scrolls itself once the
// visitor is halfway down the section (useAutoScrollReport); the phone takes no
// scroll or touch of its own, so it can never trap the page scroll. The
// sample email's tel/mailto links and buttons stay unclickable, and the whole
// mockup is aria-hidden: it's a picture of a report, not a UI. Its handwritten
// note is off here (this page doesn't load that script font), and the report
// shows this page's own pool photo, already downloaded for the hero.
// No mobile `.jpg` exists for this photo; every browser this site supports
// takes the .webp sources first.
const REPORT_PHOTO = {
  base: '/pool-waterfront-800',
  mobileWebp: '/pool-waterfront-800.webp',
  webp: '/pool-waterfront-640.webp',
  wideWebp: '/pool-waterfront-1120.webp',
  alt: 'A sparkling blue backyard pool and spa on the water',
};

// Framer-style scroll trigger: once the visitor is about halfway down the
// section, the email scrolls itself on its own clock, like someone reading:
// four eased flicks with short pauses, ~6s in all. On phones the phone sits
// below the four features, so it also waits until most of the phone is on
// screen. Once the section is fully off screen, the email resets to the top so
// it plays again next time. Reduced motion: it doesn't play.
const REPORT_STOPS = [0.24, 0.5, 0.76, 1]; // fractions of the email's length
const REPORT_MOVE_MS = 950;
const REPORT_PAUSE_MS = 650;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const useAutoScrollReport = (
  phoneRef: React.RefObject<HTMLDivElement | null>,
  bodyRef: React.RefObject<HTMLDivElement | null>,
) => {
  useEffect(() => {
    const phone = phoneRef.current;
    const body = bodyRef.current;
    const section = phone?.closest('section');
    if (!phone || !body || !section) return;
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    let raf = 0;
    let timer = 0;
    let played = false;
    const stop = () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    const glideTo = (to: number, done: () => void) => {
      const from = body.scrollTop;
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / REPORT_MOVE_MS);
        body.scrollTop = from + (to - from) * easeInOutCubic(t);
        if (t < 1) raf = requestAnimationFrame(tick);
        else done();
      };
      raf = requestAnimationFrame(tick);
    };
    const play = () => {
      const max = body.scrollHeight - body.clientHeight;
      let i = 0;
      const next = () => {
        if (i >= REPORT_STOPS.length) return;
        glideTo(REPORT_STOPS[i++] * max, () => {
          timer = window.setTimeout(next, REPORT_PAUSE_MS);
        });
      };
      next();
    };
    const check = () => {
      const vh = window.innerHeight;
      const s = section.getBoundingClientRect();
      const p = phone.getBoundingClientRect();
      const midway = s.top + s.height / 2 <= vh / 2;
      const phoneShown = Math.min(p.bottom, vh) - Math.max(p.top, 0) >= p.height * 0.6;
      if (!played && midway && phoneShown) {
        played = true;
        play();
      } else if (played && (s.bottom < 0 || s.top > vh)) {
        played = false;
        stop();
        body.scrollTop = 0;
      }
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      stop();
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [phoneRef, bodyRef]);
};

const ReportPhone = () => {
  const clock = useLiveClock();
  const [gmailScrolled, setGmailScrolled] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  useAutoScrollReport(phoneRef, bodyRef);
  return (
    <div
      className="phone-drop pointer-events-none relative flex justify-center"
      aria-hidden="true"
      data-nosnippet=""
    >
      <div ref={phoneRef} className="relative">
        <HomeHeroPhone
          clock={clock}
          gmailScrolled={gmailScrolled}
          setGmailScrolled={setGmailScrolled}
          interactive={false}
          scrollBodyRef={bodyRef}
          annotation={false}
          reportPhoto={REPORT_PHOTO}
        />
      </div>
    </div>
  );
};

const Report = () => (
  <section aria-labelledby="report-title" className={`dark-depth overflow-hidden ${sectionY}`}>
    <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-20">
      <div>
        <div data-reveal="">
          <Eyebrow light>Your service report</Eyebrow>
        </div>
        <h2 data-reveal="" id="report-title" className={`${h2} text-white`}>
          Know exactly what happened at your pool, every week.
        </h2>
        <p data-reveal="" className="mt-4 max-w-[540px] text-pretty text-[17px] leading-[1.65] text-white/[0.72]">
          Most pool services never send a report. Yours arrives before we leave the driveway, and anything that needs
          your attention, like low water or an equipment issue, is flagged right there.
        </p>
        {/* 2×2, equal row heights, so the four items line up across. */}
        <ul className="mt-11 grid auto-rows-fr sm:grid-cols-2 sm:gap-x-9">
          {REPORT_POINTS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} data-reveal="" data-reveal-delay={i * 90} className="flex gap-4 py-6">
              <span className="r-tile grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-white/[0.06] text-[#53a5d3]">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <h3 className="text-[16.5px] font-semibold text-white">{title}</h3>
                <p className="mt-1 text-[14.5px] leading-[1.6] text-white/[0.62]">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div data-reveal="" data-reveal-delay={120} className="mx-auto w-full max-w-[440px]">
        <ReportPhone />
      </div>
    </Container>
  </section>
);

// ── Reviews ─────────────────────────────────────────────────────────────────

// Real Google reviews, quoted as written (including the owner's name spelled
// two ways). No review count anywhere: only what can be shown in full.
// TODO: GOOGLE_REVIEWS_URL is a Google search until the Business Profile link
// is supplied; swap in the profile's reviews URL.
const GOOGLE_REVIEWS_URL = 'https://www.google.com/search?q=Suncoast+Pool+Pros+St.+Petersburg+FL+reviews';

const REVIEWS = [
  {
    name: 'Michelle M.',
    quote:
      'My pool has never looked better. After struggling with my former pool company for years, it’s such a relief to finally have a company I can count on and not have to worry about my pool service. Jonathan and Warren have both been wonderful to work with. They’re responsive, reliable, and do exactly what they say they’re going to do.',
  },
  {
    name: 'Jack K.',
    quote:
      'Johnathan with Suncoast Pools provides a value service. Reasonable price, and very reliable service. They replaced my filter system and pump after the hurricane, then converted my pool to a salt system. Outstanding service.',
  },
  {
    name: 'Praxitelis',
    quote: 'Excellent service. Of the 5 years I’ve had pool service, this is by far the best!',
  },
];

const Stars = ({ className = '' }: { className?: string }) => (
  <span aria-hidden="true" className={`tracking-[0.06em] text-[#e8a100] ${className}`}>
    ★★★★★
  </span>
);

type Review = (typeof REVIEWS)[number];

const ReviewCard = ({ review, featured = false, delay }: { review: Review; featured?: boolean; delay: number }) => (
  <li
    data-reveal=""
    data-reveal-delay={delay}
    className={`w-card flex flex-col bg-white ${featured ? 'justify-center px-[30px] py-7 md:row-span-2' : 'px-[26px] py-6'}`}
  >
    <Stars className="text-[13px]" />
    <span className="sr-only">Rated 5 out of 5.</span>
    <blockquote className={`mt-3 leading-[1.6] text-sc-navy/80 ${featured ? 'text-[16px]' : 'text-[14.5px]'}`}>
      “{review.quote}”
    </blockquote>
    <div className={`flex items-center gap-2.5 ${featured ? 'mt-[22px]' : 'mt-4'}`}>
      <span
        aria-hidden="true"
        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-sc-blue/10 text-[13px] font-semibold text-sc-blue"
      >
        {review.name[0]}
      </span>
      <span className="text-[13.5px]">
        <span className="font-semibold text-sc-navy">{review.name}</span>
        <span className="text-sc-navy/55"> · Google review</span>
      </span>
    </div>
  </li>
);

const Reviews = () => (
  <section aria-labelledby="reviews-title" className="bg-[#f5f9fd] py-20 sm:py-24">
    <Container>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div data-reveal="" className="max-w-2xl">
          <Eyebrow>What customers say</Eyebrow>
          <h2 id="reviews-title" className={`${h2} text-sc-navy sm:text-[clamp(28px,3.4vw,38px)]`}>
            Neighbors who stopped worrying about their pool.
          </h2>
        </div>
        <a
          href={GOOGLE_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-4 py-2.5 text-[14px] font-semibold text-sc-navy shadow-[0_1px_2px_rgba(16,24,40,0.06)] ring-1 ring-sc-navy/10 transition hover:ring-sc-navy/25 sm:self-auto"
        >
          <Stars className="text-[13px]" />
          Read our reviews on Google
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        </a>
      </div>

      {/* Featured review on the left; the other two stacked on the right. */}
      <ul className="mt-12 grid gap-5 md:grid-cols-2">
        <ReviewCard review={REVIEWS[0]} featured delay={0} />
        <ReviewCard review={REVIEWS[1]} delay={90} />
        <ReviewCard review={REVIEWS[2]} delay={180} />
      </ul>
    </Container>
  </section>
);

// ── 3. How it works ─────────────────────────────────────────────────────────

const STEPS = [
  {
    title: 'Send us your address',
    body: 'Use the form above, or text two photos: one of the pool, one of the equipment. Same-day reply, Monday to Saturday.',
  },
  {
    title: 'Get your flat monthly price',
    body: 'A clear number, often without a site visit. No pressure and no obligation.',
  },
  {
    title: 'We take it from here',
    body: 'We handle the switch from your current company and usually start within days. You don’t need to be home.',
  },
];

// Desktop: the heading and CTA sit beside the timeline, centered against it.
const HowItWorks = () => (
  <section aria-labelledby="how-title" className={`bg-white ${sectionY}`}>
    <Container className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-24">
      <div data-reveal="" className="lg:self-center">
        <Eyebrow>How it works</Eyebrow>
        <h2 id="how-title" className={`${h2} text-sc-navy`}>
          Getting started takes five minutes, tops.
        </h2>
        <p className="mt-4 max-w-[420px] text-pretty text-[17px] leading-[1.6] text-sc-navy/[0.72]">
          Three simple steps. No contract to sign, and no need to be home for any of them.
        </p>
        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <QuoteButton />
          <a href={SMS_QUOTE_HREF} className="inline-flex items-center gap-2 text-[15px] text-sc-navy/70">
            <MessageSquare className="h-4 w-4 text-sc-navy/55" />
            <span>
              or <span className={inlineLink}>text us 2 photos</span>
            </span>
          </a>
        </div>
      </div>

      {/* The line runs through the centers of the 48px number circles. */}
      <ol className="relative before:absolute before:bottom-12 before:left-[23px] before:top-6 before:w-px before:bg-[linear-gradient(180deg,rgba(38,118,182,0.45),rgba(38,118,182,0.08))]">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            data-reveal=""
            data-reveal-delay={i * 90}
            className="relative pb-11 pl-[68px] pt-1 last:pb-0 sm:pl-[84px]"
          >
            <span className="step-dot absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-full bg-white text-[16px] font-semibold text-sc-blue">
              {i + 1}
            </span>
            <h3 className="pt-2.5 text-[21px] font-semibold tracking-[-0.015em] text-sc-navy">{s.title}</h3>
            <p className="mt-2 max-w-[460px] text-pretty text-[16.5px] leading-[1.6] text-sc-navy/[0.78]">{s.body}</p>
          </li>
        ))}
      </ol>
    </Container>
  </section>
);

// ── 4. Guarantees ───────────────────────────────────────────────────────────

// Terms restated from the Service Agreement. The fine print is part of the
// promise: stating a guarantee without its limits is how trust gets lost.
const GUARANTEES = [
  {
    icon: ShieldCheck,
    title: 'Always Blue Guarantee',
    body: 'Your water stays clear and balanced all week, not just on visit day. If it drifts under our regular care, we come back and make it right at no charge.',
    fine: "As long as we're the only ones adding chemicals. Excludes chemical loss from leaks, and problems from failing equipment until it's repaired.",
  },
  {
    icon: RotateCcw,
    title: '2-week money-back guarantee',
    body: "Not happy in your first two weeks? Tell us before your third weekly visit and we'll refund everything you've paid, in full.",
    fine: 'For new customers on our Service Agreement.',
  },
  {
    icon: Handshake,
    title: 'Month-to-month. No contract.',
    body: "We'd rather earn your business every week than lock you in. Stop any time with 30 days' notice and no cancellation penalty.",
    fine: 'Billed monthly, by bank transfer (free) or card.',
  },
];

const [ALWAYS_BLUE, ...OTHER_GUARANTEES] = GUARANTEES;

const Guarantees = () => (
  <section aria-labelledby="guarantees-title" className={`dark-depth text-white ${sectionY}`}>
    <Container>
      <div data-reveal="" className="max-w-2xl">
        <Eyebrow light>Our guarantees</Eyebrow>
        <h2 id="guarantees-title" className={`${h2} text-white`}>
          Our promises, in writing.
        </h2>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {/* The signature promise spans the row: icon | promise | fine print. */}
        <div
          data-reveal=""
          className="g-card g-card-feature grid gap-5 rounded-[18px] p-7 md:col-span-2 md:grid-cols-[64px_1.35fr_1fr] md:gap-x-8 md:gap-y-3 md:p-10"
        >
          <span className="g-tile grid h-16 w-16 place-items-center rounded-[16px] md:row-span-2">
            <ALWAYS_BLUE.icon className="h-7 w-7" strokeWidth={2} />
          </span>
          <div className="md:self-end">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[#ffc226]">Our signature promise</p>
            <h3 className="mt-2 text-[28px] font-[650] leading-[1.15] tracking-[-0.025em]">{ALWAYS_BLUE.title}</h3>
          </div>
          <p className="text-pretty text-[17px] leading-[1.6] text-white/80 md:col-start-2 md:row-start-2">
            {ALWAYS_BLUE.body}
          </p>
          <p className="border-t border-white/[0.12] pt-5 text-[13.5px] leading-[1.55] text-white/55 md:col-start-3 md:row-span-2 md:row-start-1 md:self-center md:border-l md:border-t-0 md:pl-8 md:pt-0">
            {ALWAYS_BLUE.fine}
          </p>
        </div>

        {OTHER_GUARANTEES.map(({ icon: Icon, title, body, fine }, i) => (
          <div key={title} data-reveal="" data-reveal-delay={(i + 1) * 90} className="g-card flex flex-col rounded-[18px] p-7 md:p-8">
            <span className="g-tile grid h-10 w-10 place-items-center rounded-[10px]">
              <Icon className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <h3 className="mt-5 text-[18px] font-semibold tracking-[-0.01em]">{title}</h3>
            <p className="mt-2 flex-1 text-[15.5px] leading-[1.55] text-white/80">{body}</p>
            <p className="mt-4 border-t border-white/10 pt-4 text-[13px] leading-snug text-white/55">{fine}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-[14px] text-white/60">
        Every term is in our{' '}
        <Link
          to="/service-agreement/"
          className="font-semibold text-white underline decoration-white/30 decoration-1 underline-offset-[3px] transition hover:decoration-white"
        >
          Service Agreement
        </Link>
        .
      </p>
    </Container>
  </section>
);

// ── 5. Service areas ────────────────────────────────────────────────────────

// From src/lib/cities.ts, the list the footer and menus use. All 14 as plain
// pills, none linked: only 7 have their own page, and a mix of links and
// non-links reads as inconsistent. The header's Service Areas menu links the
// ones that do. St. Petersburg, the home base, is the one navy pill.
const Areas = () => (
  <section aria-labelledby="areas-title" className={`bg-white ${sectionY}`}>
    <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
      <div data-reveal="">
        <Eyebrow>Service area</Eyebrow>
        <h2 id="areas-title" className={`${h2} text-sc-navy`}>
          Pool service across Pinellas County.
        </h2>
        <p className={lead}>
          All of Pinellas, from St. Pete Beach to Palm Harbor, plus South Tampa and Davis Island. Our routes are
          concentrated here, which is how visits stay on schedule.
        </p>
        <p className="mt-6 text-[15px] text-sc-navy/70">
          Don’t see your neighborhood?{' '}
          <button type="button" onClick={focusQuoteForm} className={inlineLink}>
            Enter your address
          </button>{' '}
          and we’ll confirm.
        </p>
      </div>

      <ul className="flex flex-wrap content-center gap-2.5 self-center">
        {cities.map((c) => {
          const home = c.slug === 'st-petersburg';
          return (
            <li
              key={c.slug}
              className={`inline-flex items-center gap-1.5 rounded-full py-2.5 pl-3.5 pr-4 ${
                home ? 'bg-sc-navy' : 'bg-white ring-1 ring-sc-navy/10'
              }`}
            >
              <MapPin className={`h-[15px] w-[15px] shrink-0 ${home ? 'text-[#ffc226]' : 'text-sc-sky'}`} strokeWidth={2.25} />
              <span className={`text-[14.5px] font-[550] ${home ? 'text-white' : 'text-sc-navy'}`}>{c.name}</span>
              {home && <span className="text-[12.5px] text-white/60">{c.blurb}</span>}
            </li>
          );
        })}
      </ul>
    </Container>
  </section>
);

// ── 6. FAQ ──────────────────────────────────────────────────────────────────

// Short, page-specific answers (the long versions live on /faq/).
const FAQS = [
  {
    q: 'How much does pool service cost in St. Petersburg?',
    a: "It depends on your pool: its size, the trees around it, its surface and its equipment. Send your address or two photos and we'll reply with your exact flat monthly price the same day. Every standard chemical is included in that price.",
  },
  {
    q: 'Do I need to be home for service?',
    a: 'No. An unlocked gate on your service day, a gate code or a lockbox is all we need. Most customers are at work when we visit, and the report shows exactly what we did.',
  },
  {
    q: 'Do you service saltwater pools?',
    a: 'Yes, on the same flat-rate plan. On a salt pool we also clean the salt cell and check salinity, which keeps the cell from scaling up and failing early.',
  },
  {
    q: 'How do I switch from my current pool company?',
    a: "Tell your old company you're done, and we pick up on your new weekly day once your price is set, so there's no gap where the pool slips. If it drifted during the handoff, we bring it back to clear and balanced.",
  },
  {
    q: 'My pool is green right now. Can you still help?',
    a: "Yes. Recovery is quoted first, since the chemicals and labor vary so much from pool to pool, and starts once you approve it. When it's clear, you move onto weekly service so it stays that way.",
  },
  {
    q: 'How soon can you start?',
    a: 'Usually within days. Our routes are concentrated around Pinellas and the beaches, so once your price is confirmed we can slot you onto a nearby route quickly.',
  },
];

const Faq = () => (
  <section aria-labelledby="faq-title" className={`bg-[#f5f9fd] ${sectionY}`}>
    <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
      <div data-reveal="">
        <Eyebrow>Questions</Eyebrow>
        <h2 id="faq-title" className={`${h2} text-sc-navy`}>
          Straight answers.
        </h2>
        <p className={lead}>
          Something else on your mind? Call{' '}
          <a href={PHONE_HREF} className={`${inlineLink} whitespace-nowrap`}>
            {PHONE_DISPLAY}
          </a>{' '}
          and talk to a real person, {HOURS_SHORT}. Or see{' '}
          <Link to="/faq/" className={inlineLink}>
            all our FAQs
          </Link>
          .
        </p>
      </div>

      <div className="divide-y divide-sc-navy/10 rounded-[18px] bg-white px-5 shadow-[0_0_0_1px_rgba(36,58,85,0.08)] sm:px-6">
        {FAQS.map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[16.5px] font-semibold text-sc-navy [&::-webkit-details-marker]:hidden">
              <h3>{q}</h3>
              <ChevronDown className="h-5 w-5 shrink-0 text-sc-navy/45 transition-transform group-open:rotate-180" />
            </summary>
            <p className="-mt-1 pb-5 pr-10 text-[15.5px] leading-[1.6] text-sc-navy/[0.78]">{a}</p>
          </details>
        ))}
      </div>
    </Container>
  </section>
);

// ── 7. Closing CTA + footer ─────────────────────────────────────────────────

const FinalCta = () => (
  <section aria-labelledby="cta-title" className={`bg-white ${sectionY}`}>
    <Container>
      <div data-reveal="" data-reveal-delay={120} className="cta-depth rounded-[24px] px-6 py-14 text-center sm:px-12 sm:py-[72px]">
        <h2 id="cta-title" className={`${h2} mx-auto max-w-2xl text-white`}>
          Ready for a pool you never have to think about?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-[17px] leading-[1.6] text-white/75">
          Get your flat monthly price today. Every standard chemical included, no contract, and a 2-week money-back
          guarantee.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <QuoteButton className="h-[52px] px-7" />
          <a
            href={PHONE_HREF}
            className="inline-flex h-[52px] items-center gap-2 rounded-[10px] px-6 text-base font-semibold text-white ring-1 ring-white/25 transition hover:ring-white/50"
          >
            <Phone className="h-[18px] w-[18px] text-white/70" />
            {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </Container>
  </section>
);

export const LandingFooter = () => (
  <footer className="border-t border-sc-navy/[0.08] bg-white py-10">
    <Container className="flex flex-col gap-6 text-[14px] text-sc-navy/65 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="font-display text-[15px] font-bold uppercase tracking-wide text-sc-navy">{BUSINESS_NAME}</p>
        <p className="mt-2 flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sc-navy/45" />
          <span>
            {ADDRESS_LINE}, {ADDRESS_CITY_STATE_ZIP}
          </span>
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Phone className="h-4 w-4 shrink-0 text-sc-navy/45" />
          <a href={PHONE_HREF} className="font-medium text-sc-navy">
            {PHONE_DISPLAY}
          </a>
          <span aria-hidden="true">·</span>
          {HOURS_SHORT}
        </p>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 md:justify-end">
        <Link to="/services/" className="transition hover:text-sc-navy">
          Services
        </Link>
        <Link to="/faq/" className="transition hover:text-sc-navy">
          FAQ
        </Link>
        <Link to="/service-agreement/" className="transition hover:text-sc-navy">
          Service Agreement
        </Link>
        <Link to="/privacy-policy/" className="transition hover:text-sc-navy">
          Privacy Policy
        </Link>
      </nav>
    </Container>
  </footer>
);

// The sections go inside the page's <main>; LandingFooter goes after it.
export const LandingBelowFold = () => (
  <>
    <Included />
    <Report />
    <Reviews />
    <HowItWorks />
    <Guarantees />
    <Areas />
    <Faq />
    <FinalCta />
  </>
);
