// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Page } from '$lib/types';

declare global {
  namespace App {
    interface PageData extends Partial<Page> {}
  }
}

export {};
