/**
 * Cloudflare Turnstile integration — invisible CAPTCHA.
 *
 * Why: hides our /api/contact endpoint from drive-by bots that script form
 * submits directly. The honeypot already blocks the cheapest bots; Turnstile
 * catches the more sophisticated ones (puppeteer, paid spam services).
 *
 * Usage:
 *   const { execute, ready } = useTurnstile();
 *   // in handleSubmit:
 *   const token = await execute();
 *   await sendContact({ ..., turnstileToken: token });
 *
 * The script is loaded lazily — the first form interaction triggers a single
 * shared <script> insert. Subsequent forms reuse it.
 */
import { useEffect, useRef, useState } from 'react';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__suncoastTurnstileOnLoad';
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

// Module-scoped loader so multiple useTurnstile() calls share one script tag.
let scriptPromise: Promise<void> | null = null;

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          execution?: 'render' | 'execute';
          size?: 'normal' | 'compact' | 'invisible';
          retry?: 'auto' | 'never';
          appearance?: 'always' | 'execute' | 'interaction-only';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      execute: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
    __suncoastTurnstileOnLoad?: () => void;
  }
}

const loadScript = (): Promise<void> => {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('not_browser'));
      return;
    }
    if (window.turnstile) {
      resolve();
      return;
    }
    window.__suncoastTurnstileOnLoad = () => resolve();
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('turnstile_script_failed'));
    document.head.appendChild(script);
  });
  return scriptPromise;
};

/**
 * Returns:
 *   - containerRef: attach to a `<div>` in your form where the (invisible)
 *     widget will mount.
 *   - execute: async function that triggers the challenge and resolves with
 *     a one-time token to send to /api/contact.
 *   - ready: true once the script + widget are mounted.
 *   - enabled: false if no site key is configured (e.g. local dev). In that
 *     case execute() resolves with an empty string and the server-side
 *     verification is skipped (the Function also defaults to skip when the
 *     secret isn't configured).
 */
export const useTurnstile = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Last token issued by the widget's success callback. Tokens are valid for
  // ~5 minutes; the widget auto-refreshes them so this stays current.
  const tokenRef = useRef<string>('');
  // Pending getToken() callers waiting for the next callback fire (used when
  // the user hits submit before the widget has produced its first token, or
  // right after a manual reset).
  const waitersRef = useRef<Array<(token: string) => void>>([]);
  const [ready, setReady] = useState(false);
  // Defer loading the Turnstile script until the user is actually about to
  // need it. Loading on mount would block popup paint by the time we ship the
  // ~20 KB Cloudflare script + run its widget bootstrap on every "Get a Quote"
  // click. We toggle this on first submit attempt (see execute() below).
  const [shouldLoad, setShouldLoad] = useState(false);

  const enabled = Boolean(SITE_KEY);

  useEffect(() => {
    if (!enabled || !shouldLoad) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        // Managed invisible widget. Turnstile auto-solves on render and
        // delivers a token via the callback — we don't need (and shouldn't
        // call) turnstile.execute() in this mode.
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY!,
          size: 'invisible',
          retry: 'auto',
          callback: (token: string) => {
            tokenRef.current = token;
            const waiters = waitersRef.current;
            waitersRef.current = [];
            for (const w of waiters) w(token);
          },
          'error-callback': () => {
            // On error, drain waiters with an empty token so submission can
            // proceed to the server, which will report captcha_failed cleanly.
            tokenRef.current = '';
            const waiters = waitersRef.current;
            waitersRef.current = [];
            for (const w of waiters) w('');
          },
          'expired-callback': () => {
            // Token aged out. Clear so the next submit waits for a fresh one.
            tokenRef.current = '';
            if (widgetIdRef.current && window.turnstile) {
              window.turnstile.reset(widgetIdRef.current);
            }
          },
        });
        setReady(true);
      })
      .catch(() => {
        // Script load failed (network, ad blocker, etc.). Leave `ready` false
        // — execute() will resolve with '' and submission will proceed without
        // a token. The server treats no-token as captcha failure ONLY if a
        // secret is configured; otherwise it's accepted (dev-friendly default).
      });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
      waitersRef.current = [];
      tokenRef.current = '';
    };
  }, [enabled, shouldLoad]);

  const execute = (): Promise<string> => {
    if (!enabled) return Promise.resolve('');
    // First execute() call kicks off the script load. The promise below
    // waits for the token to arrive (up to 6s), which gives the script time
    // to load + the widget to auto-solve.
    if (!shouldLoad) setShouldLoad(true);
    // Token already cached from the auto-solve — use it. Then reset the
    // widget so the next submit gets a fresh token (each Turnstile token
    // can only be verified server-side once).
    if (tokenRef.current) {
      const token = tokenRef.current;
      tokenRef.current = '';
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          /* ignore */
        }
      }
      return Promise.resolve(token);
    }
    // No token yet. Could be: (a) script still loading, (b) widget mid-solve,
    // (c) post-reset, no fresh token issued yet. Wait up to ~6 seconds for
    // the success callback to fire.
    return new Promise<string>((resolve) => {
      const timer = window.setTimeout(() => {
        // Drop this waiter from the queue if it's still there.
        waitersRef.current = waitersRef.current.filter((w) => w !== waiter);
        resolve('');
      }, 6000);
      const waiter = (token: string) => {
        window.clearTimeout(timer);
        resolve(token);
      };
      waitersRef.current.push(waiter);
    });
  };

  return { containerRef, execute, ready, enabled };
};
