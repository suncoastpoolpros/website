import {StrictMode} from 'react';
import {createRoot, hydrateRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {LazyMotion, MotionConfig, domAnimation} from 'motion/react';
import App from './App.tsx';
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
const rootEl = document.getElementById('root')!;
if (rootEl.firstChild) {
  hydrateRoot(rootEl, tree);
} else {
  createRoot(rootEl).render(tree);
}
