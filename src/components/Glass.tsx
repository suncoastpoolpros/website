import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared Apple-style "clear glass" surface used across the site
 * (hero service-area badge, phone button, etc.).
 * Lightly tinted, subtle blur, defined hairline border, soft shadow.
 *
 * Renders as <a> when `href` is passed, otherwise <div>.
 */
type GlassProps = {
  href?: string;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

const GLASS_BASE =
  'bg-white/[0.07] backdrop-blur-[10px] border border-white/20 shadow-lg shadow-black/20';

// Hover lift — only meaningful on interactive (link) variants.
const GLASS_INTERACTIVE = 'hover:bg-white/[0.12] hover:border-white/30 transition-colors';

export const Glass = ({ href, className, children, ...rest }: GlassProps) => {
  const classes = cn(GLASS_BASE, href && GLASS_INTERACTIVE, className);
  // (See displayName below — this file's chunk hash had to change to escape a
  // poisoned edge-cache entry. Details there.)

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
};

/**
 * Also serves as a deliberate cache-bust for this file's built chunk.
 *
 * INCIDENT: `public/_headers` applies `Cache-Control: immutable, max-age=1yr` to
 * `/assets/*` BY PATH, without regard for what was actually served. During a
 * deploy's propagation window a request for `/assets/Glass-<hash>.js` was
 * answered with Cloudflare Pages' SPA-fallback `index.html`, so the edge cached
 * 294KB of HTML under that .js URL — as immutable, for a year. Chrome then
 * refused it ("Expected a JavaScript-or-Wasm module script but the server
 * responded with a MIME type of text/html"), the lazy route never resolved, and
 * the homepage rendered as a blank dark screen. It does not self-heal.
 *
 * Editing this file changes the chunk's content hash, so the app requests a NEW
 * filename and never touches the poisoned entry. Purging the Cloudflare cache is
 * the actual cure; this is what makes the site work without dashboard access.
 *
 * A minified comment wouldn't survive to change the hash, so the bust has to be
 * real emitted code — and a displayName is worth having anyway (React DevTools).
 */
Glass.displayName = 'Glass';
