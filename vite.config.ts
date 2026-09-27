import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({ pages: 'public', assets: 'public', strict: true }),
      // PROTOTYPE (#298): /pagefind/ is written after vite build.
      prerender: {
        handleHttpError: ({ path, message }) => {
          if (path.startsWith('/pagefind/')) return;
          throw new Error(message);
        },
      },
    }),
  ],
});
