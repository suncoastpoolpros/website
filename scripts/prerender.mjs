// Post-build prerender script. Runs after `vite build` (client) and
// `vite build --ssr src/entry-server.tsx` (server). For each route in
// PRERENDER_ROUTES, calls render(url) to get the rendered HTML body + per-page
// meta (title, description, canonical, OG), then injects both into the static
// HTML template Vite produced and writes the result to dist/<route>/index.html.
//
// The end state: a real static site. Visiting /faq fetches a fully-rendered
// HTML file with content already in it. React still hydrates after the JS
// loads — so animations and interactivity work — but first paint is instant.

import { promises as fs } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const ROOT = path.resolve(process.argv[1], '..', '..');
const CLIENT_DIST = path.join(ROOT, 'dist');
const SERVER_DIST = path.join(ROOT, 'dist-ssr');
const SERVER_ENTRY = path.join(SERVER_DIST, 'entry-server.js');
const TEMPLATE = path.join(CLIENT_DIST, 'index.html');

const escapeHtml = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Replace or insert per-page meta tags into the HTML head. Idempotent: if a
 * tag already exists (e.g. <title> from index.html), it is replaced in-place.
 */
function injectHead(html, meta) {
  let out = html;
  const replacements = [];

  if (meta.title) {
    out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`);
  }
  if (meta.description) {
    out = out.replace(
      /<meta name="description"[^>]*\/?>/,
      `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    );
  }
  if (meta.canonicalUrl) {
    out = out.replace(
      /<link rel="canonical"[^>]*\/?>/,
      `<link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}" />`,
    );
  }

  // Robots noindex for opt-in pages (transactional/thank-you). Injected right
  // after the canonical so it's in the static HTML Google reads. Indexable
  // pages get no robots tag (default = index,follow).
  if (meta.noindex) {
    out = out.replace(
      '</head>',
      `  <meta name="robots" content="noindex,follow" />\n  </head>`,
    );
  }

  // Per-page LCP hero preload. The template ships the homepage (St. Pete) hero
  // preloads; if this page declares its own hero, swap those out so the page
  // preloads only its real LCP image (e.g. Belleair/Treasure heroes) instead of
  // wasting the critical path on an image it doesn't paint.
  if (meta.heroPreload) {
    // Drop every hero <link rel="preload" as="image"> the template hardcoded.
    out = out.replace(/\s*<link rel="preload" as="image"[^>]*\/?>/g, '');
    const h = meta.heroPreload;
    // These media queries MUST mirror how the CSS actually picks the file, or
    // the browser preloads one hero and then paints a different one —
    // downloading both. The `.hero-bg-*` rules use `image-set(… 1x, …-1920 2x)`,
    // which selects purely on DEVICE PIXEL RATIO; the preloads used to select on
    // WIDTH, so the two disagreed in both directions:
    //   • tablet/laptop ≥768px at DPR2 preloaded the 1x but painted the 2x
    //     (measured 588KB of hero on an 820px retina tablet — two full images,
    //     LCP 4.8s on Slow 4G)
    //   • ≥1536px at DPR1 preloaded the 2x but painted the 1x
    // So gate the ≥768px preloads on resolution, exactly like image-set. Mobile
    // stays width-only because `.hero-bg-mobile` ships a single DPR-agnostic
    // entry. A browser without `resolution` media support simply doesn't preload
    // and falls back to loading via CSS — slower, never wrong.
    // fetchpriority="high" is the actual LCP lever here. Halving the tablet hero
    // (330KB -> 154KB) moved tablet LCP only 2664ms -> 2516ms, because the hero
    // was not bandwidth-starved for its own size — it was queued behind the JS
    // chunks. Raising its priority lets it start ahead of them. Only one of these
    // media queries can match, so exactly one image is ever high-priority.
    //
    // A page may declare a TABLET variant. image-set() picks on DPR alone, so a
    // 2x tablet otherwise receives the full desktop/wide file (measured: 330KB
    // on an 820px tablet, LCP 2664ms vs 544ms on mobile). When `tablet` is set,
    // the 768–1023 band takes it at any DPR and the DPR split starts at 1024 —
    // which must mirror the media query on the matching `.hero-bg-*` rule.
    const wide = h.wide || h.desktop;
    const dprFloor = h.tablet ? 1024 : 768;
    const imgPreloads = [
      `<link rel="preload" as="image" fetchpriority="high" href="${escapeHtml(h.mobile)}" type="image/webp" media="(max-width: 767px)" />`,
    ];
    if (h.tablet) {
      imgPreloads.push(
        `<link rel="preload" as="image" fetchpriority="high" href="${escapeHtml(h.tablet)}" type="image/webp" media="(min-width: 768px) and (max-width: 1023px)" />`,
      );
    }
    imgPreloads.push(
      `<link rel="preload" as="image" fetchpriority="high" href="${escapeHtml(h.desktop)}" type="image/webp" media="(min-width: ${dprFloor}px) and (max-resolution: 1.99dppx)" />`,
      `<link rel="preload" as="image" fetchpriority="high" href="${escapeHtml(wide)}" type="image/webp" media="(min-width: ${dprFloor}px) and (min-resolution: 2dppx)" />`,
    );
    out = out.replace('</head>', `  ${imgPreloads.join('\n    ')}\n  </head>`);
  }

  // Per-page font preload. The template ships a default set; if this page
  // declares its own above-the-fold fonts, swap them so the route preloads only
  // the weights it actually paints (and not ones it doesn't, e.g. Caveat off the
  // homepage or Montserrat-900 on content pages).
  if (meta.fontPreload && meta.fontPreload.length) {
    out = out.replace(/\s*<link rel="preload" as="font"[^>]*\/?>/g, '');
    // De-dupe by href. Each family is now a single variable file, so a page
    // still listing weights individually (FONTS.inter400 + FONTS.inter600 …)
    // resolves to the same URL several times — emitting it twice would make the
    // browser warn and waste a head entry. An unconditional entry also wins
    // over a media-gated one for the same file.
    const seen = new Map();
    for (const f of meta.fontPreload) {
      const href = typeof f === 'string' ? f : f.href;
      const media = typeof f === 'string' ? '' : f.media;
      if (!seen.has(href) || !media) seen.set(href, media);
    }
    const fontPreloads = [...seen].map(([href, media]) => {
      const mediaAttr = media ? ` media="${escapeHtml(media)}"` : '';
      return `<link rel="preload" as="font" type="font/woff2" href="${escapeHtml(href)}" crossorigin${mediaAttr} />`;
    });
    out = out.replace('</head>', `  ${fontPreloads.join('\n    ')}\n  </head>`);
  }

  // OG + Twitter tags — these don't exist in index.html, so append them inside
  // <head> right before </head>.
  if (meta.title) replacements.push(`<meta property="og:title" content="${escapeHtml(meta.title)}" />`);
  if (meta.description) replacements.push(`<meta property="og:description" content="${escapeHtml(meta.description)}" />`);
  if (meta.canonicalUrl) replacements.push(`<meta property="og:url" content="${escapeHtml(meta.canonicalUrl)}" />`);
  replacements.push(`<meta property="og:type" content="website" />`);
  replacements.push(`<meta property="og:site_name" content="Suncoast Pool Pros" />`);
  // Branded 1200x630 share image → large-image link previews (iMessage, FB,
  // LinkedIn, etc.). One sitewide image. Absolute URL + VERSIONED filename so
  // it bypasses the immutable /*.png edge cache when it changes (bump -vN). This
  // also fixes the orange iMessage tile: with no og:image, iOS fell back to the
  // app icon and tinted the card from its orange sun.
  const OG_IMAGE = 'https://suncoastpoolpros.com/og-image-v1.png';
  replacements.push(`<meta property="og:image" content="${OG_IMAGE}" />`);
  replacements.push(`<meta property="og:image:width" content="1200" />`);
  replacements.push(`<meta property="og:image:height" content="630" />`);
  replacements.push(`<meta property="og:image:alt" content="Suncoast Pool Pros — Flat-Rate Weekly Pool Service" />`);
  replacements.push(`<meta property="og:locale" content="en_US" />`);
  replacements.push(`<meta name="twitter:card" content="summary_large_image" />`);
  replacements.push(`<meta name="twitter:image" content="${OG_IMAGE}" />`);
  replacements.push(`<meta name="twitter:image:alt" content="Suncoast Pool Pros — Flat-Rate Weekly Pool Service" />`);
  if (meta.title) replacements.push(`<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`);
  if (meta.description) replacements.push(`<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`);

  out = out.replace('</head>', `  ${replacements.join('\n    ')}\n  </head>`);

  // Per-page JSON-LD, emitted STATICALLY. Previously each page injected its
  // graph from a useEffect, which means the HTML a crawler reads on first fetch
  // carries none of it — Google does render JS, but static is strictly safer and
  // costs nothing here. `data-page-schema` marks it so the client hook adopts
  // this tag instead of appending a duplicate. Escape `</script` and U+2028/9 so
  // the payload can't break out of the script element.
  if (meta.jsonLd && meta.jsonLd.length) {
    const ld = JSON.stringify(meta.jsonLd)
      .replace(/<\/script/gi, '<\\/script')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
    out = out.replace(
      '</head>',
      `  <script type="application/ld+json" data-page-schema>${ld}</script>\n  </head>`,
    );
  }

  return out;
}

