# ADR-0003: Where Park acreage comes from

- **Status**: Accepted
- **Date**: 2026-09-18

## Context

The `acres` field came from two sources. Town and county Parks took it from the Google Sheets park database (`docs/park-database-sync-audit.md`). City Parks took it from the City of Rochester's `Hosted/Parks_Open_Space_Points` GIS layer (#60). Nobody knows how the park database got its figures.

The crawl in #66 read the official page of each Park. 89 official pages give a size. For 29 Parks, the official figure differs from ours by more than 10% (#67). Braddock Bay Park is 1753.11 acres in the park database and 375 on the Town of Greece page.

The `by-size` pages (ADR-0001) sort on this field, so the source changes the order.

## Decision

**For acres, the official town, county or city page has priority.** The order of sources is:

1. The official page of the Park, when it gives a number.
2. The park database, for a town or county Park.
3. The city GIS layer, for a city Park.

A lower source fills the field only when no higher source gives a figure. The figure is written as the official page gives it, with no added precision.

The park database sync already uses this rule for a Park name: the official page has priority over the park database.

## Consequences

- All 89 Parks with an official figure now use it. 72 figures changed, 6 Parks got a figure for the first time, and 11 figures were already the same.
- Some official figures are rounded, or give only the developed part of a Park. Braddock Bay Park drops from 1753.11 to 375 acres, and it moves down its `by-size` page. We accept this. The official figure is the one the Park's owner publishes.
- The front matter does not record the source of a figure. Before a future sync from the park database writes `acres`, it must read the official page of that Park. If the official page gives a figure, the sync keeps it.
