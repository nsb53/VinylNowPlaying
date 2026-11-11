import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The Python server serves the build from web/dist at "/".
export default defineConfig({
  plugins: [svelte()],
  base: '/dist/',
  build: {
    outDir: '../web/dist',
    emptyOutDir: true,
    // TV browsers lag years behind desktop ones, so compile for an old engine.
    target: ['chrome64', 'safari12'],
  },
  server: {
    proxy: { '/api': 'http://localhost:8765' },
  },
});
