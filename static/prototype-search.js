// PROTOTYPE (#298): throwaway. Picks the variant from ?variant= (or the last
// one seen in this tab), shows its triggers, and draws the switcher bar.
(() => {
  const VARIANTS = {
    A: 'Nav icon · centred panel · / key · /find opens the dialog',
    B: 'Icon by the name · top sheet · Cmd-K · /find results on the page',
    C: 'Icon at the edge · full screen · Cmd-K · /find box in the filter',
  };
  const keys = Object.keys(VARIANTS);
  const url = new URL(location.href);
  let stored = null;
  try {
    stored = sessionStorage.getItem('pf-variant');
  } catch {}
  const variant = keys.includes(url.searchParams.get('variant'))
    ? url.searchParams.get('variant')
    : keys.includes(stored)
      ? stored
      : 'A';
  try {
    sessionStorage.setItem('pf-variant', variant);
  } catch {}
  document.documentElement.dataset.variant = variant;

  // A hidden trigger still listens on the whole document. Give it a key
  // nobody presses. Attributes only: /find hydrates, so no node may go.
  for (const el of document.querySelectorAll('[data-pf-variant]')) {
    if (el.dataset.pfVariant === variant) continue;
    for (const trigger of el.querySelectorAll('pagefind-modal-trigger')) {
      trigger.setAttribute('shortcut', 'ctrl+alt+shift+f19');
    }
  }

  const go = (step) => {
    const next = keys[(keys.indexOf(variant) + step + keys.length) % keys.length];
    url.searchParams.set('variant', next);
    location.replace(url);
  };

  const bar = document.createElement('div');
  bar.className = 'pr-switcher';
  bar.innerHTML = `<button type="button" aria-label="Previous variant">←</button>
    <span><b>${variant}</b> ${VARIANTS[variant]}</span>
    <button type="button" aria-label="Next variant">→</button>`;
  const [prev, next] = bar.querySelectorAll('button');
  prev.onclick = () => go(-1);
  next.onclick = () => go(1);
  document.body.append(bar);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const t = event.target;
    if (t.closest?.('input, textarea, select, [contenteditable], dialog[open]'))
      return;
    go(event.key === 'ArrowLeft' ? -1 : 1);
  });
})();
