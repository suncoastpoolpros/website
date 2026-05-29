import React, { useEffect, useRef, useState } from 'react';
import { m, useScroll, useTransform } from 'motion/react';
import { Phone, Star, MapPin } from 'lucide-react';
import { ServiceReport } from '@/components/ServiceReport';
import { Glass } from '@/components/Glass';
import { useQuoteSheet } from '@/components/QuoteSheet';
import { Container } from '@/components/Container';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';

const formatClock = (d: Date) =>
  d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, '');

const useLiveClock = () => {
  const [time, setTime] = useState(() => formatClock(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setTime(formatClock(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);
  return time;
};

export const Hero = () => {
  const clock = useLiveClock();
  const { open: openQuoteSheet } = useQuoteSheet();
  const sectionRef = useRef<HTMLDivElement>(null);

  // Phone tilts 2° on desktop, sits straight (0°) on mobile.
  const [phoneTilt, setPhoneTilt] = useState(0);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setPhoneTilt(mq.matches ? 2 : 0);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

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
              "image-set(url('/hero-bg-1280.webp') type('image/webp') 1x, url('/hero-bg-1920.webp') type('image/webp') 2x, url('/hero-bg-1280.jpg') type('image/jpeg') 1x)",
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
              "image-set(url('/hero-bg-mobile.webp') type('image/webp'), url('/hero-bg-mobile.jpg') type('image/jpeg'))",
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

        {/* Gradient overlay — lighter at the very top, building to the section
            seam color at the bottom. */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#02060c]/35 via-[#04090f]/45 to-[#07111c] md:from-[#02060c]/40 md:via-[#04090f]/65" />

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
                  style={{ textShadow: '0 1px 14px rgba(0,0,0,0.5)' }}
                >
                  No Monthly Chemical Cost
                </span>
              </div>

              {/* Semantic H1 carries the primary local-SEO keyword: "Pool Cleaning St. Petersburg" */}
              <h1
                className="font-display font-medium text-white/90 text-[17px] sm:text-lg md:text-[1.1875rem] leading-snug mb-5 sm:mb-7 sm:whitespace-nowrap tracking-tight"
                style={{ textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}
              >
                St. Petersburg's expert pool cleaning company.
              </h1>

              <p
                className="text-[15px] text-gray-200 font-light max-w-[27rem] leading-[1.6] mb-8 sm:mb-9"
                style={{ textShadow: '0 1px 10px rgba(0,0,0,0.55)' }}
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
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 text-brand-orange">
                    {[0,1,2,3,4].map(i => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="font-medium text-white/90">5.0</span>
                  <span className="text-gray-500">on Google</span>
                </div>

                <span className="hidden sm:inline text-gray-700">•</span>

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
              initial={{ opacity: 0, y: 50, rotate: phoneTilt }}
              animate={{ opacity: 1, y: 0, rotate: phoneTilt }}
              whileHover={{ rotate: 0 }}
              transition={{
                opacity: { duration: 1, delay: 0.2, ease: 'easeOut' },
                y: { duration: 1, delay: 0.2, ease: 'easeOut' },
                rotate: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
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
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110px] h-[34px] bg-black rounded-full z-30" />

                    {/* Status bar overlay (sits over the report header) */}
                    <div className="absolute top-0 inset-x-0 h-12 px-7 flex justify-between items-center z-20 pointer-events-none">
                      <span className="text-black text-[15px] font-semibold tracking-tight tabular-nums" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>{clock}</span>
                      <div className="flex items-center gap-1.5 text-black">
                        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
                          <rect x="0" y="7" width="3" height="4" rx="0.5" />
                          <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
                          <rect x="9" y="3" width="3" height="8" rx="0.5" />
                          <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
                        </svg>
                        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
                          <path d="M7.5 0C4.7 0 2.1 1 0 2.8l1.4 1.7C3.1 3 5.2 2.2 7.5 2.2s4.4.8 6.1 2.3L15 2.8C12.9 1 10.3 0 7.5 0zm0 4.5c-1.9 0-3.6.7-4.9 1.9l1.4 1.7c.9-.9 2.2-1.4 3.5-1.4 1.4 0 2.6.5 3.5 1.4l1.4-1.7C11.1 5.2 9.4 4.5 7.5 4.5zm0 4.5c-.9 0-1.7.3-2.4.9L7.5 12l2.4-2.1c-.7-.6-1.5-.9-2.4-.9z" />
                        </svg>
                        <div className="flex items-center">
                          <div className="relative w-[24px] h-[11px] rounded-[3px] border border-black/50 p-[1.5px]">
                            <div className="h-full bg-black rounded-[1px]" style={{ width: '85%' }} />
                          </div>
                          <div className="w-[1.5px] h-[4px] bg-black/50 rounded-r-sm ml-[0.5px]" />
                        </div>
                      </div>
                    </div>

                    {/* Service report fills the screen, with top padding so status bar doesn't cover content */}
                    <div className="absolute inset-0 pt-[44px]">
                      <ServiceReport />
                    </div>

                    {/* Home indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[5px] bg-black/80 rounded-full z-30" />
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
