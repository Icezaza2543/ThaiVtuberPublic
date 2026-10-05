import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dev only: VTHAIDEX_STATS_FILE=<summary.json> serves /api/stats locally (e.g. a summary not yet published).
const statsFile = process.env.VTHAIDEX_STATS_FILE;
const localStats = {
  name: 'local-stats',
  configureServer(server) {
    if (!statsFile) return;
    server.middlewares.use('/api/stats', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(readFileSync(statsFile));
    });
  },
};

const pages = ['index', 'directory', 'about', 'contribute', 'terms', 'terms-of-use', 'privacy', 'data-license'];

export default defineConfig({
  plugins: [react(), tailwindcss(), localStats],
  // Local dev/preview read the live public API; Vercel serves /api itself in production.
  server: { proxy: { '/api': { target: 'https://vthaidex.vercel.app', changeOrigin: true } } },
  preview: { proxy: { '/api': { target: 'https://vthaidex.vercel.app', changeOrigin: true } } },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000, // the lazy three.js universe chunk
    rollupOptions: {
      input: Object.fromEntries(pages.map((page) => [page, resolve(import.meta.dirname, `${page}.html`)])),
    },
  },
});
