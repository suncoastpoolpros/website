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
  // A pending execute() call waiting for the next callback fire.
  const pendingRef = useRef<{ resolve: (token: string) => void; reject: (e: Error) => void } | null>(null);
  const [ready, setReady] = useState(false);

  const enabled = Boolean(SITE_KEY);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY!,
          size: 'invisible',
          execution: 'execute',
          appearance: 'interaction-only',
          callback: (token: string) => {
            const pending = pendingRef.current;
            pendingRef.current = null;
            pending?.resolve(token);
          },
          'error-callback': () => {
            const pending = pendingRef.current;
            pendingRef.current = null;
            pending?.reject(new Error('turnstile_error'));
          },
          'expired-callback': () => {
            if (widgetIdRef.current && window.turnstile) {
              window.turnstile.reset(widgetIdRef.current);
            }
          },
        });
        setReady(true);
      })
      .catch(() => {
        // Script load failed (network, ad blocker, etc.). Leave `ready` false
        // — the form's execute() will resolve with '' and submission will
        // proceed without a token. The server treats no-token as captcha
        // failure ONLY if a secret is configured; otherwise it's accepted.
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
    };
  }, [enabled]);

  const execute = (): Promise<string> => {
    if (!enabled || !ready || !widgetIdRef.current || !window.turnstile) {
      // Falls through to a no-op token. Server-side: if the secret is
      // configured, this will fail captcha; if not, it accepts the submit.
      return Promise.resolve('');
    }
    return new Promise<string>((resolve, reject) => {
      // Race-condition safety: if there's already a pending execute() that
      // never fired, reject it. Each submit gets a fresh promise.
      pendingRef.current?.reject(new Error('turnstile_superseded'));
      pendingRef.current = { resolve, reject };
      try {
        window.turnstile!.reset(widgetIdRef.current!);
        window.turnstile!.execute(widgetIdRef.current!);
      } catch (e) {
        pendingRef.current = null;
        reject(e instanceof Error ? e : new Error('turnstile_exec_failed'));
      }
    });
  };

  return { containerRef, execute, ready, enabled };
};
