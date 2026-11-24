import { useEffect, useRef, type RefObject } from 'react';

/*
 * The homepage report phone's manual scroller (phones only; the owner hides it
 * from md up). A track with a white handle beside the phone: dragging the handle
 * moves the email inside the phone through its full length, tapping the track
 * glides it there, and the handle is a keyboard slider.
 *
 * It must be a SIBLING of the phone, not inside it: PhoneReport's .phone-drop is
 * inert, aria-hidden and pointer-events:none, so nothing inside it gets input.
 * That is also why a swipe on the phone scrolls the page: the email box stays
 * overflow:hidden and only ever moves by scrollTop, from here.
 *
 * The handle's position always comes from the email's real scrollTop (its
 * scroll event), so a drag, a tap's smooth glide and the keyboard all agree.
 * It is placed with `top`, never an inline transform: on phones the page's
 * .force-static-motion rule strips inline transforms.
 */

const HANDLE_H = 72;
const KEY_STEP = 0.1;
const PAGE_STEP = 0.25;

const clamp = (p: number) => Math.max(0, Math.min(1, p));

export const ReportScroller = ({
  bodyRef,
  className = '',
}: {
  /** The phone's email scroll box (PhoneReport's scrollRef). */
  bodyRef: RefObject<HTMLDivElement | null>;
  className?: string;
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    const track = trackRef.current;
    const handle = handleRef.current;
    if (!body || !track || !handle) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    const range = () => Math.max(0, body.scrollHeight - body.clientHeight);
    const travel = () => Math.max(1, track.clientHeight - HANDLE_H);
    const progress = () => {
      const max = range();
      return max > 0 ? clamp(body.scrollTop / max) : 0;
    };

    const sync = () => {
      const p = progress();
      handle.style.top = `${p * travel()}px`;
      handle.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    };
    const scrollToProgress = (p: number, smooth: boolean) => {
      const top = clamp(p) * range();
      if (smooth && !reduced.matches) body.scrollTo({ top, behavior: 'smooth' });
      else body.scrollTop = top;
    };

    // Drag: the handle keeps the same spot under the finger, and the email
    // follows proportionally. Pointer capture keeps the drag alive when the
    // finger leaves the handle; touch-action:none (class) stops the page
    // scrolling underneath.
    let drag: { id: number; y: number; from: number } | null = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, y: e.clientY, from: progress() * travel() };
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      scrollToProgress((drag.from + e.clientY - drag.y) / travel(), false);
    };
    const up = (e: PointerEvent) => {
      if (drag && e.pointerId === drag.id) drag = null;
    };

    // Tap on the track (not the handle): centre the handle on the tap and
    // glide the email there. `click`, so a swipe that starts on the track
    // still scrolls the page and never jumps the report.
    const tap = (e: MouseEvent) => {
      if (handle.contains(e.target as Node)) return;
      const r = track.getBoundingClientRect();
      scrollToProgress((e.clientY - r.top - HANDLE_H / 2) / travel(), true);
    };

    const key = (e: KeyboardEvent) => {
      const p = progress();
      const next =
        e.key === 'ArrowDown' || e.key === 'ArrowRight' ? p + KEY_STEP
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? p - KEY_STEP
        : e.key === 'PageDown' ? p + PAGE_STEP
        : e.key === 'PageUp' ? p - PAGE_STEP
        : e.key === 'Home' ? 0
        : e.key === 'End' ? 1
        : null;
      if (next === null) return;
      e.preventDefault();
      scrollToProgress(next, false);
    };

    body.addEventListener('scroll', sync, { passive: true });
    handle.addEventListener('pointerdown', down);
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
    handle.addEventListener('keydown', key);
    track.addEventListener('click', tap);
    // The email's height changes as its photo loads and on rotation.
    const ro = new ResizeObserver(sync);
    ro.observe(body);
    if (body.firstElementChild) ro.observe(body.firstElementChild);
    sync();

    return () => {
      body.removeEventListener('scroll', sync);
      handle.removeEventListener('pointerdown', down);
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
      handle.removeEventListener('keydown', key);
      track.removeEventListener('click', tap);
      ro.disconnect();
    };
  }, [bodyRef]);

  return (
    <div ref={trackRef} className={`relative flex h-[420px] w-12 shrink-0 cursor-pointer justify-center ${className}`}>
      <div aria-hidden="true" className="h-full w-[14px] rounded-[7px] bg-white/20" />
      <div
        ref={handleRef}
        role="slider"
        tabIndex={0}
        aria-label="Scroll the report"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        className="absolute left-0 top-0 flex h-[72px] w-12 touch-none cursor-grab select-none flex-col items-center justify-center gap-[5px] rounded-[14px] bg-white shadow-[0_6px_18px_rgba(0,0,0,0.5)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white active:cursor-grabbing"
      >
        <span aria-hidden="true" className="h-[2.5px] w-5 rounded-full bg-[#243a55]" />
        <span aria-hidden="true" className="h-[2.5px] w-5 rounded-full bg-[#243a55]" />
        <span aria-hidden="true" className="h-[2.5px] w-5 rounded-full bg-[#243a55]" />
      </div>
    </div>
  );
};
