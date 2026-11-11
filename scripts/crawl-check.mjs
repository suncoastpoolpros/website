#!/usr/bin/env node
/**
 * Crawler-response check: what status does each URL a crawler can find on the
 * site actually return?
 *
 * Collects URLs from robots.txt, the sitemap, llms.txt, and every page in the
 * sitemap (links, images, srcset, canonical, og:*, JSON-LD), then requests
 * each with a few crawler User-Agents and a normal browser, following
 * redirects by hand so the whole chain is recorded. It also tries the common
 * non-canonical variants of every sitemap URL (no trailing slash, www, http,
 * /index.html), which is what crawlers arrive with from old links.
 *
 * Prints every result that isn't a direct 200 or a single 301 to a 200.
 * Spoofed User-Agents only test the site itself: Cloudflare verifies real
 * crawler IPs, so a Cloudflare-level block can't be reproduced this way.
 *
 *   node scripts/crawl-check.mjs [origin] [--json out.json]
 *   default origin: https://suncoastpoolpros.com
 */

const args = process.argv.slice(2);
const ORIGIN = (args.find((a) => /^https?:\/\//.test(a)) ?? 'https://suncoastpoolpros.com').replace(/\/$/, '');
const JSON_OUT = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const HOST = new URL(ORIGIN).host;

const UAS = {
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  gptbot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)',
  claudebot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  perplexitybot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  browser:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** One request, redirects followed by hand (max 5 hops). */
const probe = async (url, ua, method = 'GET') => {
  const chain = [];
  let current = url;
  for (let hop = 0; hop < 6; hop++) {
    let res;
    try {
      res = await fetch(current, { method, redirect: 'manual', headers: { 'user-agent': ua } });
    } catch (e) {
      chain.push({ url: current, status: 'ERR', note: String(e.cause?.code ?? e.message) });
      return chain;
    }
    const loc = res.headers.get('location');
    chain.push({ url: current, status: res.status });
    await res.arrayBuffer().catch(() => {});
    if (res.status >= 300 && res.status < 400 && loc) {
      current = new URL(loc, current).href;
      if (chain.some((c) => c.url === current)) {
        chain.push({ url: current, status: 'LOOP' });
        return chain;
      }
      continue;
    }
    return chain;
  }
  chain.push({ url: current, status: 'TOO_MANY' });
  return chain;
};

/** Fine: a direct 200, or one 301 that lands on a 200. */
const isClean = (chain) =>
  (chain.length === 1 && chain[0].status === 200) ||
  (chain.length === 2 && chain[0].status === 301 && chain[1].status === 200);

const text = async (url) => {
  const res = await fetch(url, { headers: { 'user-agent': UAS.browser } });
  return res.ok ? res.text() : '';
};

// ── Collect URLs ─────────────────────────────────────────────────────────

const found = new Map(); // url -> Set of where it was found
const add = (raw, from) => {
  if (!raw) return;
  let u;
  try {
    u = new URL(raw.trim().replace(/&amp;/g, '&'), ORIGIN + '/');
  } catch {
    return;
  }
  if (!/^https?:$/.test(u.protocol)) return;
  if (u.host !== HOST && u.host !== `www.${HOST}`) return;
  u.hash = '';
  const key = u.href;
  if (!found.has(key)) found.set(key, new Set());
  found.get(key).add(from);
};

const robots = await text(`${ORIGIN}/robots.txt`);
const sitemapUrls = [...robots.matchAll(/^Sitemap:\s*(\S+)/gim)].map((m) => m[1]);
if (!sitemapUrls.length) sitemapUrls.push(`${ORIGIN}/sitemap.xml`);

const pages = [];
for (const sm of sitemapUrls) {
  add(sm, 'robots.txt');
  const xml = await text(sm);
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    add(m[1], 'sitemap');
    pages.push(m[1]);
  }
}

const llms = await text(`${ORIGIN}/llms.txt`);
for (const m of llms.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) add(m[1], 'llms.txt');

// Non-canonical variants of each sitemap URL: what old links and crawlers arrive with.
const variants = [];
for (const p of pages) {
  const u = new URL(p);
  if (u.pathname !== '/' && u.pathname.endsWith('/')) variants.push([`${u.origin}${u.pathname.slice(0, -1)}`, 'variant: no slash']);
  variants.push([`${u.origin}${u.pathname}index.html`.replace('//index', '/index'), 'variant: /index.html']);
  variants.push([`https://www.${HOST}${u.pathname}`, 'variant: www']);
  variants.push([`http://${HOST}${u.pathname}`, 'variant: http']);
}

const attr = (html, re) => [...html.matchAll(re)].map((m) => m[1]);
for (const p of pages) {
  const html = await text(p);
  const from = new URL(p).pathname;
  for (const h of attr(html, /\shref="([^"]+)"/g)) add(h, `link on ${from}`);
  for (const s of attr(html, /\ssrc="([^"]+)"/g)) add(s, `src on ${from}`);
  for (const ss of attr(html, /\ssrc[sS]et="([^"]+)"/g))
    for (const part of ss.split(',')) add(part.trim().split(/\s+/)[0], `srcset on ${from}`);
  for (const c of attr(html, /<meta[^>]+(?:property|name)="(?:og:image|og:url|twitter:image)"[^>]+content="([^"]+)"/g))
    add(c, `meta on ${from}`);
  for (const block of attr(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))
    for (const u of attr(block, /"(https?:\/\/[^"]+)"/g)) add(u, `json-ld on ${from}`);
  for (const css of attr(html, /url\(['"]?(\/[^'")]+)['"]?\)/g)) add(css, `css on ${from}`);
}

// ── Probe ────────────────────────────────────────────────────────────────

const targets = [...found.keys()].map((u) => [u, [...found.get(u)].slice(0, 3).join('; ')]).concat(variants);
console.error(`Checking ${targets.length} URLs × ${Object.keys(UAS).length} user-agents against ${ORIGIN}…`);

const problems = [];
const all = [];
const CONCURRENCY = 6;
let i = 0;
const worker = async () => {
  while (i < targets.length) {
    const [url, from] = targets[i++];
    for (const [name, ua] of Object.entries(UAS)) {
      const chain = await probe(url, ua);
      const row = { url, from, ua: name, chain };
      all.push(row);
      if (!isClean(chain)) problems.push(row);
    }
    // HEAD once per URL with the Googlebot UA: some stacks 405/500 on HEAD.
    const head = await probe(url, UAS.googlebot, 'HEAD');
    if (!isClean(head)) problems.push({ url, from, ua: 'googlebot (HEAD)', chain: head });
    await sleep(40);
  }
};
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// Group identical outcomes across user-agents so the table stays short.
const groups = new Map();
for (const p of problems) {
  const sig = `${p.url}|${p.chain.map((c) => c.status).join('>')}`;
  if (!groups.has(sig)) groups.set(sig, { ...p, uas: [] });
  groups.get(sig).uas.push(p.ua);
}

const rows = [...groups.values()].sort((a, b) => a.url.localeCompare(b.url));
console.log(`\n${rows.length} non-clean results (of ${targets.length} URLs):\n`);
for (const r of rows) {
  const path = r.chain.map((c) => `${c.status}`).join(' → ');
  const final = r.chain[r.chain.length - 1].url;
  console.log(`${path.padEnd(16)} ${r.url}`);
  if (final !== r.url) console.log(`${''.padEnd(16)}   final: ${final}`);
  console.log(`${''.padEnd(16)}   UAs: ${r.uas.join(', ')} · found: ${r.from}`);
}

if (JSON_OUT) {
  const { writeFile } = await import('node:fs/promises');
  await writeFile(JSON_OUT, JSON.stringify({ origin: ORIGIN, checked: targets.length, problems: rows, all }, null, 2));
  console.error(`\nFull results written to ${JSON_OUT}`);
}
