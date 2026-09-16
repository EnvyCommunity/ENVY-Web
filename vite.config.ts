import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ENVY Community — Worker propio en Cloudflare (D1 + R2 + ASSETS).
// En local, /lsrp/api se proxya al Worker desplegado (no a ReXyo).
export default defineConfig({
  plugins: [react()],
  base: '/lsrp/',
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    proxy: {
      '/lsrp/api': {
        target: 'https://envy-community.envycommunityrp.workers.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
