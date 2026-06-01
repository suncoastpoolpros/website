import { useEffect } from 'react';

/**
 * iOS-safe body scroll lock for overlays (nav drawer, quote sheet).
 *
 * `document.body.style.overflow = 'hidden'` does NOT stop touch scrolling on
 * iOS Safari — the page behind an open overlay can still be finger-dragged and
 * keeps its momentum, which makes the overlay feel like it's floating on a
 * moving background. Instead we pin the body with `position: fixed` (the
 * technique body-scroll-lock libraries use) and restore the exact scroll
 * position when the lock lifts.
 *
 * Pass the overlay's open state. The lock engages while `active` is true and
 * releases (restoring scroll) when it flips false or the component unmounts.
 *
 * Safe with this site's globally hidden scrollbars (scrollbar-width:none), so
 * pinning the body causes no layout shift. Fixed chrome (navbar, sticky CTA,
 * the portaled overlays themselves) is unaffected: a position:fixed body does
 * not create a containing block for fixed descendants.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;
    const body = document.body;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
