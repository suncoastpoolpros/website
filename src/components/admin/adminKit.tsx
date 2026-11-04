/**
 * The admin's homepage-style kit: the same header, cards, fields, buttons and
 * type as the public homepage, so the back office reads as the same company.
 *
 * Built FROM the homepage's pieces (sectionKit's buttons and Eyebrow,
 * HeroQuoteForm's card shadow, label and input), not copies of them, so a
 * change to the homepage reaches here too.
 *
 * Screens move onto this one at a time. The ones still on the dark theme use
 * adminUi.tsx, and AdminPage picks the page background to match (LIGHT_DOCS).
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronLeft, LogOut } from 'lucide-react';
import { Eyebrow, buttonClass } from '@/components/landing/sectionKit';
import { fieldLabel, inputClass, raisedShadow } from '@/components/landing/HeroQuoteForm';

export { buttonClass, fieldLabel, inputClass };

/** The homepage card: white, 14px corners, the raised shadow. */
export const cardClass = `rounded-[14px] bg-white ${raisedShadow}`;

/** A quieter tile inside a card: the homepage's light section blue. */
export const tileClass = 'rounded-[12px] bg-sc-mist';

/** Secondary actions at admin density: the homepage outline button, 40px tall. */
export const smallButton =
  'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-3.5 text-[14px] font-semibold text-sc-navy ring-1 ring-inset ring-sc-navy/[0.18] transition hover:ring-sc-navy/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue disabled:cursor-not-allowed disabled:opacity-50';

/** Body text, muted text and small print, in the homepage's navy. */
export const bodyText = 'text-[15px] leading-[1.6] text-sc-navy/[0.78]';
export const mutedText = 'text-[13.5px] leading-[1.55] text-sc-navy/60';

/** Callouts, in the colors the homepage and popup already use for each. */
export const notice = {
  info: 'rounded-[10px] bg-[#eef5fb] px-4 py-3 text-[14px] text-sc-navy',
  warn: 'rounded-[10px] bg-[#fff8e1] px-4 py-3 text-[14px] text-[#8a6100] ring-1 ring-inset ring-[#f0d27a]',
  error: 'rounded-[10px] bg-red-50 px-4 py-3 text-[14px] font-medium text-red-700',
  ok: 'rounded-[10px] bg-[#e7f6ee] px-4 py-3 text-[14px] text-[#13804b]',
};

/**
 * The homepage header: white, the wave mark and stacked wordmark in navy, a
 * hairline under it. "Admin" sits beside the logo so it's never mistaken for
 * the public site, and the right side holds the screen's actions (Lock).
 */
export const AdminHeader = ({ onLogout }: { onLogout?: () => void }) => (
  <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_0_rgba(36,58,85,0.08)]">
    <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <img src="/icon-mark.svg" alt="" aria-hidden="true" width={37} height={24} className="h-7 w-auto md:h-[30px]" />
        <span className="flex flex-col font-display font-bold uppercase text-sc-navy">
          <span className="text-[15px] leading-none tracking-[0.02em] md:text-[16px]">Suncoast</span>
          <span className="mt-[3px] text-[9px] leading-none tracking-[0.405em] md:mt-[3.25px] md:text-[9.6px]">
            Pool Pros
          </span>
        </span>
        <span className="ml-1 h-6 w-px bg-sc-navy/15" aria-hidden="true" />
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-sc-navy/55">Admin</span>
      </div>
      {onLogout && (
        <button type="button" onClick={onLogout} className={smallButton}>
          <LogOut className="h-4 w-4" /> Lock
        </button>
      )}
    </div>
  </header>
);

/** Page body: the homepage's 1200px container on its light section blue. */
export const AdminBody = ({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) => (
  <div className={`mx-auto w-full px-4 pb-16 pt-8 sm:px-8 sm:pt-12 ${narrow ? 'max-w-3xl' : 'max-w-[1200px]'}`}>
    {children}
  </div>
);

/** A screen's title block: back link, section label, h1, one-line lead. */
export const PageHead = ({
  eyebrow,
  title,
  lead,
  onBack,
  actions,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}) => (
  <div className="mb-8">
    {onBack && (
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-[14px] font-semibold text-sc-navy/60 transition hover:text-sc-navy"
      >
        <ChevronLeft className="h-4 w-4" /> All tools
      </button>
    )}
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 text-balance text-[30px] font-[650] leading-[1.12] tracking-[-0.035em] text-sc-navy sm:text-[36px]">
          {title}
        </h1>
        {lead && <p className="mt-2 text-pretty text-[16px] leading-[1.6] text-sc-navy/[0.72]">{lead}</p>}
      </div>
      {actions}
    </div>
  </div>
);

/** A white card with an optional title row. */
export const Card = ({
  title,
  aside,
  className = '',
  children,
}: {
  title?: string;
  /** Right side of the title row: a count, a button. */
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) => (
  <section className={`${cardClass} p-5 sm:p-7 ${className}`}>
    {(title || aside) && (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {title && <h2 className="text-[19px] font-[650] tracking-[-0.02em] text-sc-navy">{title}</h2>}
        {aside}
      </div>
    )}
    <div className="space-y-5">{children}</div>
  </section>
);

/** A Card that starts shut, for detail most visits skip. */
export const CollapsibleCard = ({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`${cardClass} p-5 sm:p-7`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <h2 className="text-[19px] font-[650] tracking-[-0.02em] text-sc-navy">{title}</h2>
        <span className="flex shrink-0 items-center gap-2">
          {!open && hint ? <span className="text-[13px] text-sc-navy/55">{hint}</span> : null}
          <ChevronDown className={`h-4 w-4 text-sc-navy/50 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open ? <div className="mt-5 space-y-5">{children}</div> : null}
    </section>
  );
};

/** A big number with a small label under it. */
export const Stat = ({ value, label }: { value: React.ReactNode; label: string }) => (
  <div className={`${tileClass} px-4 py-3`}>
    <span className="block text-[24px] font-[650] leading-tight tracking-[-0.03em] text-sc-navy tabular-nums">
      {value}
    </span>
    <span className="mt-0.5 block text-[11.5px] font-semibold uppercase tracking-[0.14em] text-sc-navy/55">
      {label}
    </span>
  </div>
);
