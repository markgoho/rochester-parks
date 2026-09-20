# ADR-0005: What counts as a Park

- **Status**: Accepted, amended by ADR-0006
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

For a city row, the city's own park GIS layer (`Hosted/Parks_Open_Space_Points`) is the first check. A row the layer types as "Street Mall" is not a Park. A row the layer names as a park is a Park when its owner is the City of Rochester. A row owned by the City of Rochester School District is school land.

## Consequences

- `meigs-linden` was the city's "MEIGS/LINDEN PARK" row, which the city also names Ellwanger & Barry Park. It was a second page for `ellwanger-and-barry-park` and is removed.
- `james-madison-school` is removed. It is school grounds and is in no city park layer.
- `west-high-field` stays, renamed West High Park. It is not school land: the layer gives its owner as the City of Rochester. The layer's school ballfields (School #12, Charlotte Middle School) give their owner as the City of Rochester School District, so the owner field is the test.
- Winton / Merchants stays rejected. The city layer types it as a Street Mall.
- Barrington Street Park gets a page. The city layer lists it as a pocket park.
- The R-Centers and community centers that are still Park pages are handled in #75 under this rule.

## Applied in #75 (2026-09-19)

**Reading settled: the park layer is the first check, not the only check.** A row in `Hosted/Parks_Open_Space_Points` proves grounds. No row does not disprove them. The layer holds 174 curated, named parks, so it has no row for every parcel of public land. When the layer is silent, the city's tax parcel layer `Open_Data/Tax_Parcels_Open_Data` decides: a City-owned parcel classed Playground or Recreational Facility is grounds, and the clause "when an R-Center has its own outdoor grounds, the grounds are the Park" applies. A parcel classed School is school grounds, and the city's `Hosted/RCSD_Schools` directory confirms it by an exact address match. Without this reading, the next triage of a city row rediscovers the same gap.

Seven pages were deleted, with no redirect and no replacement page:

- Five R-Centers share their address with an operating RCSD school: `adams-street-rec-center` (Nathaniel Rochester Community School), `clinton-baden-rec-center` (Dr. Martin Luther King Jr. School), `humboldt-recreation-center` (Henry Hudson School), `south-avenue-recreation-center` (Anna Murray-Douglass Academy School) and `ryan-community-center` (John James Audubon School). School grounds are not Parks.
- `danforth-community-center` sits on a City parcel classed Benevolent, and the one park point beside it is typed Street Mall.
- `seneca-park-zoo` became a Facility of `seneca-park`, typed `Zoo`, and its page went.

Six pages stayed. `gardiner-avenue` took the layer's `name2`, "Gardiner Ave. Playground", as its title. Five R-Centers sit on City-owned parcels classed Playground or Recreational Facility, 2.9 to 6.8 acres, with no school at the address, so they stayed as Parks on the Edgerton pattern: `avenue-d-rec-center`, `campbell-st-rec-center`, `carter-st-rec-center`, `david-f-gantt-recreation-center` and `flint-st-recreation-center`. Each gained its R-Center as a Facility.

**These five keep a building name as their title, and this is known.** No source names their grounds. The park layer has no row, the city's 2014 `Open_Data/Parks_Open_Data` layer names only the buildings, and OpenStreetMap names nothing there. The owner chose a building name over a name this site would have to invent. The `description` of each page says what the page covers: the grounds that hold the R-Center. A source that names the grounds renames the page.
