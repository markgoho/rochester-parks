# What the Pagefind dialog and Pirsch can record about a search

Research for [Find what the Pagefind dialog and Pirsch can record about a search (#312)](https://github.com/markgoho/rochester-parks/issues/312), 2026-09-27. Sources are primary: the Pagefind repo at tag `v1.5.2` (commit `bf17396`), its docs source (`docs/content/docs/*.md`, published at pagefind.app), the built `public/pagefind/pagefind-component-ui.js` from branch `prototype/search-map`, the live `https://api.pirsch.io/pa.js`, docs.pirsch.io, pirsch.io/pricing, and a headless test run on the built site.

## Short answer

- **Pagefind gives a supported JS API, not DOM events.** Get the instance with `window.PagefindComponents.getInstanceManager().getInstance('default')` and call `instance.on(event, callback)`. The events are `search`, `loading`, `results`, `filters`, `error` and `translations`. No fork is necessary.
- **Query:** the `search` event gives `(term, filters)`. **Result count:** the `results` event gives `searchResult`; the count is `searchResult.results.length`. The `results` payload has no term, so keep the term from the last `search` event (or read `instance.searchTerm`).
- **"Done":** `<pagefind-input>` waits 300 ms after the last key press (the `debounce` attribute), then starts one search. A reader who stops for 300 ms mid-word makes a search too. To count one search per query, wait for a longer pause, a result click, or `search("")`.
- **End of a query:** with `reset-on-close` (the prototype has it), closing the dialog calls `triggerSearch("")`. So `search("")` after a non-empty term means "the reader left this query" (dialog closed, Escape, or clear button).
- **Result opened:** there is no Pagefind event. Use one delegated `click` (and `auxclick`) listener on `<pagefind-results>` that finds the closest `a`.
- **Pirsch `pa.js` sends custom events.** `window.pirsch(name, {meta, duration, non_interactive})` is in `pa.js`; it is not only in an extended script. It sends with `navigator.sendBeacon`, so the event survives the full page load when a reader opens a result (`csr = false`).
- **Pirsch limits:** up to 20 metadata pairs, key up to 100 characters, value up to 2000 characters, string values only. Tags count toward these limits. The docs give no event name limit.
- **Plan:** every Pirsch plan (Standard, Plus, Enterprise) has custom events, the API and CSV export. Only "Custom Event Metrics" and funnels need Plus. Each event counts toward the monthly page-view quota.
- **Export:** `GET /api/v1/statistics/event/list` with `event=<name>` and `meta_results=0` gives each query with no result, grouped by name and metadata. It needs an OAuth client (client ID and secret) with `statistics` read scope, a token from `POST /api/v1/token`, and `Authorization: Bearer <token>`.
- **Privacy:** Pirsch says metadata must contain no personal data (PII). A query is free text, so it can contain a name, an address or a phone number. Pagefind itself sends nothing off the site and does not put the query in the URL or in storage.

## Pagefind Component UI

All source links are at tag `v1.5.2`. The built file on `prototype/search-map` is the same release: `public/pagefind/pagefind-entry.json` says `"version":"1.5.2"`, and the minified `pagefind-component-ui.js` sets `window.PagefindComponents` with `getInstanceManager`.

### The supported way to listen

- The docs page "Custom Components" says custom code "can listen to search events, trigger searches, and coordinate with the built-in components" ([docs/custom-components.md L8](https://github.com/Pagefind/pagefind/blob/v1.5.2/docs/content/docs/custom-components.md?plain=1#L8)).
- With the script tag, use the global after `pagefind-component-ui.js` loads: `window.PagefindComponents.getInstanceManager().getInstance('default')` ([docs/custom-components.md L17-L31](https://github.com/Pagefind/pagefind/blob/v1.5.2/docs/content/docs/custom-components.md?plain=1#L17-L31)). The global is set when the module runs ([component-ui.ts L11](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/component-ui.ts#L11)).
- `getInstance(name)` returns the existing instance or makes one, so a listener can attach before or after the components connect ([components/instance-manager.ts L32-L51](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/components/instance-manager.ts#L32-L51)). Components with no `instance` attribute use `default`.
- Load order: module scripts run in document order. A second `<script type="module">` after the Pagefind one sees the global.
- `instance.on(event, callback, owner?)` rejects an unknown event name with a console error ([core/instance.ts L467-L499](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/core/instance.ts#L467-L499)). There is no `off()`; a listener stays for the life of the page. On this site each page is a full page load, so that is not a problem.

### Events

From the docs table ([docs/custom-components.md L52-L63](https://github.com/Pagefind/pagefind/blob/v1.5.2/docs/content/docs/custom-components.md?plain=1#L52-L63)) and the types ([types.ts L65-L74](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/types.ts#L65-L74)):

| Event | Callback arguments | When |
|---|---|---|
| `search` | `(term: string, filters: FilterSelection)` | At once, when a search starts |
| `loading` | none | Before each search |
| `results` | `(searchResult: PagefindSearchResult)` | When results are ready |
| `filters` | `({ available, total })` | When filter counts change |
| `error` | `(error: PagefindError)` | When Pagefind cannot load or search |
| `translations` | `(translations, direction)` | When the language changes |

`PagefindSearchResult` is `{ results: PagefindRawResult[], filters?, totalFilters?, unfilteredTotalCount? }`, and each raw result is `{ id, data: () => Promise<PagefindResultData> }` ([types.ts L4-L14](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/types.ts#L4-L14)). The count is available at once; the URL and title of a result need `await result.data()` ([docs/custom-components.md L146-L160](https://github.com/Pagefind/pagefind/blob/v1.5.2/docs/content/docs/custom-components.md?plain=1#L146-L160)).

### How a search runs

1. `<pagefind-input>` has a `debounce` attribute, default `300` ms ([docs/components/input.md L23](https://github.com/Pagefind/pagefind/blob/v1.5.2/docs/content/docs/components/input.md?plain=1#L23); [components/pagefind-input.ts L18](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/components/pagefind-input.ts#L18), [L29-L31](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/components/pagefind-input.ts#L29-L31)). Each key press starts a timer. Only the last timer calls `instance.triggerSearch(value)` ([L111-L125](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/components/pagefind-input.ts#L111-L125)).
2. `triggerSearch(term)` sets `instance.searchTerm`, dispatches `search` at once, then calls `__search__` ([core/instance.ts L505-L509](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/core/instance.ts#L505-L509)).
3. `__search__` dispatches `loading`, loads Pagefind, and searches. It dispatches `results` only if no newer search started, so an old search never sends late results ([core/instance.ts L553-L596](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/core/instance.ts#L553-L596)). Thus the last `search` event always matches the next `results` event.
4. An empty term does not search. `__clear__` dispatches `results` with `{ results: [], unfilteredTotalCount: 0 }` ([core/instance.ts L541-L551](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/core/instance.ts#L541-L551)). A listener must ignore `results` when the term is empty, or it counts a false "no result".
5. Escape in the input and the clear button call `triggerSearch("")` ([components/pagefind-input.ts L127-L133](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/components/pagefind-input.ts#L127-L133), [L161-L168](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/components/pagefind-input.ts#L161-L168)). Inside the dialog, Escape goes first to a capture listener on the `<dialog>` that closes it ([components/pagefind-modal.ts L93-L103](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/components/pagefind-modal.ts#L93-L103)).
6. With `reset-on-close`, the dialog `close` handler calls `triggerSearch("")` ([components/pagefind-modal.ts L87-L91](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/components/pagefind-modal.ts#L87-L91), [L150-L154](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/components/pagefind-modal.ts#L150-L154)). The native `close` event does not bubble, so a listener on `<pagefind-modal>` does not get it. When a listener on the inner `<dialog>` runs, `instance.searchTerm` is already `""`. Keep the last non-empty term in your own variable.

### When a search is "done"

Pagefind has no "final query" signal. The 300 ms debounce stops a search on each key press, but a slow typist makes a search for each pause: in the test run, "gene", a 600 ms pause, then "see" made two searches, `gene` (27 results) and `genesee` (21 results). To record one query per intent, record the last non-empty term (and its count) at one of these points, whichever comes first:

- the reader opens a result (click on a result link);
- `search("")` arrives after a non-empty term (dialog closed, Escape, clear button);
- no new `search` event for a longer time (for example 1.5 to 2 s). The page can also unload with the dialog open; `pagehide` covers that.

`<pagefind-input debounce="…">` can make the Pagefind wait longer, but that makes the results slower for the reader. The analytics wait is better kept in the listener.

### Which result was opened

- No Pagefind event reports it. `<pagefind-results>` listens only to `keydown`, `focusin` and `focusout` on its container ([components/pagefind-results.ts L565-L669](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/components/pagefind-results.ts#L565-L669)).
- The results are plain `<a href>` links. The default template uses `a.pf-result-link` ([components/pagefind-results.ts L52](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/components/pagefind-results.ts#L52)); the site template on `prototype/search-map` (`src/lib/prototype-search.ts`) has its own links.
- Use one delegated `click` listener and one `auxclick` listener (middle click) on `<pagefind-results>`, with `event.target.closest('a')`. Enter on a focused link fires `click`, so keyboard use is covered. The rank is the index of the link's result item among its siblings.
- The site sets `csr = false` (`src/routes/+layout.ts`), so a click is a full page load. The event must go out with `sendBeacon` or `fetch(…, {keepalive: true})`. Pirsch does this (see below).

### DOM events

The only DOM event is `pagefind-error` (`CustomEvent`, `bubbles` and `composed`, `detail` = the error). A component fires it when it shows an error ([components/base-element.ts L87-L103](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind_ui/component/components/base-element.ts#L87-L103)). There is no DOM event for a search or a result.

### Sketch

This is not a design; it shows how the pieces connect. `send` is a placeholder for the Pirsch call.

```js
const instance = window.PagefindComponents.getInstanceManager().getInstance('default');
let term = '', count = 0, sent = '', timer;
const flush = (how) => { if (term && term !== sent) { sent = term; send(term, count, how); } };
instance.on('search', (t) => {
  clearTimeout(timer);
  if (!t.trim()) { flush('left'); term = ''; sent = ''; return; }
  term = t.trim();
});
instance.on('results', (r) => {
  if (!term) return;
  count = r.results.length;
  timer = setTimeout(() => flush('pause'), 2000);
});
document.querySelector('pagefind-results').addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (a) { flush('open'); /* also send a.getAttribute('href') and the rank */ }
});
```

## Pirsch

### `pa.js` sends custom events

Read from the live script `https://api.pirsch.io/pa.js` (11,842 bytes on 2026-09-27) and the [events docs](https://docs.pirsch.io/advanced/events#example-3-using-javascript):

- `pa.js` defines `window.pirsch(name, options)`. `name` must be a non-empty string, or the promise rejects. `options` is `{ meta, duration, non_interactive }`. Each meta value goes through `String()`. `duration` is a number (seconds) or it becomes `0`.
- It sends a JSON body to `https://api.pirsch.io/event` with `navigator.sendBeacon`. The body has the page URL (up to 1800 characters), title, referrer, screen size, tags, `event_name`, `event_duration`, `event_meta` and `non_interactive`. The promise resolves when the browser queues the beacon.
- An event counts as an interaction, so the session is not "bounced". `non_interactive: true` changes that ([docs: Creating Events](https://docs.pirsch.io/advanced/events#creating-events)).
- On `localhost`, with no `data-dev` attribute, or with `localStorage.disable_pirsch` set, `pa.js` puts a stub `window.pirsch` in place. The stub logs `Pirsch event: <name> <json>` to the console and resolves with `null` ([docs: Testing](https://docs.pirsch.io/advanced/events#testing)). So a local preview shows the exact payload and sends nothing.
- `src/app.html` loads `pa.js` with `defer`. Before it runs, `window.pirsch` does not exist. A caller must check `typeof window.pirsch === 'function'`.
- The declarative forms (`data-pirsch-event`, `pirsch-event=` classes, `<meta name="pirsch-event">`) bind once, at `DOMContentLoaded`, with `querySelectorAll`. Pagefind makes the result links later, so a `data-pirsch-event` attribute in the result template does nothing. `window.pirschInit()` binds again, but it also binds each static element a second time. Use the JS call.
- `pa.js` also adds its own events: "Outbound Link Click", "File Download" and "404 Page Not Found" (through `window.pirschNotFound()`).

### Limits

From [docs: Limits](https://docs.pirsch.io/advanced/events#limits):

- up to 20 metadata key-value pairs;
- a key up to 100 characters;
- a value up to 2000 characters;
- tags from the `pa.js` snippet are added to each event and count toward these limits.

Meta values must be strings ([docs: Example 3](https://docs.pirsch.io/advanced/events#example-3-using-javascript)). The same example says "There is no limit to the number of metadata fields you can send". That sentence is in conflict with the Limits section; the Limits section is the more specific statement, so use 20.

The docs give no limit for the event name. The open-source core (`github.com/pirsch-analytics/pirsch`, commit `2cf4279`) only trims white space from the name (`pkg/ingest/request.go` L325). It shortens a title to 512 and a path to 2000 characters. This is the library, not the hosted service, so it does not prove the hosted service has no limit. Keep names short and fixed, for example `Search` and `Search result opened`.

### Plans and billing

From [pirsch.io/pricing](https://pirsch.io/pricing), feature table:

- Standard, Plus and Enterprise all have: Custom Event Tracking, RESTful API & SDKs, CSV Export, Saveable Filters, Public Dashboards.
- Plus and Enterprise only: Custom Event Metrics, Funnels, A/B Testing, Segmentation. None is necessary for this work.
- "Custom events and 10% of events for session extensions count towards your monthly page view limit." The events docs say the same ("Events count towards your billable monthly page views"). Thus send one event per settled query, not one per 300 ms search.
- The plan on the site's account is not visible from the repo. Every plan has what this work needs, so the answer does not block.

### Dashboard

From [docs: Dashboard and Filtering](https://docs.pirsch.io/advanced/events#dashboard-and-filtering):

- Events have their own panel. It shows when at least one event is in the selected period. It shows unique visitors and the conversion rate.
- The detail view shows the event name, views, unique visitors, conversion rate and average duration. The metadata shows below each event.
- A click on an event adds it as a filter; a click on a metadata entry filters by that key and value.
- If `results` is a meta key, a filter on `results = 0` in the dashboard lists the queries with no result.

### API export

From the [API v1 reference](https://docs.pirsch.io/api-sdks/api-v1) (API v2 "will most likely be released at the end of 2026"):

- **Auth** ([Getting an Access Token](https://docs.pirsch.io/api-sdks/api-v1#getting-an-access-token)): `POST https://api.pirsch.io/api/v1/token` with `{ client_id, client_secret }` gives `{ access_token, expires_at }`. Send `Authorization: Bearer <token>`. On `401`, get a new token. An access key is write-only and cannot read statistics.
- **Client** ([Creating a Client](https://docs.pirsch.io/api-sdks/api-v1#creating-a-client)): the client needs `scope_statistics: "r"`. The docs say type `oauth` "can be used to read and write data", and type `token` "is read-only and typically used to send statistics". That second sentence is in conflict with itself; the reading path in the docs is the `oauth` client with ID and secret.
- **Filter** ([Filter](https://docs.pirsch.io/api-sdks/api-v1#filter)): `id` (domain ID), `from` and `to` (`YYYY-MM-DD`) are required. `event=<name>` filters by event name. `meta_<key>=<value>` filters by metadata; all pairs must match. `event_meta_key=<key>` breaks one event down by a key. `limit` is hard-limited to 100; use `offset` to page. Prefixes: `!` (not), `~` (contains), `^` (does not contain).
- **Endpoints:**
  - [`GET /api/v1/statistics/events`](https://docs.pirsch.io/api-sdks/api-v1#events): each event name with count, visitors, views, conversion rate, average duration and its `meta_keys`.
  - [`GET /api/v1/statistics/event/meta`](https://docs.pirsch.io/api-sdks/api-v1#event-metadata): the values of one key for one event (needs `event` and `event_meta_key`), with count and visitors per value.
  - [`GET /api/v1/statistics/event/list`](https://docs.pirsch.io/api-sdks/api-v1#listing-events): events grouped by name and the full metadata, each with `visitors` and `count`.
- **Queries with no result:** `GET /api/v1/statistics/event/list?id=<domain>&from=…&to=…&event=Search&meta_results=0&limit=100&offset=0` gives each distinct `{ query, results: "0", … }` with its count. `event/meta?event=Search&event_meta_key=query&meta_results=0` should give the same as a flat list of query values; the docs do not show `meta_` and `event_meta_key` together, so test it. Neither call was run: there is no read client for the site's account.
- **CSV** ([Exporting Statistics](https://docs.pirsch.io/get-started/export)): the Import / Export settings page exports aggregated statistics to CSV. Raw data export is by request to support.
- **Delete** ([Deleting Statistics](https://docs.pirsch.io/api-sdks/api-v1#deleting-statistics)): `DELETE /api/v1/statistics` with `kind: "events"` deletes only events for a domain and a date range.

## Privacy

### Pagefind

- Pagefind is "a fully static search library … without hosting any infrastructure" ([docs/_index.md L6](https://github.com/Pagefind/pagefind/blob/v1.5.2/docs/content/_index.md?plain=1#L6)). The search runs in the browser. The only requests are for index and fragment files on the site's own host (Firebase Hosting). Which index chunks load depends on the words, so host logs show a rough word range at most, not the query.
- The Component UI does not write the query to the URL, `localStorage` or `sessionStorage`. A search of `pagefind_ui/component/` finds no `history.`, `URLSearchParams`, `localStorage` or `sessionStorage`. The only `location` use is navigation in `<pagefind-searchbox>`, which this site does not use.
- Thus a query leaves the browser only if the site's own code sends it.

### Pirsch

- The events docs have a "DANGER" note: "You must ensure that no Personally Identifiable Information (PII) is sent within a metadata field." Example 4 adds: remove PII "before sending it to Pirsch, or you will need the user's consent" ([docs: Tracking Events](https://docs.pirsch.io/advanced/events)).
- A query is free text. A reader can type a name, an address, an email address or a phone number. The site cannot know. Possible guards (options for the next ticket, not decisions): trim and lower-case; cap the length (for example 64 characters); drop a query with `@` or with many digits; drop very short queries; send only the count and no text when a guard fails.
- Each event carries the page URL and title, the referrer and screen size (from the `pa.js` beacon), and Pirsch adds country, city, browser, OS and a visitor hash. The hash uses IP, User-Agent, date and a salt per site; a visitor is known for at most 24 hours; no cookies; the IP is not stored ([docs: Privacy](https://docs.pirsch.io/privacy#how-does-pirsch-recognize-visitors)).
- Pirsch lists "User-Agent header (separate from a page view for up to three months)" among stored data ([docs: What Data Do We Collect](https://docs.pirsch.io/privacy#what-data-do-we-collect)).
- Retention on every plan is "Unlimited" (pricing). Events stay until someone deletes them: from settings, or with `DELETE /api/v1/statistics` and `kind: "events"`.
- The dashboard has Public Dashboards and access links (pricing, API). If one is turned on, the query text is public too.
- The site has no privacy page now (no match for "privacy" in `src/routes` or `content/`).

## Test run

`bun run build` on `prototype/search-map` (commit `013eb62`), `public/` served by a static server on `localhost`, headless Chromium (Playwright 1.58). The script attached `instance.on('search')` and `instance.on('results')`, a `click` listener on `<pagefind-results>`, and a `close` listener on both `<pagefind-modal>` and its inner `<dialog>`. Output:

```text
EV search "gene"                          typed 4 keys 60 ms apart: one search
EV results "gene" 27
EV search "genesee"                       after a 600 ms pause and 3 more keys
EV results "genesee" 21
EV click /rochester-city-parks/genesee-valley-west/
Pirsch event: Search result opened {"meta":{"query":"genesee","href":"/rochester-city-parks/genesee-valley-west/"}}

EV search "xyzzyq" open=true
EV results "xyzzyq" 0
EV search "" open=false                   Escape closed the dialog (reset-on-close)
EV results "" 0                           the clear, not a real "no result"
EV dialog close; searchTerm=""            the term is already gone
```

- The debounce works: 4 fast keys made one search. A pause of 600 ms made a second search.
- On `localhost`, `window.pirsch` is the `pa.js` stub; it printed the exact payload.
- The listener on `<pagefind-modal>` got no `close` event (it does not bubble). The listener on the inner `<dialog>` ran after `search("")`, with `instance.searchTerm` already `""`.

## Open points

These are for [Decide what search analytics records and where it goes (#313)](https://github.com/markgoho/rochester-parks/issues/313), not facts this research can settle:

- Which moment counts as one search: result opened, dialog closed, a pause, or all three (with one event per query).
- Which PII guards to use on the query text, and whether to send the text at all when a guard fails.
- The event names and meta keys (for example `Search` with `query` and `results`, and `Search result opened` with `query`, `href` and `rank`).
- A read-only OAuth client for the export, if a script should list the queries with no result.
- The event name length limit on the hosted Pirsch service is not documented.
