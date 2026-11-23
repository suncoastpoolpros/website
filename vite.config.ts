import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// The day of the build (UTC), for the sample service report's date: the
// prerendered HTML and the browser's first render both start from it, so they
// match, and the page then moves it to the visitor's own most recent Thursday
// (src/lib/reportDate.ts). Both builds (client and SSR) run in one `npm run
// build`, so they agree.
const BUILD_DATE = new Date().toISOString().slice(0, 10);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Build-time hardening for production bundles only (Vite's `serve` ignores
  // these so dev still has full console output):
  //   - drop `console.*` and `debugger` calls so failed-submit reasons and
  //     dev-time noise don't leak to visitors' browser consoles
  //   - strip legal/license comments to shave a few bytes off the bundle
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },
  build: {
    rollupOptions: {
      output: {
        // Group big shared deps into stable chunks so the browser fetches a
        // few well-sized files instead of dozens of micro-chunks. Each tiny
        // chunk costs a mobile round-trip; consolidating them lowers TTI.
        // (manualChunks is ignored for SSR builds — only applies to the client.)
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-router')) return 'router';
          if (id.includes('/react-dom/') || id.includes('/react/')) return 'react';
          if (id.includes('/motion/')) return 'motion';
          if (id.includes('/lucide-react/')) return 'icons';
          return undefined;
        },
      },
    },
  },
  // SSR build (npm run build:ssr) bundles src/entry-server.tsx for Node so
  // scripts/prerender.mjs can import it. noExternal: true forces all deps —
  // including Tailwind-derived imports and motion — to be inlined into the
  // server bundle, which avoids ESM resolution issues when the script imports
  // dist-ssr/entry-server.js at build time.
  ssr: {
    noExternal: true,
  },
});
