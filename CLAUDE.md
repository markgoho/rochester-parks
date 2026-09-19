# Rochester Parks

A website for all the parks in Rochester NY. SvelteKit with `adapter-static`, built to `public/` and deployed to Firebase Hosting by GitHub Actions on push to `main`. Content is markdown under `content/`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `markgoho/rochester-parks`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Browser support

Target the latest browsers. Use modern HTML and CSS before JavaScript. When a browser does not support a new CSS feature yet, the page must still work without it; do not add a script fallback for it.
