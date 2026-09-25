import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In development the API runs separately on :3001. Proxying /api keeps the
    // browser on one origin, so no CORS setup is needed locally. The e2e suite
    // points this at its own API instance with BUTCH_API_PROXY.
    proxy: {
      '/api': process.env.BUTCH_API_PROXY ?? 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
