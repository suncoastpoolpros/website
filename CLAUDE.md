# Suncoast Pool Pros — site speed & optimization

Quick reference for keeping the marketing site fast on **mobile** (Slow 4G, real iPhones) without breaking SEO. Desktop perf is easy here; mobile is the constraint. Rooted in current (2025) authoritative guidance from react.dev, reactrouter.com, developers.cloudflare.com.

## Architecture in 4 sentences

- **Vite + React 19 SPA**, statically prerendered to HTML at build time via a custom Node script (`scripts/prerender.mjs`) that uses `renderToString` on `src/entry-server.tsx`.
- Every public route ships as a real static `dist/<route>/index.html` with the rendered React tree baked into `#root`. The client `hydrateRoot`s on top, then nav stays SPA-style (instant in-app `<Route>` swap, no network).
- **Cloudflare Pages** serves the static HTML at the edge with brotli (level 4) — Auto Minify was deprecated Aug 2024, so Vite minifies at build time. `public/_headers` sets immutable caching for `/assets/*`, `/fonts/*`, and images.
- Cross-page nav uses React Router's `<Link to="...">`. After the first prerendered page hydrates, every subsequent click is in-app — no network round-trip.

## The non-negotiables

1. **Every public route MUST be prerendered.** Add its path to `PRERENDER_ROUTES` in `src/entry-server.tsx`. If a page isn't in there, it ships as an empty `<div id="root">` and LCP collapses.
2. **All routes are eagerly imported.** `App.tsx` and `entry-server.tsx` both `import { LandingPage } from '@/pages/LandingPage'` — never `lazy(() => import(...))`. One bigger bundle (~150 KB gz) is the right tradeoff for a 13-page marketing site because nav becomes instant. (Authoritative: [reactrouter.com/how-to/spa](https://reactrouter.com/how-to/spa))
3. **Don't add `<Suspense>` to any prerender path.** `renderToString` is synchronous and renders the Suspense fallback instead of waiting. The suspended content fills only client-side, defeating SSR for that subtree. ([react.dev/reference/react-dom/server/renderToString](https://react.dev/reference/react-dom/server/renderToString))
4. **Don't write inline `style={{ color: '#hex', textShadow: '...', backgroundColor: '#hex' }}` for SSR'd elements.** The browser re-serializes these (`#1669AE` → `rgb(22, 105, 174)`, shadow descriptors get reordered) which mismatches the SSR'd HTML and triggers React #418 + a full client re-render. Use CSS classes in `src/index.css` instead.
5. **Don't load Turnstile or other third-party scripts on component mount.** Defer until the user actually needs them (Turnstile loads on form submit, not on popup open). See `src/lib/turnstile.ts`.
6. **Don't add render-blocking external `<link>` or `<script>` to `index.html`.** Self-host fonts; no Google Fonts `@import`. Trim to the weights you actually use (currently Inter 400/600/700 + Montserrat 400/700/900 + Caveat 700).
7. **Don't prefetch other route chunks on idle.** Even if we go back to `lazy()` for some heavy page, don't `requestIdleCallback`-prefetch all the others. This was tried and swamped Slow 4G with parallel requests that pushed the LCP image to the back of the queue, delaying FCP by ~500ms.
8. **Cloudflare Email Address Obfuscation must be OFF in the dashboard** (Scrape Shield → Email Address Obfuscation → off). CF rewrites `mailto:` in the SSR'd HTML, which mismatches React hydration. We also defensively render the email link in an effect-driven state in ServiceReport so SSR ships no mailto. ([developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/))

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

## Files that matter most

- `src/App.tsx` — route table. **Eager imports only.** No `<Suspense>` wrapper.
- `src/main.tsx` — `hydrateRoot` when `#root` has children, `createRoot` fallback for SPA-only paths.
- `src/entry-server.tsx` — server entry used by `scripts/prerender.mjs`. **Mirror App.tsx's imports.** If you add a page here, add it to `PRERENDER_ROUTES` too.
- `scripts/prerender.mjs` — post-build step that walks `PRERENDER_ROUTES` and writes `dist/<route>/index.html`.
- `src/lib/usePageMeta.ts` + `src/lib/serverMeta.ts` — populate per-page `<title>`, description, canonical, OG tags into the SSR'd HTML head (and update the DOM on client-side route changes).
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
2. **Lazy-loading routes on a small prerendered site is the wrong default.** Each `<Link>` click triggers a fetch + parse on the slow radio. Drop route-level `React.lazy()`; ship one bundle. Reserve `lazy()` for genuinely heavy *optional* features (lightboxes, video players) — not for normal page components.
3. **React 19's `renderToString` aborts on Suspense.** Any `lazy()` import inside a prerendered route produces `<template data-msg="Switched to client rendering...">` and breaks SSR for that route. The workaround for true streaming is `renderToPipeableStream` + `onAllReady`, but for a 13-page marketing site, just don't suspend during render.
4. **Cloudflare Email Address Obfuscation rewrites SSR'd `mailto:` links.** The fix: disable in CF dashboard (preferred), or wrap with `<!--email_off-->...<!--/email_off-->`. We also render email links in an effect to skip the issue entirely if the dashboard setting drifts.
5. **Inline style colors break hydration.** Move them to CSS classes; the browser normalizes inline `style="background-color:#1669AE"` to `rgb(...)` only on the client.
6. **Font weight count matters.** Trimmed from 5 weights per family to 3. Saved ~140 KB off first-load.
7. **`font-display: swap` on every `@font-face`.** Without it, text doesn't paint until the woff2 arrives.

## What to do if mobile feels slow

1. Run a real measurement script (Playwright + iPhone viewport + Slow 4G + 4× CPU). **Don't trust GTmetrix** — it gave us an E for "no gzip" when CF was actually serving brotli (Auto Minify is dead since 2024-08).
2. Look at the resource waterfall. The critical chain on mobile is: HTML → CSS → react.js → motion.js + router.js + icons.js + entry → fonts → hero image. Anything else loading in parallel is fine; anything blocking that chain isn't.
3. Verify there are **no hydration errors** in DevTools console. React #418 means a SSR/client mismatch is causing a full re-render — that alone adds ~200ms to TBT and probably looks like jank.
4. Check `cf-cache-status:` on the HTML response. `DYNAMIC` is OK (means Cloudflare hit the origin); `HIT` is great. If HTML is `BYPASS`, something's wrong with `_headers`.
5. If nav still feels slow, confirm pages are eagerly imported in both `App.tsx` and `entry-server.tsx`. The instant nav depends on every route being already in the JS bundle.
6. Consider [React Compiler 1.0](https://www.infoq.com/news/2025/12/react-compiler-meta/) for automatic memoization — Meta reports ~10% LCP improvement.

## Don't deploy without

- `npm run lint` clean (it's just `tsc --noEmit`).
- `npm run build` succeeds and prints "Prerendered N/N routes".
- No `<template data-msg="Switched to client rendering...">` in any `dist/*/index.html` (grep for it).
- No hydration warnings when you open the deployed page in a real browser with DevTools open.
- Real mobile measurement (Slow 4G + 4× CPU) — FCP < 1.5s, LCP < 2.5s, TBT < 200ms on the homepage.
