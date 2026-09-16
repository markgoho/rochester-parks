# Park database sync — audit

Every park page under `content/town-parks/` was checked against the Google Sheets park database (152 rows, 25 municipalities). Village rows — Brockport, Fairport, Honeoye Falls, Scottsville, Spencerport — were folded into their town.

**Park names now follow the database.** Fifteen pages had a name the database spells differently; each one took the database spelling. Folder slugs are untouched, so no URL changed and no redirect is needed. No page was moved or deleted.


One thing is NOT settled and needs you: `docs/cutover.md` says Gates Town Park was added on purpose, to cover the one old WordPress URL with no equivalent page. The Gates agent, not knowing that, read it as a duplicate of First Responders Park and suggested merging the two. Do not merge it — but the two pages do describe one physical park, so it is worth deciding what Gates Town Park should say.


## Done centrally, not per town

- `geo` coordinates were read out of the Google Maps embeds already in the pages, so no coordinate is invented. 107 pages gained latitude and longitude; pages with no embed have none.
- `acres` was added to the front-matter type and to the Park JSON-LD as a `PropertyValue` with `unitText: acre`, because schema.org `Park` has no size property.
- A placeholder `telephone: +1-555-123-4567` was removed from Persimmon Park.
- The first geo pass wrote `type: 'park'geo:` on one line in 83 files. That was my bug, caught early and repaired in all of them; several town reports mention it as pre-existing, which is wrong. The build parses every file cleanly now.


## Counts

Towns reported: 20 of 20

- Pages created: 25
- Pages updated: 113
- Names changed to the database spelling: 15
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

## Names taken from the database

The database is the source of truth for a park name, so each page below now carries the database spelling in its `title` and `description`. The old name is kept here because `CONTEXT.md` records the park name as the join key for the WordPress comment archive — the archive keys on the OLD column, so an import needs this mapping.

Folder slugs, and therefore URLs, are unchanged. Nothing 404s and no redirect is needed.


| Town | Was | Now (database) | URL, unchanged |
| --- | --- | --- | --- |
| gates | First Responders Park | **Gates First Responder Park** | `/town-parks/gates-parks/first-responders-park/` |
| greece | Beverly Pappas Memorial Park | **Pappas Park** | `/town-parks/greece-parks/beverly-pappas-memorial-park/` |
| greece | Veterans Memorial Park | **Veteran's Memorial Park** | `/town-parks/greece-parks/veterans-memorial-park/` |
| henrietta | Kenwick park | **Kenwick Park** | `/town-parks/henrietta-parks/kenwick-park/` |
| ogden | Memorial Park | **Veteran's Memorial Park** | `/town-parks/ogden-parks/ogden-memorial-park/` |
| penfield | LaSalles Landing Park | **LaSalle's Landing Park** | `/town-parks/penfield-parks/lasalles-landing-park/` |
| penfield | Veteran’s Memorial Park | **Veterans Memorial Park** | `/town-parks/penfield-parks/veterans-memorial-park/` |
| perinton | Ayrualt Boat Launch | **Ayrault Boat Launch** | `/town-parks/perinton-parks/ayrualt-boat-launch/` |
| perinton | Garnsey Road Arboretum | **Garnsey Arboretum** | `/town-parks/perinton-parks/garnsey-arboretum/` |
| rush | Stoney Brook Road Park | **Stonybrook Road Park** | `/town-parks/rush-parks/stoney-brook-road-park/` |
| rush | Veterans Memorial Park | **Veteran's Memorial Park** | `/town-parks/rush-parks/veterans-memorial-park/` |
| sweden | Corbet Park | **Corbett Park** | `/town-parks/sweden-parks/corbet-park/` |
| webster | Kent Park | **Irving Kent Memorial Park** | `/town-parks/webster-parks/kent-park/` |
| webster | Webster First Responders Park | **First Responders Park** | `/town-parks/webster-parks/webster-first-responders-park/` |
| wheatland | Canawagus Park | **Canawaugus Park** | `/town-parks/wheatland-parks/canawagus-park/` |

## Pages with no database row — nothing was removed

| Town | Park | Note |
| --- | --- | --- |
| brighton | Belmanor Park | not in the Brighton database. It is in the Henrietta database slice (municipality: Henrietta, 108 Belmanor Drive). Left in place per spec (no rename/delete/move). |
| gates | Gates Town Park | No database row. Body content describes the same physical park as First Responders Park (Lyell Road, unpaved entry, four soccer fields, 9-hole disc golf course, pond with dock; the First Responders Park body even links to 'The Woodlands at Gates Town Park'). Appears to be a duplicate/earlier-named page for the same park that the database row was matched to. Not deleted, renamed, or given the database's address/cid to avoid duplicating structured data across two pages for one physical park. Merge or redirect is the owner's call. |
| greece | Badgerow Park North | not in the database; only Badgerow Park South is in the database slice |
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
- **brighton** — Sandra L. Frankel Nature Park has no existing map embed, so no geo coordinates were added per the 'do not invent coordinates' rule.
- **chili** — Database gives Davis Park and Hubbard Park the identical cid 2653963529208280724, but they have different street addresses (551 Chestnut Ridge Rd vs 3720 Union St). Added the sameAs link to both as given, but one of the two cids looks like a copy-paste error in the source database and should be checked.
- **chili** — amenities was an empty list for every Chili row in the database, so no amenities field was added to any page.
- **chili** — content/town-parks/chili-parks/_index.md (the town list page) has description 'A list of Brighton Parks', which looks like a copy-paste leftover from another town. Left untouched since it is not a park row and out of scope for this sync, but the owner may want to fix it.
- **clarkson** — Database amenities were empty for all three rows, so no amenities field was added to any page.
- **clarkson** — None of the three pages had an existing sameAs list, so each got a new one-item list from the database cid.
- **east-rochester** — All 4 database rows matched existing pages by exact name; no pages created or removed.
- **east-rochester** — No amenities were added: the database's amenities list was empty for all 4 parks in this town, so per the spec's 'never write an empty value' rule, the amenities key was left untouched.
- **east-rochester** — content/town-parks/east-rochester-parks/_index.md is the town listing page (not a park row) and was left unchanged.
- **gates** — Gates Town Park and First Responders Park appear to be two pages for one physical park (see unmatched_pages). Recommend the owner decide whether to merge, redirect, or otherwise reconcile them.
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
- **perinton** — The 4 newly created pages (Vincent G. Kennelley Park, Misty Pine Park, Park Circle Park, Winding Brook Park) have no geo, address, acres, or amenities because the database has none and coordinates must not be invented. They carry only title, description, type, and the placeholder body.
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

## Updated pages

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
