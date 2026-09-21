# Rochester Parks

A public guide to every park in and around Rochester, NY. Readers are the general Rochester public, not developers. The site replaces the official town, county and city pages, so a reader never needs to visit them.

## Language

### Content

**Park**:
A single standalone public green space the site covers, in the city, a town, a village, the county, or the state system: outdoor land a government owns that the public can go to and use, or will use when an official plan is built. A village Park is listed with the town that holds the village. A street median, a traffic triangle, a street corner, school grounds and a building are not Parks (ADR-0005, ADR-0006). ADR-0009 gives the test that proves a city building has grounds of its own.
_Avoid_: Location, site, venue

**Former Park**:
A Park a government has since decommissioned, closed for good or built over. It keeps its page, because the site holds the only record of what was there, and the page says plainly that the park is gone. It is in no Park List, count, map or search result, so nothing sends a reader to a place that no longer exists, but it stays indexable so a reader looking for the old park learns what became of it (ADR-0010). A Park closed for a season or for repair is not a Former Park.
_Avoid_: Decommissioned park, closed park, abandoned park, ex-park

**Facility**:
A named place inside a Park that keeps its own hours, or that the public rents: a rec center, lodge, pavilion, ice rink, zoo, spray park or beach. A rented Facility often has no public hours at all. It is still a Facility, and the Park page tells the reader how to rent it: the link or the telephone number that takes a booking, and the season the Facility is rented in, when the source gives one. The page does not give a fee, because a fee changes more often than the site is built (ADR-0004 asks the site to replace the official page, not to copy each number off it). A number is a name: "Shelter 3" is a Facility. A Facility has its own place inside the Park, so a map of the Park can show where it is. A playground that keeps the same hours as the grounds is an amenity, not a Facility. A Facility always belongs to the Park that holds it. An R-Center with no grounds of its own is not a Park.
_Avoid_: Venue, building, amenity

**Trail**:
A named path on government land that the public walks or rides and that is a place of its own, such as a rail trail, a greenway or a canal towpath. A Trail is not a Park, even when a government calls it a park. A path inside one Park is part of that Park (ADR-0006).
_Avoid_: Linear park, greenway, path

**Park page**:
The page describing one Park, sourced from markdown under `content/`. Everything about the Park is on this one page. Its topics, such as Facilities, Trails inside the Park, and History, are headings on the page, not pages of their own (ADR-0007). The write-up has no standard set of topics and tracks no figure per topic (ADR-0011).
_Avoid_: Park post, park entry

**Sourced description**:
A Park page body written from official pages the writer read, in the third person, with every fact traceable to a URL in that page's `sameAs`. It is held to the plain-prose standard: 8th-grade reading level, no sentence over 25 words, brief, no marketing adjective and no dated fact (#150, #159).
_Avoid_: Blurb, summary, copy

**Visit report**:
The owner's own first-person write-up of a walk through a Park, with the photos from that walk, carried over from the WordPress site. It is not a Sourced description and is not held to that standard: it is a voice, not a record of official facts, and no agent rewrites one (#170).
_Avoid_: Review, write-up, trip report

**Neighborhood**:
One of the areas the City of Rochester divides itself into, as the city's own boundary layer draws them. A Neighborhood is to the city what a town is to the county: the city Park List draws the whole city with its Neighborhoods, and a city Park page draws only the Neighborhood that holds the Park. A Neighborhood has no page of its own.
_Avoid_: District, quadrant, ward

**Blog post**:
An article that is not about one specific Park.
_Avoid_: Article, news item

**Park name**:
The human-readable title of a Park, as printed on the page. The WordPress comment export keys on this string rather than on a URL, so it is the join key for the archive import.
_Avoid_: Park title, slug

### Comments

**Comment**:
A message a reader leaves on a Park page or a Blog post.
_Avoid_: Post, feedback, message

**Commenter**:
A member of the public who leaves a Comment. Never holds an account.
_Avoid_: User, author, member

**Reply**:
A Comment that answers another Comment. Nesting is one level deep only. A Reply never has a Reply.
_Avoid_: Thread, nested comment, child comment

**Subject**:
The category a Commenter picks on the form. Exactly three values: comment, correction, reservation question.
_Avoid_: Type, category, kind

**Reservation inquiry**:
A Comment from a reader who mistakes this site for the parks department and asks to book a lodge, a shelter, or a pavilion. The dominant pattern in the archive. Named because it drives both the Subject enum and the redirect notice on the page.
_Avoid_: Booking request, rental request

**Moderation queue**:
The set of Comments that have been submitted and are not yet Approved. Nothing in it is visible to the public.
_Avoid_: Pending list, inbox, drafts

**Approved**:
The state of a Comment that the site owner has accepted for publication. Only Approved Comments reach readers.
_Avoid_: Published, live, accepted

**Archive comment**:
One of the roughly 140 Comments carried over from the WordPress site, dated 2012 to 2024. Distinguished from a new Comment because its author is unreachable and its reply structure is unrecoverable from the export.
_Avoid_: Legacy comment, imported comment, old comment

**Pingback**:
An automated link-back row in the WordPress export, recognisable by a page title in the author field and `[…]` as its content. Not a Comment, and never imported.
_Avoid_: Trackback, backlink

### Constraints

**Web-native**:
The standard this site holds itself to, with two sides. On the reader's side: plain HTML, working with JavaScript off, with no third-party iframe or widget. On the write side: the form may post to one small service the owner wrote and controls, and to no hosted comment product.
_Avoid_: Vanilla, no-JS, progressive
