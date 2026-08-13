import React from 'react';

/**
 * A code-split route component that can be PRELOADED so its first render is
 * synchronous.
 *
 * Why not React.lazy: `lazy()` always suspends on its first render attempt, even
 * when the module is already in the bundler's cache, because it only records the
 * resolved value in a microtask after calling the factory. On a prerendered page
 * that is fatal — at `hydrateRoot` the route chunk has not loaded, `<Suspense>`
 * renders its `null` fallback, the client tree therefore does not match the
 * server HTML, and React throws away the entire prerendered DOM and rebuilds it
 * (the minified #418 this site threw on every route).
 *
 * Two consequences of that, both of which this fixes:
 *   1. every cold load paid for a full extra render pass, and
 *   2. a chunk that failed to load left a BLANK page instead of the prerendered
 *      HTML — which is exactly how a single bad asset URL took the homepage
 *      down twice.
 *
 * `preload()` resolves the module up front; once resolved, rendering returns the
 * component synchronously and hydration matches byte for byte. Before it's
 * resolved this still throws a promise, so `<Suspense>` behaves exactly as it
 * did for client-side navigation. A failed import throws during render so
 * ChunkErrorBoundary still catches it and does its one-shot reload.
 */
export type PreloadableComponent = React.ComponentType<Record<string, never>> & {
  preload: () => Promise<unknown>;
};

export function lazyRoute(loader: () => Promise<React.ComponentType<never>>): PreloadableComponent {
  let status: 'idle' | 'pending' | 'resolved' | 'failed' = 'idle';
  let Loaded: React.ComponentType<never> | null = null;
  let failure: unknown = null;
  let inflight: Promise<unknown> | null = null;

  const load = () => {
    if (status === 'resolved' || status === 'failed') return Promise.resolve();
    if (!inflight) {
      status = 'pending';
      inflight = loader().then(
        (C) => {
          Loaded = C;
          status = 'resolved';
        },
        (e) => {
          // Resolve rather than reject: the error is re-thrown during render so
          // ChunkErrorBoundary (a render-phase boundary) can catch it. An
          // unhandled rejection here would just be noise.
          failure = e;
          status = 'failed';
        },
      );
    }
    return inflight;
  };

  const Route = (props: Record<string, never>) => {
    if (status === 'failed') throw failure;
    if (status !== 'resolved') throw load();
    return React.createElement(Loaded!, props);
  };
  Route.preload = load;

  return Route as PreloadableComponent;
}

/**
 * Resolve the chunk for `pathname` before hydrating, so the first render of the
 * prerendered route is synchronous. Unknown paths resolve immediately — they are
 * client-only (404), where there is no prerendered HTML to match anyway.
 *
 * Route paths are declared without a trailing slash while canonical URLs carry
 * one, so both forms are normalised to the declared key.
 */
export function preloadRoute(
  routes: Record<string, PreloadableComponent>,
  pathname: string,
): Promise<unknown> {
  const key = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const match = routes[key] ?? routes[key.toLowerCase()];
  return match ? match.preload() : Promise.resolve();
}
