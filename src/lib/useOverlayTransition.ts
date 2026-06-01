import { useEffect, useRef, useState } from 'react';

/**
 * Drives an overlay's enter/exit with CSS classes instead of a JS animation
 * library, so the slide runs on the compositor thread — it stays smooth even
 * while React is mounting the panel's contents (the heavy mount was what made
 * the drawer hitch on open), and there's no per-open animation-library mount
 * cost (Framer's AnimatePresence/MotionConfig setup) eating the first frames.
 *
 * Returns:
 *   - `mounted`  — render the overlay in the DOM? (true while open + during the
 *                  exit transition, then false)
 *   - `visible`  — apply the `.is-open` class that triggers the CSS transform
 *                  transition?
 *
 * On open: mount in the closed state, then flip `visible` on a later frame so
 * the browser has a previous painted frame to transition FROM. On close: drop
 * `visible` (transition out), then unmount after `duration` so the exit plays.
 *
 * `duration` must be >= the longest CSS transition on the panel/scrim.
 */
export function useOverlayTransition(isOpen: boolean, duration = 320) {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);
  const raf = useRef<number | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const cancelRaf = () => {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
    const clearTimer = () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };

    if (isOpen) {
      clearTimer();
      setMounted(true);
      // Two rAFs: the first lets the just-mounted closed state paint, the
      // second flips to open so the transition has a frame to animate from.
      raf.current = requestAnimationFrame(() => {
        raf.current = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      cancelRaf();
      setVisible(false);
      timer.current = window.setTimeout(() => setMounted(false), duration);
    }

    return () => {
      cancelRaf();
      clearTimer();
    };
  }, [isOpen, duration]);

  return { mounted, visible };
}
