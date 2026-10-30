import React from 'react';
import { Phone, ShieldCheck } from 'lucide-react';
import { usePageMeta, FONTS } from '@/lib/usePageMeta';
import { PHONE_DISPLAY, PHONE_HREF, SMS_QUOTE_HREF } from '@/lib/contact';
import { HeroQuoteForm } from '@/components/landing/HeroQuoteForm';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { VisitReportCard } from '@/components/landing/VisitReportCard';

/*
 * /landing — a standalone page in its own light look (the sc-* logo tokens in
 * index.css), with its own header and no site Footer.
 *
 * The hero is built on the Hormozi offer framework: call out the audience,
 * promise the dream outcome, make it believable (guarantee + proof of every
 * visit), and make starting effortless (one field).
 *
 * Radius scale: 20px photo · 14px cards, form, menus · 10px buttons, inputs,
 * tags (6px for the tag's inner chip). Spacing on the 8-point grid.
 *
 * Don't add numbers, reviews or claims beyond the ones already here.
 */

const Container = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-8 ${className}`}>{children}</div>
);

const inlineLink =
  'font-semibold text-sc-navy underline decoration-sc-navy/30 decoration-1 underline-offset-[3px] transition hover:decoration-sc-navy';

// ── Photo + visit report ────────────────────────────────────────────────────

// The <picture> sources mirror the site's DPR rules: phones get the portrait
// mobile crop; wider screens get the 1536 file at 1x and the 1920 at 2x.
const HeroPhoto = () => (
  <div className="relative mx-auto w-full min-w-0 max-w-[560px] lg:max-w-none">
    <div className="relative aspect-[5/6] overflow-hidden rounded-[20px] bg-sc-sky/20 shadow-[0_40px_80px_-40px_rgba(16,32,52,0.55)] ring-1 ring-sc-navy/10 lg:aspect-auto lg:h-[min(640px,calc(100dvh-136px))]">
      <picture>
        <source media="(max-width: 767px)" type="image/webp" srcSet="/st-pete-beach-hero-mobile-v2.webp" />
        <source media="(max-width: 767px)" srcSet="/st-pete-beach-hero-mobile-v2.jpg" />
        <source type="image/webp" srcSet="/st-pete-beach-hero.webp 1x, /st-pete-beach-hero-1920.webp 2x" />
        <img
          src="/st-pete-beach-hero.jpg"
          alt="Crystal-clear backyard pool on the water in St. Petersburg, FL"
          width={1536}
          height={1024}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[46%_50%]"
        />
      </picture>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,32,52,0)_55%,rgba(16,32,52,0.28)_100%)]"
      />

      {/* Scaled from its top-right corner so it shrinks into the corner, not inward. */}
      <div className="absolute right-3 top-3 w-[300px] origin-top-right scale-[0.8] sm:right-6 sm:top-6 sm:scale-[0.94]">
        <VisitReportCard />
      </div>
    </div>
  </div>
);

// ── Hero ────────────────────────────────────────────────────────────────────

// On desktop the hero fills the first screen. The headline and photo scale with
// the screen's HEIGHT as well as its width, so shorter laptops still fit.
const Hero = () => (
  <section className="relative bg-[#f5f9fd]">
    <Container className="grid items-center gap-12 pb-16 pt-10 sm:pt-14 lg:min-h-[calc(100dvh-72px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16 lg:py-8">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-2 rounded-[10px] bg-white py-1 pl-1 pr-3.5 text-[13px] font-medium text-sc-navy/75 shadow-[0_1px_2px_rgba(16,24,40,0.06)] ring-1 ring-sc-navy/10">
          <span className="rounded-[6px] bg-sc-blue/10 px-2 py-0.5 text-[12px] font-semibold text-sc-blue">
            Weekly pool service
          </span>
          St. Petersburg &amp; Pinellas
        </p>

        {/* The tagline is sized in em off the headline, so it scales with it. The
            size keeps "Crystal-clear water," on one line: off the screen width
            on phones, off the text column (screen minus photo and gaps) on
            desktop, and off the height so short laptops still fit. */}
        <hgroup className="mt-6 text-[clamp(30px,9.2vw,58px)] lg:text-[clamp(36px,min(calc((100vw-648px)/9.4),7.4vh),58px)]">
          <h1 className="text-[1em] font-bold leading-[1.04] tracking-[-0.032em] text-sc-navy">
            <span className="bg-[linear-gradient(90deg,#2676b6,#3f95cc)] box-decoration-clone bg-clip-text text-transparent">
              Crystal-clear
            </span>{' '}
            water,
            <br />
            every week.
          </h1>
          <p className="mt-4 text-[0.42em] font-semibold leading-tight tracking-[-0.01em] text-sc-blue">
            One flat rate. Chemicals included.
          </p>
        </hgroup>

        <p className="mt-4 max-w-[29.5rem] text-[17px] leading-[1.6] text-sc-navy/[0.78] sm:text-lg">
          Weekly cleaning, full chemical balancing, GPS-verified visits, and a report after every clean. No
          contracts, no surprises, no green water.
        </p>

        <div id="get-price" className="mt-8 scroll-mt-24">
          <HeroQuoteForm />
        </div>

        <p className="mt-7 flex items-start gap-2 text-[14.5px] leading-relaxed text-sc-navy/70">
          <Phone className="mt-[3px] h-4 w-4 shrink-0 text-sc-navy/55" strokeWidth={2.25} />
          <span>
            Prefer to talk? Call{' '}
            <a href={PHONE_HREF} className={`${inlineLink} whitespace-nowrap`}>
              {PHONE_DISPLAY}
            </a>{' '}
            or{' '}
            <a href={SMS_QUOTE_HREF} className={inlineLink}>
              text us 2 photos
            </a>
            .
          </span>
        </p>

        {/* Divider trick: each item's divider sits in the gap to its LEFT, and the
            -ml + overflow-hidden clip it whenever the item starts a line — so a
            wrapped row never begins with a stray divider. */}
        <div className="mt-6 overflow-hidden">
          <ul className="-ml-8 flex flex-wrap items-center gap-y-2 text-[14px] text-sc-navy/75">
            <li className="relative flex items-center gap-2 pl-8 before:absolute before:left-4 before:top-1/2 before:h-4 before:w-px before:-translate-y-1/2 before:bg-sc-navy/15">
              <span aria-hidden="true" className="tracking-[0.08em] text-[#e8a100]">
                ★★★★★
              </span>
              <span>
                <span className="font-semibold text-sc-navy">5.0</span> on Google
              </span>
            </li>
            <li className="relative flex items-center gap-2 pl-8 before:absolute before:left-4 before:top-1/2 before:h-4 before:w-px before:-translate-y-1/2 before:bg-sc-navy/15">
              <ShieldCheck className="h-[18px] w-[18px] text-sc-blue" strokeWidth={2.25} />
              Always Blue guarantee
            </li>
          </ul>
        </div>
      </div>

      <HeroPhoto />
    </Container>
  </section>
);

export const PoolLandingPage = () => {
  usePageMeta({
    title: 'Weekly Pool Service in St. Petersburg, FL | Suncoast Pool Pros',
    description:
      'Weekly pool cleaning in St. Petersburg with every standard chemical included, for one flat monthly price. No contracts, plus a 2-week money-back guarantee.',
    canonicalPath: '/landing/',
    noindex: true,
    fontPreload: [FONTS.inter],
  });

  return (
    <div className="landing-canvas force-static-motion min-h-screen bg-white font-sans text-sc-navy antialiased">
      <LandingHeader />
      <main>
        <Hero />
      </main>
    </div>
  );
};
