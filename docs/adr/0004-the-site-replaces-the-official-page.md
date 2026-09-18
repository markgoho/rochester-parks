# ADR-0004: The site replaces the official page

- **Status**: Accepted
- **Date**: 2026-09-18

## Context

Most official town, county and city park pages are hard to read and hard to use. Before this decision, the site showed some facts and sent the reader to the official page for the rest, for example hours that change, closures and reservations.

The crawl in #66 showed that the official pages hold facts that go out of date: "Effective June 29, 2026", "Reopens Monday Nov 23, 2026", seasonal beach hours. A link to the official page is the simple way to handle these facts, but it sends the reader away.

## Decision

**The site replaces the official page. A reader never needs to visit it.** The official page stays the source of the facts (ADR-0003), but the site shows every fact the reader needs, including facts that are true only for a period.

The end goal is to also replace the reservation systems that most municipalities offer.

## Consequences

- The site takes on the work of keeping facts current. A fact with a date carries that date, and the build shows only what is true on the day of the build. The site needs a scheduled rebuild.
- Each Park records when its facts were last checked against the official page. Scripts crawl the official pages again, report changes, and check that links still work.
- The official site link on the Park page (ADR-0001) is a citation, not the place where the reader finds the facts.
- A Reservation inquiry is no longer only a mistake to redirect. It shows a need that the site plans to meet.
