import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: The Gemini API key is no longer injected into the browser.
// All AI calls go through the backend server (see /server), which keeps
// the key server-side. During development, /api is proxied to that server.
export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: process.env.API_PROXY_TARGET || 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
