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
11. **Defer interaction-triggered third-party scripts OFF the interaction's critical path.** GA4 loads on the first user interaction (`App.tsx`), but the first interaction is often the *hamburger tap* — and gtag.js parses/executes ~190ms on the main thread, freezing the nav drawer's open. `initAnalytics()` is now scheduled via `setTimeout(…, 1200)` (clears the open animation) **then** `requestIdleCallback`. Don't move it back to a synchronous call in the interaction handler. **This is invisible to the lab: analytics only runs on the prod hostname** (`suncoastpoolpros.com`), so local/preview/Lighthouse never see the block — measure on the live site (see "What to do if mobile feels slow").
12. **Overlays slide via CSS transforms, not Framer Motion, and the nav drawer is pre-mounted.** The nav drawer + quote sheet animate with composited CSS `transform` transitions (`.overlay-*` in `index.css`), NOT `m.*`/`AnimatePresence` — a JS tween runs on the main thread and stutters; a transform transition runs on the compositor and stays smooth even while React works. The **nav drawer is mounted once after hydration and kept in the DOM off-screen** (`inert` + `pointer-events:none` when closed), so opening is a class toggle — no on-tap React mount, no frame wait. Body scroll-lock uses `useScrollLock` (`position:fixed` pin), NOT `overflow:hidden` (a no-op for touch scroll on iOS). See "Overlays (nav drawer + quote sheet)".

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

## Mobile motion & animation (strip on mobile, keep on desktop)

JS-driven animation is the other big real-iPhone cost (alongside blur). The rule: **page animations play on desktop, are stripped on mobile; interactive overlay animations (nav drawer, quote sheet) play on both.**

**How it's wired:**

