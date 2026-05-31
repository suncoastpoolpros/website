import React from 'react';

/**
 * Recovers from lazy() chunk-load failures.
 *
 * Routes are code-split with React.lazy + <Suspense fallback={null}>. If a
 * dynamic import() rejects — most commonly because the page was opened before a
 * deploy and the old hashed chunk URL now 404s — Suspense has nothing to show
 * and the user is stuck on a blank screen (only a manual hard refresh fixes it).
 * This was reproducible on iOS Safari, which keeps pages alive in memory across
 * deploys, when tapping an in-app <Link> (e.g. the footer's Service Agreement).
 *
 * On such an error we force a one-time hard reload of the current URL, which
 * fetches the fresh prerendered HTML + current chunk hashes — turning a
 * permanent blank into an automatic recovery. A sessionStorage flag prevents a
 * reload loop if the failure is something a reload can't fix.
 */
const RELOAD_FLAG = 'chunk-reload-attempted';

// Heuristic: dynamic-import / chunk-load failures across browsers.
const isChunkLoadError = (error: unknown): boolean => {
  const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /ChunkLoadError|Loading chunk|Importing a module script failed|error loading dynamically imported module|Failed to fetch dynamically imported module/i.test(
    msg,
  );
};

type Props = { children: React.ReactNode };
type State = { failed: boolean };

export class ChunkErrorBoundary extends React.Component<Props, State> {
  // Declared explicitly so typing doesn't depend on React.Component's generic
  // base resolving (this project has no @types/react pinned).
  declare props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { failed: isChunkLoadError(error) };
  }

  componentDidCatch(error: unknown) {
    if (!isChunkLoadError(error)) {
      // Not a chunk error — rethrow on next tick so it isn't silently swallowed.
      throw error;
    }
    // Hard-reload once to pick up the current deploy's chunks.
    if (typeof window !== 'undefined' && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
    }
  }

  render() {
    // While the reload is in flight (or if it already ran), render nothing —
    // the page is about to be replaced by the fresh document.
    if (this.state.failed) return null;
    return this.props.children;
  }
}

// Clear the one-shot flag once a route has successfully mounted, so a *future*
// chunk failure in the same session can also self-heal. Call from a mounted
// route tree (e.g. inside App after Suspense resolves).
export const clearChunkReloadFlag = () => {
  if (typeof window !== 'undefined') sessionStorage.removeItem(RELOAD_FLAG);
};
