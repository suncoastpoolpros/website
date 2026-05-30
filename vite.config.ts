import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
});