- `App.tsx` wraps `<Routes>` in `<MotionConfig reducedMotion={isMobile ? 'always' : 'never'}>` (via a `useIsMobile` hook, `max-width:767px`). On mobile every `<m.*>` renders at its **final** state (no animation); desktop animates normally. `useIsMobile` starts `false` to match SSR/first paint, then flips after mount.
- **Force-visible CSS safety net** (`src/index.css`, `@media (max-width:767px)`): `.force-static-motion [style*="opacity"] { opacity:1 !important }` (+ `transform:none`). This exists because below-fold `whileInView`+`viewport{once:true}` elements re-run their lifecycle when an overlay opens/closes and get **stuck invisible** (whileInView won't re-fire). Forcing them visible on mobile prevents that. **Every page's root wrapper carries the `.force-static-motion` class.**
- **Keep the nav drawer + quote sheet animating on mobile.** The drawer is **portaled to `document.body`** (`createPortal` in `Navbar.tsx`) so it renders *outside* `.force-static-motion` and the force-visible rule can't flatten its staggered entrance. It also has its own nested `<MotionConfig reducedMotion="never">`. The quote sheet renders from `QuoteSheetProvider` at the app root, already outside `.force-static-motion`.

**Gotchas:**
- Don't use a complex `:not(.x *)` (descendant combinator inside `:not()`) to exclude a subtree from the force-visible rule — it's unreliable on Safari and silently flattened the drawer. Use a portal (drawer) or render outside the marker instead.
- If you add a desktop page animation, it auto-strips on mobile — no per-element work needed. If you add an overlay that must animate on mobile, portal it out of `.force-static-motion` + wrap in `reducedMotion="never"`.
- `entry-server.tsx` has its own `reducedMotion="user"` MotionConfig (SSR path) — harmless, separate from the client `App.tsx` one.

## Other mobile/iOS fixes baked in (don't regress these)

- **CSS is inlined into each page's `<head>`** by `prerender.mjs` (a `<style>` block, with the render-blocking `<link>` dropped — only a `<noscript>` fallback link remains). This removes the render-blocking stylesheet round-trip on cold mobile loads. Inline-only (not inline + async link) is correct here: it's an SPA, so in-app nav never re-fetches CSS — a cached link would only double-download on first visit. Cost: ~13 KB brotli more HTML per direct page load.
- **`viewport-fit=cover`** is in the `index.html` viewport meta, and `html, body { background:#07111c }` — without these, the iOS home-indicator safe-area strip rendered **white** under the fixed sticky CTA, and `env(safe-area-inset-bottom)` returned 0. The sticky CTA uses `pb-[max(0.5rem,env(safe-area-inset-bottom))]` (max, not `0.75rem + inset`, which over-padded).
- **`ChunkErrorBoundary`** (`src/components/`) wraps the lazy routes: if a `lazy()` import fails (commonly a stale hashed chunk after a deploy — iOS keeps pages alive across deploys), it hard-reloads once instead of leaving a permanent blank page (was reproducible by tapping a footer link on iOS). sessionStorage one-shot guards against reload loops.
- **Full-height heros use `min-h-dvh`** (not `min-h-screen`/`100vh`) so they fill the *visible* iOS viewport without the URL-bar overshoot, and the next section starts at the true fold. Only the hero sections; page wrappers stay `min-h-screen`.
- **Heavy phone mockups are desktop-only in the hero + rendered in a separate `lg:hidden` section below on mobile** (homepage `HomeHeroPhoneSection`, Treasure `PhoneShowcaseMobile`) — keeps the mockup out of the above-the-fold 100vh on phones.
- **Decorative mockup labels are `<p>`, not `<h2>`** — the ServiceReport "Water Chemistry / Chemicals Added / …" labels were polluting the page heading outline. Keep UI-graphic text out of `<h1>`–`<h6>`.

## Overlays (nav drawer + quote sheet)

Both overlays must open **instantly and slide smoothly on a real iPhone** — the place this was hardest to get right. The pattern (don't regress it):

- **Slide = composited CSS transform, not Framer Motion.** `.overlay-scrim` / `.overlay-panel-right` (drawer) / `.overlay-panel-bottom` (sheet) in `src/index.css` animate `transform`/`opacity` via CSS transition. A JS tween (`m.*` animating `x`/`y`, or a spring) runs on the main thread and stuttered; a transform transition runs on the **compositor**, so it stays smooth even while the main thread is busy. The old `m.*`/`AnimatePresence`/`MotionConfig` were removed from both overlays.
- **Nav drawer is PRE-MOUNTED** (`src/components/Navbar.tsx`): mounted once after hydration (gated on a `hydrated` state so it's never in the prerendered HTML) and parked off-screen at `translateX(100%)`. Opening just toggles `is-open` → no on-tap React mount, no animation-frame wait → instant. When closed it's `inert` + `pointer-events:none` (CSS `.nav-drawer`), and `overflow:hidden` keeps the parked panel from adding horizontal scroll.
- **Quote sheet is MOUNT-ON-OPEN** (`src/components/QuoteSheet.tsx`) via `useOverlayTransition` (mount → next frame add `is-open` → transition; remove → unmount after the duration). It is NOT pre-mounted: it hosts the heavy `QuoteChooser` form, so keeping it always-mounted would tax every page load. If its open ever feels slow, warm it on intent (mount on the trigger's `pointerdown`, like `SmartLink`) — don't pre-mount the form.
- **Scroll-lock = `useScrollLock` (`src/lib/`)**, a `position:fixed` body pin with scroll restore — NOT `overflow:hidden`, which does nothing for touch scroll on iOS (the page behind an open overlay would still drift). Safe here because scrollbars are globally hidden (no layout shift).
- **The drawer's open lag had TWO causes, both invisible to the lab.** (1) gtag.js ran ~190ms on the first tap — see non-negotiable #11. (2) the drawer mounted on tap — fixed by pre-mounting. Traced tap→first-paint dropped from a ~190ms main-thread block to ~28ms with the main thread free. Diagnosed with `scripts/trace-drawer.mjs` + `trace-timing.mjs` against the **live** site.

## Files that matter most

- `src/App.tsx` — route table. Pages are `lazy()` (see non-negotiable #2), wrapped in one `<Suspense fallback={null}>`. Nav links use `SmartLink` to preload chunks on intent.
- `src/main.tsx` — `hydrateRoot` when `#root` has children, `createRoot` fallback for SPA-only paths.
- `src/entry-server.tsx` — server entry used by `scripts/prerender.mjs`. **Eager imports only** (no `lazy()` — `renderToString` bails on Suspense). If you add a page, import it here and add it to `PRERENDER_ROUTES`.
- `scripts/prerender.mjs` — post-build step that walks `PRERENDER_ROUTES`, writes `dist/<route>/index.html`, and injects per-page meta + hero/font preloads into each head.
- `src/lib/usePageMeta.ts` + `src/lib/serverMeta.ts` — populate per-page `<title>`, description, canonical, OG, **and `heroPreload`/`fontPreload`** into the SSR'd HTML head (and update the DOM on client-side route changes). `usePageMeta` also exports `FONTS` + `NAV_FONTS` (see Per-page preloading).
- `src/lib/turnstile.ts` — deferred-load Turnstile so the Quote popup paints instantly.
- `public/_headers` — Cloudflare cache config. Hashed assets get `immutable`, HTML gets `max-age=0, must-revalidate` (browser always revalidates with edge — fast 304).
- `vite.config.ts` — `manualChunks` keep `react`, `motion`, `router`, `lucide-react` in separate chunks so each is hashed-and-cached independently.
- `src/lib/useScrollLock.ts` + `src/lib/useOverlayTransition.ts` — overlay primitives (iOS-safe scroll-lock; CSS mount/visibility timing). See "Overlays".
- `scripts/trace-drawer.mjs` + `scripts/trace-timing.mjs` — CPU-throttled drawer-open trace (puppeteer-core + system Chrome). Run against the **live** site to catch main-thread blocks on tap (analytics, mount cost) that the lab misses.

## Mobile performance budget

Targets on Slow 4G + 4× CPU throttle (Lighthouse mobile profile):

| Metric | Target | Why |
|---|---|---|
| FCP | < 1.5s | "Good" threshold |
| LCP | < 2.5s | Google ranking signal |
| TBT | < 200ms | Google ranking signal |
| CLS | < 0.1 | Set `width`/`height` on every `<img>` |

Below-the-fold homepage sections (FeatureGrid, ServiceAreas, Process, Services, CtaBand) are plain CSS, no JS animation. The hero text/phone columns DO use `m.*` entrance animations (desktop only — stripped on mobile by the motion system above). City-page below-folds use `whileInView` reveals (also desktop-only on mobile). See "Mobile motion & animation."

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
11. **JS animation, not just blur, janks real iPhones — strip page motion on mobile.** `whileInView`/entrance animations across the site were stuttering on phones while the lab looked fine (GPU/compositing, invisible to TBT). Global `MotionConfig reducedMotion` on mobile fixed it. Keep interactive overlays (drawer/sheet) animating via portal + nested `reducedMotion="never"`.
12. **A complex `:not(.x *)` to exclude a subtree is unreliable on Safari.** It silently flattened the nav drawer's entrance animation on iOS. Portal the overlay out of the scoped wrapper instead of trying to exclude it via CSS.
13. **Inline CSS removes the render-blocking stylesheet on cold loads** — but inline-*only* (drop the `<link>`), not inline + async link, for an SPA (in-app nav never re-fetches CSS). Done in `prerender.mjs`.
14. **iOS safe area renders white without `viewport-fit=cover`** + a dark `html/body` background, and `env(safe-area-inset-*)` returns 0. Use `max(floor, env(...))` for safe-area padding, not `floor + env(...)`.
15. **A failed `lazy()` chunk = permanent blank page** (Suspense `fallback={null}` shows nothing, no recovery) — common with stale chunks after a deploy on iOS. `ChunkErrorBoundary` hard-reloads once to recover.
16. **Use `min-h-dvh` for full-height heros, not `100vh`/`min-h-screen`** — `100vh` overshoots behind the iOS URL bar, leaving the next section peeking into the fold.
17. **Title tags: lead with keyword + city, 40–60 chars, city-page statement hooks.** Separator (pipe/dash) has no proven CTR edge — front-loading + length + audience-matched wording do. Belleair → "Never a Missed Visit" (absentee owners); Treasure → "Always Guest-Ready" (rentals).
18. **A laggy nav drawer was analytics + on-tap mount, NOT the animation.** Spent a round rewriting the slide (Framer → CSS) with no perceived improvement, because the real cost was elsewhere: gtag.js ran ~190ms on the first tap (only on the prod hostname, so every local/Lighthouse run looked clean), and the drawer mounted on tap. Fixes: defer gtag past the open animation (non-negotiable #11) + pre-mount the drawer (see "Overlays"). Lesson: when an interaction feels slow, **trace the interaction on the live site first** (`scripts/trace-drawer.mjs`) — don't assume it's the animation, and don't trust local where third-party scripts are gated off.

## What to do if mobile feels slow

1. Run a real measurement script (Playwright + iPhone viewport + Slow 4G + 4× CPU). **Don't trust GTmetrix** — it gave us an E for "no gzip" when CF was actually serving brotli (Auto Minify is dead since 2024-08).
2. Look at the resource waterfall. The critical chain on mobile is: HTML → CSS → react.js → motion.js + router.js + icons.js + entry → fonts → hero image. Anything else loading in parallel is fine; anything blocking that chain isn't.
3. Verify there are **no hydration errors** in DevTools console. React #418 means a SSR/client mismatch is causing a full re-render — that alone adds ~200ms to TBT and probably looks like jank.
4. Check `cf-cache-status:` on the HTML response. `DYNAMIC` is OK (means Cloudflare hit the origin); `HIT` is great. If HTML is `BYPASS`, something's wrong with `_headers`.
5. If nav feels slow, confirm `SmartLink` intent-preloading is firing (chunk should download on `touchstart`/hover, before the click). `App.tsx` is lazy-loaded, so without intent-preload each `<Link>` click waits on a fetch.
6. If a page paints blank/janky on a real iPhone but the lab looks fine, suspect **GPU compositing**, not JS — `backdrop-filter`/blur and large `filter: blur()` glows don't show up in TBT. Confirm no blur leaked onto mobile (the `<=767px` `backdrop-filter:none` rule + glow-orb `display:none`).
7. Consider [React Compiler 1.0](https://www.infoq.com/news/2025/12/react-compiler-meta/) for automatic memoization — Meta reports ~10% LCP improvement.
8. **If a specific interaction (menu/sheet open) feels slow, trace the interaction itself — on the LIVE site.** `node scripts/trace-drawer.mjs https://suncoastpoolpros.com/` then `node scripts/trace-timing.mjs /tmp/drawer-trace.json`. It breaks the tap down into Scripting/Layout/Paint and shows *when* each runs relative to the tap. Run it against production, not local: third-party scripts (GA) only fire on the prod hostname, so a local trace hides exactly the kind of main-thread block that froze the drawer open.

## Don't deploy without

- `npm run lint` clean (it's just `tsc --noEmit`).
- `npm run build` succeeds and prints "Prerendered N/N routes".
- No `<template data-msg="Switched to client rendering...">` in any `dist/*/index.html` (grep for it).
- No hydration warnings (React #418) in the deployed page's console — inline `style={{}}` colors/shadows on SSR'd elements are the usual cause (non-negotiable #4).
- Real mobile measurement (Slow 4G + 4× CPU) — FCP < 1.5s, LCP < 2.5s, TBT < 200ms on the homepage.
- On a real iPhone: no white safe-area strip under the sticky CTA; nav drawer entrance animates; footer/nav links don't land on a blank page; no blur visible.
- New/changed pages: correct `<title>`/canonical in the *prerendered* HTML; each route's `<head>` preloads only its own hero + fonts; root wrapper has `.force-static-motion`.
- Each `dist/<route>/index.html` head preloads only its own hero + fonts (grep for `preload" as="image"` / `as="font"`); content pages preload no hero.
- New/changed city pages: correct `<title>` + canonical in the *prerendered* HTML (they use `usePageMeta`, not an inline effect).
- No `backdrop-filter`/blur visible on a real phone (it's globally disabled `<768px`).
