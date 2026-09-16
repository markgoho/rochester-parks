# ADR-0002: City Parks draw on their Neighborhood

- **Status**: Accepted
- **Date**: 2026-09-16

## Context

A town Park page draws its town outline with a dot. The town Park List draws the county with the town picked out. The county Park List draws the whole county.

The city had no equivalent. Its Park List embedded a Google My Maps iframe, which breaks the Web-native rule in `CONTEXT.md`. Its Park pages drew no map at all, because `townAt` and `townKey` name towns only.

Two sources of Neighborhood boundaries exist:

- The Google map the site embedded. Its boundaries were "sourced online" and are coarse, 4 to 136 points each.
- The City of Rochester's own layer, `ProjectsAndPlans/Neighborhoods` on `maps.cityofrochester.gov`. It holds 50 polygons, keyed on neighborhood associations.

Both line up with the traced city outline to within about one map unit after `project()`.

## Decision

**The city is drawn with its Neighborhoods, the way the county is drawn with its towns.**

- The city Park List draws every Neighborhood (`CityLocator`). Each carries a `<title>`, so its name shows on hover with no JavaScript. The iframe is gone.
- A city Park page draws only the Neighborhood that holds the Park (`TownShape`, which now takes any `Outline`). A Park outside every Neighborhood gets the whole city.
- The boundaries come from the city's layer, not the Google map. `scripts/neighborhoods.ts` fetches it, simplifies it to 0.05 map units, and writes `src/lib/neighborhood-outlines.ts`. Names are cleaned in that script: the layer prints association names in capitals.

### Parks by Neighborhood

A Neighborhood gets no page of its own. Most hold one park or none: of 48, 17 hold none and 17 hold one. A page each would be thin.

Instead, the city section has a second prerendered page, `/rochester-city-parks/by-neighborhood/`, the same rows grouped under one heading per Neighborhood. This is the ADR-0001 pattern: a second order is a second page, not a control. Its canonical is the A to Z page, and the sitemap leaves it out.

- On the city Park List map, a Neighborhood with parks links to its group (`by-neighborhood/#corn-hill`). A Neighborhood with none is drawn paler and is not a link.
- On a city Park page, the "In Corn Hill" caption links to the same group.
- The two city list pages link to each other from an order line above the table.
- A park with no `geo` goes in a last group, "Not placed yet".

## Consequences

- Some association areas overlap: Lilac sits inside the University of Rochester, Park Meigs crosses Park Central. The outlines are stored largest first. The map draws the smaller area on top, and a Park in both takes the smaller, more specific name.
- The city's layer has no polygon for the airport land in the southwest. A point there falls back to the whole city map.
- The Google map's Neighborhood descriptions and Park markers are not carried over.
- A city Park page shows a map only once it has `geo`. Most city Parks have none yet.
- A county Park that stands in the city still draws the whole city outline, not its Neighborhood.
