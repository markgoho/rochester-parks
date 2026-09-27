// PROTOTYPE (#310): throwaway. The header is #298's winner (A) on every
// variant. ?variant= now picks what a result shows beside its text.
(() => {
  const VARIANTS = {
    A: 'Place map: the town or Neighborhood with the dot',
    B: "The Park's own outline (the card's figure)",
    C: 'No map: text only (the #298 result)',
    D: 'County dot: one shared county map, the dot moves',
  };
  const keys = Object.keys(VARIANTS);
  const url = new URL(location.href);
  let stored = null;
  try {
    stored = sessionStorage.getItem('pf-fig');
  } catch {}
  const variant = keys.includes(url.searchParams.get('variant'))
    ? url.searchParams.get('variant')
    : keys.includes(stored)
      ? stored
      : 'A';
  try {
    sessionStorage.setItem('pf-fig', variant);
  } catch {}
  document.documentElement.dataset.variant = 'A';
  document.documentElement.dataset.fig = variant;

  // The #298 losers' triggers still listen on the whole document. Give them a
  // key nobody presses. Attributes only: /find hydrates, so no node may go.
  for (const el of document.querySelectorAll('[data-pf-variant]')) {
    if (el.dataset.pfVariant === 'A') continue;
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
