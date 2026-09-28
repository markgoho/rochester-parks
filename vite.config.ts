import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({ pages: 'public', assets: 'public', strict: true }),
      // pagefind --site public runs after this build and writes /pagefind/,
      // so the prerender step must not fail on the stylesheet link it finds
      // there (#318).
      prerender: {
        handleHttpError: ({ path, message }) => {
          if (path.startsWith('/pagefind/')) return;
          throw new Error(message);
        },
      },
    }),
  ],
});
