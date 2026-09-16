# Rochester Parks

A public guide to every park in and around Rochester, NY. Readers are the general Rochester public, not developers.

## Language

### Content

**Park**:
A single public green space the site covers, in the city, a town, the county, or the state system.
_Avoid_: Location, site, venue

**Park page**:
The page describing one Park. About 199 exist, sourced from markdown under `content/`.
_Avoid_: Park post, park entry

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
