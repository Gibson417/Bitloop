import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  root: '.',
  base: './', // Use relative paths for Electron compatibility
  plugins: [svelte()],
  resolve: {
    alias: {
      $components: path.resolve(__dirname, 'src/components'),
      $lib: path.resolve(__dirname, 'src/lib'),
      $store: path.resolve(__dirname, 'src/store'),
      $src: path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
