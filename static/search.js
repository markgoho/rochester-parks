// Pagefind's search dialog glue. Loaded on every page, whether the
// Component UI itself loads by script tag or, on /find, after hydration
// (see +layout.svelte and routes/find/+page.svelte).
import { createSearchLog } from './search-log.js';

// Search analytics (#322): one search-log per page load, fed by Pagefind's
// own instance events and a click on a result. Local and preview builds
// never send a real event: `pa.js` puts a stub on `window.pirsch` there
// that only logs (see docs/research/search-analytics.md).
const log = createSearchLog();

function send(event) {
  if (!event) return;
  if (typeof window.pirsch !== 'function') return;
  window.pirsch('Search', { meta: event });
}

// There is no `off()`, so this waits for `window.PagefindComponents` rather
// than racing script order: safe whether the Pagefind module tag precedes
// this one, or, on /find, loads later from onMount. Gives up after 10s if
// the Pagefind module never loads, rather than polling for the page's life.
function attachToPagefind(triesLeft = 200) {
  const manager = window.PagefindComponents?.getInstanceManager;
  if (!manager) {
    if (triesLeft <= 0) return;
    setTimeout(() => attachToPagefind(triesLeft - 1), 50);
    return;
  }
  const instance = manager().getInstance('default');
  instance.on('search', (term) => log.search(term));
  instance.on('results', (result) => log.results(result.results.length));
}
attachToPagefind();

function onResultActivate(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!target.closest('pagefind-results')) return;
  if (!target.closest('a')) return;
  send(log.opened());
}
document.addEventListener('click', onResultActivate);
document.addEventListener('auxclick', onResultActivate);

window.addEventListener('pagehide', () => send(log.left()));

// Fix for #318: Pagefind's own `reset-on-close` does not clear the input's
// visible text when the dialog closes by Escape. Its input listens for its
// own "search" event and skips updating the DOM value whenever
// `document.activeElement` is still the input. A backdrop click or a result
// link click move focus away first, so those two close paths reset fine;
// Escape does not move focus until after Pagefind's own close handling has
// already run, so the guard is still true and the stale text stays.
// Blurring here, before that handling runs, puts Escape on the same path as
// the other two, so Pagefind's own reset clears the input, the Clear
// button and the results together. It also marks the dialog session done,
// so the search-log flushes the kept term here too (#322).
document.addEventListener(
  'close',
  (event) => {
    const dialog = event.target;
    if (!(dialog instanceof HTMLDialogElement)) return;
    if (!dialog.closest('pagefind-modal')) return;
    if (dialog.contains(document.activeElement)) document.activeElement.blur();
    send(log.closed());
  },
  true
);
