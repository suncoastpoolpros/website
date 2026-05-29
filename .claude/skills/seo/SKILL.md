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
Current baseline already has: `<title>`, `meta description`, `theme-color`,
`canonical`, and hero image `preload`s. Known gaps to flag/fix:

- [ ] **Open Graph** — `og:title`, `og:description`, `og:image` (1200×630),
      `og:url`, `og:type=website`, `og:site_name`. None exist yet.
- [ ] **Twitter card** — `twitter:card=summary_large_image` + title/desc/image.
- [ ] **LocalBusiness JSON-LD** — add a `<script type="application/ld+json">`
      block. Use schema type `LocalBusiness` (or `HomeAndConstructionBusiness`)
      with name, telephone, areaServed (the cities), url, priceRange `$$`,
      and `aggregateRating` only if real reviews back it.
- [ ] **Favicon / apple-touch-icon** — `logo.svg` exists in `public/` but isn't
      linked. Add `<link rel="icon">`.
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
This is a Vite SPA; the hero image is the likely LCP element.
- [ ] **LCP** — hero images are preloaded + served as `.webp` responsive sizes
      (`public/hero-bg-*.webp`). Keep the `preload` links in sync with any new
      breakpoints. Don't lazy-load the LCP/hero image.
- [ ] **Lazy-load below-the-fold images** — `loading="lazy"` on the Services
      pool photo, testimonial avatars, etc. (NOT the hero).
- [ ] **CLS** — give images explicit width/height or aspect-ratio so layout
      doesn't shift as they load.
- [ ] **Bundle** — `motion` (Framer) is the heavy dep; flag if animations grow.
- [ ] Verify with `npm run build` and a Lighthouse/PageSpeed run on the deploy.

## Guardrails
- Don't invent reviews, ratings, addresses, or claims for schema — only encode
  what's verifiably true. False `aggregateRating` is a Google penalty risk.
- Don't break the hero preload chain or convert the LCP image to lazy load.
- Keep copy changes truthful to how the service actually works (e.g. leak
  detection is chemistry-inferred via stabilizer/calcium hardness, not a sensor).
- Confirm keyword/copy edits with the user before applying.
