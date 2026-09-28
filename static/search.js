// Pagefind's search dialog glue. Loaded on every page, whether the
// Component UI itself loads by script tag or, on /find, after hydration
// (see +layout.svelte and routes/find/+page.svelte).
//
// Fix for #318: Pagefind's own `reset-on-close` does not clear the input's
// visible text when the dialog closes by Escape. Its input listens for its
// own "search" event and skips updating the DOM value whenever
// `document.activeElement` is still the input. A backdrop click or a result
// link click move focus away first, so those two close paths reset fine;
// Escape does not move focus until after Pagefind's own close handling has
// already run, so the guard is still true and the stale text stays.
// Blurring here, before that handling runs, puts Escape on the same path as
// the other two, so Pagefind's own reset clears the input, the Clear
// button and the results together.
document.addEventListener(
  'close',
  (event) => {
    const dialog = event.target;
    if (!(dialog instanceof HTMLDialogElement)) return;
    if (!dialog.closest('pagefind-modal')) return;
    if (dialog.contains(document.activeElement)) document.activeElement.blur();
  },
  true
);
