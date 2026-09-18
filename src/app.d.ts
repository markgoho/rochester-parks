// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Page } from '#lib/types.js';

declare global {
  namespace App {
    interface PageData extends Partial<Page> {}
  }

  namespace svelteHTML {
    /**
     * Interest invokers. The attribute ships in Chrome and Edge and is in
     * Svelte's types no sooner than the other browsers take it.
     * https://open-ui.org/components/interest-invokers.explainer/
     */
    interface HTMLAttributes {
      interestfor?: string;
    }
  }
}

export {};
