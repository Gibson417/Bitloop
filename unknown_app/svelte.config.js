import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  compilerOptions: {
    dev: true
  },
  preprocess: vitePreprocess(),
  kit: {
    adapter: undefined
  }
};

export default config;
