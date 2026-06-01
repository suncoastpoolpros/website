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
    const imgPreloads = [
      `<link rel="preload" as="image" href="${escapeHtml(h.mobile)}" type="image/webp" media="(max-width: 767px)" />`,
      `<link rel="preload" as="image" href="${escapeHtml(h.desktop)}" type="image/webp" media="(min-width: 768px)${h.wide ? ' and (max-width: 1535px)' : ''}" />`,
    ];
    if (h.wide) {
      imgPreloads.push(
        `<link rel="preload" as="image" href="${escapeHtml(h.wide)}" type="image/webp" media="(min-width: 1536px)" />`,
      );
    }
    out = out.replace('</head>', `  ${imgPreloads.join('\n    ')}\n  </head>`);
  }

  // Per-page font preload. The template ships a default set; if this page
  // declares its own above-the-fold fonts, swap them so the route preloads only
  // the weights it actually paints (and not ones it doesn't, e.g. Caveat off the
  // homepage or Montserrat-900 on content pages).
  if (meta.fontPreload && meta.fontPreload.length) {
    out = out.replace(/\s*<link rel="preload" as="font"[^>]*\/?>/g, '');
    const fontPreloads = meta.fontPreload.map((f) => {
      const href = typeof f === 'string' ? f : f.href;
      const media = typeof f === 'string' ? '' : ` media="${escapeHtml(f.media)}"`;
      return `<link rel="preload" as="font" type="font/woff2" href="${escapeHtml(href)}" crossorigin${media} />`;
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
  // No og:image / twitter:image — link shares render as a plain card (title +
  // description + site icon), no large background photo. twitter:card is the
  // small "summary" type accordingly.
  replacements.push(`<meta name="twitter:card" content="summary" />`);
  if (meta.title) replacements.push(`<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`);
  if (meta.description) replacements.push(`<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`);

  out = out.replace('</head>', `  ${replacements.join('\n    ')}\n  </head>`);
  return out;
}

function injectBody(html, body) {
  return html.replace(
    '<div id="root"></div>',
    `<div id="root">${body}</div>`,
  );
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
  console.log(`\nPrerendered ${count}/${PRERENDER_ROUTES.length} routes.`);
}

run().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
