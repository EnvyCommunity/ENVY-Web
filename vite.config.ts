import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ENVY Community — web del servidor de rol. Repo independiente (solo frontend);
// el backend sigue siendo el de ReXyo en rexyoes.com/lsrp/api (mismo origen
// cuando se sirve bajo /lsrp). base '/lsrp/' para que encaje con esa ruta.
export default defineConfig({
  plugins: [react()],
  base: '/lsrp/',
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    proxy: {
      '/lsrp/api': { target: 'https://rexyoes.com', changeOrigin: true, secure: true },
    },
  },
});
