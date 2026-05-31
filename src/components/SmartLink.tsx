import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { preloadRoute } from '@/lib/preloadRoute';

// Drop-in replacement for react-router-dom's Link that fires the chunk
// preload on touchstart / mouseenter / focus. The actual click still uses
// React Router's SPA navigation — but by that time the chunk is usually
// already in the browser cache, so route transition feels instant.
//
// Pass `to` as a string (the only form we use). Other Link props pass through.
export const SmartLink = ({ to, onTouchStart, onMouseEnter, onFocus, ...rest }: LinkProps & { to: string }) => {
  const trigger = () => preloadRoute(to);
  return (
    <Link
      to={to}
      onTouchStart={(e) => { trigger(); onTouchStart?.(e); }}
      onMouseEnter={(e) => { trigger(); onMouseEnter?.(e); }}
      onFocus={(e) => { trigger(); onFocus?.(e); }}
      {...rest}
    />
  );
};
