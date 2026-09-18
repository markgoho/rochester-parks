# ADR-0005: What counts as a Park

- **Status**: Accepted
- **Date**: 2026-09-18

## Context

`CONTEXT.md` defined a Park as "a single public green space", but the site did not follow that rule. The city park pages came from the park database's city tab (#34), which is a list of facilities, not of parks. Four agents judged its 127 rows, and they did not draw the line in the same place (#38). The result included street corners, R-Centers, and school grounds, each one described as "A Rochester City Park".

## Decision

**A Park is a standalone public green space: outdoor land that a government owns and that the public can go to and use.** It has at least one thing a visitor goes there for, such as a playground, a field, a court, a garden or a place to sit.

These are not Parks:

- A street median or "mall", a traffic triangle, a street corner, a bridge, or the plaza around a building.
- School grounds, even when the public can use the fields after school.
- A building. An R-Center, a lodge or a rink is a **Facility** of the Park that holds it.

When an R-Center has its own outdoor grounds, the grounds are the Park. The page is named for the grounds, and the R-Center is a Facility on that page, as Edgerton Park already does.

For a city row, the city's own park GIS layer (`Hosted/Parks_Open_Space_Points`) is the first check. A row the layer types as "Street Mall" is not a Park. A row the layer names as a park, owned by the City of Rochester, is a Park unless it is school land.

## Consequences

- `meigs-linden` was the city's "MEIGS/LINDEN PARK" row, which the city also names Ellwanger & Barry Park. It was a second page for `ellwanger-and-barry-park` and is removed.
- `james-madison-school` is removed. It is school grounds and is in no city park layer.
- `west-high-field` stays. The city owns it and names it West High Park in its park layer.
- Winton / Merchants stays rejected. The city layer types it as a Street Mall.
- Barrington Street Park gets a page. The city layer lists it as a pocket park.
- The R-Centers and community centers that are still Park pages are handled in #75 under this rule.