/**
 * Hoist React 19's auto-emitted resource links out of the app HTML.
 *
 * React 19 preloads images it renders (`<img src>`) by emitting a
 * `<link rel="preload" as="image">`. With the streaming APIs those "hoistables"
 * go into <head>; `renderToString` has no head to hoist into, so it emits them
 * INLINE at the point they were generated — i.e. inside #root. On the client,
 * React puts the same link in <head>, so the server HTML had a node the client
 * tree doesn't → hydration mismatch (React #418) on EVERY route, which forces a
 * full client re-render of the tree (see CLAUDE.md #4 and "Don't deploy
 * without"). Measured: 28/28 routes carried a stray
 * `<link rel="preload" as="image" href="/icon-mark.svg">` as #root's first child
 * and every viewport threw #418 on load.
 *
 * So: pull those links out of the body and return them for the head. The
 * preload is still emitted (same benefit), just in the right place — and the
 * hydrated tree now matches byte-for-byte.
 *
 * ORDER MATTERS: injectHead() already ran, so its `heroPreload` strip-and-
 * replace is done and these links land after it — a hero page keeps both its
 * deliberate hero set and this (tiny, deduped) logo-mark preload.
 */
function hoistResourceLinks(body) {
  const links = [];
  const cleaned = body.replace(/<link\s[^>]*rel="(?:preload|stylesheet|preconnect)"[^>]*\/?>/g, (tag) => {
    links.push(tag);
    return '';
  });
  return { cleaned, links };
}

