# ADR-0009: Proving a city Park has grounds

- **Status**: Accepted
- **Date**: 2026-09-19
- **Amends**: ADR-0005

## Context

ADR-0005 says a building is not a Park, and that when an R-Center has its own outdoor grounds, the grounds are the Park. It does not say how to prove that grounds exist.

It makes the city park GIS layer `Hosted/Parks_Open_Space_Points` the first check for a city row. #75 had to decide what the layer's silence means for thirteen pages named for a building. Two readings were possible. Either no row means no grounds, or no row means the layer does not know.

The layer holds 174 rows. It is a list of named parks, not a record of every parcel of public land. Nine R-Centers had no row within 500 m, and five of them sit on City parcels of 2.9 to 6.8 acres with ball fields, courts and playgrounds on them.

## Decision

**The park layer is the first check, not the only check. A row proves grounds. No row proves nothing.**

When the layer has no row near a city building, the city tax parcel layer `Open_Data/Tax_Parcels_Open_Data` decides. Query the parcel that contains the building's own coordinates and read `CLASSDSCRP`:

- **Playground** or **Recreational Facility**, owned by the City of Rochester: the parcel is the grounds. The Park page is the grounds, and the building is a Facility on it, as Edgerton Park does.
- **School**: the parcel is school land, which ADR-0005 already excludes. Confirm it against `Hosted/RCSD_Schools`, the city's 60-row directory of current schools, by an exact address match. A parcel classed School with no school at the address is not settled by this test.
- Any other class, such as Benevolent: the parcel is not grounds.

A named row in the park layer still beats the parcel. A row typed Street Mall still rejects the page, whatever the parcel says.

## Considered options

- No row in the park layer means no grounds. Rejected: it deletes five City playgrounds and recreation grounds because a curated list of named parks does not name them. Absence in a partial dataset is not evidence.
- Judge each building by its official city page. Rejected: the city page describes the building and its programs, so it says nothing about who owns the land under it.

## Consequences

- ADR-0005's grounds clause now has a test, so the next triage of a city row does not rediscover the gap.
- The tax parcel layer is a source for **grounds**, not for `acres`. ADR-0003 still governs acreage, and the parcel is not in its list of sources.
- Grounds proved this way often have no name. Five pages from #75 keep a building name as a title because no source names their grounds. A source that names them renames the page.
