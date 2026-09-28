# ADR-0013: Search needs JavaScript

- **Status**: Accepted
- **Date**: 2026-09-27

## Context

Web-native holds every reader-facing page to plain HTML that works with JavaScript off. Add site search (#317) asks for a reader to type a Park's name, a town, or a word from its write-up, and get to its page in one step. The site is static: SvelteKit builds it to `public/` and Firebase Hosting serves the files. There is no server this site controls that a search box could query.

Pagefind indexes the built HTML at build time and searches that index in the reader's own browser, from files this host already serves. The two other ways to answer the spec's problem both fail Web-native worse than Pagefind does: a plain HTML fallback (a form that lists every page, or a client-side page that still needs JavaScript to filter) gives a reader with JavaScript off no working search at all, so it is not really a fallback; and an outside search engine (for example a hosted Algolia index or a Google Custom Search box) would send every reader's search term to a service this site does not control, which the spec's search analytics decision (#312) already treats as a privacy line the site will not cross for its own logging, let alone hand to a third party.

## Decision

**Search needs JavaScript. This is the one exception to Web-native.** With JavaScript off, every page still works exactly as it does today; only the search dialog is missing. There is no JS-off fallback for search, and no outside search engine takes its place.

## Consequences

- CONTEXT.md's **Web-native** entry names this exception and links here.
- The reader-facing half of Web-native no longer reads as an absolute rule. A future feature that also wants JavaScript must show the same kind of trade-off (no server to ask, no acceptable JS-off answer) rather than pointing at this ADR as a general exemption.
