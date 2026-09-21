# ADR-0007: One page per Park, with page navigation

- **Status**: Accepted, amended by ADR-0011
- **Date**: 2026-09-18

## Context

We must record the Facilities inside a Park, for example the four lodges at Pineway Ponds Park. Most of these you rent, and they have no public hours. Later a Park can also have Trails inside it, a history and a map of where each thing is. This information can go on the Park page, or on pages of its own under the Park: a Facilities page, a Trails page, a History page.

The content has two facts that apply:

- Most Park pages are short. Of 282 Park pages, the median body is 9 words, 90% have 130 words or fewer, and the longest has 571.
- The Hugo site tried subpages. 4 Parks had 15 of them (`events`, `history`, `photos`, `reservations`, `reviews`, `trails`). 13 had a title and no body. Only the Ellwanger and Barry history had text. The Veterans Memorial Park trails page had one line that promised a later visit.

A reader who searches for "Pineway Ponds lodge rental" lands on the Park page. That page must answer the question.

## Decision

**All information about a Park is on its Park page.** Each topic is an `h2` heading with an `id` on that page. A topic does not get a page of its own.

**The Park page has a page navigation** when it has two or more topic headings. It is a list of anchor links to the headings, made at build time. A link to a topic from somewhere else, for example `…/pineway-ponds-park/#facilities`, goes directly to that topic.

**The page navigation shows the topic you are reading with CSS only:** `scroll-target-group: auto` on the list and `:target-current` on the links. There is no script. A browser that does not support these features shows the same list with no highlight. The list works fully without the highlight.

A topic gets its own page only when it has more content than the Park page can hold, and a reader would go to it directly. That is a new decision when it happens, not the default.

We rejected two alternatives:

- **Subpages for each topic.** Most would hold one line or nothing, as the Hugo subpages did. A reader who wants to rent a lodge would need a second click.
- **A script for the highlight.** The usual scroll-spy uses `IntersectionObserver`, and it sets `aria-current` with a script. Park pages ship no client JavaScript (`csr = false`). We target the latest browsers, and the rule of least power puts CSS before JavaScript.

## Consequences

- The 13 empty subpages are removed. The Ellwanger and Barry history moves to a History heading on its Park page. The Veterans Memorial Park trails line has no facts and is removed. Each old URL redirects to its Park page.
- The page navigation is new work. Firefox and Safari show it with no highlight until they support `scroll-target-group`.
- `:target-current` is not exposed to a screen reader, and without a script there is no `aria-current`. A screen reader user gets the list and the headings, but not the current topic.
- The Facilities topic needs a Facility that can have no hours, with how to rent it and its place in the Park (#77).
- ADR-0011 answers #111: the write-up has no standard set of topics, and tracks no figure per topic.
