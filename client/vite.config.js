import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Ensure JSX uses the automatic runtime in *all* pipelines (build + vitest),
  // so components don't need `import React`.
  esbuild: {
    jsx: 'automatic',
  },
  server: {
    port: 5173,
    // Dev proxy: the frontend calls /api/* which is forwarded to the
    // Express server (avoids CORS + hot-reload issues during development).
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
  },
});
