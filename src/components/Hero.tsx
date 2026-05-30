import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { m, useScroll, useTransform } from 'motion/react';
import { Phone, Star, MapPin } from 'lucide-react';
import { Glass } from '@/components/Glass';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { Container } from '@/components/Container';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';

// Lazy-load the service-report content (the email body inside the phone mockup).
// It's visually decorative — pure trust signal — and adds ~24KB of JSX + a
// large inline <style>. Keeping it out of the initial Hero bundle means the
// headline + CTAs become interactive sooner (better LCP / TTI / Lighthouse).
const ServiceReport = lazy(() =>
  import('@/components/ServiceReport').then((m) => ({ default: m.ServiceReport }))
);

const formatClock = (d: Date) =>
  d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, '');

const useLiveClock = () => {
  const [time, setTime] = useState(() => formatClock(new Date()));
  useEffect(() => {
    // Only H:MM is shown, so a 10s tick is enough to catch minute rollovers
    // without forcing a repaint every second on the (large) phone layer.
    const id = window.setInterval(() => setTime(formatClock(new Date())), 10000);
    return () => window.clearInterval(id);
  }, []);
  return time;
};

export const Hero = () => {
  const clock = useLiveClock();
  const { open: openQuoteSheet } = useQuoteSheet();
  const sectionRef = useRef<HTMLDivElement>(null);
  // Tracks whether the Gmail report body has been scrolled at all — when true,
  // the top icon bar picks up Gmail's gray fill the way it does in the real app.
  const [gmailScrolled, setGmailScrolled] = useState(false);

  // "Get a Free Quote" opens the chooser — bottom sheet on mobile,
  // centered modal on desktop.
  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openQuoteSheet();
  };
  // Parallax: as the hero scrolls out of view, drift the bg image up a bit slower
  // than the content for a subtle depth effect.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);

  return (
    <div ref={sectionRef} className="relative min-h-[calc(100vh-2rem)] lg:min-h-[760px] flex items-center justify-center overflow-hidden pt-20 pb-20">
      {/* Immersive Background Elements */}
      <div className="absolute inset-0 z-0">
        {/* Near-black base with a hint of cool undertone */}
        <div className="absolute inset-0 bg-[#02060c]" />

        {/* Pool background — desktop (landscape crop) */}
        <m.div
          className="absolute -inset-y-[18%] inset-x-0 hidden md:block bg-cover bg-center will-change-transform"
          style={{
            backgroundImage:
              "image-set(url('/pool-service-st-petersburg-hero.webp') type('image/webp') 1x, url('/pool-service-st-petersburg-hero-1920.webp') type('image/webp') 2x, url('/pool-service-st-petersburg-hero.jpg') type('image/jpeg') 1x)",
            filter: 'saturate(1.45) brightness(0.85) contrast(1.12) hue-rotate(-6deg)',
            y: bgY,
          }}
          aria-hidden
        />

        {/* Pool background — mobile. Locked to one screen height (100vh) and
            anchored at the top, so it never stretches to the full (taller) section
            content height. */}
        <div
          className="absolute top-0 inset-x-0 h-screen md:hidden bg-cover bg-center"
          style={{
            backgroundImage:
              "image-set(url('/pool-service-st-petersburg-hero-mobile.webp') type('image/webp'), url('/pool-service-st-petersburg-hero-mobile.jpg') type('image/jpeg'))",
            filter: 'saturate(1.45) brightness(0.85) contrast(1.12) hue-rotate(-6deg)',
            // Fade the bottom of the image into transparency so it dissolves into
            // the dark section instead of a hard horizontal cut.
            WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 92%)',
            maskImage: 'linear-gradient(to bottom, black 55%, transparent 92%)',
          }}
          aria-hidden
        />

        {/* Blue tint pass — 'overlay' blend deepens the blue in the sky, clouds,
            and water without darkening the warm house lights. Hidden on mobile. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: '#1669AE', mixBlendMode: 'overlay', opacity: 0.4 }}
          aria-hidden
        />

        {/* Gradient overlay — stronger mid-section darkening on mobile so the
            stacked body copy stays readable over the bright water/sky area.
            Desktop keeps the lighter pass since the left scrim does the heavy
            lifting there. */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#02060c]/55 via-[#04090f]/70 to-[#07111c] md:from-[#02060c]/40 md:via-[#04090f]/65" />

        {/* Mobile readability scrim — a soft top-down wash that sits behind the
            stacked text column only. Keeps the photo visually present while
            lifting contrast on the headline, paragraph, and trust strip. */}
        <div className="md:hidden absolute inset-0 bg-gradient-to-b from-[#02060c]/35 via-[#02060c]/45 to-transparent pointer-events-none" />

        {/* Left scrim — DESKTOP ONLY. On mobile the layout is centered/stacked,
            so a left scrim would just crush the whole image. */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#02060c]/85 via-[#02060c]/30 to-transparent pointer-events-none" />

        {/* Spotlight glow behind the phone (right side) — pulls the eye to it */}
        <div className="absolute top-[18%] right-[5%] w-[40vw] h-[60vh] bg-brand-orange/12 rounded-full blur-[120px] animate-float" />

        {/* Subtle deep-blue ambient on the left for balance */}
        <div className="absolute top-[10%] left-[-10%] w-[40vw] h-[50vw] bg-[#0a2540]/30 rounded-full blur-[120px] animate-morph" />

        {/* Side vignette only — fades left/right edges, leaves bottom open for blend */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_center,transparent_0%,transparent_60%,rgba(5,11,20,0.55)_100%)] pointer-events-none" />

        {/* Bottom blend: fades into the next section's color (#07111C) so the seam is invisible. */}
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[#07111c] from-25% to-transparent pointer-events-none" />
      </div>

      <Container className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content - Left Side */}
          <div className="lg:col-span-6 pt-10 lg:pt-0">
            <m.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <Glass className="inline-flex items-center px-4 py-2 rounded-full mb-8">
                <span className="text-xs font-medium text-cyan-50 tracking-wider uppercase">St. Pete · Largo · Clearwater · Tampa</span>
              </Glass>

              {/* Visual headline (price differentiator) — a div, not h1, so the SEO H1 below carries the keyword weight */}
              <div className="font-display font-bold text-white tracking-tight mb-7 text-3xl sm:text-4xl md:text-[2.7rem] leading-[1.15]">
                <span
                  className="block text-brand-orange font-black text-5xl sm:text-6xl md:text-[4.5rem] leading-[0.95] tracking-tight"
                  style={{
                    textShadow:
                      '0 0 60px rgba(255, 114, 15, 0.45), 0 2px 0 rgba(0, 0, 0, 0.35)',
                  }}
                >
                  One Flat Rate
                </span>
                <span
                  className="block mt-5 sm:whitespace-nowrap text-white font-normal tracking-tight text-2xl sm:text-3xl md:text-[2.25rem] leading-[1.1]"
                  style={{ textShadow: '0 2px 16px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)' }}
                >
                  No Monthly Chemical Cost
                </span>
              </div>

              {/* Semantic H1 carries the primary local-SEO keyword: "Pool Cleaning St. Petersburg" */}
              <h1
                className="font-display font-medium text-white text-[17px] sm:text-lg md:text-[1.1875rem] leading-snug mb-5 sm:mb-7 sm:whitespace-nowrap tracking-tight"
                style={{ textShadow: '0 2px 14px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.5)' }}
              >
                St. Petersburg's expert pool cleaning company.
              </h1>

              <p
                className="text-[15px] text-gray-100 font-light max-w-[27rem] leading-[1.6] mb-8 sm:mb-9"
                style={{ textShadow: '0 1px 12px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.4)' }}
              >
                <span className="text-white">Weekly pool cleaning, full chemical balancing, GPS-verified visits</span>, and a written report after every clean. <span className="text-white">One flat monthly price</span> — no chemical surprises, no contracts, no green water.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <a
                  href="#quote"
                  onClick={handleQuoteClick}
                  className="btn btn-blue"
                >
                  Get a Free Quote
                </a>

                <Glass
                  href={PHONE_HREF}
                  className="hidden sm:inline-flex items-center justify-center gap-2 px-6 py-3 text-white/90 hover:text-white rounded-lg font-medium text-[15px]"
                >
                  <Phone className="w-4 h-4" />
                  {PHONE_DISPLAY}
                </Glass>
              </div>

              {/* Trust strip */}
              <div
                className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-gray-200"
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 text-brand-orange">
                    {[0,1,2,3,4].map(i => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="font-semibold text-white">5.0</span>
                  <span className="text-gray-300">on Google</span>
                </div>

                <span className="hidden sm:inline text-gray-500">•</span>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-blue-light" />
                  <span>Locally Owned in St. Pete</span>
                </div>
              </div>
            </m.div>
          </div>

          {/* Visual Content - Right Side (Phone Mockup) — also shown on mobile below the text */}
          <div className="lg:col-span-6 relative flex justify-center items-center mt-4 lg:mt-0">
            {/* Handwritten label + arrow — animates as if being written/drawn in. */}
            <div
              className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 xl:translate-x-12 flex-col items-start z-20 pointer-events-none"
              style={{ transform: 'translate(-20px, -40px) rotate(-6deg)' }}
            >
              {/* Text writes in like a pen: each letter is revealed one at a time
                  with a split-second pause between, via a per-letter clip wipe (the
                  ink appears solid as the pen passes — no fading). */}
              <m.span
                className="text-brand-orange text-[1.7rem] xl:text-[2.15rem] leading-tight max-w-[180px]"
                style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}
                initial="hidden"
                whileInView="shown"
                viewport={{ once: true }}
                transition={{ delayChildren: 0.4, staggerChildren: 0.11 }}
              >
                {['Sent after', 'every visit'].map((line, lineIdx) => (
                  <span key={lineIdx} className="block">
                    {Array.from(line).map((ch, i) => (
                      <m.span
                        key={i}
                        className="inline-block"
                        style={{ whiteSpace: 'pre' }}
                        variants={{
                          hidden: { opacity: 0 },
                          shown: { opacity: 1 },
                        }}
                        transition={{ duration: 0.01 }}
                      >
                        {ch}
                      </m.span>
                    ))}
                  </span>
                ))}
              </m.span>

              {/* Hand-drawn swooping arrow — strokes draw themselves after the text. */}
              <svg
                width="180"
                height="60"
                viewBox="0 0 180 60"
                fill="none"
                className="text-brand-orange mt-1"
                style={{ transform: 'scale(0.7)', transformOrigin: 'center center', marginLeft: '-5rem' }}
              >
                {/* Main curve draws first — path defined left→right so the stroke
                    animates from the left point toward the right.
                    opacity snaps to 1 the instant the draw starts, so the round
                    linecap dot isn't visible sitting there beforehand. */}
                <m.path
                  d="M22 38
                     C 30 40, 55 46, 75 52
                     S 112 42, 130 36
                     S 170 8, 170 8"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    pathLength: { delay: 3.5, duration: 0.8, ease: 'easeInOut' },
                    opacity: { delay: 3.5, duration: 0.01 },
                  }}
                />
                {/* Chevron draws last, after the line reaches the tip */}
                <m.path
                  d="M37 25 L 22 38 L 31 51"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    pathLength: { delay: 3.1, duration: 0.3, ease: 'easeOut' },
                    opacity: { delay: 3.1, duration: 0.01 },
                  }}
                />
              </svg>
            </div>

            <m.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                opacity: { duration: 1, delay: 0.2, ease: 'easeOut' },
                y: { duration: 1, delay: 0.2, ease: 'easeOut' },
              }}
              className="relative z-10 w-[300px] scale-90 origin-center"
            >
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
                            <span className="text-white text-[7px] font-bold leading-none tabular-nums tracking-tight">
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
                        className="flex-1 min-h-0 overflow-y-auto bg-white"
                        style={{ scrollbarWidth: 'none' }}
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
                              <span className="text-[10px] text-[#3c4043] bg-[#f1f3f4] px-1.5 py-0.5 rounded font-medium">
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
                            flash while the chunk streams in. */}
                        <Suspense fallback={<div className="w-full h-full bg-[#fafafa]" />}>
                          <ServiceReport inline />
                        </Suspense>
                      </div>
                    </div>

                    {/* Gmail reply/forward bar — pinned to the bottom of the screen */}
                    <div
                      className="absolute bottom-[6px] left-0 right-0 px-3 z-30 flex items-center gap-2"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                    >
                      <div className="flex-1 rounded-full bg-white border border-[#dadce0] py-1.5 px-3 flex items-center justify-center gap-1.5 text-[#3c4043] text-[11px] font-medium">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 17 3 11 9 5" />
                          <path d="M3 11h11a6 6 0 016 6v2" />
                        </svg>
                        Reply
                      </div>
                      <div className="flex-1 rounded-full bg-white border border-[#dadce0] py-1.5 px-3 flex items-center justify-center gap-1.5 text-[#3c4043] text-[11px] font-medium">
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
              <div className="absolute -top-6 -left-6 -right-6 bottom-12 bg-gradient-to-br from-brand-blue/15 via-brand-blue-dark/10 to-brand-orange/15 blur-3xl -z-10 rounded-[3rem]" />
            </m.div>
          </div>
        </div>

      </Container>
    </div>
  );
};
