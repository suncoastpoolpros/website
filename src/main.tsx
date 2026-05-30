import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {LazyMotion, MotionConfig, domAnimation} from 'motion/react';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
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
  </StrictMode>,
);
