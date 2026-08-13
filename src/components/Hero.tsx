import React, { useEffect, useRef, useState } from 'react';
import { m } from 'motion/react';
import { Phone, Star, MapPin } from 'lucide-react';
import { Glass } from '@/components/Glass';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { Container } from '@/components/Container';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { ServiceReport } from '@/components/ServiceReport';

const formatClock = (d: Date) =>
  d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, '');

// SSR-safe: initial value is an empty string so the server-rendered HTML
// matches the first client render. The real time is set on mount and ticked
// every 10s (we only show H:MM, so a 10s tick is enough).
const useLiveClock = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    setTime(formatClock(new Date()));
    const id = window.setInterval(() => setTime(formatClock(new Date())), 10000);
    return () => window.clearInterval(id);
  }, []);
  return time;
};

export const Hero = () => {
  const clock = useLiveClock();
  const { open: openQuoteSheet } = useQuoteSheet();
  // Tracks whether the Gmail report body has been scrolled at all — when true,
  // the top icon bar picks up Gmail's gray fill the way it does in the real app.
  const [gmailScrolled, setGmailScrolled] = useState(false);

  // "Get a Free Quote" opens the chooser — bottom sheet on mobile,
  // centered modal on desktop.
  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };

  return (
    <div className="relative min-h-dvh lg:min-h-[760px] flex items-center justify-center overflow-hidden pt-20 pb-20">
      {/* Immersive Background Elements */}
      <div className="absolute inset-0 z-0">
        {/* Near-black base with a hint of cool undertone */}
        <div className="absolute inset-0 bg-[#02060c]" />

        {/* Pool background — desktop (landscape crop) */}
        <div
          className="hero-bg-desktop absolute -inset-y-[18%] inset-x-0 hidden md:block bg-cover bg-center"
          aria-hidden
        />

        {/* Pool background — mobile. Locked to one screen height and anchored at
            the top, so it never stretches to the full (taller) section content
            height. Uses h-dvh (the *dynamic* viewport unit), NOT h-screen/100vh:
            the section is min-h-dvh, so matching units keeps the photo tracking
            the text as iOS shows/hides the URL bar. A fixed 100vh background here
            stayed put while the dvh-sized content reflowed on scroll, which read
            as an unintended parallax (CLAUDE.md non-negotiable #16). */}
        <div
          className="hero-bg-mobile absolute top-0 inset-x-0 h-dvh md:hidden bg-cover bg-center"
          aria-hidden
        />

        {/* Blue tint pass — 'overlay' blend deepens the blue in the sky, clouds,
            and water without darkening the warm house lights. Hidden on mobile.
            Class instead of inline style: the browser re-serializes inline color
            values (#1669AE → rgb(...)), which mismatches the SSR HTML. */}
        <div
          className="hero-blue-tint absolute inset-0 pointer-events-none"
          aria-hidden
        />

        {/* Readability + framing scrim — ONE element (see .hero-scrim in
            index.css) that replaces the former four divs: vertical darken,
            mobile text scrim, desktop left scrim, and edge vignette. It layers
            those gradients in a single background and swaps mobile↔desktop at
            md. Same look, fewer DOM nodes / paint layers. */}
        <div className="hero-scrim absolute inset-0 pointer-events-none" aria-hidden />

        {/* Spotlight glow behind the phone (right side) — pulls the eye to it */}
        <div className="hidden md:block absolute top-[18%] right-[5%] w-[40vw] h-[60vh] bg-brand-blue/12 rounded-full blur-[120px] animate-float" />

        {/* Subtle deep-blue ambient on the left for balance */}
        <div className="hidden md:block absolute top-[10%] left-[-10%] w-[40vw] h-[50vw] bg-[#0a2540]/30 rounded-full blur-[120px] animate-morph" />

        {/* Bottom blend — pinned to the section's bottom edge, fades the photo
            up into #07111c so the seam into the next section (also #07111c) is
            invisible. A fixed-height band at the edge (like the Treasure hero),
            NOT a % stop in the full-height scrim — that lands in the wrong spot
            since the hero height varies. */}
        <div className="absolute inset-x-0 bottom-0 h-44 md:h-72 bg-gradient-to-t from-[#07111c] from-20% via-[#07111c]/70 to-transparent pointer-events-none" />
      </div>

      <Container className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content - Left Side. Slide-in entrance (desktop only — the
              global MotionConfig in App.tsx sets reducedMotion on mobile, so
              this renders static there). */}
          <m.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="lg:col-span-6 pt-10 lg:pt-0"
          >
            {/* Below lg the phone-mockup column doesn't exist (it renders in
                its own section under the hero), so a left-aligned stack leaves
                a dead right half at tablet widths. Center the whole
                composition below lg; lg+ restores the original two-column
                left-aligned layout. */}
            <div className="text-center lg:text-left max-w-[34rem] lg:max-w-none mx-auto lg:mx-0">
              {/* glass-mobile-blur: on phones (no backdrop blur) the pill gets
                  the solid grey surface so it reads over the bright sky —
                  same mobile-glass treatment as the hero call button. (This
                  chip was invisible on mobile until the glow-orb kill selector
                  above stopped matching backdrop-blur classes.) */}
              <Glass className="glass-mobile-blur inline-flex items-center px-4 py-2 rounded-full mb-8">
                {/* 11px below sm: "Palm Harbor" made the list wrap at ≤375px
                    at the 12px size. */}
                <span className="whitespace-nowrap text-[11px] sm:text-xs font-semibold text-cyan-50 tracking-wider uppercase">St. Pete · Largo · Clearwater · Palm Harbor</span>
              </Glass>

              {/* Visual headline (price differentiator) — a div, not h1, so the SEO H1 below carries the keyword weight */}
              <div className="font-display font-bold text-white tracking-tight mb-4 md:mb-7 text-3xl sm:text-4xl md:text-[2.7rem] leading-[1.15]">
                {/* Mobile: both lines at font-bold (700) — matched weights, and
                    700 is the preloaded weight (the 900 preload is md:-gated;
                    font-black on mobile was painting an unpreloaded font).
                    Desktop keeps the original black/normal contrast pair. */}
                {/* lg:text-[3.9rem] fixes a wrap: from lg the text column is a
                    6-of-12 grid cell — 456px at 1024px wide, 494px at 1100 —
                    but this line needs 506px at 4.5rem, so it broke onto two
                    lines ("One Flat" / "Rate") across the whole 1024–1199 band.
                    3.9rem renders ~439px and clears it.
                    Scoped as lg:max-[1199px] — a BOUNDED band — rather than a
                    plain lg: plus a min-[1200px]: override. Tailwind emits the
                    arbitrary min-width variant BEFORE lg:, so lg: won at every
                    width above 1024 and the headline stayed small on desktop
                    (measured: still 62.4px at 1440px). Bounding the override
                    means md:text-[4.5rem] simply resumes at 1200, where the
                    column finally reaches 520px. */}
                <span className="text-shadow-hero-headline block text-white md:text-brand-orange font-bold md:font-black text-5xl sm:text-6xl md:text-[4.5rem] lg:max-[1199px]:text-[3.9rem] leading-[0.95] tracking-tight">
                  One Flat Rate
                </span>
                {/* Every size here is MEASURED so this line's rendered width
                    matches "One Flat Rate" above at that breakpoint — the two
                    lines start and end together.
                    The strings scale linearly, so the ratio is fixed: the
                    headline renders 7.0347px of width per px of font-size
                    (900 weight), this line 12.725px per px (400 weight). So
                    sub = top x 0.5528:
                      48px  top ->  1.54rem   (mobile, 700/700, both ~326px)
                      72px  top ->  2.4877rem (~506px)
                      62.4px top -> 2.1563rem (~439px, the lg column)
                    Re-measure with a Range if either string or weight changes —
                    eyeballing this never lands. */}
                <span className="text-shadow-hero-sub block mt-2 md:mt-5 sm:whitespace-nowrap text-white font-bold md:font-normal tracking-tight text-[1.54rem] sm:text-[1.92rem] md:text-[2.4877rem] lg:max-[1199px]:text-[2.1563rem] leading-[1.1]">
                  No Monthly Chemical Cost
                </span>
              </div>

              {/* Semantic H1 carries the primary local-SEO keyword: "Pool Cleaning St. Petersburg" */}
              <h1 className="text-shadow-hero-h1 font-display font-normal text-white text-xl md:text-[1.25rem] leading-snug mb-3 md:mb-7 sm:whitespace-nowrap tracking-tight">
                St. Petersburg's expert pool cleaning company.
              </h1>

              {/* Mobile shows NO body paragraph — the display headline + the H1
                  keyword line carry the message, keeping the hero airy over the
                  photo. (The old mobile benefit line repeated both; its keywords
                  remain in the title/description and visible sections below.)
                  The full value prop shows md+ only. */}
              <p className="text-shadow-hero-body hidden md:block text-[15px] text-gray-100 font-normal max-w-[27rem] mx-auto lg:mx-0 leading-[1.6] mb-8 sm:mb-9">
                <span className="text-white">Weekly pool cleaning, full chemical balancing, GPS-verified visits</span>, and a written report after every clean. <span className="text-white">One flat monthly price</span> — no chemical surprises, no contracts, no green water.
              </p>

              <div className="relative">
                {/* Mobile-only soft scrim behind just the CTAs so they read
                    cleanly over the bright pool photo. It fades to transparent on
                    every side (radial gradient in .hero-cta-scrim) so the rest of
                    the hero stays bright. CSS class, not inline style, to keep SSR
                    hydration stable (CLAUDE.md #4). */}
                {/* Mobile shows the QUOTE button only (restored after the
                    tab-bar-only experiment); the phone action lives in the
                    header's Call or Text pill, so the Glass call button below
                    is sm+ only. */}
                <div
                  className="hero-cta-scrim md:hidden absolute -inset-x-8 -top-6 -bottom-8 pointer-events-none"
                  aria-hidden
                />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-center lg:justify-start gap-3 sm:gap-4">
                  <a
                    href="#quote"
                    onClick={handleQuoteClick}
                    className="btn btn-blue w-full sm:w-auto"
                  >
                    Get My Free Quote
                  </a>

                  {/* Call button — matches the city pages' (St. Pete Beach, etc.)
                      Glass call button: frosted glass on desktop, solid grey
                      surface on mobile via .glass-mobile-blur (backdrop-blur is
                      globally disabled below 768px, CLAUDE.md #10). Kept full-width
                      on mobile so it aligns under the quote CTA, inline on desktop. */}
                  <Glass
                    href={PHONE_HREF}
                    className="glass-mobile-blur hidden sm:inline-flex items-center justify-center gap-2 px-6 py-3 text-white/90 hover:text-white rounded-lg font-semibold text-[15px] w-full sm:w-auto"
                  >
                    <Phone className="w-4 h-4 text-brand-blue-light" />
                    {PHONE_DISPLAY}
                  </Glass>
                </div>
              </div>

              {/* Trust strip — ONE line at every width (nowrap + smaller
                  type/stars/gaps below sm), CENTRED as a single cluster below lg
                  to match the rest of the centred hero, then a left cluster at
                  lg where the copy goes left-aligned.
                  It used to be justify-between on mobile, which pinned the stars
                  to the left edge and "Locally Owned" to the right — and that
                  masked a real overflow: the two groups measure 344px together
                  but the container is 288px at 320px wide and 328px at 360px, so
                  the content was wider than its box and simply bled past the
                  padding. Centring alone would have clipped BOTH ends, so the
                  " in St. Pete" tail is dropped below 390px (see span), which
                  brings the cluster to ~282px and lets it genuinely fit. */}
              <div className="text-shadow-hero-strip mt-7 flex flex-nowrap items-center justify-center lg:justify-start gap-x-3 sm:gap-x-6 text-[12px] sm:text-[13px] text-gray-200">
                <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                  <div className="flex gap-0.5 text-brand-orange">
                    {[0,1,2,3,4].map(i => (
                      <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                    ))}
                  </div>
                  <span className="font-semibold text-white">5.0</span>
                  <span className="text-gray-300">on Google</span>
                </div>

                <span className="hidden sm:inline text-gray-500">•</span>

                <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-blue-light shrink-0" />
                  {/* The tail is hidden, not removed — it stays in the DOM
                      (and crawlable) at every width; only the narrowest phones
                      drop it visually so the one-line cluster fits. */}
                  <span>
                    Locally Owned<span className="hidden min-[390px]:inline"> in St. Pete</span>
                  </span>
                </div>
              </div>
            </div>
          </m.div>

          {/* Visual Content - Right Side (Phone Mockup) — DESKTOP ONLY in the
              hero. On mobile it renders in its own section below the hero (see
              <HomeHeroPhone> usage in the page), so the hero is a clean 100vh of
              headline + CTAs and the phone never sits above the fold.
              NOT animated (plain div, matching the Treasure Island hero): the
              phone is a heavy subtree (full Gmail/ServiceReport mockup), and
              sliding it up on load made the homepage load-in janky vs. Treasure,
              whose phone just appears. Only the text column animates. */}
          <div className="hidden lg:flex lg:col-span-6 relative justify-center items-center" data-nosnippet="">
            <HomeHeroPhone clock={clock} gmailScrolled={gmailScrolled} setGmailScrolled={setGmailScrolled} />
          </div>
        </div>
      </Container>
    </div>
  );
};

