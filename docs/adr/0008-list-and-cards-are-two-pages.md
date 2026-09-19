# ADR-0008: The table and the cards are two pages

- **Status**: Accepted
- **Date**: 2026-09-18

## Context

A Park List shows its Parks as a table. Readers also want to see them as cards, with a photo. A reader must be able to change between the two views, and each view must keep the sort orders of ADR-0001.

Only 25 of the 280 Parks on a Park List have a photo: 2 of 78 in the city, 1 of 22 in the county. Thus most cards have no photo, and the card for a Park with no photo sets the look of the page.

A prototype tried three card designs on the `prototype/park-cards` branch. The owner chose "photo or place".

## Decision

**A card view is a second page below each ordering.**

| Table | Cards |
|---|---|
| `/town-parks/greece-parks/` | `/town-parks/greece-parks/cards/` |
| `/town-parks/greece-parks/by-size/` | `/town-parks/greece-parks/by-size/cards/` |
| `/rochester-city-parks/by-neighborhood/` | `/rochester-city-parks/by-neighborhood/cards/` |

Two icon links at the end of the section's counts line change the view: rows for the table, a grid of squares for the cards. The view is a property of the whole section, so the switch sits with the section's counts, in the same place on both views, and adds no line above the table. Each icon has a tooltip. Each order link on a card page goes to the card page of that order, so the view stays when the reader sorts.

A card page carries a canonical link to the A to Z table, and the sitemap does not list it.

**A card shows a photo, or where the Park is.** A photo shows in ink and paper, and changes to full colour under the pointer or the focus. A Park with no photo shows the town or Neighborhood that holds it, with one dot for the Park. A county Park shows the town it stands in.

We rejected two alternatives:

- A CSS toggle with the URL hash (`#cards`) and `:target`. It needs no script, but each page must then hold both views. The prototype held its three views this way, and the city page grew to 1.2 MB. A hash also does not stay when the reader follows a sort link, unless each link adds it again.
- A toggle with client JS. ADR-0001 rejected this for the sort orders, for the same reasons.

## Consequences

- Each park section gets one more page for each ordering: 46 more pages.
- `ParkMeta` gets `photo?: string`. The photo for a card is a WordPress featured image first, then the first body image. A WordPress thumbnail is only 144px wide, so it comes last.
- `Page` gets `view?: 'cards'`.
- A card takes the same view transition names as its table row. A Park moves between the table and the cards, and between two orders.
- Each card draws its own map, but not from its own copy of the paths. Each place's outline and clip, and the river and the canal, are in a card page once, and each card points at them with `<use>`. The status icons point into one sprite file, `/icons.svg`, that the browser keeps for all pages. Before, the city card page was 574 KB, and the river alone repeated 43 times. It is now 308 KB, and the city table page is 238 KB, not 330 KB (#137).
