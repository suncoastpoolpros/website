import React, { useEffect, useState } from 'react';
import { ChevronDown, Menu, Phone, X } from 'lucide-react';
import { SmartLink } from '@/components/SmartLink';
import { BUSINESS_NAME, PHONE_DISPLAY, PHONE_HREF } from '@/lib/contact';
import { useScrollLock } from '@/lib/useScrollLock';
import { focusQuoteForm } from '@/components/landing/HeroQuoteForm';

type NavItem = { label: string; to: string };

const AREAS: NavItem[] = [
  { label: 'St. Petersburg', to: '/' },
  { label: 'Snell Isle', to: '/snell-isle-fl/' },
  { label: 'St. Pete Beach', to: '/st-pete-beach-fl/' },
  { label: 'Treasure Island', to: '/treasure-island-fl/' },
  { label: 'Seminole', to: '/seminole-fl/' },
  { label: 'Largo', to: '/largo-fl/' },
  { label: 'Belleair Beach', to: '/belleair-beach-fl/' },
  { label: 'Clearwater', to: '/clearwater-fl/' },
];

// Same target as the footer's "View all areas": the homepage's areas section.
const ALL_AREAS_HREF = '/#service-areas';

const SERVICES: NavItem[] = [
  { label: 'Weekly Pool Cleaning', to: '/services/' },
  { label: 'Green Pool Recovery', to: '/services/green-pool-recovery/' },
  { label: 'Storm Cleanup', to: '/services/storm-cleanup/' },
  { label: 'Saltwater Pool Service', to: '/services/saltwater-pool-service/' },
];

const LINKS: NavItem[] = [
  { label: 'Pool Care', to: '/pool-care/' },
  { label: 'FAQ', to: '/faq/' },
  { label: 'Tools', to: '/tools/' },
];

const topLink =
  'inline-flex h-10 items-center gap-1 whitespace-nowrap rounded-[8px] px-3 min-[62.5rem]:max-[68.75rem]:px-[7px] text-[15px] font-medium text-sc-navy/80 transition-colors hover:bg-[#f5f9fd] hover:text-sc-navy';

const menuItem =
  'block whitespace-nowrap rounded-[10px] px-3 py-2 text-[14.5px] text-sc-navy/85 transition-colors hover:bg-[#f5f9fd] hover:text-sc-navy';

// CSS-only dropdown: opens on hover and on keyboard focus (focus-within), so it
// needs no state and works before hydration. The pt-2 wrapper bridges the gap
// between trigger and menu so the pointer can cross it without closing.
const Dropdown = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="group relative">
    <button type="button" aria-haspopup="true" className={topLink}>
      {label}
      <ChevronDown
        className="h-4 w-4 transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180"
        strokeWidth={2.25}
      />
    </button>
    <div className="invisible absolute left-0 top-full z-40 translate-y-1 pt-2 opacity-0 transition-[opacity,translate,visibility] duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
      <div className="min-w-[220px] rounded-[14px] bg-white p-1.5 shadow-[0_16px_40px_-16px_rgba(36,58,85,0.35)] ring-1 ring-sc-navy/10">
        {children}
      </div>
    </div>
  </div>
);

