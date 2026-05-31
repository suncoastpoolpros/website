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
