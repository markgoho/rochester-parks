# ADR-0006: Village parks, planned parks, and Trails

- **Status**: Accepted
- **Date**: 2026-09-18

## Context

The crawl in #66 found 63 places on official sites that have no page here (#71). ADR-0005 decides most of them. It does not decide three kinds: parks that a village owns, parks that are planned but not open, and named trails. The site already had pages of each kind: Vincent G. Kennelley Park (Village of Fairport), High Falls State Park (planned), and Lehigh Valley Trail Linear Park (a county trail).

## Decision

**A village park is a Park.** It is listed with the town that holds the village. The page does not claim an owner, because village ownership is hard to prove.

**A planned park or a park under construction is a Park** when an official plan names it. The page says clearly that the park is not open. Land that a government protects, with no official plan and no public use, gets no page.

**A Trail is not a Park, even when a government calls it a park.** A Trail is a named path on government land that is a place of its own. Trails get their own section, with one page for each Trail and a list page. A path inside one Park stays on that Park's page.

## Considered options

- Each named trail is a Park. Rejected: a trail map has many short trails, and the Park list becomes a list of paths.
- A trail is a Park when the government lists it as a park. Rejected: the reader looks for a trail by what it is, not by which list holds it.

## Consequences

- Lehigh Valley Trail, Genesee Valley Greenway and Chili Nature Trail move to the Trails section, and their old URLs redirect.
- Conkey Corner Park is split from the El Camino Trail. Towpath Park stays a Park, because it is a small park beside the canal. #160 found that the Town of Ogden's 2024 plan drops it because the town does not own it. It is the 0.28-acre tax-exempt lot at 20 Canal St in the Village of Spencerport, so it is a village park and stays a Park under this ADR.
- Thousand Acre Swamp is not a Park or a Trail, because The Nature Conservancy owns it.
- #107 (how a linear park shows on a map) applies to Trails.
