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
    if (isOpen) {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      setMounted(true);
    } else {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
      setVisible(false);
      timer.current = window.setTimeout(() => setMounted(false), duration);
    }
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [isOpen, duration]);

  // Flip `visible` only AFTER the mounted DOM has committed (this effect runs
  // post-commit of `mounted`), then wait two rAFs so the closed state gets a
  // painted frame to transition FROM. Starting the rAF countdown in the same
  // effect that calls setMounted (the old shape) raced the mount: on a cold
  // open of a heavy panel (QuoteChooser) the frames fired before/straddling
  // the commit, the panel got `.is-open` on its first paint, and the entrance
  // transition was skipped entirely — the sheet "just appeared". Pre-warmed
  // panels skip the race anyway; this makes cold opens equally safe.
  useEffect(() => {
    if (!isOpen || !mounted) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
  }, [isOpen, mounted]);

  return { mounted, visible };
}
