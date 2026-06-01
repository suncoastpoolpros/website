/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Cloudflare Turnstile public site key (form anti-spam). */
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  /** Google Analytics 4 Measurement ID, e.g. "G-XXXXXXXXXX". When unset,
   *  analytics no-ops (see src/lib/analytics.ts). Set it as a build-time env
   *  var in Cloudflare Pages (VITE_* vars are inlined at build). */
  readonly VITE_GA_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
