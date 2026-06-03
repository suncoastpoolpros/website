import React, { useEffect, useState } from 'react';
import { m } from 'motion/react';
import { ServiceReport } from '@/components/ServiceReport';

const formatClock = (d: Date) =>
  d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, '');

const useLiveClock = () => {
  const [time, setTime] = useState(() => formatClock(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setTime(formatClock(new Date())), 10000);
    return () => window.clearInterval(id);
  }, []);
  return time;
};

// Desktop-only Gmail service-report phone mockup for the Belleair hero.
// Lazy-loaded so phones/tablets never download this code or its ServiceReport
// dependency on first paint.
export const BelleairHeroPhone = () => {
  const clock = useLiveClock();
  const [gmailScrolled, setGmailScrolled] = useState(false);

  return (
    <m.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        opacity: { duration: 1, delay: 0.3, ease: 'easeOut' },
        y: { duration: 1, delay: 0.3, ease: 'easeOut' },
      }}
      className="lg:col-span-5 flex justify-center items-center relative"
      // Decorative demo mockup — keep its sample report text (dates, chem
      // readings, "Pool Service Report …") out of Google search snippets so
      // the page's real meta description is used instead.
      data-nosnippet=""
    >
      <div className="relative w-[300px] scale-90 origin-center">
        {/* Side buttons */}
        <div className="absolute left-[-3px] top-[110px] w-[3px] h-8 bg-[#1a1a1a] rounded-l-sm z-0" />
        <div className="absolute left-[-3px] top-[160px] w-[3px] h-14 bg-[#1a1a1a] rounded-l-sm z-0" />
        <div className="absolute left-[-3px] top-[225px] w-[3px] h-14 bg-[#1a1a1a] rounded-l-sm z-0" />
        <div className="absolute right-[-3px] top-[180px] w-[3px] h-20 bg-[#1a1a1a] rounded-r-sm z-0" />

        {/* Phone frame — titanium-style bezel */}
        <div className="relative rounded-[3rem] p-[3px] bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#2a2a2a] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="relative rounded-[2.85rem] bg-black overflow-hidden h-[648px]">
            <div className="absolute inset-[10px] rounded-[2.55rem] bg-[#f2f2f0] overflow-hidden">
              {/* Dynamic Island */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-[84px] h-[28px] bg-black z-30"
                style={{ top: '11px', borderRadius: '14px' }}
              />

              {/* Status bar — bg tracks the Gmail top bar so the seam
                  between iOS chrome and Gmail chrome stays unified. */}
              <div
                className={`absolute top-0 inset-x-0 h-12 px-5 flex justify-between items-center z-20 pointer-events-none transition-colors duration-150 ${
                  gmailScrolled ? 'bg-[#f1f3f4]' : 'bg-white'
                }`}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
              >
                {/* Left slot — width matches the right-icon cluster so the
                    clock centers in the gap between screen edge and Island */}
                <div className="flex justify-center" style={{ width: '60px' }}>
                  {/* suppressHydrationWarning: the clock differs between the
                      build-time prerender and the client's current time; without
                      this the text mismatch throws React #418 and forces a full
                      client re-render. */}
                  <span
                    suppressHydrationWarning
                    className="text-black text-[13px] font-semibold tracking-tight tabular-nums"
                  >
                    {clock}
                  </span>
                </div>
                <div className="flex items-center gap-[5px] text-black">
                  <svg width="15" height="10" viewBox="0 0 17 12" fill="currentColor">
                    <rect x="0" y="8" width="3" height="4" rx="0.8" />
                    <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.8" />
                    <rect x="9" y="3" width="3" height="9" rx="0.8" />
                    <rect x="13.5" y="0" width="3" height="12" rx="0.8" />
                  </svg>
                  <svg width="13" height="9" viewBox="0 0 15 11" fill="currentColor">
                    <path d="M7.5 0C4.7 0 2.1 1 0 2.8l1.4 1.7C3.1 3 5.2 2.2 7.5 2.2s4.4.8 6.1 2.3L15 2.8C12.9 1 10.3 0 7.5 0zm0 4.5c-1.9 0-3.6.7-4.9 1.9l1.4 1.7c.9-.9 2.2-1.4 3.5-1.4 1.4 0 2.6.5 3.5 1.4l1.4-1.7C11.1 5.2 9.4 4.5 7.5 4.5zm0 4.5c-.9 0-1.7.3-2.4.9L7.5 12l2.4-2.1c-.7-.6-1.5-.9-2.4-.9z" />
                  </svg>
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
                    {/* Archive */}
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="4" rx="0.5" />
                      <path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8" />
                      <line x1="10" y1="13" x2="14" y2="13" />
                    </svg>
                    {/* Trash */}
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                    {/* Mark unread (with notification dot) */}
                    <div className="relative">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="M3 7l9 6 9-6" />
                      </svg>
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#1a73e8]" />
                    </div>
                    {/* More */}
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="1.6" />
                      <circle cx="12" cy="12" r="1.6" />
                      <circle cx="19" cy="12" r="1.6" />
                    </svg>
                  </div>
                </div>

                {/* Scrollable area — subject, sender, and the report all
                    scroll together so the subject/sender slide up out of
                    view as the user scrolls, the way real Gmail does.
                    Only the top icon bar stays pinned. */}
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

                  {/* The real report, in inline mode so it joins the
                      parent scroll instead of creating its own */}
                  <ServiceReport
                    inline
                    customerName="The Whitman Residence"
                    customerAddress={
                      <>
                        123 Example Lane,{' '}
                        <span style={{ whiteSpace: 'nowrap' }}>Belleair Beach, FL 33786</span>
                      </>
                    }
                    photo={{
                      base: '/belleair-beach-hero',
                      alt: 'Waterfront pool at a Belleair Beach, FL home — cleaned and chemically balanced by Suncoast Pool Pros',
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

            {/* Glossy reflection */}
            <div className="absolute inset-[10px] rounded-[2.55rem] pointer-events-none bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
          </div>
        </div>

        {/* Quiet ambient glow — cooler than the homepage's blue+orange mix,
            so it stays in the page's Gulf-tone palette. */}
        <div className="absolute -top-6 -left-6 -right-6 bottom-12 bg-gradient-to-br from-brand-blue/15 via-brand-blue-dark/10 to-brand-blue/5 blur-3xl -z-10 rounded-[3rem]" />
      </div>
    </m.div>
  );
};

export default BelleairHeroPhone;
