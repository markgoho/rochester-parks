# Pagefind on a static SvelteKit site

Research for [#296](https://github.com/markgoho/rochester-parks/issues/296), 2026-09-27. Sources are primary: the Pagefind repo ([github.com/Pagefind/pagefind](https://github.com/Pagefind/pagefind), which was `CloudCannon/pagefind`), its `CHANGELOG.md`, its docs source (`docs/content/docs/*.md`, published at pagefind.app), its Component UI source (`pagefind_ui/component/`), the npm registry, and a test run on this site.

## Short answer

- Use Pagefind **1.5.2** (latest stable, 2026-04-12). The Component UI (`<pagefind-modal-trigger>` + `<pagefind-modal>`) is the recommended UI now. Nothing replaces it.
- Run the CLI after `vite build`: `pagefind --site public`. Pin `pagefind` as a devDependency. Put the step in the `build` script, so the GitHub Actions deploy runs it with no change.
- Load the UI with a script tag from `/pagefind/`, not with a Vite import. Then Vite never sees Pagefind, and the known SvelteKit problems do not apply.
- Under `vite dev` there is no index and no UI. Test search on `bun run build && bun run preview`.
- Mark each indexable page with `data-pagefind-body`. A Former Park page gets no `data-pagefind-body`, so it is not in the index.
- A Park name is the page `h1`, so it is the Pagefind `title`. Version 1.5 searches the title and gives it a 5x boost by default. No extra weight is necessary.
- Style the UI with `--pf-*` CSS custom properties only. The UI does not follow `prefers-color-scheme` by itself. It has no view-transition support; it opens a native `<dialog>` with `showModal()`.
- This site now: 387 pages, 3,768 words, index made in 0.27 s. The first search costs about 125 KB compressed.

## Where current Pagefind differs from dod-db

dod-db (`~/github/dod-db`) runs `bunx pagefind --site hugo/public` and uses `<pagefind-modal-trigger>` + `<pagefind-modal>` with `/pagefind/pagefind-component-ui.js` and `.css`. That is the current pattern. The differences are small:

1. **Version is not pinned.** `pagefind` is not in dod-db `package.json` or `bun.lock`, so each build gets the latest release from npm. Today that is 1.5.2, the same as this research. For rochester-parks, add `pagefind` as a devDependency so `bun.lock` pins it.
2. **Its trigger content is lost.** dod-db puts its own `<button class="navbar__search-trigger">Search</button>` inside `<pagefind-modal-trigger>`. The component `render()` starts with `this.innerHTML = ""` and then makes its own `button.pf-trigger-btn` (`pagefind_ui/component/components/pagefind-modal-trigger.ts`, lines 68–122). The dod-db button and its class are gone when the script runs. Use the attributes (`placeholder`, `compact`, `shortcut`, `hide-shortcut`) and `--pf-*` variables instead.
3. **One meta value is lost.** dod-db `episodes/single.html` puts `data-pagefind-meta` twice on one `<article>`. An HTML parser keeps only the first copy of a duplicate attribute, so the `episode` meta is dropped. Put both in one attribute, separated by a comma (`docs/metadata.md`, "Defining multiple metadata keys"). This is a dod-db bug, not a Pagefind change.
4. **Title boost is new.** Since 1.5.0, Pagefind searches metadata and gives the `title` a 5x boost (`CHANGELOG.md`, v1.5.0, "Search Relevance"). dod-db gets this with no change.

## Version and UI

- npm `pagefind`: `latest` is `1.5.2` (published 2026-04-12). The last pre-release tags are `1.5.0-beta.2` and `1.5.0-alpha.4`, both older than 1.5.2. The `Unreleased` section of `CHANGELOG.md` is empty at commit `426b540` (2026-09-23). GitHub releases list v1.5.2 as "Latest".
- npm `@pagefind/component-ui`: `latest` is `1.5.2`. The same UI is also in every bundle as `/pagefind/pagefind-component-ui.js` and `.css`.
- `CHANGELOG.md`, v1.5.0 (2026-04-06), "Looking Forward": "The Component UI is the new recommended way to add search to your site, and future UI work will focus there. The Default UI and Modular UI are sticking around for now."
- `docs/search-ui.md` gives two prebuilt options: the modal dialog (`<pagefind-modal-trigger>` + `<pagefind-modal>`) and `<pagefind-searchbox>` (a dropdown). The dialog is the one this project wants.
- Other 1.5.0 changes that help this site: search runs in a Web Worker, index chunks are about 45% smaller, and diacritics match (a search for "cafe" finds "café").

## Build: CLI after `vite build`

- `docs/running-pagefind.md`: "Pagefind usually runs after your static site generator". The minimal command is `npx pagefind --site public`; it writes the bundle to `public/pagefind/`.
- Pagefind maintainer on SvelteKit ([Pagefind#548](https://github.com/Pagefind/pagefind/issues/548)): the quick start "is applicable to the website frameworks **with static exports**, e.g. SvelteKit with adapter-static … From that point, it's a static site and Pagefind runs on the directory".
- There are no official SvelteKit docs. [Pagefind#539](https://github.com/Pagefind/pagefind/issues/539) (open) asks for meta-framework docs; the maintainer points to the Node API for deeper tool integration.
- What the SvelteKit community did: [Pagefind#327](https://github.com/Pagefind/pagefind/issues/327) and [#549](https://github.com/Pagefind/pagefind/issues/549) show the pain comes from `import("/pagefind/pagefind.js")` inside Svelte code: Vite and `svelte-check` cannot find a file that exists only after the build, and the import fails on the server (`location is not defined`). The fix there was `// @ts-ignore`, a browser guard, or the third-party `vite-plugin-pagefind` (npm `latest` 1.1.1). With the Component UI loaded by a plain `<script type="module" src="/pagefind/pagefind-component-ui.js">`, none of this applies. No Vite plugin and no Node API are necessary.
- The Node API (`docs/node-api.md`) can build an index from code. It helps only when a tool has no HTML files on disk. adapter-static writes HTML files, so the CLI is simpler.

Recommended change for this repo:

```jsonc
// package.json
"build": "bun scripts/reading-level.ts && vite build && pagefind --site public",
"devDependencies": { "pagefind": "1.5.2" }
```

The deploy workflow already runs `bun install --frozen-lockfile` and `bun run build`, so it needs no change. `public/` is in `.gitignore`, so the bundle is never committed.

URLs: `src/routes/+layout.ts` sets `trailingSlash = 'always'`, so each page is `…/index.html`. Pagefind drops `index.html` from result URLs by default (`docs/config-options.md`, "Keep index URL"), so results link to `/rochester-city-parks/some-park/`. This is the canonical form. The `.html` problem in #549 does not apply.

## Under `vite dev`

Pagefind has no dev mode for Vite. Under `vite dev`, the requests for `/pagefind/pagefind-component-ui.js` and `.css` fail, so the custom elements never upgrade and get no styles. `<pagefind-modal-trigger>` stays an unknown element with no children and no size. The page works; the console shows two load errors. The Pagefind CLI has `--serve` (`docs/config-options.md`), but `vite preview` does the same job and is how this project measures speed.

- Recommended: test search with `bun run build && bun run preview`.
- Not recommended: index into `static/pagefind/` for dev. `vite build` would copy that old bundle into `public/`, and the build step would then have to overwrite it.

## Attributes that control the index

From `docs/indexing.md`, `docs/metadata.md`, `docs/filtering.md`, `docs/weighting.md`:

| Attribute | Effect |
|---|---|
| `data-pagefind-body` | Index only this element (several per page are combined). When any page on the site has it, pages without it are **not indexed**. |
| `data-pagefind-ignore` | Leave this element out of the index. Default value `index` still reads meta, filters, title and image inside it; `="all"` skips everything. |
| `data-pagefind-meta` | Store a value to show with the result. Forms: element text (`="title"`), attribute (`="image[src]"`), inline (`="kind:Park"`, must be last). Comma-separate several keys in **one** attribute. Meta is searched by default since 1.5. |
| `data-pagefind-default-meta` | Same as meta, but lower priority. |
| `data-pagefind-filter` | Adds a filter value (for example a municipality). Not necessary for the first version. |
| `data-pagefind-sort` | Adds a sort key. Not necessary. |
| `data-pagefind-weight` | Weight 0.0–10.0 for an element; the scale is quadratic (2.0 ≈ 4x). |
| `data-pagefind-index-attrs` | Adds attribute text, such as `alt`, to the index. |

Pagefind skips `<nav>`, `<footer>`, `<script>` and `<form>` by itself. The CLI option `exclude_selectors` (in `pagefind.yml`) removes elements with no template change.

**Leaving a page out completely (Former Park, ADR-0010).** `docs/indexing.md`, "Removing pages": "the best way to remove pages is by adding `data-pagefind-body` to the pages you **would** like to index." So put `data-pagefind-body` on the main content of each page type that must be found, and do not put it on a Former Park page. The CLI `glob` option is the other method, but a Former Park keeps its normal URL, so a glob cannot select it. A test in the index step can assert that no Former Park URL is in the index.

This choice is site-wide: once one page has `data-pagefind-body`, every page type must have it or it drops out. #297 must list the page types (Park, Trail, Blog post, list pages, about, and so on) and mark each one.

## Ranking a Park name above body text

- Automatic `title` meta is the text of the first `h1` (`docs/metadata.md`). In the test index, Park pages have the Park name as title (for example `/town-parks/perinton-parks/spring-lake-park/` → "Spring Lake Park").
- Since 1.5.0, a title match gives a 5x boost, and pages that match only in the title are returned too (`docs/ranking.md`, "Configuring Metadata Weights"; `CHANGELOG.md` v1.5.0). Change it with `ranking.metaWeights` in `configureInstance("default", { ranking: { metaWeights: { title: 5.0 } } })` from `window.PagefindComponents` (`docs/components/config.md`, "Programmatic Configuration").
- Headings have their own weight: `h1` 7.0, `h2` 6.0 … all other text 1.0 (`docs/weighting.md`).
- So a Park name ranks above body text with no change. Add `data-pagefind-weight` or `data-pagefind-meta="title"` only if a page's `h1` is not the name.
- Other names (a former name, a Trail's other name) can go in a custom meta key with its own `metaWeights` value. That is a #297 decision.

## Styling, color scheme, view transitions

- The UI is light DOM, not shadow DOM. Its CSS resets each `pagefind-*` element with `all: initial` and each `pf-*` class with `all: revert`, under selectors of very high specificity (`:is(*, #\#):is(*, #\#):is(*, #\#) …`, three IDs) (`pagefind_ui/component/css/pagefind-component-ui.css`). Site class rules do not win against it. The supported way to style it is the `--pf-*` custom properties (`docs/css-variables.md`): colors, `--pf-font`, sizes, `--pf-border-radius`, `--pf-modal-max-width`, `--pf-modal-max-height`, `--pf-modal-top`, `--pf-modal-backdrop`, and the icons.
- **`prefers-color-scheme`:** not automatic. `docs/css-variables.md`: "The Component UI does not honor `prefers-color-scheme` automatically because it cannot determine if the site it is placed on does so." Either put `data-pf-theme="dark"` on an ancestor, or set the `--pf-*` colors in the site's own dark-mode block. The second fits this site: map `--pf-*` to the site's color tokens once.
- **Dialog:** `<pagefind-modal>` makes a native `<dialog class="pf-modal">` and opens it with `showModal()` (`pagefind-modal.ts`, lines 47 and 141). So it has the top layer, `::backdrop`, focus trap and Escape for free. It closes on a backdrop click. Its open animation (`pf-modal-appear`, 0.15 s scale + fade) runs only under `prefers-reduced-motion: no-preference`.
- **View transitions:** the UI has no view-transition code (no `startViewTransition` and no `view-transition-name` in the source). A result is a normal link, so the site's cross-document view transition runs as for any link. There is no morph from the trigger to the dialog.
- **Keyboard:** the trigger listens for `mod+k` (Cmd+K or Ctrl+K) on the whole document. Change it with `shortcut="/"`; hide the key hint with `hide-shortcut`; show only the icon with `compact`. The trigger button gets `aria-haspopup="dialog"`, `aria-expanded` and `aria-keyshortcuts` (`pagefind-modal-trigger.ts`).
- **Own button:** the trigger always renders its own button (see dod-db difference 2). To use a site button, call `open()` on the `<pagefind-modal>` element. `open()` is a public method in the source but is not in the docs, so it can change.
- **Before the script runs** the trigger has no children, so it has no width (with the CSS loaded it is an empty `inline-block`). The header must keep space for it, or the header moves when the button appears. This is a #298 point.

## Size and load cost

Test run on this site, 2026-09-27, commit `614c321`, `bunx pagefind@1.5.2 --site public` after `bun run build`:

| Measure | Value |
|---|---|
| HTML pages indexed | 387 (no `data-pagefind-body` yet, so every page) |
| of which `/cards/` and `/by-size/` list pages | 68 |
| Words (Pagefind's count) | 3,768 |
| Index time | 0.27 s (2.0 s with the `bunx` start) |
| Index chunks (`index/`) | 8 files, 177 KB total, largest 26 KB (already gzip) |
| Fragments (`fragment/`) | 387 files, 317 KB total, about 0.8 KB each (already gzip) |
| `pagefind.en-us_*.pf_meta` | 3 KB |
| `wasm.en-us.pagefind` | 73 KB |
| `pagefind.js` + `pagefind-worker.js` | 13 KB + 12 KB gzip |
| `pagefind-component-ui.js` / `.css` | 175 KB / 42 KB raw; 39 KB / 7 KB gzip |

Cost to a reader:

- **Every page:** the UI script (39 KB gzip) and CSS (7 KB gzip). The script is a module, so it does not block the first render. It is the same file on each page, so the browser caches it.
- **First search:** `pagefind.js`, the worker, the WASM, the meta file and one or two index chunks: about 125 KB compressed (13 + 12 + 73 + 3 + one chunk of about 22). Then one fragment (about 1 KB) for each result shown. `preload` is off by default, so none of this loads before the reader types (`docs/components/config.md`).
- **About 500 pages:** the chunk count and the fragment count grow with the pages; the per-search cost stays near the same, because a search loads only the chunks for its words. `docs/hosting.md`: Pagefind compresses its own files, so the server needs no gzip.
- Firebase Hosting: only the files in `index/` and `fragment/` and the `.pf_meta` file have a hash in the name. `pagefind.js`, `pagefind-worker.js`, the `wasm.*` files, `pagefind-entry.json` and the UI `.js`/`.css` do not. Do not add the `/_app/immutable/**` long-cache header to all of `/pagefind/**`.

## What this changes for the other tickets

- **#297 (index contents and ranking):** the Park-name boost is already there in 1.5 (title = `h1`, 5x). The main work is to choose where `data-pagefind-body` goes, because it is all-or-nothing for the site: a Former Park page must not have it, and every other page type that must be found must have it. Decide if the 68 `/cards/` and `/by-size/` list pages are in the index; today they would duplicate their list pages. Decide if a custom meta key (such as the municipality or "Trail") shows on each result.
- **#298 (search trigger and dialog in the header):** use `<pagefind-modal-trigger>` + `<pagefind-modal>`, loaded by script tag from `/pagefind/`. Do not put your own button inside the trigger; it is removed. Style only through `--pf-*`, and map them to the site color tokens for light and dark. Keep space in the header for the trigger before the script runs. The prototype must run on `bun run build && bun run preview`, not `vite dev`. The `mod+k` shortcut is on by default.