/**
 * The iPhone + Gmail service-report mockup from the homepage hero. Extracted so
 * it can render in two places: inside the hero's right column on desktop, and in
 * a standalone section below the hero on mobile (HomeHeroPhoneSection) — keeping
 * the heavy mockup out of the above-the-fold 100vh on phones. The Gmail
 * scroll-tint state lives in the parent (Hero) and is threaded through as props,
 * since the desktop instance shares Hero's clock tick.
 */
type HomeHeroPhoneProps = {
  clock: string;
  gmailScrolled: boolean;
  setGmailScrolled: React.Dispatch<React.SetStateAction<boolean>>;
  // When false, the Gmail body is NOT an independent scroll region. The mobile
  // instance (HomeHeroPhoneSection) passes false: an inner overflow-y-auto whose
  // content is taller than the phone traps the touch scroll, so dragging over
  // the phone scrolls that box first and the page "hesitates" until it bottoms
  // out. Desktop keeps it scrollable so the report can be read in place.
  interactive?: boolean;
  /** Ref to the phone's inner scrollable area. The mobile section drives it
      from the side scroll wheel: overflow-hidden boxes still accept
      programmatic scrollTop, so the report scrolls with NO touch trap. */
  scrollBodyRef?: React.RefObject<HTMLDivElement | null>;
};

