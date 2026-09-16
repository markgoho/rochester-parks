# ADR-0001: Where Park metadata displays

- **Status**: Accepted
- **Date**: 2026-09-16

## Context

We add more metadata to each Park. Acres is the first new field. More fields will follow: address, hours, trail miles, the official site.

Three surfaces can show a field. The Park List (`src/lib/layouts/ParkList.svelte`), the Park page (`src/lib/layouts/ParkSingle.svelte`) and the finder (`src/routes/find/`). Without a rule, each new field goes on all three. The Park List is the most costly surface, because its desktop row is a five-area CSS grid and its mobile row is a different grid. Each new column changes both.

Two constraints apply:

- The site is Web-native. `src/routes/+layout.ts` sets `csr = false`. Only `/find` sets `csr = true`, because it must filter in the browser.
- `ParkMeta.status` holds derived facts only. Nothing in it is authored by hand.

## Decision

**A field displays on the surface where the reader asks its question.**

| Surface | The reader's question | What the surface shows |
|---|---|---|
| Park List | Which of these Parks do I go to? | Facts that compare Parks: acres, trail miles |
| Park page | I chose this Park. What must I know? | Facts for one Park: address, hours, official site, who looks after it |
| Finder | Show me each Park that... | Fields that filter or sort the full site |

Three rules follow:

1. The Park List shows a maximum of two numeric columns. After that, a new field goes to the finder.
2. An authored fact goes in `ParkMeta`, beside `geo`. It does not go in `ParkStatus`. `ParkStatus` stays derived.
3. A Park with no value for a field shows an em dash. In a sort, these Parks come last. A size sort that hides them shows the Parks that somebody measured, not the largest Parks.

**Sort.** "Nothing is ranked here" prevents an editorial rank. It does not prevent a sort on an objective number.

A second order is a second prerendered page, not a control. `/town-parks/greece-parks/` stays in A to Z order. `/town-parks/greece-parks/by-size/` lists the same Parks, largest first. Each page links to the other. This is the Hugo pattern.

We rejected two alternatives:

- A sort control on the list page. It needs `csr = true` on the catch-all route. That sends the Svelte runtime to each Park page and each section page, for one control. It also breaks the reason `src/routes/+layout.ts` gives for `csr = false`.
- Sort in `/find` only. The runtime is already there, so the cost is zero. But the reader asked for a sorted town list, and `/find` is a different page with a different job.

A second page costs build time and about 23 more files. It costs the reader no JavaScript.

A section gets a `by-size` page only when two or more of its Parks have a figure. One measured Park is not an order.

## Consequences

- Acres becomes `acres?: number` on `ParkMeta` and on `ParkIndexEntry`. It shows as a Park List column. The finder carries the figure, so a size filter can be added later. The Park page facts panel is a follow-up, and is not built yet.
- Address, hours and the official site show on the Park page only.
- The Park List drops the "Sorted A-Z - nothing is ranked here" copy. The two orderings are reached from the column headings themselves: the Park heading links to the A to Z page, the Size heading links to the `by-size` page, and the heading of the current order is marked `aria-current="page"` instead of linked. A heading is a link, not a button, so this stays a second page and not a control. The page still states its own order.
- The `by-size` page carries a canonical link to the A to Z page, because the two hold the same Parks.
- Rochester city Parks have no acreage at all (0 of 77). That section gets no `by-size` page until the figures arrive.
- The A-Z page and the `by-size` page hold the same rows in a new order. This is the best case for a cross-document view transition. See issue #35.
