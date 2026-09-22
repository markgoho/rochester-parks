# Park database sync — audit

Every park page was checked against the Google Sheets park database. The sheet has three tabs — Town Parks (152 rows), County Parks (23) and City Parks (127) — and a CSV export only returns the first, so the county and city lists were read out of the HTML export instead. Village rows — Brockport, Fairport, Honeoye Falls, Scottsville, Spencerport — were folded into their town.

The official town, county and city websites outrank the sheet for a park name. Those links live as hyperlinks on the Name cell, which a CSV export drops. All 131 were checked before use: 119 are reachable and were written, 12 are dead and were left out.

**Park names now follow the database.** Fifteen pages had a name the database spells differently; each one took the database spelling. Folder slugs are untouched, so no URL changed and no redirect is needed. No page was moved or deleted.


**Resolved since this audit ran.** This page is a record of one sync run, so the notes below keep the wording they had on the day. Where a note has since been settled, the resolution is here instead of an edit to the note: **Belmanor Park** was moved to Henrietta. The page now lives at `content/town-parks/henrietta-parks/belmanor-park/_index.md`, which matches the database, so every note below that files it under Brighton is out of date.


One thing is NOT settled and needs you: `docs/cutover.md` says Gates Town Park was added on purpose, to cover the one old WordPress URL with no equivalent page. The Gates agent, not knowing that, read it as a duplicate of First Responders Park and suggested merging the two. Do not merge it — but the two pages do describe one physical park, so it is worth deciding what Gates Town Park should say.


**The sheet has no State Parks tab.** Its three tabs are Town Parks, County Parks and City Parks only. **Hamlin Beach State Park** and **Irondequoit Bay State Marine Park** are covered indirectly, as County-tab rows that took their acreage, address and Google Maps link from the sheet before being filed under `content/state-parks/`. The other two pages under `content/state-parks/` have no row at all: **High Falls State Park** is a planned park under ADR-0006, named from New York State's own framework-plan announcement, not from the sheet; **Genesee Valley Greenway State Park** is named from its own `parks.ny.gov` page. Neither page gives an acreage.


## Done centrally, not per town

- `geo` coordinates were read out of the Google Maps embeds already in the pages, so no coordinate is invented. 107 pages gained latitude and longitude; pages with no embed have none.
- `acres` was added to the front-matter type and to the Park JSON-LD as a `PropertyValue` with `unitText: acre`, because schema.org `Park` has no size property.
- A placeholder `telephone: +1-555-123-4567` was removed from Persimmon Park.
- The first geo pass wrote `type: 'park'geo:` on one line in 83 files. That was my bug, caught early and repaired in all of them; several town reports mention it as pre-existing, which is wrong. The build parses every file cleanly now.


## Counts

Towns reported: 20 of 20

- Town park pages created: 25
- Town park pages updated: 113
- Park names corrected: 14 (12 from the database, 2 from an official site)
- Pages not in the database: 7
- Database rows judged not a park: 5


## Added park pages

| Town | Park | Path |
| --- | --- | --- |
| brighton | Sandra L. Frankel Nature Park | `content/town-parks/brighton-parks/sandra-l-frankel-nature-park/_index.md` |
| chili | Chili Nature Trail | `content/town-parks/chili-parks/chili-nature-trail/_index.md` |
| henrietta | Chapman's Corner Park | `content/town-parks/henrietta-parks/chapmans-corner-park/_index.md` |
| mendon | Driesbach Fields | `content/town-parks/mendon-parks/driesbach-fields/_index.md` |
| mendon | Great Bend Park | `content/town-parks/mendon-parks/great-bend-park/_index.md` |
| mendon | Mendon Center Park | `content/town-parks/mendon-parks/mendon-center-park/_index.md` |
| mendon | Rotary Park | `content/town-parks/mendon-parks/rotary-park/_index.md` |
| mendon | Vest Pocket Park | `content/town-parks/mendon-parks/vest-pocket-park/_index.md` |
| ogden | Ogden Heritage Park | `content/town-parks/ogden-parks/ogden-heritage-park/_index.md` |
| ogden | Towpath Park | `content/town-parks/ogden-parks/towpath-park/_index.md` |
| penfield | Sherwood Fields Park | `content/town-parks/penfield-parks/sherwood-fields-park/_index.md` |
| perinton | Misty Pine Park | `content/town-parks/perinton-parks/misty-pine-park/_index.md` |
| perinton | Park Circle Park | `content/town-parks/perinton-parks/park-circle-park/_index.md` |
| perinton | Vincent G. Kennelley Park | `content/town-parks/perinton-parks/vincent-g-kennelley-park/_index.md` |
| perinton | Winding Brook Park | `content/town-parks/perinton-parks/winding-brook-park/_index.md` |
| pittsford | Farm View Park | `content/town-parks/pittsford-parks/farm-view-park/_index.md` |
| pittsford | Habecker Fields | `content/town-parks/pittsford-parks/habecker-fields/_index.md` |
| rush | Hundred Acres Nature Park | `content/town-parks/rush-parks/hundred-acres-nature-park/_index.md` |
| sweden | Havenwood Park | `content/town-parks/sweden-parks/havenwood-park/_index.md` |
| webster | Charles E. Sexton Memorial Park | `content/town-parks/webster-parks/charles-e-sexton-memorial-park/_index.md` |
| webster | Four Mile Creek Preserve | `content/town-parks/webster-parks/four-mile-creek-preserve/_index.md` |
| webster | Gosnell Big Woods Preserve | `content/town-parks/webster-parks/gosnell-big-woods-preserve/_index.md` |
| webster | Herman Road Forever Wild Forest | `content/town-parks/webster-parks/herman-road-forever-wild-forest/_index.md` |
| webster | State Road Nature Preserve | `content/town-parks/webster-parks/state-road-nature-preserve/_index.md` |
| webster | Whiting Road Nature Preserve | `content/town-parks/webster-parks/whiting-road-nature-preserve/_index.md` |

## Names taken from the official sites, then the database

The official town, county and city site is the authority for a park name; the database comes second. Each page below now carries that name in its `title` and `description`. The old name is kept in `docs/park-name-changes.json` because `CONTEXT.md` records the park name as the join key for the WordPress comment archive, and the archive keys on the OLD name.

Folder slugs, and therefore URLs, are unchanged. Nothing 404s and no redirect is needed.

Three names the database got wrong were caught this way and are NOT changed to what the sheet says: Gates calls its park **First Responders Park**, not "Gates First Responder Park"; Perinton calls its **Garnsey Road Arboretum**, not "Garnsey Arboretum"; and Greece spells it **Papas**, not "Pappas".

