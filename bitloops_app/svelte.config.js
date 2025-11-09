import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  compilerOptions: {
    dev: false
  },
  preprocess: vitePreprocess(),
  kit: {
    adapter: undefined
  }
};

export default config;
