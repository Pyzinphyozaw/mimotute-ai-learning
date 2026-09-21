import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  const API_URL = env.VITE_API_BASE_URL || 'http://localhost:3000';
  console.log(API_URL);

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
          timeout: 0,
          proxyTimeout: 0,
        },
      },
    },
  };
});