| Was | Now | Source | URL, unchanged |
| --- | --- | --- | --- |
| Irondequoit Bay Park | **Irondequoit Bay Park West** | official Monroe County page | `/monroe-county-parks/irondequoit-bay-park-west/` |
| Beverly Pappas Memorial Park | **Beverly Papas Park** | official Town of Greece page | `/town-parks/greece-parks/beverly-pappas-memorial-park/` |
| Veterans Memorial Park | **Veteran's Memorial Park** | park database | `/town-parks/greece-parks/veterans-memorial-park/` |
| Kenwick park | **Kenwick Park** | park database | `/town-parks/henrietta-parks/kenwick-park/` |
| Memorial Park | **Veteran's Memorial Park** | park database | `/town-parks/ogden-parks/ogden-memorial-park/` |
| LaSalles Landing Park | **LaSalle's Landing Park** | park database | `/town-parks/penfield-parks/lasalles-landing-park/` |
| Veteran’s Memorial Park | **Veterans Memorial Park** | park database | `/town-parks/penfield-parks/veterans-memorial-park/` |
| Ayrualt Boat Launch | **Ayrault Boat Launch** | park database | `/town-parks/perinton-parks/ayrualt-boat-launch/` |
| Stoney Brook Road Park | **Stonybrook Road Park** | park database | `/town-parks/rush-parks/stoney-brook-road-park/` |
| Veterans Memorial Park | **Veteran's Memorial Park** | park database | `/town-parks/rush-parks/veterans-memorial-park/` |
| Corbet Park | **Corbett Park** | park database | `/town-parks/sweden-parks/corbet-park/` |
| Kent Park | **Irving Kent Memorial Park** | park database | `/town-parks/webster-parks/kent-park/` |
| Webster First Responders Park | **First Responders Park** | park database | `/town-parks/webster-parks/webster-first-responders-park/` |
| Canawagus Park | **Canawaugus Park** | park database | `/town-parks/wheatland-parks/canawagus-park/` |

## Pages with no database row — nothing was removed

