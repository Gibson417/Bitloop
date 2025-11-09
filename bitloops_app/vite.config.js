import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $components: path.resolve('./src/components'),
      $store: path.resolve('./src/store'),
      $lib: path.resolve('./src/lib')
    }
  }
});
