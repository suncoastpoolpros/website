import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Camera,
  ChevronDown,
  FlaskConical,
  Gauge,
  Handshake,
  MapPin,
  MessageSquare,
  Phone,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { SmartLink as Link } from '@/components/SmartLink';
import { useLandingQuoteSheet } from '@/components/landing/LandingQuoteSheet';
import { PhoneReport } from '@/components/landing/PhoneReport';
import { cities } from '@/lib/cities';
import {
  HOURS_SHORT,
  PHONE_DISPLAY,
  PHONE_HREF,
  SMS_QUOTE_HREF,
} from '@/lib/contact';
import { Container, QuoteButton as KitQuoteButton } from '@/components/landing/sectionKit';
import { GOOGLE_REVIEWS_URL, REVIEWS, type Review } from '@/lib/reviews';
import { SERVICE_TILES } from '@/lib/serviceTiles';

/*
 * The homepage below the hero, in the order a visitor's questions come:
 *   what do you do → what do customers say → what do I get each week → how
 *   do I start → what if I'm unhappy → do you come to me → the rest → go.
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
 * Plain CSS only, no scroll reveal: everything is simply there. Images below
 * the fold are lazy. The FAQ is native <details>, so every answer ships in
 * the prerendered HTML.
 */

const inlineLink =
  'font-semibold text-sc-navy underline decoration-sc-navy/30 decoration-1 underline-offset-[3px] transition hover:decoration-sc-navy';
// For links inside lists, answers and fine print: the surrounding text's own
// weight and color, with the same underline.
const softLink =
  'underline decoration-current/30 decoration-1 underline-offset-[3px] transition hover:text-sc-navy hover:decoration-sc-navy';

// This page's section rhythm and headings (the shared kit's are the other
// pages'): 112px top and bottom from 1024px, 76px below. Every h2 is
// followed by one subheading line. No eyebrow labels.
const sectionY = 'py-[76px] lg:py-28';
const h2 = 'text-balance text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[30px]';
const subBase = 'mt-2.5 max-w-[40rem] text-pretty text-[16px] leading-[1.55] md:text-[17px]';
const sub = `${subBase} text-[rgba(36,58,85,0.66)]`;
const subDark = `${subBase} text-white/[0.72]`;

// Every quote button below the hero: the flat gold, opening the quote popup.
const QuoteButton = ({ className = 'h-12 px-6 text-base' }: { className?: string }) => (
  <KitQuoteButton variant="flat" label="Get my free quote" className={className} />
);

// ── 1. Services ─────────────────────────────────────────────────────────────

// Icon beside the name; at 560px and under, the icon above it and the name
// free to wrap. Linked tiles only change their border on hover. From 1024 to
// 1279 the four columns are narrowest, so a hair less padding and type keep
// "Saltwater pool maintenance" on one line from ~1100px.
const tileClass =
  'flex h-[72px] items-center gap-2.5 rounded-[12px] border border-[rgba(36,58,85,0.1)] bg-white px-4 lg:max-xl:px-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.03)] max-[560px]:h-auto max-[560px]:min-h-[94px] max-[560px]:flex-col max-[560px]:items-start max-[560px]:justify-center max-[560px]:p-4';