export const LandingHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  useScrollLock(menuOpen);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <header className="relative z-30 bg-white shadow-[0_1px_0_0_rgba(36,58,85,0.08)]">
      <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-8">
        <SmartLink to="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${BUSINESS_NAME} home`}>
          <img src="/circle-icon.svg" alt="" width={34} height={34} className="h-[34px] w-[34px]" />
          <span className="text-[15px] font-extrabold uppercase tracking-[0.04em] text-sc-navy sm:text-[16px]">
            {BUSINESS_NAME}
          </span>
        </SmartLink>

        <nav aria-label="Main" className="hidden items-center gap-0.5 min-[1000px]:flex">
          <Dropdown label="Service Areas">
            {AREAS.map((a) => (
              <SmartLink key={a.to} to={a.to} className={menuItem}>
                {a.label}
              </SmartLink>
            ))}
            <div className="mx-2 my-1.5 h-px bg-sc-navy/10" />
            <a href={ALL_AREAS_HREF} className={`${menuItem} font-semibold text-sc-navy`}>
              View all areas
            </a>
          </Dropdown>
          <Dropdown label="Services">
            {SERVICES.map((s) => (
              <SmartLink key={s.to} to={s.to} className={menuItem}>
                {s.label}
              </SmartLink>
            ))}
          </Dropdown>
          {LINKS.map((l) => (
            <SmartLink key={l.to} to={l.to} className={topLink}>
              {l.label}
            </SmartLink>
          ))}
        </nav>

        {/* 1000–1099px: the links and the phone number can't share one row, so
            the number steps aside there (the Get a Quote button stays). Those
            breakpoints are in rem on purpose: Tailwind can't order a px
            breakpoint against the rem-based sm:, and sm:inline-flex would win. */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <a
            href={PHONE_HREF}
            className="hidden items-center gap-2 whitespace-nowrap text-[15px] font-semibold text-sc-navy sm:inline-flex min-[62.5rem]:max-[68.75rem]:hidden"
          >
            <Phone className="h-4 w-4 text-sc-navy/55" strokeWidth={2.25} />
            {PHONE_DISPLAY}
          </a>
          <a
            href={PHONE_HREF}
            aria-label={`Call ${PHONE_DISPLAY}`}
            className="grid h-[42px] w-[42px] place-items-center rounded-[10px] text-sc-navy ring-1 ring-sc-navy/15 sm:hidden"
          >
            <Phone className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </a>
          <button
            type="button"
            onClick={focusQuoteForm}
            className="hidden h-[42px] items-center whitespace-nowrap rounded-[10px] bg-sc-navy px-4 text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.12)] transition-colors hover:bg-[#1c2f46] sm:inline-flex"
          >
            Get a Quote
          </button>
          {/* Shown wherever the center links are hidden, so they're always reachable. */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="landing-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="grid h-[42px] w-[42px] place-items-center rounded-[10px] text-sc-navy ring-1 ring-sc-navy/15 min-[1000px]:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="landing-menu"
        className={`fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-white px-4 pb-10 pt-4 sm:px-8 min-[1000px]:hidden ${menuOpen ? '' : 'hidden'}`}
      >
        <nav aria-label="Mobile" className="mx-auto max-w-[1200px] divide-y divide-sc-navy/[0.08]" onClick={(e) => (e.target as HTMLElement).closest('a') && close()}>
          <MobileGroup title="Service Areas">
            {AREAS.map((a) => (
              <SmartLink key={a.to} to={a.to} className={menuItem}>
                {a.label}
              </SmartLink>
            ))}
            <a href={ALL_AREAS_HREF} className={`${menuItem} font-semibold text-sc-navy`}>
              View all areas
            </a>
          </MobileGroup>
          <MobileGroup title="Services">
            {SERVICES.map((s) => (
              <SmartLink key={s.to} to={s.to} className={menuItem}>
                {s.label}
              </SmartLink>
            ))}
          </MobileGroup>
          <div className="py-3">
            {LINKS.map((l) => (
              <SmartLink key={l.to} to={l.to} className={`${menuItem} text-[16px] font-medium`}>
                {l.label}
              </SmartLink>
            ))}
          </div>
        </nav>
        <button
          type="button"
          onClick={() => {
            close();
            // After the scroll lock lets go, or the scroll lands on a pinned body.
            setTimeout(focusQuoteForm, 0);
          }}
          className="mx-auto mt-4 flex h-12 w-full max-w-[1200px] items-center justify-center rounded-[10px] bg-sc-navy text-base font-semibold text-white"
        >
          Get a Quote
        </button>
      </div>
    </header>
  );
};

const MobileGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="py-3">
    <p className="px-3 pb-1 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-sc-navy/55">{title}</p>
    {children}
  </div>
);