const HomeHeroPhone = ({ clock, gmailScrolled, setGmailScrolled, interactive = true, scrollBodyRef }: HomeHeroPhoneProps) => {
  return (
    <>
            {/* Handwritten label + arrow — animates as if being written/drawn in. */}
            {/* MEASURED placement, expressed entirely in classes.
                It previously mixed Tailwind translates with an inline
                `transform`, and in Tailwind v4 those are INDEPENDENT CSS
                properties (`translate:` / `rotate:`, not the `transform`
                shorthand) — so they composed instead of the inline winning, and
                the real offset was translate-x-4/-12 PLUS the inline -20px. That
                netted the handwriting 16px INSIDE the phone at 1280px+ and 45px
                inside at 1024px. One source of truth now; x values are measured
                to leave ~24px of air beside the phone.
                Shown from 1200px, not lg: the text needs its width + a gap
                (~169px at this size) and the space right of the phone is only
                125px at 1024, 144 at 1100, 157 at 1152 — it does not fit until
                1200 (181px). Below that the hero is already tight, and this is
                decorative (aria-hidden, data-nosnippet), so it simply sits out
                rather than colliding. */}
            <div
              className="hidden min-[1200px]:flex absolute right-0 top-1/2 -translate-y-[calc(50%+40px)] translate-x-[33px] xl:translate-x-[68px] rotate-[-6deg] flex-col items-start z-20 pointer-events-none"
            >
              <span
                className="text-brand-orange text-[1.7rem] xl:text-[2.15rem] leading-tight max-w-[180px]"
                style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}
              >
                <span className="block">A pool service</span>
                <span className="block">report before</span>
                <span className="block">we leave your</span>
                <span className="block">driveway</span>
              </span>

              {/* Hand-drawn swooping arrow — strokes draw themselves after the text. */}
              <svg
                width="180"
                height="60"
                viewBox="0 0 180 60"
                fill="none"
                className="text-brand-orange mt-1"
                style={{ transform: 'scale(0.7)', transformOrigin: 'center center', marginLeft: '-5rem' }}
              >
                <path
                  d="M22 38
                     C 30 40, 55 46, 75 52
                     S 112 42, 130 36
                     S 170 8, 170 8"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M37 25 L 22 38 L 31 51"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            <div className="relative z-10 w-[300px] scale-90 origin-center">
              {/* Side buttons */}
              <div className="absolute left-[-3px] top-[110px] w-[3px] h-8 bg-[#1a1a1a] rounded-l-sm z-0" />
              <div className="absolute left-[-3px] top-[160px] w-[3px] h-14 bg-[#1a1a1a] rounded-l-sm z-0" />
              <div className="absolute left-[-3px] top-[225px] w-[3px] h-14 bg-[#1a1a1a] rounded-l-sm z-0" />
              <div className="absolute right-[-3px] top-[180px] w-[3px] h-20 bg-[#1a1a1a] rounded-r-sm z-0" />

              {/* Phone Frame - titanium-style bezel */}
              <div className="relative rounded-[3rem] p-[3px] bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#2a2a2a] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]">
                <div className="relative rounded-[2.85rem] bg-black overflow-hidden h-[648px]">
                  {/* Inner screen */}
                  <div className="absolute inset-[10px] rounded-[2.55rem] bg-[#f2f2f0] overflow-hidden">
                    {/* Dynamic Island sits above the report content */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-[84px] h-[28px] bg-black z-30"
                      style={{ top: '11px', borderRadius: '14px' }}
                    />

                    {/* Status bar overlay — bg tracks the Gmail top bar so the
                        seam between iOS chrome and Gmail chrome stays unified. */}
                    <div
                      className={`absolute top-0 inset-x-0 h-12 px-5 flex justify-between items-center z-20 pointer-events-none transition-colors duration-150 ${
                        gmailScrolled ? 'bg-[#f1f3f4]' : 'bg-white'
                      }`}
                    >
                      {/* Left slot — width matches the right-icon cluster so the
                          clock centers in the gap between screen edge and Island */}
                      <div className="flex justify-center" style={{ width: '60px' }}>
                        <span className="text-black text-[13px] font-semibold tracking-tight tabular-nums" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>{clock}</span>
                      </div>
                      <div className="flex items-center gap-[5px] text-black">
                        {/* Cell signal — 4 chunky bars at full strength */}
                        <svg width="15" height="10" viewBox="0 0 17 12" fill="currentColor">
                          <rect x="0" y="8" width="3" height="4" rx="0.8" />
                          <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.8" />
                          <rect x="9" y="3" width="3" height="9" rx="0.8" />
                          <rect x="13.5" y="0" width="3" height="12" rx="0.8" />
                        </svg>
                        <svg width="13" height="9" viewBox="0 0 15 11" fill="currentColor">
                          <path d="M7.5 0C4.7 0 2.1 1 0 2.8l1.4 1.7C3.1 3 5.2 2.2 7.5 2.2s4.4.8 6.1 2.3L15 2.8C12.9 1 10.3 0 7.5 0zm0 4.5c-1.9 0-3.6.7-4.9 1.9l1.4 1.7c.9-.9 2.2-1.4 3.5-1.4 1.4 0 2.6.5 3.5 1.4l1.4-1.7C11.1 5.2 9.4 4.5 7.5 4.5zm0 4.5c-.9 0-1.7.3-2.4.9L7.5 12l2.4-2.1c-.7-.6-1.5-.9-2.4-.9z" />
                        </svg>
                        {/* Battery — iOS status-bar style at normal charge:
                            solid black pill, white percentage number. The
                            "outline + percentage-width fill" treatment is only
                            shown in Low Power Mode; normal charge is just black. */}
                        <div className="flex items-center">
                          <div className="relative w-[22px] h-[10px] rounded-[3px] bg-black flex items-center justify-center">
                            {/* font-semibold (Inter 600, already preloaded), not
                                font-bold (Inter 700): at 7px it's visually
                                identical, and using 600 keeps this near-fold
                                phone mockup from pulling the 48 KiB inter-700.woff2
                                into the homepage's critical request chain. */}
                            <span className="text-white text-[7px] font-semibold leading-none tabular-nums tracking-tight">
                              78
                            </span>
                          </div>
                          <div className="w-[1px] h-[3.5px] bg-black rounded-r-sm ml-[0.5px]" />
                        </div>
                      </div>
                    </div>

                    {/* Gmail chrome — wraps the real report so it reads as
                        the actual email a homeowner receives, not a marketing
                        card. Top bar + sender row sit above the report; the
                        Reply/Forward action bar sits below. */}
                    <div
                      className="absolute inset-0 pt-[44px] pb-[48px] bg-white flex flex-col"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    >
                      {/* Gmail top action bar — white when unscrolled, gray once
                          the email body has scrolled even slightly (real Gmail).
                          A hairline divider also appears on scroll. */}
                      <div
                        className={`shrink-0 px-3 pt-2 pb-1.5 flex items-center justify-between transition-colors duration-150 border-b ${
                          gmailScrolled ? 'bg-[#f1f3f4] border-black/20' : 'bg-white border-transparent'
                        }`}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                        <div className="flex items-center gap-3.5 text-[#5f6368]">
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="4" rx="0.5" />
                            <path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8" />
                            <line x1="10" y1="13" x2="14" y2="13" />
                          </svg>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                          <div className="relative">
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="5" width="18" height="14" rx="2" />
                              <path d="M3 7l9 6 9-6" />
                            </svg>
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#1a73e8]" />
                          </div>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="5" cy="12" r="1.6" />
                            <circle cx="12" cy="12" r="1.6" />
                            <circle cx="19" cy="12" r="1.6" />
                          </svg>
                        </div>
                      </div>

                      {/* Scrollable area — subject, sender, and the report all
                          scroll together. Only the top icon bar stays pinned. */}
                      <div
                        ref={scrollBodyRef}
                        className={`flex-1 min-h-0 bg-white ${interactive ? 'overflow-y-auto' : 'overflow-hidden'}`}
                        style={{ scrollbarWidth: 'none' }}
                        // Attached in BOTH modes: programmatic scrollTop (the
                        // mobile side wheel) fires scroll events too, so the
                        // Gmail header tint reacts the same as real scrolling.
                        onScroll={(e) => {
                          const scrolled = (e.currentTarget.scrollTop || 0) > 4;
                          setGmailScrolled((prev) => (prev === scrolled ? prev : scrolled));
                        }}
                      >
                        {/* Subject line + Inbox label + star */}
                        <div className="px-3 pt-1.5 pb-2 flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-normal text-[#202124] leading-[1.25] tracking-tight">
                              Pool Service Report — Thursday, May 14, 2026
                            </p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f9ab00">
                                <path d="M3 5h12l5 7-5 7H3z" />
                              </svg>
                              <span className="text-[10px] text-[#3c4043] bg-[#f1f3f4] px-1.5 py-0.5 rounded font-semibold">
                                Inbox
                              </span>
                            </div>
                          </div>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </div>

                        {/* Sender row */}
                        <div className="px-3 py-2.5 flex items-center gap-2.5">
                          <img
                            src="/circle-icon.svg"
                            alt=""
                            width={28}
                            height={28}
                            loading="lazy"
                            decoding="async"
                            className="w-[28px] h-[28px] rounded-full shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-[#202124] leading-tight truncate uppercase tracking-wide">
                              SUNCOAST POOL PROS
                            </p>
                            <p className="text-[10px] text-[#5f6368] leading-tight mt-0.5">May 14</p>
                            <p className="text-[10px] text-[#5f6368] leading-tight mt-0.5 flex items-center gap-0.5">
                              to me
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7 10l5 5 5-5z" />
                              </svg>
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0 text-[#5f6368]">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="9" />
                              <circle cx="9" cy="10" r="0.6" fill="currentColor" />
                              <circle cx="15" cy="10" r="0.6" fill="currentColor" />
                              <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" strokeLinecap="round" />
                            </svg>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 17 3 11 9 5" />
                              <path d="M3 11h11a6 6 0 016 6v2" />
                            </svg>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="1.4" />
                              <circle cx="12" cy="12" r="1.4" />
                              <circle cx="12" cy="19" r="1.4" />
                            </svg>
                          </div>
                        </div>

                        {/* Fallback matches .sr-root's #fafafa so there's no
                            flash while the chunk streams in. The homepage shows
                            the waterfront pool photo in the report (city pages
                            keep the ServiceReport DEFAULT_PHOTO). */}
                        <ServiceReport
                          inline
                          photo={{
                            base: '/treasure-island-hero',
                            // Points at the SAME re-encoded file the mobile hero
                            // paints, so this stays a cache hit instead of a
                            // second full-size download.
                            mobileWebp: '/treasure-island-hero-mobile-v2.webp',
                            alt: 'Waterfront infinity pool with palm trees in St. Petersburg, FL — cleaned and chemically balanced by Suncoast Pool Pros',
                          }}
                        />
                      </div>
                    </div>

                    {/* Gmail reply/forward bar — pinned to the bottom of the screen */}
                    <div
                      className="absolute bottom-[6px] left-0 right-0 px-3 z-30 flex items-center gap-2"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    >
                      <div className="flex-1 rounded-full bg-white border border-[#dadce0] py-1.5 px-3 flex items-center justify-center gap-1.5 text-[#3c4043] text-[11px] font-semibold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 17 3 11 9 5" />
                          <path d="M3 11h11a6 6 0 016 6v2" />
                        </svg>
                        Reply
                      </div>
                      <div className="flex-1 rounded-full bg-white border border-[#dadce0] py-1.5 px-3 flex items-center justify-center gap-1.5 text-[#3c4043] text-[11px] font-semibold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 17 21 11 15 5" />
                          <path d="M21 11H10a6 6 0 00-6 6v2" />
                        </svg>
                        Forward
                      </div>
                      <div className="w-[28px] h-[28px] rounded-full bg-white border border-[#dadce0] flex items-center justify-center text-[#5f6368]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="9" />
                          <circle cx="9" cy="10" r="0.6" fill="currentColor" />
                          <circle cx="15" cy="10" r="0.6" fill="currentColor" />
                          <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>

                  </div>

                  {/* Glossy screen reflection */}
                  <div className="absolute inset-[10px] rounded-[2.55rem] pointer-events-none bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
                </div>
              </div>

              {/* Soft ambient glow behind phone — orange bottom unifies with hero accent.
                  Inset kept tight on the bottom so the bloom doesn't bleed into the hero's fade zone. */}
              <div className="absolute -top-6 -left-6 -right-6 bottom-12 bg-gradient-to-br from-brand-blue/15 via-brand-blue-dark/10 to-brand-blue/15 blur-3xl -z-10 rounded-[3rem]" />
            </div>
    </>
  );
};

/**
 * Mobile-only section that renders the homepage phone mockup below the hero, so
 * the heavy mockup stays out of the above-the-fold 100vh on phones. Owns its own
 * clock + Gmail-scroll state (independent of the desktop hero instance). Hidden
 * on lg+, where the phone lives inside the hero instead.
 */
export const HomeHeroPhoneSection = () => {
  const clock = useLiveClock();
  const [gmailScrolled, setGmailScrolled] = useState(false);
  // Side scroll wheel: drags on the track drive the phone's inner report
  // scroll (programmatic scrollTop works on the overflow-hidden body, so the
  // phone itself never captures touch — no page-scroll trap). Direct DOM
  // writes from pointer events; no React state per drag frame.
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    const body = bodyRef.current;
    if (!track || !thumb || !body) return;
    const THUMB_H = 64;
    // Thumb position is driven by the body's real scroll state (scroll event
    // below), and via `top` — NOT an inline transform: the mobile
    // .force-static-motion rule neutralizes inline transforms inside page
    // content ([style*="transform"] { transform:none !important }), which
    // silently pinned the thumb in place on phones.
    const positionThumb = () => {
      const max = body.scrollHeight - body.clientHeight;
      const p = max > 0 ? body.scrollTop / max : 0;
      thumb.style.top = `${p * (track.clientHeight - THUMB_H)}px`;
    };
    const setProgress = (p: number) => {
      const clamped = Math.max(0, Math.min(1, p));
      body.scrollTop = clamped * (body.scrollHeight - body.clientHeight);
    };
    body.addEventListener('scroll', positionThumb, { passive: true });
    positionThumb();
    let dragging = false;
    const progressFrom = (e: PointerEvent) => {
      const r = track.getBoundingClientRect();
      return (e.clientY - r.top - THUMB_H / 2) / (r.height - THUMB_H);
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      track.setPointerCapture(e.pointerId);
      setProgress(progressFrom(e));
    };
    const move = (e: PointerEvent) => {
      if (dragging) setProgress(progressFrom(e));
    };
    const up = () => {
      dragging = false;
    };
    track.addEventListener('pointerdown', down);
    track.addEventListener('pointermove', move);
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);
    return () => {
      body.removeEventListener('scroll', positionThumb);
      track.removeEventListener('pointerdown', down);
      track.removeEventListener('pointermove', move);
      track.removeEventListener('pointerup', up);
      track.removeEventListener('pointercancel', up);
    };
  }, []);
  return (
    <section className="lg:hidden relative bg-[#07111c] pt-12 pb-12 overflow-hidden">
      {/* Real heading + one crawlable sentence, deliberately OUTSIDE the
          data-nosnippet wrapper below. This section proves the biggest
          differentiator on the site and had no heading at all — and because
          Google indexes mobile-first, a heading in this (lg:hidden) section is
          one it actually reads. The mockup itself stays nosnippet so Google
          can't lift "Reply / Forward / Free Chlorine 3.5 ppm" out of the fake
          email and use it as the search snippet. */}
      <Container className="mb-8">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="section-heading text-white leading-[1.15] mb-3">
            See your weekly pool service report.
          </h2>
          <p className="section-subtext">
            Chemistry readings, what we added, photos of your pool, and a
            GPS-verified visit &mdash;{' '}
            <span className="text-white">emailed before we leave your driveway</span>.
          </p>
        </div>
      </Container>

      <div className="flex flex-col items-center" data-nosnippet="">
        {/* Handwritten annotation, mobile variant of the desktop one beside
            the phone — here it sits ABOVE the phone with a hand-drawn arrow
            pointing down at it. Caveat 700 is homepage-preloaded (this
            section renders only on the homepage). */}
        <div className="pointer-events-none -rotate-6 mb-2 flex flex-col items-center" aria-hidden="true">
          <span
            className="text-brand-orange text-[1.9rem] leading-tight text-center"
            style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}
          >
            <span className="block">A pool service report</span>
            <span className="block">before we leave your driveway</span>
          </span>
          <svg
            width="60"
            height="54"
            viewBox="0 0 60 54"
            fill="none"
            className="text-brand-orange mt-1 translate-x-10 rotate-6"
          >
            <path
              d="M30 4 C 44 14, 16 26, 28 44"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M18 36 L 28 46 L 38 35"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        {/* The phone is centered on its own. The scroll wheel is ABSOLUTE, so it
            no longer participates in the centering: as a flex sibling it added
            its 28px width + 10px gap to the centered group, which pushed the
            phone ~19px left of true center. */}
        <div className="relative flex justify-center items-center">
          {/* interactive={false}: the phone's inner Gmail body must NOT be a
              touch scroll region (that traps the page scroll). The side wheel
              below is the ONLY way the report scrolls on mobile — via
              programmatic scrollTop through bodyRef. */}
          <div className="relative">
            <HomeHeroPhone
              clock={clock}
              gmailScrolled={gmailScrolled}
              setGmailScrolled={setGmailScrolled}
              interactive={false}
              scrollBodyRef={bodyRef}
            />
            {/* Scroll wheel: 28px-wide touch track (visual 4px line + thumb),
                sitting just outside the phone's RIGHT edge. Absolute, so it
                stays out of the centring math — as a flex sibling it pushed the
                phone ~19px off centre. touch-action:none so dragging it never
                scrolls the page. */}
            <div
              ref={trackRef}
              aria-hidden="true"
              className="absolute left-full top-1/2 -translate-y-1/2 h-[400px] w-7 flex justify-center"
              style={{ touchAction: 'none' }}
            >
              <div className="absolute inset-y-0 w-1 rounded-full bg-white/10" />
              <div
                ref={thumbRef}
                className="absolute top-0 w-1.5 h-16 rounded-full bg-white/50"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
