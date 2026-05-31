---
name: seo
description: >-
  Audit and improve SEO for the Suncoast Pool Pros landing site (Vite + React +
  Tailwind v4). Covers local SEO (St. Petersburg / Pinellas / Tampa Bay),
  technical/meta (title, description, Open Graph, LocalBusiness schema, sitemap,
  robots), content/copy (keywords, headings, alt text), and performance (Core
  Web Vitals, image optimization). Use when asked to "improve SEO", "audit SEO",
  "add meta tags / schema", "check Core Web Vitals", or before a launch/deploy.
---

# SEO — Suncoast Pool Pros landing site

A single-page marketing site for a St. Petersburg, FL pool service. The business
is local-service: ranking for "pool cleaning St. Petersburg" and nearby cities
is the whole game. Optimize for **local intent + conversion**, not blog traffic.

## Business facts (keep these consistent everywhere — NAP consistency matters)

- **Name:** Suncoast Pool Pros
- **Phone:** (727) 295-3621
- **Service area:** St. Petersburg, Largo, Clearwater, Tampa + Pinellas County / Tampa Bay
- **Canonical domain:** https://suncoastpoolpros.com/
- **Primary keyword:** pool cleaning St. Petersburg (+ "flat-rate", "weekly pool service")

If you change the phone, name, or service area, update **every** occurrence
(`index.html`, components, schema, footer) — inconsistent NAP hurts local ranking.

## How to run an audit

1. Read `index.html`, `src/pages/LandingPage.tsx`, and `src/components/Hero.tsx`.
2. Walk the checklist below; report findings as **done / missing / broken**.
3. Only edit when asked. For copy/keyword changes, confirm wording with the user
   first (this site's copy is hand-tuned).
4. After any change, run `npm run lint` (tsc) and, for rendered output, build +
   screenshot via headless Chrome (see the `run` skill pattern).

## Checklist

### Technical / meta — lives in `index.html`
Per-page `<title>`, description, canonical, OG, and hero/font preloads are set
via `usePageMeta` (runs during prerender → lands in static HTML), NOT hardcoded
in `index.html`. `index.html` holds only site-wide defaults. Known gaps:

- [x] **Open Graph + Twitter** — DONE, set per-page via `usePageMeta`
      (`og:title/description/image/url/type/site_name` + `twitter:card` etc.).
      Verify in `dist/<route>/index.html`, not just `index.html`.
- [x] **LocalBusiness JSON-LD** — DONE. City pages (Belleair/Treasure) inject
      `LocalBusiness` + `FAQPage` via a `usePageSchema` effect; homepage has its
      own. When adding a city page, add the schema block. Only encode true facts;
      no `aggregateRating` unless real reviews back it.
- [x] **Favicon** — DONE (`<link rel="icon">` in `index.html`).
- [ ] **`robots.txt`** and **`sitemap.xml`** in `public/` — single page, but
      both should exist; sitemap lists the canonical URL.
- [ ] **`<html lang="en">`** — present, keep it.
- [ ] Title ≤ ~60 chars, description ≤ ~155 chars. Lead with the local keyword.

### Content / copy
- [ ] **Exactly one `<h1>`** — currently `src/components/Hero.tsx:148`. It must
      contain the primary local keyword intent. Never add a second h1.
- [ ] **Heading hierarchy** — section titles are `<h2>` via the `.section-heading`
      class (`src/index.css`); card titles `<h3>`. Don't skip levels.
- [ ] **Image alt text** — descriptive + local where natural. Good example:
      `src/components/Services.tsx:93`. The footer logo
      (`src/pages/LandingPage.tsx:41`) and service-report photos should have
      meaningful alt, not "image".
- [ ] **Keyword placement** — primary keyword in h1, title, description, and
      naturally in the first section. Don't keyword-stuff.
- [ ] **City names** as real text (not only in images) — the ServiceAreas
      section is the main local-relevance signal; keep cities crawlable.

### Local SEO
- [ ] NAP (name/address/phone) identical across page, schema, footer.
- [ ] `areaServed` in schema matches the cities shown on the page.
- [ ] Tel links use `tel:+1...` format (already done in several CTAs).
- [ ] Recommend (don't auto-do): Google Business Profile, consistent citations.

### Performance — Core Web Vitals
**The authoritative speed reference is the root `CLAUDE.md` ("site speed &
optimization") — read it first.** It documents the prerender pipeline, per-page
preloading, the mobile blur ban, the mobile motion-strip, and CSS inlining. This
section is just the SEO-audit checklist; don't duplicate CLAUDE.md here.

- [ ] **Per-page above-the-fold preloads.** Each page preloads only the hero
      image + font weights it paints, via `usePageMeta({ heroPreload, fontPreload })`
      → injected by `scripts/prerender.mjs`. NOT a global list in `index.html`
      anymore. When auditing a page, grep its `dist/<route>/index.html` head:
      it should preload its own hero (or none) and only the fonts it renders.
      Watch the sneaky one: a hero H1 with `font-display font-normal` =
      **Montserrat 400** (not Inter) — must be in that page's `fontPreload`.
- [ ] **LCP is often the headline TEXT, not the hero image** (the hero is a CSS
      `background-image`). So the font on the H1 is on the LCP path — preload it.
      Don't assume the image is LCP; check the PageSpeed "LCP element".
- [ ] **CLS** — give `<img>` explicit `width`/`height` (intrinsic ratio) even
      when CSS sizes them, so the box is reserved before load. SVG logos need it.
- [ ] **No blur on mobile** — `backdrop-filter` and large `filter: blur()` glows
      are disabled `<768px` (they caused real-iPhone jank). Don't reintroduce
      blur on mobile; desktop frosted glass is capped at 10px. See CLAUDE.md.
- [ ] **Every page's meta via `usePageMeta`, never an inline `useEffect`** — or
      its prerendered HTML ships the homepage title/canonical (bad for indexing).
- [ ] Verify with `npm run build` + a real-device-profile PageSpeed/Lighthouse
      run on the deploy. Don't trust desktop-Chromium-only numbers; GPU and font
      cost on real iPhones is what bites. All these audits are "Unscored"
      diagnostics — fix the ones with real latency (font long-poles), skip the
      cosmetic ones (e.g. "unused JS" in the React vendor chunk; cache lifetimes
      are already `immutable`/1yr).

## Guardrails
- Don't invent reviews, ratings, addresses, or claims for schema — only encode
  what's verifiably true. False `aggregateRating` is a Google penalty risk.
- Don't break the hero preload chain or convert the LCP image to lazy load.
- Keep copy changes truthful to how the service actually works (e.g. leak
  detection is chemistry-inferred via stabilizer/calcium hardness, not a sensor).
- Confirm keyword/copy edits with the user before applying.
