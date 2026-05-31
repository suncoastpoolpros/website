# Suncoast Pool Pros — site speed & optimization

Quick reference for keeping the marketing site fast on **mobile** (Slow 4G, real iPhones) without breaking SEO. Desktop perf is easy here; mobile is the constraint. Rooted in current (2025) authoritative guidance from react.dev, reactrouter.com, developers.cloudflare.com.

## Architecture in 4 sentences

- **Vite + React 19 SPA**, statically prerendered to HTML at build time via a custom Node script (`scripts/prerender.mjs`) that uses `renderToString` on `src/entry-server.tsx`.
- Every public route ships as a real static `dist/<route>/index.html` with the rendered React tree baked into `#root`. The client `hydrateRoot`s on top, then nav stays SPA-style (instant in-app `<Route>` swap, no network).
- **Cloudflare Pages** serves the static HTML at the edge with brotli (level 4) — Auto Minify was deprecated Aug 2024, so Vite minifies at build time. `public/_headers` sets immutable caching for `/assets/*`, `/fonts/*`, and images.
- Cross-page nav uses React Router's `<Link to="...">`. After the first prerendered page hydrates, every subsequent click is in-app — no network round-trip.

## The non-negotiables

1. **Every public route MUST be prerendered.** Add its path to `PRERENDER_ROUTES` in `src/entry-server.tsx`. If a page isn't in there, it ships as an empty `<div id="root">` and LCP collapses.
2. **Client routes are `lazy()` in `App.tsx`; the SSR entry stays eager.** `src/App.tsx` lazy-loads every page (`lazy(() => import('@/pages/...'))`) so the homepage hydration only parses LandingPage (~36 KB gz), not all 12 pages — on real iPhone Safari the all-in-one bundle made click handlers dead for ~4s while React parsed everything. To keep nav feeling instant, `src/components/SmartLink` (PreloadOnIntent) kicks off the chunk download on `touchstart`/`mouseover`, before the click fires. **`src/entry-server.tsx` must still import every prerendered page eagerly** — `renderToString` is synchronous and bails on Suspense (see #3), so the server entry can't use `lazy()`. (Authoritative: [reactrouter.com/how-to/spa](https://reactrouter.com/how-to/spa))
3. **Don't add `<Suspense>` to any prerender path.** `renderToString` is synchronous and renders the Suspense fallback instead of waiting. The suspended content fills only client-side, defeating SSR for that subtree. ([react.dev/reference/react-dom/server/renderToString](https://react.dev/reference/react-dom/server/renderToString))
4. **Don't write inline `style={{ color: '#hex', textShadow: '...', backgroundColor: '#hex' }}` for SSR'd elements.** The browser re-serializes these (`#1669AE` → `rgb(22, 105, 174)`, shadow descriptors get reordered) which mismatches the SSR'd HTML and triggers React #418 + a full client re-render. Use CSS classes in `src/index.css` instead.
5. **Don't load Turnstile or other third-party scripts on component mount.** Defer until the user actually needs them (Turnstile loads on form submit, not on popup open). See `src/lib/turnstile.ts`.
6. **Don't add render-blocking external `<link>` or `<script>` to `index.html`.** Self-host fonts; no Google Fonts `@import`. Trim to the weights you actually use (currently Inter 400/600/700 + Montserrat 400/700/900 + Caveat 700).
7. **Don't prefetch other route chunks on idle.** Even if we go back to `lazy()` for some heavy page, don't `requestIdleCallback`-prefetch all the others. This was tried and swamped Slow 4G with parallel requests that pushed the LCP image to the back of the queue, delaying FCP by ~500ms.
8. **Cloudflare Email Address Obfuscation must be OFF in the dashboard** (Scrape Shield → Email Address Obfuscation → off). CF rewrites `mailto:` in the SSR'd HTML, which mismatches React hydration. We also defensively render the email link in an effect-driven state in ServiceReport so SSR ships no mailto. ([developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/))
9. **Every page sets its meta via `usePageMeta` — NEVER an inline `useEffect` SEO block.** `usePageMeta` runs synchronously during `renderToString` (via the `serverMeta` singleton), so title/description/canonical/OG land in the *prerendered HTML*. A page that injects meta only in a `useEffect` ships the homepage's defaults in its static HTML (wrong `<title>`, canonical → `/`) because effects don't run during prerender — bad for SEO and what Google indexes first. JSON-LD is the one exception: `usePageMeta` doesn't do it, so add a slim schema-only `useEffect` (see Belleair/Treasure `usePageSchema`).
10. **No `backdrop-filter`/blur on mobile.** A global rule in `src/index.css` (`@media (max-width:767px){ *,::before,::after{ backdrop-filter:none !important } }`) disables it below 768px. On iOS Safari, blurred surfaces force a re-raster of everything behind them, and mounting/toggling them (nav drawer, quote sheet, sticky CTA, scroll-triggered navbar) blanks and repaints the whole page. Desktop keeps frosted glass, capped at **10px** (`backdrop-blur-[10px]`, not the old `-xl`/24px). Decorative `filter: blur()` glow orbs (`[class*="blur-["].rounded-full`) are also `display:none` on mobile.

## How nav actually works

**First visit (cold cache):**
1. Browser requests `/faq` → Cloudflare edge serves `/faq/index.html` (prerendered, ~30 KB brotli ~7 KB)
2. Browser parses HTML, sees `<link rel="modulepreload">` for react.js, motion.js, router.js, icons.js, and the entry script. Fetches in parallel.
3. Hero image and 3 fonts preload from `<link rel="preload">` in head.
4. React 19 `hydrateRoot()` runs over the existing DOM. No re-render. No white screen.

**Subsequent nav in the same session:**
1. User clicks `<Link to="/contact">` → React Router swaps `<Route>` instantly. No network. The page changes immediately because both pages are already in the JS bundle.
2. `usePageMeta` updates `<title>` and meta in the DOM head.
3. `ScrollToTop` scrolls to top.

**Critical chain on first visit:** HTML → CSS → react.js → motion.js + router.js + icons.js (parallel) → entry chunk → fonts → hero image. Anything blocking that chain hurts FCP/LCP. Anything else can be deferred (third-party scripts, Turnstile, etc.).

## Per-page above-the-fold preloading

Every page preloads **only the hero image and font weights it actually paints above the fold** — not one global set forced on all pages. A page that preloads a hero it doesn't show, or a font weight it doesn't render, wastes the critical request chain and delays the real LCP.

**How it's wired (extends the per-page meta pipeline):**

1. A page declares its above-fold assets in its `usePageMeta({ ... })` call:
   ```ts
   usePageMeta({
     title, description, canonicalPath,
     heroPreload: { mobile, desktop, wide },   // its LCP hero, responsive
     fontPreload: [...NAV_FONTS, FONTS.inter400, FONTS.montserrat900],
   });
   ```
2. `usePageMeta` (server path) writes `heroPreload`/`fontPreload` into the `serverMeta` singleton during `renderToString`.
3. `scripts/prerender.mjs` reads them and injects per-route `<link rel="preload">` tags into that page's `<head>`, **stripping the template defaults** so the page preloads only its own set.

**The helpers** (`src/lib/usePageMeta.ts`): `FONTS` maps named weights → woff2 paths; `NAV_FONTS` = the weights every page needs for the Navbar (`inter-600` + `montserrat-700`). Pages spread `NAV_FONTS` then add hero-specific weights.

**Current per-page sets:**
- **Homepage**: St-Pete hero + Inter 400/600, Montserrat 700/900, **Caveat 700** (the only page with the script accent).
- **Belleair**: St-Pete hero (it reuses that image) + Inter 400/600, Montserrat 700/900.
- **Treasure Island**: its *own* `treasure-island-hero-*` + Inter 400/600, Montserrat 700/900.
- **Content pages** (FAQ/Tools/Contact/etc.): **no hero preload**, fonts = the `index.html` default (`inter-600` + `montserrat-700` + `inter-400`). They don't render Montserrat 900 or Caveat, so they don't preload them.

**Rules:**
- The `index.html` `<head>` default font set is the **content-page baseline**. Hero pages override via `fontPreload`. Keep `inter-600` in the default — it's the dominant above-fold weight (nav semibold) and was previously missing, which made it a render-blocker.
- When adding a hero/city page, set both `heroPreload` and `fontPreload`, and point `heroPreload` at the image the page *actually paints* (check `hero-bg-*` in `index.css` — e.g. Belleair reuses the St-Pete image).
- To verify after build: `grep` the `dist/<route>/index.html` head for `preload" as="image"` and `preload" as="font"` — each route should list only its own.

## Files that matter most

- `src/App.tsx` — route table. Pages are `lazy()` (see non-negotiable #2), wrapped in one `<Suspense fallback={null}>`. Nav links use `SmartLink` to preload chunks on intent.
- `src/main.tsx` — `hydrateRoot` when `#root` has children, `createRoot` fallback for SPA-only paths.
- `src/entry-server.tsx` — server entry used by `scripts/prerender.mjs`. **Eager imports only** (no `lazy()` — `renderToString` bails on Suspense). If you add a page, import it here and add it to `PRERENDER_ROUTES`.
- `scripts/prerender.mjs` — post-build step that walks `PRERENDER_ROUTES`, writes `dist/<route>/index.html`, and injects per-page meta + hero/font preloads into each head.
- `src/lib/usePageMeta.ts` + `src/lib/serverMeta.ts` — populate per-page `<title>`, description, canonical, OG, **and `heroPreload`/`fontPreload`** into the SSR'd HTML head (and update the DOM on client-side route changes). `usePageMeta` also exports `FONTS` + `NAV_FONTS` (see Per-page preloading).
- `src/lib/turnstile.ts` — deferred-load Turnstile so the Quote popup paints instantly.
- `public/_headers` — Cloudflare cache config. Hashed assets get `immutable`, HTML gets `max-age=0, must-revalidate` (browser always revalidates with edge — fast 304).
- `vite.config.ts` — `manualChunks` keep `react`, `motion`, `router`, `lucide-react` in separate chunks so each is hashed-and-cached independently.

## Mobile performance budget

Targets on Slow 4G + 4× CPU throttle (Lighthouse mobile profile):

| Metric | Target | Why |
|---|---|---|
| FCP | < 1.5s | "Good" threshold |
| LCP | < 2.5s | Google ranking signal |
| TBT | < 200ms | Google ranking signal |
| CLS | < 0.1 | Set `width`/`height` on every `<img>` |

Current homepage LCP is ~3s on first load — bottlenecked on the hero image. Below-the-fold sections (FeatureGrid, ServiceAreas, Process, Services, CtaBand) have **no JS animations**; they're plain CSS. Motion is only used in Navbar drawer + QuoteSheet (interactive, off the critical path).

## Lessons learned the hard way this session

1. **"Prefetch other pages on idle" looked smart, was catastrophic.** `requestIdleCallback` fires almost immediately when the main thread isn't pegged — which is often during page load. The 12 parallel chunk requests stalled the LCP image. Lesson: don't prefetch JS chunks on a content marketing site. ([reactrouter.com/how-to/pre-rendering](https://reactrouter.com/how-to/pre-rendering))
2. **Lazy routes vs. one bundle — measure on a real iPhone, not in a lab.** Earlier guidance here was "ship one eager bundle." That was reversed: on real iPhone Safari the all-in-one bundle left click handlers dead for ~4s while React parsed all 12 pages, so `App.tsx` now uses `lazy()` + intent-preload (`SmartLink`). The lab (throttled Chromium) didn't show this — V8 parses far faster than iOS JSC. Lesson: validate bundle decisions on a physical iPhone; the lab understates parse cost.
3. **React 19's `renderToString` aborts on Suspense.** Any `lazy()` import inside a prerendered route produces `<template data-msg="Switched to client rendering...">` and breaks SSR for that route. The workaround for true streaming is `renderToPipeableStream` + `onAllReady`, but for a 13-page marketing site, just don't suspend during render.
4. **Cloudflare Email Address Obfuscation rewrites SSR'd `mailto:` links.** The fix: disable in CF dashboard (preferred), or wrap with `<!--email_off-->...<!--/email_off-->`. We also render email links in an effect to skip the issue entirely if the dashboard setting drifts.
5. **Inline style colors break hydration.** Move them to CSS classes; the browser normalizes inline `style="background-color:#1669AE"` to `rgb(...)` only on the client.
6. **Font weight count matters.** Trimmed from 5 weights per family to 3. Saved ~140 KB off first-load.
7. **`font-display: swap` on every `@font-face`.** Without it, text doesn't paint until the woff2 arrives.
8. **`backdrop-filter` blur was the #1 cause of real-iPhone jank** — far worse than the static glow orbs. On iOS each blurred surface re-rasters everything behind it; toggling one (drawer/popup/sticky-CTA close) blanked and repainted the page ("blank, then fades back in"). Killing all blur on mobile was the single biggest perceived-speed win. TBT stayed 0ms throughout — GPU cost is invisible to it. See non-negotiable #10.
9. **City pages had wrong prerendered SEO** because their meta ran in a client-only `useEffect`. The static HTML Google sees shipped the homepage title + canonical → `/`. Fixed by moving them to `usePageMeta`. See non-negotiable #9.
10. **Per-page preloads beat a global set.** Content pages were preloading the St-Pete hero (never shown) and Montserrat-900 (never rendered), while `inter-600` — needed on every page — wasn't preloaded at all. See "Per-page above-the-fold preloading."

## What to do if mobile feels slow

1. Run a real measurement script (Playwright + iPhone viewport + Slow 4G + 4× CPU). **Don't trust GTmetrix** — it gave us an E for "no gzip" when CF was actually serving brotli (Auto Minify is dead since 2024-08).
2. Look at the resource waterfall. The critical chain on mobile is: HTML → CSS → react.js → motion.js + router.js + icons.js + entry → fonts → hero image. Anything else loading in parallel is fine; anything blocking that chain isn't.
3. Verify there are **no hydration errors** in DevTools console. React #418 means a SSR/client mismatch is causing a full re-render — that alone adds ~200ms to TBT and probably looks like jank.
4. Check `cf-cache-status:` on the HTML response. `DYNAMIC` is OK (means Cloudflare hit the origin); `HIT` is great. If HTML is `BYPASS`, something's wrong with `_headers`.
5. If nav feels slow, confirm `SmartLink` intent-preloading is firing (chunk should download on `touchstart`/hover, before the click). `App.tsx` is lazy-loaded, so without intent-preload each `<Link>` click waits on a fetch.
6. If a page paints blank/janky on a real iPhone but the lab looks fine, suspect **GPU compositing**, not JS — `backdrop-filter`/blur and large `filter: blur()` glows don't show up in TBT. Confirm no blur leaked onto mobile (the `<=767px` `backdrop-filter:none` rule + glow-orb `display:none`).
7. Consider [React Compiler 1.0](https://www.infoq.com/news/2025/12/react-compiler-meta/) for automatic memoization — Meta reports ~10% LCP improvement.

## Don't deploy without

- `npm run lint` clean (it's just `tsc --noEmit`).
- `npm run build` succeeds and prints "Prerendered N/N routes".
- No `<template data-msg="Switched to client rendering...">` in any `dist/*/index.html` (grep for it).
- No hydration warnings when you open the deployed page in a real browser with DevTools open.
- Real mobile measurement (Slow 4G + 4× CPU) — FCP < 1.5s, LCP < 2.5s, TBT < 200ms on the homepage.
- Each `dist/<route>/index.html` head preloads only its own hero + fonts (grep for `preload" as="image"` / `as="font"`); content pages preload no hero.
- New/changed city pages: correct `<title>` + canonical in the *prerendered* HTML (they use `usePageMeta`, not an inline effect).
- No `backdrop-filter`/blur visible on a real phone (it's globally disabled `<768px`).
