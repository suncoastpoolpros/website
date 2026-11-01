import React from 'react';
import { ArrowRight, Phone } from 'lucide-react';
import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { amberButton } from '@/components/landing/HeroQuoteForm';

/*
 * The homepage design system's section pieces, shared by the homepage's
 * below-the-fold (LandingBelowFold) and the city pages built on it
 * (Clearwater): the container, the section label, the h2 and lead styles,
 * the section padding, and the three buttons.
 */

export const Container = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-8 ${className}`}>{children}</div>
);

// A 22px rule before the label (and after it too when the heading is centered).
// `light` is the homepage's sky-blue label on dark; `gold` the city pages'.
export const Eyebrow = ({
  children,
  light = false,
  gold = false,
  centered = false,
}: {
  children: React.ReactNode;
  light?: boolean;
  gold?: boolean;
  centered?: boolean;
}) => (
  <p
    className={`inline-flex items-center gap-2.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] before:h-px before:w-[22px] before:bg-current before:opacity-60 ${
      centered ? 'after:h-px after:w-[22px] after:bg-current after:opacity-60' : ''
    } ${gold ? 'text-sc-gold' : light ? 'text-sc-sky' : 'text-sc-blue'}`}
  >
    {children}
  </p>
);

export const h2 = 'mt-3 text-balance text-[30px] font-[650] leading-[1.12] tracking-[-0.035em] sm:text-[40px]';
export const lead = 'mt-4 text-pretty text-[17px] leading-[1.6] text-sc-navy/[0.78]';
export const leadOnDark = 'mt-4 text-pretty text-[17px] leading-[1.6] text-white/75';
// Section padding: 112px top and bottom on desktop.
export const sectionY = 'py-20 sm:py-24 lg:py-28';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2';
const buttonBase = `group inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-[22px] text-base font-semibold transition ${focusRing}`;

export const buttonClass = {
  gold: `${amberButton} h-12 whitespace-nowrap px-[22px] text-base ${focusRing} focus-visible:outline-sc-blue`,
  navy: `${buttonBase} bg-sc-navy text-white hover:bg-[#1c2f46] focus-visible:outline-sc-blue`,
  outline: `${buttonBase} text-sc-navy ring-1 ring-inset ring-sc-navy/[0.18] hover:ring-sc-navy/40 focus-visible:outline-sc-blue`,
  outlineOnDark: `${buttonBase} text-white ring-1 ring-inset ring-white/30 hover:ring-white/55 focus-visible:outline-white`,
};

const ButtonArrow = () => (
  <ArrowRight className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-[3px]" strokeWidth={2.5} />
);

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A CTA that glides to the page's on-page quote form (#quote). A plain link
 * underneath, so it still lands without JS; `#quote` carries scroll-mt-24 for
 * the header.
 */
export const QuoteLink = ({
  variant = 'gold',
  label = 'Get my price',
  className = '',
}: {
  variant?: 'gold' | 'navy';
  label?: string;
  className?: string;
}) => (
  <a
    href="#quote"
    onClick={(e) => {
      const target = document.getElementById('quote');
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }}
    className={`${buttonClass[variant]} ${className}`}
  >
    {label}
    <ButtonArrow />
  </a>
);

export const PhoneButton = ({ onDark = false, className = '' }: { onDark?: boolean; className?: string }) => (
  <a href={PHONE_HREF} className={`${onDark ? buttonClass.outlineOnDark : buttonClass.outline} ${className}`}>
    <Phone className={`h-[18px] w-[18px] ${onDark ? 'text-white/70' : 'text-sc-navy/60'}`} />
    {PHONE_DISPLAY}
  </a>
);