| Town | Park | Note |
| --- | --- | --- |
| brighton | Belmanor Park | not in the Brighton database. It is in the Henrietta database slice (municipality: Henrietta, 108 Belmanor Drive). Left in place per spec (no rename/delete/move). |
| gates | Gates Town Park | No database row. Body content describes the same physical park as First Responders Park (Lyell Road, unpaved entry, four soccer fields, 9-hole disc golf course, pond with dock; the First Responders Park body even links to 'The Woodlands at Gates Town Park'). Appears to be a duplicate/earlier-named page for the same park that the database row was matched to. Not deleted, renamed, or given the database's address/cid to avoid duplicating structured data across two pages for one physical park. Merge or redirect is the owner's call. |
| greece | Badgerow Park North | not in the database; only Badgerow Park South is in the database slice. Resolved 2026-09-22: it is Veteran's Memorial Park under its old name. The Badgerow Park North page was removed, and its URL redirects to Veteran's Memorial Park (#202). |
| greece | Forest Hills Playground | not in the database; page body states the park has been decommissioned |
| mendon | Big Eddy Park | not in the database |
| pittsford | Lock 32 State Canal Park | not in the database; distinct location from the database's Lock 62 Canal Park row (different coordinates, ~1 mile apart) so this is not the same park under a different name |
| webster | North Ponds Park | not in the database |

## Database rows that did not get a page

| Town | Row | Why |
| --- | --- | --- |
| henrietta | Lehigh Valley Trail | already covered as a county park page at content/monroe-county-parks/lehigh-valley-trail-linear-park; a multi-town rail trail, not a standalone Henrietta town park |
| henrietta | Sledding Hill | a recreational feature, not a formally named park |
| ogden | Adams Basin Schoolhouse | a historic schoolhouse building, not a park |
| pittsford | Auburn Line Park | database row has no address/acres/cid; web research found no distinct facility by this name, only the Auburn Trail, a multi-town rail-trail corridor on the former Auburn rail line. Treated as a trail corridor rather than a standalone park site, so no page was created. |
| webster | Webster Arboretum | same parcel as Kent Park: identical address (1700 Schlegel Road) and near-identical acreage (84.50 vs Kent Park's 84.40). The arboretum is a feature inside Kent Park, not a separate park; creating a page would duplicate the existing kent-park page. |

## Database errors worth fixing in the spreadsheet

- **King's Bend Park (Pittsford)** — its `cid` is actually Isaac Gordon Nature Park's, confirmed by decoding the Google place id in each page's own map embed. The `sameAs` link was withheld from King's Bend Park rather than point it at the wrong place.
- **Davis Park and Hubbard Park (Chili)** — share one `cid` despite different street addresses. One of the two is a copy-paste error. Both links were written as given.
- **Rotary Park (Mendon)** — `acres` reads `n/a`, so no acreage was written.
- **Remembrance Park (Brockport)** — `acres` reads `0.00`, treated as a placeholder rather than a measurement.
- **Herman Road Forever Wild Forest (Webster)** — the park name spells Herman, the address spells Hermann.
- **Belmanor Park** — the page sits under Brighton, the database says Henrietta. Nothing was moved, because unlike a name, a move does change the URL.
- **Persimmon Park (Brighton)** — the page's own address and the database address disagree. The page's was kept.

## Other notes

11 notes about the front-matter bug above are omitted here.

- **brighton** — Belmanor Park is filed under brighton-parks but belongs to Henrietta per the database. The Henrietta town agent will find no henrietta-parks/belmanor-park page and may create a duplicate. Owner should decide whether to move this page (URL/comment-archive impact) rather than have two Belmanor Park pages.
- **brighton** — Corbett's Glen Nature Park: page title uses a curly apostrophe (’), database uses a straight apostrophe ('). Same park, just a quote-style difference, not treated as a name conflict.
- **brighton** — Persimmon Park: page's existing address (streetAddress 'S Clinton Ave', locality 'Brighton', postalCode 14620) differs from the database address (1285 Clinton Ave S, Rochester, NY). Left the existing address untouched per the 'add missing fields only, do not change existing values' rule; only added acres and the maps sameAs link. Owner may want to reconcile which address is correct.
- **brighton** — Sandra L. Frankel Nature Park has no existing map embed, so no geo coordinates were added per the 'do not invent coordinates' rule. Resolved 2026-09-18 (#41): its point is now its place in Google Maps.
- **chili** — Database gives Davis Park and Hubbard Park the identical cid 2653963529208280724, but they have different street addresses (551 Chestnut Ridge Rd vs 3720 Union St). Added the sameAs link to both as given, but one of the two cids looks like a copy-paste error in the source database and should be checked.
- **chili** — amenities was an empty list for every Chili row in the database, so no amenities field was added to any page.
- **chili** — content/town-parks/chili-parks/_index.md (the town list page) has description 'A list of Brighton Parks', which looks like a copy-paste leftover from another town. Left untouched since it is not a park row and out of scope for this sync, but the owner may want to fix it.
- **clarkson** — Database amenities were empty for all three rows, so no amenities field was added to any page.
- **clarkson** — None of the three pages had an existing sameAs list, so each got a new one-item list from the database cid.
- **east-rochester** — All 4 database rows matched existing pages by exact name; no pages created or removed.
- **east-rochester** — No amenities were added: the database's amenities list was empty for all 4 parks in this town, so per the spec's 'never write an empty value' rule, the amenities key was left untouched.
- **east-rochester** — content/town-parks/east-rochester-parks/_index.md is the town listing page (not a park row) and was left unchanged.
- **gates** — Gates Town Park and First Responders Park appear to be two pages for one physical park (see unmatched_pages). Recommend the owner decide whether to merge, redirect, or otherwise reconcile them. Resolved 2026-09-16: the Gates Town Park page was removed, and its URL redirects to First Responders Park.
- **greece** — Adeline Park's existing amenities list already matched the database list exactly, so no amenities edit was needed there.
- **greece** — No database rows in this slice had amenities for: Badgerow Park South, Barnard Park, Basil Marella Park, Braddock Bay Park, Columbus Park, Goodwin Park, Grandview Park, Henpeck Park, Pappas Park, Sawyer Park — existing page amenities were left untouched since the database had nothing to merge.
- **hamlin** — Database addresses included the state as 'New York' (with a stray ZIP code on Hamlin Recreation Area's entry: 'New York 14464'). Normalized addressRegion to 'NY' and omitted the ZIP, matching this repo's existing addressRegion convention and the spec's no-postal-code rule.
- **hamlin** — Database amenities arrays were empty for both parks, so no amenities field was added or merged.
- **henrietta** — Created Chapman's Corner Park page on judgment: the database name explicitly says 'Park' and no existing page/county coverage was found for it, unlike Sledding Hill and Lehigh Valley Trail. Database had no acres/address/cid, so the new page has only title/description/type.
- **henrietta** — Database row 'Belmanor Park' (Henrietta) was not created or matched: a page for Belmanor Park already exists under content/town-parks/brighton-parks/belmanor-park. Did not create a duplicate and did not move the Brighton page. Owner should confirm which town the park actually belongs to and reconcile the database/page.
- **henrietta** — None of the Henrietta database 'address' values contain a comma (e.g. 'Wildbriar Road', '108 Westcombe Park'), so no addressLocality/addressRegion could be split out per the spec's split rule. Wrote streetAddress + addressCountry: 'US' only for each; owner may want to add locality/region manually.
- **irondequoit** — All 10 database rows matched an existing page by exact name; no pages were created, renamed, or left unmatched.
- **irondequoit** — Bateau Play Area, Bristol Tot Lot, Camp Eastman, Pardee Tot Lot, Sadie's Place, and Vinton Play Area matched existing pages 1:1 by name, but the database has no acres/address/cid/amenities for any of them, so nothing was written to those pages.
- **irondequoit** — Database addresses for Heyer-Bayer Memorial Park (Rudman Road), Joshua Park (Titus Ave), and McAvoy Park (Empire Blvd) are street-only, no comma parts. Wrote streetAddress + addressCountry only; no addressLocality/addressRegion invented.
- **mendon** — Great Bend Park database address is 'Clover Street' with no locality or region (no comma parts to split). Wrote only streetAddress and addressCountry; did not invent a locality/region.
- **mendon** — None of the 8 database rows had any amenities listed, so no amenities field was added or changed anywhere.
- **mendon** — Rotary Park database acres value is 'n/a' (not a number). Omitted the acres field; only sameAs was added.
- **mendon** — Vest Pocket Park and Driesbach Fields have no acres, address, or cid in the database, so their new pages contain only title/description/type and the placeholder body.
- **ogden** — Confirmed the Memorial Park / Veteran's Memorial Park match by decoding the Google Place ID in the page's existing map embed (0xcae24cb13ef4544d) to decimal: 14619331664547173453, which is an exact match to the database row's cid. Same for Pineway Ponds Park and Rose Turner Park, whose embedded place IDs also matched their database cids, confirming those matches too.
- **ogden** — Snick Hawkins Park matched an existing page but the database row has no acres, address, cid, or amenities, so nothing was added beyond the front matter syntax fix above.
- **ogden** — Towpath Park and Veteran's Memorial Park are database rows under municipality 'Spencerport' (village), folded into the Ogden town folder per the spec.
- **parma** — All three database rows had an empty amenities list, so no amenities field was added.
- **parma** — All three database rows matched an existing page 1:1 by exact name (Parma Park, Salmon Creek Park, Village Park). No pages created, no orphan pages found.
- **parma** — Parma Park's database address was null, so no address field was added.
- **penfield** — All 10 database rows had an empty amenities list, so no page received an amenities field.
- **penfield** — Harris Whalen Park: database address was null, so no address field was added; only acres and sameAs.
- **penfield** — The town section page content/town-parks/penfield-parks/_index.md carries type: 'park' but is the town listing page, not an individual park; it was left untouched and is not counted as unmatched.
- **perinton** — Ayrault Boat Launch: the spec names boat launches as a typical not_a_park example, but this page already existed before this sync, so per the spelling-conflict rule its metadata was updated rather than removed. The owner may want to reconsider whether this belongs as a standalone park page.
- **perinton** — Center Park East: database has no acres value, so acres was not added. Spring Lake Park: database has no address value, so address was not added.
- **perinton** — Checked the whole content/ tree for stray pages under other names for the 4 newly created parks (kennelley, misty pine, park circle, winding brook); none found.
- **perinton** — Kreag Road Park: database lists amenity 'Shuffleboard'; the page already lists 'Shuffleboard Court', which covers the same feature and was left as-is (not duplicated). Database amenities 'Canal' and 'Water' were genuinely missing from the page's list and were added.
- **perinton** — The 4 newly created pages (Vincent G. Kennelley Park, Misty Pine Park, Park Circle Park, Winding Brook Park) have no geo, address, acres, or amenities because the database has none and coordinates must not be invented. They carry only title, description, type, and the placeholder body. Resolved 2026-09-18 (#41): all four now have `geo`, from their features in OpenStreetMap.
- **perinton** — The prior run's claim of having edited the 10 existing pages does not match disk state: at the start of this run none of the 10 pages had address, acres, or sameAs. Only Kreag Road Park's amenities list (pre-existing, richer than the database, matches body prose) was already present.
- **pittsford** — Farm View Park and Habecker Fields are real named Town of Pittsford park facilities (confirmed by web search), but their database rows carry no address, acres, or cid, so their new pages have only title/description/type and the placeholder body.
- **pittsford** — King's Bend Park's database cid (4064517128120222033) is identical to Isaac Gordon Nature Park's database cid. Converting to hex confirms the value actually belongs to Isaac Gordon Nature Park's Google place id (matches its existing map-embed hash 0x386810cb1518c151), not King's Bend Park's (whose embed hash is 0x5bfc4909c76ebf8). This looks like a copy error in the source database. sameAs was added to Isaac Gordon Nature Park only; it was left off King's Bend Park to avoid linking it to the wrong place. The owner should correct King's Bend Park's cid in the database.
- **riga** — Sanford Road Park amenities already included every database amenity (plus Volleyball, not in the database), so the amenities list was left unchanged.
- **riga** — content/town-parks/riga-parks/_index.md is the town listing page, not a park page; it has no matching database row and was left untouched.
- **rush** — Database row for Hundred Acres Nature Park had no acres, address, cid, or amenities, so the new page's front matter has only title, description, and type.
- **rush** — content/town-parks/rush-parks/_index.md is the town list page (title 'Rush Parks'), not an individual park; left untouched.
- **sweden** — Database rows for Brockport parks (Barry Street, Corbett, Evergreen Tot Lot, Harvester, Havenwood, Monika Andrews Children's, Remembrance, Sagawa, South Avenue) were matched against sweden-parks pages per the spec's village-folding rule; only Sweden Town Park itself has municipality 'Sweden'.
- **sweden** — No database row had a non-empty amenities list, so no amenities were merged into any page.
- **sweden** — Remembrance Park's database acres value is 0.00, which reads as a placeholder rather than a measurement (next-smallest park in this slice is 0.17 acres) — omitted rather than written as acres: 0. Owner can add a real figure if 0.00 is accurate.
- **sweden** — The town section page sweden-parks/_index.md (title 'Sweden Parks') carries type: 'park' in its front matter, which per the spec's contract means it is treated as a park page. This is probably not intended for a section index; left untouched since it's not part of the park sync, but worth the owner's attention.
- **webster** — 13 database rows had a street-only address with no locality/region. addressLocality was set to 'Webster' from the row's municipality field, and addressRegion set to 'NY'. Only First Responders Park and State Road Nature Preserve had comma-separated locality/region/zip in the database.
- **webster** — All Webster database rows had empty amenities lists, so no amenities were added to any page; existing amenity lists on damico-park and webster-first-responders-park were left untouched.
- **webster** — Herman Road Forever Wild Forest: the park name spells 'Herman' but the database address field spells the road 'Hermann Road'. Kept the address as given in the database; the owner may want to reconcile the spelling.
- **webster** — Webster Park (Monroe County park) was left untouched per instructions.
- **wheatland** — Database rows for Canawaugus Park and Johnson Park are recorded under municipality 'Scottsville', a village within the Town of Wheatland; both were matched to existing pages in wheatland-parks per the spec's village-folding rule.
- **wheatland** — Johnson Park and Canawagus Park had no database amenities to merge (empty amenities list in the database); their existing page amenities were left unchanged.
- **wheatland** — No database row had an address, so no address field was added to any page.

## Monroe County and state parks

All 23 county rows matched a page. Each took its acreage, address and official `monroecounty.gov` link. Irondequoit Bay Park was corrected to **Irondequoit Bay Park West**, which is what the county calls it.

Two county rows live elsewhere on this site and stayed there: **Lock 32 Canal Park** is filed under Pittsford, and **Hamlin Beach State Park** under state parks. Both took the metadata.

`content/state-parks/_index.md` and the Hamlin Beach page were both **empty files**, which is why that section never rendered a park. Both are written now, Hamlin Beach with the canonical `parks.ny.gov` URL that the sheet's old `nysparks.com` link redirects to.

Three county pages are not in the sheet and were left alone: Seneca Park Zoo, Lehigh Valley Trail Linear Park, Devil's Cove Park.

Irondequoit Bay Marine Park had a county page and a state page, both linked to the same `parks.ny.gov` page. It is a New York State park. Resolved 2026-09-18 (#70): the county page was removed, its coordinates, acreage, street and Google Maps link moved to Irondequoit Bay State Marine Park, and its URL redirects there.

## Rochester city parks

The city tab lists 127 rows. It is a facilities list, not a park list, so each row was judged before any page was written: **75 became park pages**, **49 were rejected**, and 28 were renamed. Before this, the site had two city park pages.

The city tab carries no acreage and no coordinates, so no city page has `acres` or `geo`. Resolved since: the city's GIS (#60) and the old city Google map (#57) supplied both. Its amenity columns are well filled, unlike the town tab, and map onto the site vocabulary like this: `PLAY APPAR` to Playground, `BASEBALL LIGHTED` and `BASEBALL UNLIT` both to Baseball Diamond, `REC CNTR` to Recreation Center, `PLAY APPAR` and the rest as named. Football Field, Handball Court, Ice Rink, Arena, Gazebo and Recreation Center are new amenity names and will appear as new filters in the finder.


### Rows rejected as not a park

| Row | Why |
| --- | --- |
| Allen Street | sheet notes confirm this is just a sliver of green space, no facilities |
| Arnold Park Mall | sheet notes confirm this is the middle of a street, not a park |
| Barrington Park | 'Barrington Park' is itself a street name (a townhouse drive off Barrington Street, e.g. 9/19/24 Barrington Park); the real nearby pocket park is named 'Barrington Street Park' at Park Ave & Barrington St, a different name. The row gives no location_text, amenities, or official link to confirm the two are the same site, so this was rejected rather than guessed. Same evidence profile as the Central Pk rejection below. |
| Bishop's Backyard | no evidence of a real park at this site; named in the Broad-and-X corner pattern used elsewhere in this sheet for street corners (Broad & Allen, Broad & Chestnut, Broad & Main), and web research found no park by this name in Rochester |
| Bloss and Saratoga | street intersection, not a park |
| Boulevard Parkway | W. Boulevard Parkway is a residential street name, not a park |
| Broad & Allen | street intersection, not a park |
| Broad & Chestnut | street intersection, not a park |
| Broad & Main | street intersection, not a park |
| Burke Terrace Mall | named in the same street-mall pattern as Arnold Park Mall and Carthage Dr Mall; no evidence found of a distinct park space |
| Carthage Dr Mall | named in the street-mall pattern; no evidence found of a distinct park space, only a residential street |
| Central Pk | 'Central Park' is a real Rochester street name (confirmed street addresses on it); the location text 'between Goodman & Union' describes a street segment, not a park |
| Charles Carroll Park | this is the pre-2022 name of the site now called Austin Steward Plaza, already created under that name; duplicate row |
| Clinton Av Triangle | appears to be a traffic triangle, not a park; no evidence found of amenities or public recognition as a park |
| Crittenden Blvd Mall | street mall/median on Crittenden Blvd (Mt. Hope to Lattimore), no facilities |
| East and Chestnut | street intersection (East Avenue/Chestnut Street), no facilities |
| Evergreen Park | street median along St. Paul (bet. Evergreen & Scrantom), no facilities, matches mall/median pattern |
| Exchange Blvd | street median along Exchange Blvd (bet. Plymouth and Ford), no facilities, matches mall/median pattern |
| Glendale Mall | street median (Glendale Park bet. Oriole & Malvern), no facilities |
| Goodman / Linden | street intersection (Goodman and Linden), no facilities |
| Hazelwood Terrace Mall | street median (Hazelwood bet. Merchants & Culver), no facilities |
| Highland Pkway Mall | street median (Highland Parkway and Greenview Pk.), no facilities |
| Hillside Ave Mall | street median (Winton and Hillside), no facilities |
| Huntington Park Mall | street median (Huntington near Harris), no facilities |
| KNICKERBOCKER STREET MALL | street mall/median (Knickerbocker/Summit Grove), no amenities |
| LAFAYETTE PARK MALL | median at the Lafayette and South Union intersection, no amenities |
| LAKE & RIDGE | street intersection (Lake Ave. and Ridge Road W.), no amenities |
| LAKEVIEW MALL | median strip within Lakeview Park, between Pierpont & Lake, no amenities |
| LIBERTY POLE | civic monument/plaza in the Main St & Franklin St intersection, no amenities; matches the street-intersection reject pattern |
| LYNCHFORD PARK A & B | Lynchford Park is a residential street name near Danforth Community Center (addresses like '16 Lynchford Park A' exist, and the city's own lead-paint listing treats it as a street), not a park |
| NUNDA BLVD MALL | median between Winton & Cobbs Hill Drive, no amenities |
| NYE PARK MALL | median within Nye Park, midway between Strong & Norton, no amenities |
| OLDE ROCHESTERVILLE O.S. | the North Water St. site was redeveloped into the private Water Street Commons development; the 'open space' is now a restaurant courtyard, not a public park |
| OXFORD ST MALL | median between Wellesley & Park, no amenities |
| PLEASANT ST/ST. JOSEPH'S | sliver of land behind the existing St. Joseph's Park, no amenities |
| PONT DE RENNES | a pedestrian bridge over the Genesee Gorge, not a park with facilities |
| PORTSMOUTH TERR. MALL | median between University & East, no amenities |
| Raines Park Mall | named street mall/median, not a park |
| Ralph Avery Mall | named street mall/median, not a park |
| River Harbor | location text only ('Bet. River & Lake Ave. s. of beach'), no amenities, no official page, no independent evidence of a distinct public park at this name; reads as an unremarkable strip of city land |
| Rockingham / Mulberry | row name is a street intersection (Rockingham St & Mulberry St), no 'Park'/'Square' designation, no amenities |
| Rundel Park Mall | named street mall/median, not a park |
| Seneca Parkway Mall | named street mall/median, not a park |
| Sibley Place Mall | named street mall/median, not a park |
| Sumner Park Mall | named street mall/median, not a park |
| War Memorial Open Space | the outdoor memorial plaza/grounds at the War Memorial arena (Broad & Exchange), not a standalone park; no amenities, no official page, no evidence it is treated as a separate park site |
| Werner Park Mall | named street mall/median, not a park |
| Winton / Highland | row name is a street intersection (Winton Rd & Highland Ave), no 'Park'/'Square' designation, no amenities |
| Winton / Merchants | row name and location are a street intersection (Winton Rd & Merchants Rd); the single 'Gazebo' amenity is a decorated corner, not the playground/ball-field carve-out the spec allows for a building-with-facilities exception |

### Settled in #38

ADR-0005 now defines what counts as a Park. The city's park GIS layer (`Hosted/Parks_Open_Space_Points`) settled these rows on 2026-09-18:

| Row | Result | Evidence |
| --- | --- | --- |
| Meigs / Linden | page removed, merged into Ellwanger and Barry Park | the layer's MEIGS/LINDEN PARK row is named Ellwanger & Barry Park, with the same 0.9 acres and coordinates |
| James Madison School | page removed | school grounds, and in no city park layer |
| West High Field | renamed West High Park | the layer names it West High Park, owned by the City of Rochester, not the school district |
| Otto Henderberg | renamed Otto Henderberg Square Park | the layer and OpenStreetMap both give this name |
| Barrington Park | Barrington Street Park page added | the layer lists Barrington Street Park as a city pocket park at Park Ave and Barrington St |
| Winton / Merchants | rejection stands | the layer types it as a Street Mall |
| Baden Park | address changed to Upper Falls Boulevard | the page had 485 N Clinton Ave, which is the R-Center about 800 m away; Baden Park and the R-Center are two sites with their own fields |

### Names changed

| Sheet says | Page says | Why |
| --- | --- | --- |
| ABERDEEN SQUARE | Aberdeen Square Park | official cityofrochester.gov page gives this full name |
| AVE. D REC. CENTER | Avenue D Rec. Center | sheet abbreviation Ave. expanded to Avenue per naming rule |
| BRONSON AVE. PLAYGROUND | Bronson Avenue Playground | sheet abbreviation Ave. expanded to Avenue per naming rule |
| BROWNCROFT ROSE GARDEN | Browncroft Rose Garden Park | official cityofrochester.gov page gives this full name |
| CAMPBELL ST REC CNTR | Campbell St Rec Center | sheet abbreviation Cntr expanded to Center per naming rule; St kept as street abbreviation |
| COBBS HILL | Cobb's Hill Park and Washington Grove | official cityofrochester.gov page gives this full name |
| CONKEY CORNER PARK | Conkey Corner Park & El Camino Trail | official cityofrochester.gov page gives this full name |
| DANFORTH COMM.  CENTER | Danforth Community Center | expanded abbreviation (Comm. to Community) |
| DAVID F. GANTT REC. CENTER | David F. Gantt Recreation Center | expanded abbreviation (Rec. to Recreation) |
| FLINT ST REC. CENTER | Flint St Recreation Center | expanded abbreviation (Rec. to Recreation), St kept as street abbreviation |
| FOURTH & PECK PARK | Fourth Street and Peck Street Park | official cityofrochester.gov page |
| GARDINER AVE. | Gardiner Avenue | expanded abbreviation (Ave. to Avenue) |
| GENESEE GATEWAY | Genesee Gateway Park | official cityofrochester.gov page |
| GRAND AVE PARK | Grand Avenue Park | expanded abbreviation (Ave to Avenue) |
| HUMBOLDT REC CTR | Humboldt Recreation Center | expanded abbreviation (Rec Ctr to Recreation Center) |
| J. R. WILSON | JR Wilson Park | official page heading |
| JAS. MADISON SCHOOL | James Madison School | expanded abbreviation Jas. -> James |
| JEFFERSON TERR PARK | Jefferson Terrace Park | expanded abbreviation Terr -> Terrace |
| JONES SQUARE | Jones Square Park | official page heading |
| LOWER MAPLEWOOD | Maplewood Park and Rose Garden | official page (250 Maplewood Ave) names the whole site; Lower Maplewood is a section, not a separate park |
| LUNSFORD CIRCLE | Lunsford Circle Park | official page heading |
| MAPLEWOOD ROSE GARDEN | Maplewood Park and Rose Garden | same official page as Lower/Middle Maplewood; merged rather than duplicated |
| MARTIN LUTHER KING JR. PARK | Dr. Martin Luther King Jr. Park & Ice Rink | official page heading |
| MIDDLE MAPLEWOOD | Maplewood Park and Rose Garden | official page names it as a section of Maplewood Park; no separate official link of its own |
| SOUTH AVE REC. CNTR. | South Avenue Recreation Center | expanded sheet abbreviation (Ave/Rec/Cntr), no official page to check |
| SUSAN B. ANTHONY SQUARE | Susan B. Anthony Square Park | official city page title |
| TROUP ST PARK | Troup Street Park | official city page title |
| WASHINGTON SQUARE | Washington Square Park | official city page title |

### City pages created

| Park | Amenities | Address | Official link |
| --- | --- | --- | --- |
| Aberdeen Square Park | 0 | no | yes |
| Adam's Street Rec Center | 7 | yes | no |
| Anderson Park | 0 | no | no |
| Aqueduct Park | 0 | no | no |
| Austin Steward Plaza | 0 | no | yes |
| Avenue D Rec. Center | 7 | yes | no |
| Baden Park | 6 | no | no |
| Brewster Harding Park | 2 | no | no |
| Bronson Avenue Playground | 2 | no | no |
| Brown Square Park | 0 | yes | yes |
| Browncroft Rose Garden Park | 0 | no | yes |
| Campbell St Rec Center | 5 | yes | no |
| Carter St. Rec Center | 6 | yes | no |
| Charlotte Village Green | 2 | no | no |
| Clinton / Baden Rec Center | 6 | yes | no |
| Cobb's Hill Park and Washington Grove | 7 | no | yes |
| Conkey Corner Park & El Camino Trail | 0 | no | yes |
| Cornerstone Park | 0 | no | no |
| Danforth Community Center | 2 | yes | no |
| David F. Gantt Recreation Center | 7 | yes | no |
| Don Samuel Torres Park | 4 | yes | no |
| Dr. Martin Luther King Jr. Park & Ice Rink | 0 | no | yes |
| Eastmoreland Park | 1 | no | no |
| Edgerton Park | 6 | no | no |
| Emerson and Glide | 2 | no | no |
| Exchange Playground | 1 | no | no |
| Farmington Park | 3 | no | yes |
| Field St Park | 3 | no | no |
| First St Playground | 4 | yes | no |
| Flint St Recreation Center | 6 | no | no |
| Fourth Street and Peck Street Park | 3 | no | yes |
| Gardiner Avenue | 4 | yes | no |
| Genesee Crossroads Park | 0 | no | no |
| Genesee Gateway Park | 1 | no | yes |
| Genesee Valley West | 7 | no | no |
| Goodwin Park | 1 | no | no |
| Grand Avenue Park | 2 | yes | no |
| Grape & Wilder | 1 | no | no |
| High Falls Terrace | 0 | no | no |
| Humboldt Recreation Center | 8 | yes | no |
| J. P. Riley | 3 | yes | no |
| JR Wilson Park | 4 | yes | yes |
| James Madison School | 5 | no | no |
| Jefferson Terrace Park | 3 | no | no |
| Jones Square Park | 0 | no | yes |
| La Grange Park | 5 | yes | no |
| Lomb Memorial Park | 0 | no | no |
| Lower Falls Park | 0 | no | no |
| Lunsford Circle Park | 0 | no | yes |
| Manhattan Square | 4 | yes | no |
| Maplewood Park and Rose Garden | 3 | no | yes |
| Marie Daley Park | 2 | yes | no |
| Meigs / Linden | 1 | no | no |
| Morrison Park | 0 | no | no |
| Norton Village Playground | 5 | yes | no |
| Orchard Playground | 2 | no | no |
| Otto Henderberg | 1 | no | no |
| Pulaski Park | 0 | no | yes |
| Quamina Park | 0 | no | no |
| Ryan Community Center | 7 | yes | no |
| Schiller Park | 0 | no | no |
| Sebastian Park | 5 | yes | yes |
| South Avenue Recreation Center | 4 | yes | no |
| St John's Park | 0 | no | no |
| Susan B. Anthony Square Park | 0 | no | yes |
| Tacoma Playground | 3 | yes | no |
| Troup Street Park | 3 | no | yes |
| Tryon Park West | 4 | no | yes |
| Turning Point Park | 0 | no | yes |
| University Avenue Playground | 2 | no | no |
| Verona Playground | 3 | no | no |
| Wadsworth Square | 0 | no | no |
| Washington Playground | 2 | yes | no |
| Washington Square Park | 0 | no | yes |
| West High Field | 4 | no | no |

### City notes

- Barrington Street Park: not in this slice under that name and not created (see Barrington Park in not_a_park), but web research found it is a real small park with benches at Park Ave & Barrington St. If a future slice or pass confirms the sheet's 'Barrington Park' row refers to this site, it can be created then.
- Aqueduct Park: the sheet's official field is null, so no sameAs was added, but cityofrochester.gov does have a live page at /locations/aqueduct-park confirming this is a genuine small downtown riverside park. The owner may want to add that link in a later metadata pass.
- Austin Steward Plaza: created as a park page though the official page describes it as a plaza/promenade with green space, seating, and Genesee Riverway Trail access rather than a traditional park.
- Five Rec Center rows created as parks (Adam's Street, Avenue D, Campbell St, Carter St., Clinton / Baden): each has Playground plus ball fields (baseball/football/soccer/tennis) alongside the recreation building, so treated as a genuine park with a building in it per the spec's rec-center rule.
- Baden Park (Upper Falls Blvd) and Clinton / Baden Rec Center (485 North Clinton Ave.) may be the same site or adjoining parcels of one park — the streets meet and the amenity lists overlap heavily (Baseball Diamond, Basketball Court, Football Field, Playground). Kept as two separate pages since the rows list distinct amenities and neither record says they are the same facility; the owner may want to check whether these should be merged.
- EMERSON AND GLIDE: spec names this as an intersection example; created anyway because the row carries two facilities (Baseball Diamond, Playground) and third-party listings (recplanet, foursquare) confirm a real 'Emerson and Glide Playground'.
- Rec-center rows (Danforth Comm. Center, David F. Gantt Rec. Center, Flint St Rec. Center, Humboldt Rec Ctr, Gardiner Ave.) created as parks, not rejected as buildings, because each row also lists ball fields/court/playground alongside the center. Danforth is the thinnest case: only Baseball Diamond plus Recreation Center.
- GRAPE & WILDER: row name says 'Grape & Wilder' but location_text says 'Maple and Wilder' (only one Basketball Court amenity, no web record found). Created per the facility rule, but the street name conflict should be checked against the source sheet.
- GENESEE CROSSROADS PARK and HIGH FALLS TERRACE: sheet lists zero amenities for both, but external sources confirm both are real, maintained City/State parks (Genesee Crossroads Park is undergoing an $8M riverside revitalization; High Falls Terrace is a 3.6-acre pocket park). Created despite empty amenities list; amenities block omitted from the page since the list is empty.
- GARDINER AVE.: street address on the row is '61 Grover Street', not Gardiner Avenue — a mismatch in the source sheet worth checking.
- HIGH FALLS TERRACE: public sources call this 'High Falls Terrace Park', but the record has no official cityofrochester.gov link to confirm, so the prepared title was kept unchanged.
- La Grange Park has a Recreation Center amenity but also ball diamond/basketball/playground/tennis, so it was treated as a genuine park with a building in it, not a rejected recreation center.
- James Madison School was created because of its five facility types (courts, fields, playground), but its name reads as a school and the record has no official link to confirm the current park name.
- Morrison Park: outside research (city rededication press release) gives the official name as 'James Morrison Park', but the record has no official link to fetch, so the sheet name was kept per spec.
- Otto Henderberg: outside research shows an official city page at cityofrochester.gov/locations/otto-henderberg-park (name 'Otto Henderberg Park'), but that link is not in the record, so no sameAs was added and the sheet name was kept.
- Liberty Pole and Pont de Rennes both have official cityofrochester.gov pages (liberty-pole-plaza, pont-de-rennes-bridge) but were still rejected as non-parks (plaza/monument and bridge, respectively) since the row itself carries no facilities and doesn't read as a park to a visitor.
- Lower Falls Park (Hastings St., east bank of the Genesee) is a separate site from the 'Lower Falls Overlook' section described on the Maplewood Park and Rose Garden official page (west bank, off Driving Park Ave). Owner should confirm these are not meant to be the same place.
- Maplewood Park and Rose Garden was built from three sheet rows (LOWER MAPLEWOOD, MAPLEWOOD ROSE GARDEN, MIDDLE MAPLEWOOD) that all describe sections of one official park at 250 Maplewood Avenue; amenities were merged (Gazebo, Playground, Tennis Court) rather than creating three thin duplicate pages.
- St. Joseph's Park already exists at content/rochester-city-parks/st-josephs-park/_index.md. Its record in this slice has empty amenities, no streetAddress, and no official link, so there was no missing metadata to add; the existing page was left untouched.
- Quamina Park: kept as a park because the sheet itself names it 'Park' (not a street-corner or mall pattern) and the prepared notes field did not flag it as a sliver, unlike River Harbor which had neither a 'Park'/'Square' name nor amenities. However the prepared streetAddress field ('25 Quamina Dr. reaching to Joseph') is the raw location_text, not a clean mailing address, per the spec's own rule that a description must never be written as streetAddress. Omitted the address block rather than inventing a trimmed address not in the record. Owner should verify this is a real park and not a thin strip of land; 25 Quamina Dr. also appears in real-estate listings as a residential address.
- St John's Park: no official link and no amenities, same thin profile as the rejected rows, but kept on independent evidence: a historical account of the Charlotte neighborhood states Lake Avenue was once called 'Charlotte Boulevard' south of St. John's Park, placing a real, named place of that name at Lake Avenue near the river, matching the record's location text.
- Ryan Community Center and South Avenue Recreation Center were kept as parks (not rejected as buildings) because both rows list playground and ball-field amenities alongside the recreation-center facility, per the spec's carve-out for buildings that also have park facilities.

## Judgement calls worth a second look

The four city slices did not draw the line in exactly the same place. These are the rows where that shows:

- **Meigs / Linden** was kept as a park because the sheet gives it a playground, but **Winton / Merchants** was rejected as an intersection although the sheet gives it a gazebo. One of those two decisions is probably wrong.
- **James Madison School**, **West High Field** and **Ryan Community Center** are school and community sites with public fields. They read oddly as "A Rochester City Park called James Madison School".
- **Otto Henderberg** and **Meigs / Linden** have incomplete names. The City of Rochester site sits behind Cloudflare and returned 403 to every request, so neither could be confirmed. They are written as the sheet spells them rather than guessed at.
- **Barrington Park** was rejected, but a real Barrington Street Park was found nearby and may be the same place.
- **Charles Carroll Park** was rejected as the pre-2022 name of **Austin Steward Plaza**, which the sheet lists separately.

## Same name, different park

These titles now appear twice. Each is a genuinely different park and the section name separates them on the page, but they will look like duplicates in a flat list: First Responders Park (Gates and Webster), Goodwin Park (city and Greece), Memorial Park (Chili and Gates), Veteran's Memorial Park (Greece, Ogden and Rush), Veterans Memorial Park (Penfield and Henrietta).

## What this does to the home page

The site went from 153 park pages to 254, counted the way the home page counts them. Most of the new ones are listings with no write-up and no photograph, so the written and photographed percentages on the home page will drop sharply. That is the true picture, not a regression. `CONTEXT.md` still says "About 199 exist", which is now stale.

## Updated town pages

| Town | Park | Fields added |
| --- | --- | --- |
| brighton | Brighton Town Park | address, acres, amenities, sameAs |
| brighton | Buckland Park | address, acres, amenities, sameAs |
| brighton | Corbett’s Glen Nature Park | address, acres, sameAs |
| brighton | Lynch Woods Park | address, acres, sameAs |
| brighton | Meridian Centre Park | address, acres, sameAs |
| brighton | Persimmon Park | acres, sameAs |
| chili | Ballantyne Park | address, acres, sameAs |
| chili | Davis Park | address, acres, sameAs |
| chili | Hubbard Park | address, acres, sameAs |
| chili | Memorial Park | address, acres, sameAs |
| chili | Union Station Park | address, acres, sameAs |
| chili | Widener Park | address, acres, sameAs |
| chili | Yolanda Park | address, acres, sameAs |
| clarkson | Clarkson Recreation Park | address, acres, sameAs |
| clarkson | Hafner Park | address, acres, sameAs |
| clarkson | Sans Souci Park | address, acres, sameAs |
| east-rochester | Concrest Park | address, acres, sameAs |
| east-rochester | Edmund Lyon Park | address, acres, sameAs |
| east-rochester | Legion Eyer Park | address, acres, sameAs |
| east-rochester | Northside Park | address, acres, sameAs |
| gates | First Responders Park | address, acres, amenities, sameAs |
| gates | Lions Park | address, acres, sameAs |
| gates | Memorial Park | address, acres, sameAs |
| gates | Wegman Road Park | address, acres, sameAs |
| gates | Westgate Park | address, acres, sameAs |
| greece | Adeline Park | address, acres, sameAs |
| greece | Badgerow Park South | address, acres, sameAs |
| greece | Barnard Park | address, acres, sameAs |
| greece | Basil Marella Park | address, acres, sameAs |
| greece | Braddock Bay Park | address, acres, sameAs |
| greece | Carter Park | address, acres, amenities, sameAs |
| greece | Columbus Park | address, acres, sameAs |
| greece | Frisbee Hill Park | address, acres, amenities, sameAs |
| greece | Goodwin Park | address, acres, sameAs |
| greece | Grandview Park | address, acres, sameAs |
| greece | Henpeck Park | address, acres, sameAs |
| greece | Pappas Park | address, acres, sameAs |
| greece | Sawyer Park | address, acres, sameAs |
| greece | Veteran's Memorial Park | address, acres, amenities, sameAs |
| hamlin | Hamlin Recreation Area | address, acres, sameAs |
| hamlin | Scout Park | address, acres, sameAs |
| henrietta | Andrews Park | address, acres, sameAs |
| henrietta | Breese Park | address, acres, sameAs |
| henrietta | Hoskins Park | address, acres, sameAs |
| henrietta | Kenwick park | address, acres, sameAs |
| henrietta | Lookup Park | address, acres, sameAs |
| henrietta | Martin Road Park | address, acres, sameAs |
| henrietta | Tinker Nature Park | address, acres, sameAs |
| henrietta | Veterans Memorial Park | address, acres, sameAs |
| irondequoit | Heyer-Bayer Memorial Park | address, acres, sameAs |
| irondequoit | Joshua Park | address, acres, sameAs |
| irondequoit | McAvoy Park | address, acres, sameAs |
| irondequoit | Spezio Park | acres, sameAs |
| mendon | Harry Allen Park | address, acres, sameAs |
| mendon | Monroe Street Village Park | address, acres, sameAs |
| mendon | Semmel Road Park | address, acres, sameAs |
| ogden | Memorial Park | acres, sameAs |
| ogden | Pineway Ponds Park | address, acres, sameAs |
| ogden | Rose Turner Park | address, acres, amenities, sameAs |
| parma | Parma Park | acres, sameAs |
| parma | Salmon Creek Park | address, acres, sameAs |
| parma | Village Park | address, acres, sameAs |
| penfield | Channing Philbrick Park | address, acres, sameAs |
| penfield | Greenwood Park | address, acres, sameAs |
| penfield | Harris Whalen Park | acres, sameAs |
| penfield | Heritage Park | address, acres, sameAs |
| penfield | LaSalles Landing Park | address, acres, sameAs |
| penfield | Panorama Valley Park | address, acres, sameAs |
| penfield | Rothfuss Park | address, acres, sameAs |
| penfield | Schaufelberger Park | address, acres, sameAs |
| penfield | Veteran’s Memorial Park | address, acres, sameAs |
| perinton | Ayrualt Boat Launch | address, acres, sameAs |
| perinton | Center Park East | address, sameAs |
| perinton | Center Park West | address, acres, sameAs |
| perinton | Egypt Park | address, acres, sameAs |
| perinton | Fellows Road Park | address, acres, sameAs |
| perinton | Garnsey Road Arboretum | address, acres, sameAs |
| perinton | Kreag Road Park | address, acres, amenities, sameAs |
| perinton | Perinton Park | address, acres, sameAs |
| perinton | Potter Park | address, acres, sameAs |
| perinton | Spring Lake Park | acres, sameAs |
| pittsford | Carpenter Park at the Port of Pittsford | address, acres, sameAs |
| pittsford | Copper Beech Park | address, acres, sameAs |
| pittsford | Great Embankment Park | address, acres, sameAs |
| pittsford | Griffith Park | address, acres, sameAs |
| pittsford | Hopkins Park | address, acres, sameAs |
| pittsford | Isaac Gordon Nature Park | address, acres, sameAs |
| pittsford | King's Bend Park | address, acres |
| pittsford | Lock 62 Canal Park | acres, sameAs |
| pittsford | Royal Coach Park | address, acres, sameAs |
| pittsford | Thornell Farm Park | address, acres, sameAs |
| riga | Sanford Road Park | address, acres, sameAs |
| rush | Stoney Brook Road Park | address, acres, sameAs |
| rush | Veterans Memorial Park | acres, sameAs |
| sweden | Barry Street Park | address, acres, sameAs |
| sweden | Corbet Park | address, acres, sameAs |
| sweden | Evergreen Tot Lot | acres |
| sweden | Harvester Park | acres |
| sweden | Monika Andrews Children's Park | acres |
| sweden | Sagawa Park | acres |
| sweden | South Avenue Park | acres |
| sweden | Sweden Town Park | acres |
| webster | D'Amico Park | address, acres |
| webster | Empire Park | address, acres |
| webster | Finn Park | address, acres |
| webster | Kent Park | address, acres |
| webster | Ridge Park | address, acres, sameAs |
| webster | Ridgecrest Park | address, acres |
| webster | Sandbar Park | address, acres, sameAs |
| webster | Webster First Responders Park | address, acres, sameAs |
| wheatland | Canawagus Park | acres, sameAs |
| wheatland | Freeman Park | acres, sameAs |
| wheatland | Johnson Park | acres, sameAs |
