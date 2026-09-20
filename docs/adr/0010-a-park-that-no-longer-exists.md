# ADR-0010: A Park that no longer exists

- **Status**: Accepted, amends ADR-0005
- **Date**: 2026-09-19

## Context

ADR-0005 decides what counts as a Park. It sorts a place into two states: it is a Park, or it never was one. `meigs-linden` and `james-madison-school` went under that rule, and no page was left behind.

`forest-hills-playground` does not fit either state. Greece decommissioned it, so it is not a Park now. But it was one, the owner walked it in 2012 and photographed it, and no other page on the internet records what was there. Deleting it would throw away the only record. Leaving it in the Greece Park List tells a reader to go to a park that is gone.

Today the page carries the fact as a line of body prose, "This park has been decommissioned and is no longer a park." ADR-0004 puts a dated fact in frontmatter, not in prose, so the layout can act on it.

## Decision

**A Former Park is a Park that a government has since decommissioned, closed for good or built over. It keeps its page, and the page says plainly that the park is gone.**

The state is an authored fact in the Park page frontmatter, `former: true`. It is not a `ParkStatus` flag: those three flags follow from the markdown and nothing there is authored by hand. A date is not required. The site records that the park is gone, not when it went, and for Forest Hills no source gives a date.

A Former Park is a third state beside ADR-0005's two. It was a Park, so the rules that admitted it still hold; it is not a Park now, so nothing on the site sends a reader to it as a place to go:

- It is not in the town's Park List, and not in the count of that town's parks. The list shows it under a separate **Former parks** heading, rendered only where a section holds one.
- It is not a marker on the town or county map, and not in the all-parks count.
- It is not a result in `/find`.
- It stays in the sitemap and stays indexable. Search is how a reader looking for the old park finds out what became of it.

Its amenities stay in the frontmatter as the record of what the park had, and the page words them in the past. They are published nowhere that reads as a present fact: not in JSON-LD, not in `/find`, not on a card.

## Consequences

- `forest-hills-playground` is the only Former Park today. The heading is built for a set, but Greece is the only section that shows it.
- The term is **Former Park**, not "decommissioned park". Decommissioned names the town's act; former names the state the site records, and reads as a list heading.
- A Park that closed for a season, for repair, or that a town plans to close, is not a Former Park. It is a Park with a note.
- ADR-0006 admits a planned park that is not open yet. A planned park and a Former Park are opposite ends of the same line, and neither is in the count of parks a reader can visit today.
