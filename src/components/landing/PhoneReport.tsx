import React, { useEffect, useRef, useState } from 'react';
import { HomeHeroPhone, useLiveClock } from '@/components/Hero';

/*
 * The homepage's phone mockup (Hero.tsx): an iPhone showing the real Gmail
 * service-report email. Shared by the homepage's report tour (Report in
 * LandingBelowFold) and Clearwater's standard section (ClearwaterStandard).
 * Whoever renders it drives the email's scroll through `scrollRef`.
 *
 * Default (the homepage): a picture of a report, not a UI. The phone takes no
 * pointer or touch of its own, so it can never trap the page scroll, and the
 * whole mockup is inert + aria-hidden: the sample email's footer has real
 * tel/mailto links, and a hidden element must not hold anything focusable.
 *
 * `interactive`: the phone takes the pointer (its owner can let the visitor
 * scroll the email) and is announced as one image. Its footer links stay
 * unfocusable (inert), since an image holds nothing to tab to.
 *
 * The handwritten note is off (these pages don't load that script font), and
 * the report shows the homepage's waterfront pool photo. No mobile `.jpg`
 * exists for it; every browser this site supports takes the .webp sources
 * first.
 */
export const WATERFRONT_REPORT_PHOTO = {
  base: '/pool-waterfront-800',
  mobileWebp: '/pool-waterfront-800.webp',
  webp: '/pool-waterfront-640.webp',
  wideWebp: '/pool-waterfront-1120.webp',
  alt: 'A sparkling blue backyard pool and spa on the water',
};

type PhoneReportProps = {
  interactive?: boolean;
  /** The sample customer's address in the report. */
  address?: React.ReactNode;
  /** 'dark' (default) for dark sections, 'light' for light ones: see
   *  HomeHeroPhone. */
  shadow?: 'dark' | 'light';
  glare?: boolean;
  /** A fixed status-bar time; the visitor's live clock when unset. */
  time?: string;
  /** The email's scroll container (the part below Gmail's top bar). */
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  /** The phone itself, for measuring it on screen. */
  phoneRef?: React.RefObject<HTMLDivElement | null>;
  reportPhoto?: React.ComponentProps<typeof HomeHeroPhone>['reportPhoto'];
};

export const PhoneReport = ({
  interactive = false,
  address,
  shadow = 'dark',
  glare = false,
  time,
  scrollRef,
  phoneRef,
  reportPhoto = WATERFRONT_REPORT_PHOTO,
}: PhoneReportProps) => {
  const clock = useLiveClock();
  const [gmailScrolled, setGmailScrolled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interactive) return;
    rootRef.current?.querySelector('.sr-footer')?.setAttribute('inert', '');
  }, [interactive]);

  const phone = (
    <div ref={phoneRef} className="relative">
      <HomeHeroPhone
        clock={time ?? clock}
        gmailScrolled={gmailScrolled}
        setGmailScrolled={setGmailScrolled}
        interactive={false}
        scrollBodyRef={scrollRef}
        annotation={false}
        reportPhoto={reportPhoto}
        address={address}
        shadow={shadow}
        glare={glare}
      />
    </div>
  );

  if (interactive) {
    return (
      <div
        ref={rootRef}
        role="img"
        aria-label="Sample Suncoast Pool Pros service report email"
        className={`phone-drop relative flex justify-center${shadow === 'light' ? ' phone-drop--light' : ''}`}
        data-nosnippet=""
      >
        {phone}
      </div>
    );
  }
  return (
    <div
      ref={rootRef}
      className={`phone-drop pointer-events-none relative flex justify-center${shadow === 'light' ? ' phone-drop--light' : ''}`}
      aria-hidden="true"
      inert
      data-nosnippet=""
    >
      {phone}
    </div>
  );
};