const ServicesSection = () => (
  <section aria-labelledby="services-title" className={`bg-white ${sectionY}`}>
    <Container>
      <div className="mx-auto text-center">
        <h2 id="services-title" className={`${h2} mx-auto max-w-[46rem] text-sc-navy`}>
          Pool cleaning and service in <span className="whitespace-nowrap">St. Petersburg</span>, from one local team.
        </h2>
        <p className={`${sub} mx-auto max-w-[38rem]`}>
          Weekly service at one flat rate, plus recovery, repairs and commercial work when you need it.
        </p>
      </div>

      <ul className="mt-9 grid grid-cols-2 gap-3 lg:mt-12 lg:grid-cols-4">
        {SERVICE_TILES.map(({ icon: Icon, name, to }) => {
          const inner = (
            <>
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-[#1f7fdb]" strokeWidth={1.6} />
              <span className="min-w-0 text-[15px] font-semibold leading-tight tracking-[-0.012em] text-[#243a55] max-[560px]:text-[14.5px] lg:max-xl:text-[14.5px]">
                {name}
              </span>
            </>
          );
          return (
            <li key={name} className="flex">
              {to ? (
                <Link
                  to={to}
                  className={`${tileClass} w-full transition-colors hover:border-[#1f7fdb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f7fdb]`}
                >
                  {inner}
                </Link>
              ) : (
                <div className={`${tileClass} w-full`}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Container>
  </section>
);

// ── 2. Reviews ──────────────────────────────────────────────────────────────

const Stars = ({ className = '' }: { className?: string }) => (
  <span aria-hidden="true" className={`tracking-[0.06em] text-[#e8a100] ${className}`}>
    ★★★★★
  </span>
);

// Three equal tiles; the attribution sits at the foot of each, so the names
// line up across the row.
const reviewCard = (review: Review) => (
  <li key={review.name} className="flex flex-col rounded-[12px] border border-[rgba(36,58,85,0.1)] bg-white px-[26px] pb-6 pt-[26px] shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
    <Stars className="text-[12px]" />
    <span className="sr-only">Rated 5 out of 5.</span>
    <blockquote className="mt-3 text-[15.5px] leading-[1.6] text-[rgba(36,58,85,0.86)]">“{review.quote}”</blockquote>
    <p className="mt-auto pt-5 text-[13.5px]">
      <span className="font-semibold text-sc-navy">{review.name}</span>
      <span className="text-sc-navy/[0.66]"> · Google review</span>
    </p>
  </li>
);

const Reviews = () => (
  <section aria-labelledby="reviews-title" className={`bg-[#f7f9fc] ${sectionY}`}>
    <Container>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="reviews-title" className={`${h2} text-sc-navy`}>
            Neighbors who stopped worrying about their pool.
          </h2>
          <p className={sub}>What our customers say on Google, where we’re rated 5.0.</p>
        </div>
        <a
          href={GOOGLE_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-[10px] border border-[rgba(36,58,85,0.14)] bg-white px-4 py-2.5 text-[14px] font-semibold text-sc-navy transition-colors hover:border-[rgba(36,58,85,0.3)] sm:self-auto"
        >
          <Stars className="text-[12px]" />
          Read our reviews on Google
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        </a>
      </div>

      <ul className="mt-9 grid gap-3 lg:mt-12 min-[900px]:grid-cols-3">
        {REVIEWS.slice(0, 3).map(reviewCard)}
      </ul>
    </Container>
  </section>
);

// ── 3. The report ───────────────────────────────────────────────────────────

// In the order they appear in the email, top to bottom.
const REPORT_POINTS = [
  {
    icon: MapPin,
    title: 'GPS-verified',
    body: 'Time-stamped at your address, so every visit is proven, not promised.',
  },
  {
    icon: Gauge,
    title: 'Every reading',
    body: 'Chlorine, pH, alkalinity, salt and filter pressure, plus a balance score.',
  },
  {
    icon: FlaskConical,
    title: 'Every chemical, logged',
    body: 'What we added and how much, every standard chemical covered by your flat rate.',
  },
  {
    icon: Camera,
    title: 'Photos of your pool',
    body: 'See how we left your pool, even on days you’re not home.',
  },
];

// Where each point lives in the sample email (ServiceReport.tsx), same order
// as REPORT_POINTS: the elements whose combined box the phone scrolls to.
const sectionTitled = (body: HTMLElement, title: string) =>
  [...body.querySelectorAll('.sr-section')].find((el) => el.textContent?.trim() === title) ?? null;
const REPORT_TARGETS: ((body: HTMLElement) => (Element | null)[])[] = [
  (body) => [body.querySelector('.sr-header__datebadge'), body.querySelector('.sr-hero')],
  (body) => [sectionTitled(body, 'Water Chemistry'), body.querySelector('.sr-lsi')],
  (body) => [sectionTitled(body, 'Chemicals Added'), sectionTitled(body, 'Chemicals Added')?.nextElementSibling ?? null],
  (body) => [sectionTitled(body, 'Photos'), body.querySelector('.sr-photo-wrap')],
];

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Glides an element's scrollTop to `to`, eased. Returns a cancel function.
const glideScroll = (el: HTMLElement, to: number, ms: number) => {
  const from = el.scrollTop;
  const t0 = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - t0) / ms);
    el.scrollTop = from + (to - from) * easeInOutCubic(t);
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
};

const REPORT_GLIDE_MS = 500;
const AUTOPLAY_MS = 3600;
const MANUAL_PAUSE_MS = 9000;

const useMediaQuery = (query: string) => {
  // false until mounted, to match the prerendered HTML.
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
};

// The phone scrolls (inside its own screen) to the active point's part of the
// report, centred as far as the email allows. Instant with reduced motion.
const usePhoneScroll = (bodyRef: React.RefObject<HTMLDivElement | null>, step: number, instant: boolean) => {
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const els = REPORT_TARGETS[step](body).filter((el): el is Element => !!el);
    if (!els.length) return;
    // The phone may be scaled; work in the email's own CSS pixels.
    const box = body.getBoundingClientRect();
    const scale = box.height / body.offsetHeight || 1;
    const rects = els.map((el) => el.getBoundingClientRect());
    const top = (Math.min(...rects.map((r) => r.top)) - box.top) / scale + body.scrollTop;
    const bottom = (Math.max(...rects.map((r) => r.bottom)) - box.top) / scale + body.scrollTop;
    const max = body.scrollHeight - body.clientHeight;
    const target = step === 0 ? 0 : Math.max(0, Math.min(max, top - Math.max(12, (body.clientHeight - (bottom - top)) / 2)));
    if (instant) {
      body.scrollTop = target;
      return;
    }
    return glideScroll(body, target, REPORT_GLIDE_MS);
  }, [bodyRef, step, instant]);
};

// The four points are tabs: click, Enter or Space picks one, and the phone
// scrolls to it. While at least 35% of the section is on screen they advance
// on their own every 3.6s, looping; hovering the list or focusing a tab holds
// them, and a pick holds them for 9s. No autoplay with reduced motion. The
// section scrolls past like any other: nothing pins.
const Report = () => {
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Bumped on every manual pick, so the hold restarts.
  const [pick, setPick] = useState(0);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const sectionRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  usePhoneScroll(bodyRef, step, reduced);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(e.intersectionRatio >= 0.35), { threshold: [0, 0.35, 1] });
    io.observe(section);
    return () => io.disconnect();
  }, []);

  const running = inView && !hovered && !focused && !reduced;
  const holding = pick > 0;
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => {
      setPick(0);
      setStep((s) => (s + 1) % REPORT_POINTS.length);
    }, holding ? MANUAL_PAUSE_MS : AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [running, step, pick, holding]);

  const choose = (i: number) => {
    setStep(i);
    setPick((n) => n + 1);
  };

  return (
    <section ref={sectionRef} aria-labelledby="report-title" className={`report-bg overflow-hidden ${sectionY}`}>
      <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-20">
        <div>
          <h2 id="report-title" className={`${h2} text-white`}>
            Know exactly what happened at your pool, every week.
          </h2>
          <p className={subDark}>
            Most pool services don’t send a report. Yours arrives before we leave the driveway, and anything that needs
            your attention, like low water or an equipment issue, is flagged right there.
          </p>
          {/* Phones and tablets: one bar per point, the active one filling
              over its interval (paused while autoplay is held). */}
          <div
            aria-hidden="true"
            className={`rp-bars${running ? '' : ' is-paused'}${reduced ? ' is-static' : ''}`}
          >
            {REPORT_POINTS.map(({ title }, i) => (
              <span
                key={`${title}-${i === step ? `${step}-${pick}` : 'x'}`}
                data-done={i < step ? '' : undefined}
                data-active={i === step ? '' : undefined}
                data-long={i === step && holding ? '' : undefined}
              />
            ))}
          </div>
          <div
            role="tablist"
            aria-label="What's in your report"
            className="mt-7 grid lg:mt-9"
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
            }}
          >
            {REPORT_POINTS.map(({ icon: Icon, title, body }, i) => (
              <button
                key={title}
                type="button"
                role="tab"
                aria-selected={i === step}
                onClick={() => choose(i)}
                className="rp-item flex gap-4 rounded-[12px] py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <span className="r-tile grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-white/[0.06] text-[#53a5d3]">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="min-w-0 pt-2">
                  <span className="block text-[16.5px] font-semibold tracking-[-0.02em] text-white">{title}</span>
                  <span className="rp-desc">
                    <span className="block">
                      <span className="block pt-1 text-[14.5px] leading-[1.6] text-white/[0.62]">{body}</span>
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="mx-auto w-full max-w-[440px]">
          <PhoneReport scrollRef={bodyRef} address="Your address, St. Petersburg, FL" />
        </div>
      </Container>
    </section>
  );
};

// ── 3. How it works ─────────────────────────────────────────────────────────

const STEPS = [
  {
    title: 'Send us your address',
    body: 'Tap “Get my free quote”, or text two photos: one of the pool, one of the equipment. Same-day reply, Monday to Saturday.',
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
      <div className="lg:self-center">
        <h2 id="how-title" className={`${h2} text-sc-navy`}>
          Getting started takes five minutes, tops.
        </h2>
        <p className={`${sub} max-w-[420px]`}>
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
            className="relative pb-11 pl-[68px] pt-1 last:pb-0 sm:pl-[84px]"
          >
            <span className="step-dot absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-full bg-white text-[16px] font-semibold text-sc-blue">
              {i + 1}
            </span>
            <h3 className="pt-2.5 text-[21px] font-semibold tracking-[-0.02em] text-sc-navy">{s.title}</h3>
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

// Three equal tiles on a light background; the Always Blue Guarantee is the
// featured one. The fine print sits at the foot of each tile, so the three
// line up.
const Guarantees = () => (
  <section aria-labelledby="guarantees-title" className={`bg-[#f7f9fc] ${sectionY}`}>
    <Container>
      <div className="text-center">
        <h2 id="guarantees-title" className={`${h2} text-sc-navy`}>
          Our promises, in writing.
        </h2>
        <p className={`${sub} mx-auto`}>
          Every term below is written into our{' '}
          <Link to="/service-agreement/" className={inlineLink}>
            Service Agreement
          </Link>
          .
        </p>
      </div>

      <ul className="mt-12 grid gap-3 min-[900px]:grid-cols-3">
        {GUARANTEES.map(({ icon: Icon, title, body, fine }, i) => (
          <li
            key={title}
            className={`flex flex-col rounded-[12px] px-[26px] pb-6 pt-7 ${
              i === 0
                ? 'border border-[#1f7fdb] bg-[rgba(31,127,219,0.045)] shadow-[0_0_0_1px_#1f7fdb,0_1px_2px_rgba(16,24,40,0.04)]'
                : 'border border-[rgba(36,58,85,0.1)] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]'
            }`}
          >
            <Icon aria-hidden="true" className="h-6 w-6 text-[#1f7fdb]" strokeWidth={1.75} />
            <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-[#243a55]">{title}</h3>
            <p className="mt-2 text-[15px] leading-[1.6] text-[rgba(36,58,85,0.74)]">{body}</p>
            <p className="mt-auto pt-5">
              <span className="block border-t border-[rgba(36,58,85,0.1)] pt-4 text-[13px] leading-[1.5] text-[rgba(36,58,85,0.56)]">
                {fine}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </Container>
  </section>
);

// ── 5. Service areas ────────────────────────────────────────────────────────

// From src/lib/cities.ts, the list the footer and menus use. Every area with
// its own page links to it: these are the city pages' strongest internal links
// once this page is the homepage. Linked and plain pills look the same at rest
// (a mix of styles read as inconsistent); the links show on hover. St.
// Petersburg, the home base, is the one navy pill and stays unlinked: this
// page is the St. Petersburg page.
const pill = 'inline-flex items-center gap-1.5 rounded-full py-2.5 pl-3.5 pr-4';
const Areas = () => {
  const { open } = useLandingQuoteSheet();
  return (
  <section id="service-areas" aria-labelledby="areas-title" className={`scroll-mt-16 bg-white ${sectionY}`}>
    <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
      <div>
        <h2 id="areas-title" className={`${h2} text-sc-navy`}>
          Pool service across Pinellas County.
        </h2>
        <p className={sub}>
          All of Pinellas, from St. Pete Beach to Palm Harbor, plus South Tampa and Davis Island. Our routes are
          concentrated here, which is how visits stay on schedule.
        </p>
        <p className="mt-6 text-[15px] text-sc-navy/70">
          Don’t see your neighborhood?{' '}
          <button type="button" onClick={open} className={inlineLink}>
            Ask us
          </button>{' '}
          and we’ll confirm.
        </p>
      </div>

      <ul className="flex flex-wrap content-center gap-2.5 self-center">
        {cities.map((c) => {
          if (c.slug === 'st-petersburg') {
            return (
              <li key={c.slug} className={`${pill} bg-sc-navy`}>
                <MapPin className="h-[15px] w-[15px] shrink-0 text-[#ffc226]" strokeWidth={2.25} />
                <span className="text-[14.5px] font-[550] text-white">{c.name}</span>
                <span className="text-[12.5px] text-white/60">{c.blurb}</span>
              </li>
            );
          }
          const inner = (
            <>
              <MapPin className="h-[15px] w-[15px] shrink-0 text-sc-sky" strokeWidth={2.25} />
              <span className="text-[14.5px] font-[550] text-sc-navy transition-colors group-hover:text-sc-blue">
                {c.name}
              </span>
            </>
          );
          return (
            <li key={c.slug} className="flex">
              {c.to ? (
                <Link
                  to={c.to}
                  className={`${pill} group bg-white ring-1 ring-sc-navy/10 transition hover:-translate-y-px hover:ring-sc-blue/40 hover:shadow-[0_6px_16px_-8px_rgba(38,118,182,0.45)]`}
                >
                  {inner}
                </Link>
              ) : (
                <span className={`${pill} bg-white ring-1 ring-sc-navy/10`}>{inner}</span>
              )}
            </li>
          );
        })}
      </ul>
    </Container>
  </section>
  );
};

// ── 6. FAQ ──────────────────────────────────────────────────────────────────

// Short, page-specific answers (the long versions live on /faq/). Exported:
// the page's FAQPage schema is built from these, so the schema always matches
// what's on screen. `link` turns one phrase of the answer into a link to the
// page that covers it; the schema keeps the plain text.
type FaqItem = { q: string; a: string; link?: { text: string; to: string } };
export const LANDING_FAQS: FaqItem[] = [
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
    link: { text: 'clean the salt cell and check salinity', to: '/services/saltwater-pool-service/' },
  },
  {
    q: 'How do I switch from my current pool company?',
    a: "Tell your old company you're done, and we pick up on your new weekly day once your price is set, so there's no gap where the pool slips. If it drifted during the handoff, we bring it back to clear and balanced.",
  },
  {
    q: 'My pool is green right now. Can you still help?',
    a: "Yes. Green pool recovery is quoted first, since the chemicals and labor vary so much from pool to pool, and starts once you approve it. When it's clear, you move onto weekly service so it stays that way.",
    link: { text: 'Green pool recovery is quoted first', to: '/services/green-pool-recovery/' },
  },
  {
    q: 'How soon can you start?',
    a: 'Usually within days. Our routes are concentrated around Pinellas and the beaches, so once your price is confirmed we can slot you onto a nearby route quickly.',
  },
];

const AnswerWithLink = ({ answer, link }: { answer: string; link: { text: string; to: string } }) => {
  const at = answer.indexOf(link.text);
  if (at < 0) return <>{answer}</>;
  return (
    <>
      {answer.slice(0, at)}
      <Link to={link.to} className={softLink}>
        {link.text}
      </Link>
      {answer.slice(at + link.text.length)}
    </>
  );
};

const Faq = () => (
  <section aria-labelledby="faq-title" className={`bg-[#f5f9fd] ${sectionY}`}>
    <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
      <div>
        <h2 id="faq-title" className={`${h2} text-sc-navy`}>
          Straight answers.
        </h2>
        <p className={sub}>
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

      <div className="divide-y divide-sc-navy/10 rounded-[12px] bg-white px-5 shadow-[0_0_0_1px_rgba(36,58,85,0.08)] sm:px-6">
        {LANDING_FAQS.map(({ q, a, link }) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[16.5px] font-semibold text-sc-navy [&::-webkit-details-marker]:hidden">
              <h3 className="tracking-[-0.02em]">{q}</h3>
              <ChevronDown className="h-5 w-5 shrink-0 text-sc-navy/45 transition-transform group-open:rotate-180" />
            </summary>
            <p className="-mt-1 pb-5 pr-10 text-[15.5px] leading-[1.6] text-sc-navy/[0.78]">
              {link ? <AnswerWithLink answer={a} link={link} /> : a}
            </p>
          </details>
        ))}
      </div>
    </Container>
  </section>
);

// ── 7. Closing CTA ─────────────────────────────────────────────────

const FinalCta = () => (
  <section aria-labelledby="cta-title" className={`bg-white ${sectionY}`}>
    <Container>
      <div className="cta-depth rounded-[12px] px-6 py-14 text-center sm:px-12 sm:py-[72px]">
        <h2 id="cta-title" className={`${h2} mx-auto max-w-2xl text-white`}>
          Ready for a pool you never have to think about?
        </h2>
        <p className={`${subDark} mx-auto max-w-xl`}>
          Get your flat monthly price today. Every standard chemical included, no contract, and a 2-week money-back
          guarantee.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <QuoteButton className="h-[52px] px-7 text-base" />
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

// The sections go inside the page's <main>; the site-wide Footer goes after it.
export const LandingBelowFold = () => (
  <>
    <ServicesSection />
    <Reviews />
    <Report />
    <HowItWorks />
    <Guarantees />
    <Areas />
    <Faq />
    <FinalCta />
  </>
);