function injectBody(html, body) {
  const { cleaned, links } = hoistResourceLinks(body);
  let out = html.replace('<div id="root"></div>', `<div id="root">${cleaned}</div>`);
  if (links.length) {
    // De-dupe: the same asset can be rendered more than once (the logo mark is
    // in both the navbar and the footer).
    const unique = [...new Set(links)];
    out = out.replace('</head>', `  ${unique.join('\n    ')}\n  </head>`);
  }
  return out;
}

/**
 * Inline the build CSS into a <style> in <head> and DROP the render-blocking
 * <link>, so first paint never waits on a stylesheet request.
 *
 * Why inline-only (not inline + async link): this is a prerendered SPA. On a
 * cold visit, inlining removes a render-blocking round-trip — the CSS arrives
 * in the same HTML response, fastest possible first paint. On in-app nav React
 * Router swaps components and never re-fetches CSS, so a cached <link> would
 * buy nothing; keeping it would just double-download the CSS on first visit.
 * The trade — each direct/hard-refresh page load re-sends ~13KB brotli of
 * inlined CSS uncached — is worth it for a marketing site optimizing cold
 * mobile landings. A <noscript> <link> covers the JS-off case.
 */
function inlineCss(html, cssHref, cssText) {
  const linkRe = new RegExp(
    `<link rel="stylesheet"[^>]*href="${cssHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`,
  );
  if (!linkRe.test(html)) return html;
  const replacement =
    `<style>${cssText}</style>\n    ` +
    `<noscript><link rel="stylesheet" crossorigin href="${cssHref}" /></noscript>`;
  return html.replace(linkRe, replacement);
}

async function run() {
  const template = await fs.readFile(TEMPLATE, 'utf8');
  // Bun-style file URL import for the SSR bundle so Node ESM resolves correctly.
  const { render, PRERENDER_ROUTES } = await import(pathToFileURL(SERVER_ENTRY).href);

  // Read the build CSS once so we can inline it into every page's <head>
  // (kills the render-blocking stylesheet request). The href in the template
  // is hashed by Vite; resolve it to a file under dist/.
  const cssHref = (template.match(/<link rel="stylesheet"[^>]*href="([^"]+)"/) || [])[1];
  let cssText = '';
  if (cssHref) {
    cssText = await fs.readFile(path.join(CLIENT_DIST, cssHref.replace(/^\//, '')), 'utf8');
  } else {
    console.warn('⚠ No stylesheet <link> found in template — skipping CSS inline.');
  }

  let count = 0;
  for (const route of PRERENDER_ROUTES) {
    let body, meta;
    try {
      const out = render(route);
      body = out.html;
      meta = out.meta;
    } catch (err) {
      console.error(`✗ ${route} — render failed:`, err.message);
      continue;
    }

    let html = template;
    html = injectHead(html, meta);
    html = injectBody(html, body);
    if (cssText) html = inlineCss(html, cssHref, cssText);

    const outDir = route === '/'
      ? CLIENT_DIST
      : path.join(CLIENT_DIST, route.replace(/^\//, ''));
    const outFile = path.join(outDir, 'index.html');
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(outFile, html);
    count++;
    console.log(`✓ ${route} → ${path.relative(ROOT, outFile)} (${html.length} bytes)`);
  }

  // Strip build-only assets that Vite copies straight out of public/. These are
  // never referenced by any CSS, HTML or preload — public/fonts/_orig holds the
  // UNSUBSET originals kept purely as the source for scripts/subset-fonts.mjs —
  // so shipping them just pushes dead weight to the edge on every deploy.
  for (const dead of ['fonts/_orig']) {
    const target = path.join(CLIENT_DIST, dead);
    try {
      await fs.rm(target, { recursive: true, force: true });
      console.log(`Pruned dist/${dead} (build-only, never served)`);
    } catch {
      /* nothing to prune */
    }
  }
  console.log(`\nPrerendered ${count}/${PRERENDER_ROUTES.length} routes.`);
}

run().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
