import {StrictMode} from 'react';
import {createRoot, hydrateRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {LazyMotion, MotionConfig, domAnimation} from 'motion/react';
import App, { ROUTE_COMPONENTS } from './App.tsx';
import { preloadRoute } from './lib/lazyRoute';
import './index.css';

const tree = (
  <StrictMode>
    <BrowserRouter>
      {/* reducedMotion="user" respects the OS-level "Reduce motion" setting
          (common on 55+ devices and accessibility users). Motion library
          short-circuits to 0-duration transitions when set, with no per-
          component plumbing needed. */}
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation} strict>
          <App />
        </LazyMotion>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>
);

// If the route was prerendered, #root already contains rendered markup —
// hydrate in place to preserve it (instant LCP). Otherwise fall back to a
// fresh client render so SPA-only routes (404, etc.) still work.
//
// Hydration WAITS for the initial route's chunk. Routes are code-split, and a
// split component that isn't loaded yet renders Suspense's null fallback — which
// does not match the prerendered HTML, so React discarded the entire server tree
// and rebuilt it (#418 on every route). Resolving the chunk first makes that
// first render synchronous and the hydration exact.
//
// This costs no time in practice: the page was never interactive before its
// chunk arrived. What it removes is the wasted re-render — and, more importantly,
// it means a chunk that fails to load leaves the prerendered HTML on screen
// instead of a blank page.
const rootEl = document.getElementById('root')!;
if (rootEl.firstChild) {
  preloadRoute(ROUTE_COMPONENTS, window.location.pathname).then(() => {
    hydrateRoot(rootEl, tree);
  });
} else {
  createRoot(rootEl).render(tree);
}
