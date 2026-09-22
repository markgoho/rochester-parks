# Comments: implementation spec

- **Status**: Ready to build
- **Date**: 2026-09-22
- **Map**: [Map: a web-native comment system for the static site](https://github.com/markgoho/rochester-parks/issues/22)
- **Decision record**: [ADR-0012](adr/0012-where-a-comment-is-stored.md)

This spec assembles every decision on the map into one document. A build session works from it and reopens nothing. Each claim cites the closed ticket that settled it, as `(#n)`. Where the map never decided a point, the spec says so and marks its own choice **Spec choice**. Each spec choice is cheap to reverse. The vocabulary is the vocabulary of [`CONTEXT.md`](../CONTEXT.md): `Comment`, `Reply`, `Archive comment`, `Commenter`, `Subject`, `Moderation queue`, `Moderation surface`, `Approved`, `Reservation inquiry`, `Pingback`, `Web-native`.

## 1. The shape in one paragraph

A reader fills a plain HTML form at the end of a Park page, a Trail page or a Blog post. With JavaScript off, the form posts to `/comment` on `rochesterparks.org`. A Hosting rewrite sends the POST to one 2nd-gen Firebase Function in `us-east4`. The Function checks the post, writes one document to Firestore in the `Moderation queue`, dispatches a small workflow that opens a GitHub issue so GitHub emails the owner, and answers 303 back to the page. The owner opens the `Moderation surface`, a set of owner-only HTML pages served by the same Function behind HTTP Basic auth, and approves, rejects, redacts or replies. Approval dispatches the deploy workflow. The build reads every `Approved` Comment through the Admin SDK and bakes it into the static page. The reader's side has no runtime fetch and no client JavaScript (ADR-0012, #29, #30).

The 127 `Archive comment` rows from the WordPress site enter once, `Approved`, by a script the owner runs (#208, #212).

## 2. Data model

### 2.1 The collection

One Firestore collection in the `(default)` database of project `rochester-parks`, Native mode, `us-east4` (#25, ADR-0012). It holds every Comment: new, owner and Archive. **Spec choice**: the collection is named `comments`.

Firestore rules stay deny-all to the public, as `firestore.rules` is today. Nothing reads or writes the collection except through the Admin SDK: the Function, the build step and the import script (ADR-0012, #30).

### 2.2 A Comment document

The field list is #206's, plus the fields the import and the owner mark need. **Spec choice**: the field names.

| Field     | Type                                                          | Meaning                                                                                                                                              | Source        |
| --------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `page`    | string                                                        | The URL path of the page, for example `/town-parks/riga-parks/sanford-road-park/`.                                                                   | #206          |
| `parent`  | string or null                                                | The id of the Comment this one answers. Null for a top-level Comment.                                                                                | #206, #27     |
| `state`   | `"queue"` or `"approved"`                                     | In the `Moderation queue`, or `Approved`. There is no rejected state: reject deletes (#30).                                                          | ADR-0012, #30 |
| `name`    | string                                                        | The Commenter's name as typed. For an owner Comment, whatever the owner typed; it is never shown (§4.3).                                             | #206          |
| `email`   | string or null                                                | The Commenter's email. Kept for the life of the Comment, so the owner can write back by hand. Null on an owner Comment and on every Archive comment. | #206, #208    |
| `body`    | string                                                        | Plain text. No HTML.                                                                                                                                 | #24, #208     |
| `subject` | `"comment"`, `"correction"`, `"reservation-question"` or null | The `Subject`. Null on an Archive comment and on an owner Reply.                                                                                     | #28, #208     |
| `created` | timestamp                                                     | When the Commenter sent it. For an Archive comment, the export's `date`.                                                                             | #206          |
| `owner`   | boolean                                                       | True when the site owner wrote it. Drives the signature "Rochester Parks" and the orange rule.                                                       | #206, #208    |
| `flags`   | string array                                                  | Spam-defence flags, for example `["links"]`. Empty when none.                                                                                        | #24, #206     |

Tier two adds three fields, only when it is switched on (§7.2): `ip` and `userAgent`, written while the Comment is in the queue and removed on approval, and `akismet`, the verdict string (#206).

**Correction to #206.** #206 lists "the announcement issue number" as a field. The Function cannot learn that number: it dispatches a workflow, and `workflow_dispatch` returns no issue number, while the workflow holds no Firestore credential to write it back. So the document stores no issue number. The issue carries the Comment's id instead, and approve or reject finds the issue by that id (§8.3).

**Spec choice**: an Archive comment carries no field that marks it as archive. Its null `email` and null `subject` tell the story, and #28 renders it the same as any Comment.

### 2.3 Document ids

- A new Comment and an owner Reply take a Firestore auto id.
- An Archive comment takes an id derived from its natural key, `author + date`, which is unique across the sheet (#27). A re-run of the import overwrites, never duplicates (#208). **Spec choice**: the id is `archive-` plus the first 20 hex characters of the SHA-256 of `author + "|" + date`.

### 2.4 The `Subject` enum

Exactly three values (CONTEXT.md, #28): comment, correction, reservation question. **Spec choice**: the form value and the stored value are the same tokens, `comment`, `correction` and `reservation-question`. The prototype posted `reservation`; this spec aligns the token with the term. The labels on the form are "A comment", "A correction" and "A reservation question", with "A comment" checked by default (#28). A published Comment never shows its Subject (#28, #213).

### 2.5 Structure rules

- **One level of Reply.** A Reply has a `parent`; a Reply never has a Reply (CONTEXT.md, constraint 7). The archive holds no reply-to-reply (#27).
- **Who writes a Reply.** On the live site only the owner writes a Reply, from the Moderation surface (#30). The public form has no parent field, so a reader's new Comment is always top-level (#28). The only reader-written Replies are five Archive Replies, which render as Replies, not flattened (#27, #28).
- **Delete takes the Replies with it.** Deleting a Comment deletes its Replies, because a Reply to nothing reads as nonsense (#206).

## 3. Where Comments appear, and the front-matter switch

### 3.1 Page kinds

Three page kinds take Comments: Park pages, Trail pages and Blog posts. No other page does: not About, not a list page, not an index page (#212, CONTEXT.md). A Former Park and the Planned Park are Park pages, so they take Comments with no special case (#212). A new page kind takes Comments only through a code change (#212).

In this codebase the three kinds are a page rendered with the `park-single` layout, a page rendered with the `trail-single` layout, and a single page under `content/blog/`. About is also a `default-single` page, so the Blog test is the path, not the layout.

### 3.2 The switch

A boolean front-matter key, `comments: false`, on the page's own markdown file. It follows the precedent of `former: true` and `planned: true` (#212).

- **Absent**: the form is open.
- **`comments: false`**: the form is closed on that page.
- The key only closes. `comments: true` on About or on a list page does nothing (#212).

### 3.3 A closed page

A closed page keeps its `Approved` Comments and the notice. One line takes the place of the form: "Comments are closed on this page." (#212). Removing a Comment is the Moderation surface's delete (§9), never the switch (#212).

## 4. The comment area on a page

The layout is view A, "Ledger", from the prototype (#28). The primary source for markup and CSS is the `view--a` section of [`CommentAreaPrototype.svelte`](https://github.com/markgoho/rochester-parks/blob/prototype/comment-area/src/lib/components/CommentAreaPrototype.svelte) on `prototype/comment-area`. That branch is throwaway; build a new component, do not merge it.

### 4.1 Order of parts

The area sits at the end of the body column (#28). Top to bottom:

1. The after-submit banner, shown only when the page is reached from a submit (§6.3).
2. A heading "Comments" with a count eyebrow, "{n} so far" (#28).
3. The notice (§5).
4. The Comments, each with its Replies under it.
5. The form, headed "Leave a comment", or the closed line (§3.3).

**Spec choice**: with zero Approved Comments, the count eyebrow is left out, and the heading, notice and form still show. **Spec choice**: Comments are listed oldest first, a ledger read top to bottom, and Replies oldest first under their parent. The map did not decide the order.

### 4.2 One Comment

- The author's name, then the date as an ISO date (`YYYY-MM-DD`) in the data face, in a `<time datetime>` element. Nothing else marks age. An Archive comment carries no "old site" mark (#28).
- The body as plain text. **Spec choice**: line breaks in the body are kept (`white-space: pre-line`); a URL shows as text and is not made a link, the same as the import does for archive bodies (#208).
- The Subject is never shown (#28, #213).
- Comment text sits outside `.prose`, so any link rule it needs is its own (#28).

### 4.3 Replies and the owner mark

- A Reply is indented under its parent (#28).
- An **owner** Comment is signed "Rochester Parks" and carries an orange left rule. Nothing else marks it: no badge, no eyebrow (#28). The stored `name` is never shown for an owner Comment.
- An owner Reply is indented and orange-ruled. An owner top-level Comment, such as the two on the Blog post, takes the orange rule and the signature but is not indented (#208).
- A reader's Reply takes the same indent with a plain rule and the eyebrow "Reply" (#28). On the live site this is only ever an Archive Reply (§2.5).

### 4.4 The form

Plain HTML, `method="post"`, `action="/comment"`, no JavaScript, no iframe, no widget (Web-native, #28). In this order (#28):

1. **Subject**: a fieldset of three radios, legend "What is this about?", "A comment" checked (§2.4).
2. **Name**: required, `autocomplete="name"`.
3. **Email**: required, `type="email"`, `autocomplete="email"`, with a hint under it: "Never shown. Only the site owner sees it. Ask and your Comment is removed." (#206). This replaces the prototype's "Never published."
4. **Comment**: a required textarea.
5. **Honeypot** (§7.1), visually hidden.
6. **Token**: a hidden input carrying the page's HMAC (§7.1), and a hidden input carrying the page path.
7. The button "Send comment".

Field errors use `:user-invalid` (#28). **Spec choice**: the name field takes `maxlength="100"` and the body `maxlength="5000"`, matching the server limits in §6.2.

## 5. The notice

Every comment area carries a notice that the site is not the parks department, with a reservation link (constraint 9). It is a banner above the whole area, under the heading and before the first Comment: an orange-ruled note, one sentence plus the link (#28). It stays on a closed page (#212).

### 5.1 Text

The text on a Park page is the prototype's view A sentence, with "the lodge" made general because the link is no longer per Facility (#214):

> This site is not the parks department. It cannot book anything. To rent a lodge or a shelter, go to {owner link}.

On a Trail page and a Blog post there is no owner, so the notice points at the Park pages (#214):

> This site is not the parks department. It cannot book anything. Each park's page names who takes its bookings. Start at {all-parks link}.

The all-parks link goes to `/all-parks-in-rochester-ny/`. **Spec choice**: the exact wording of both. #28 fixed the first sentence pair and the shape; #214 fixed what the second one says, not its words.

### 5.2 Where the owner link comes from

One link per **owner**, never per Facility (#214). It is kept in the front matter of each section `_index.md` that holds Park pages: each `content/town-parks/<town>-parks/_index.md`, `content/rochester-city-parks/_index.md`, `content/monroe-county-parks/_index.md` and `content/state-parks/_index.md` (#214). A Park page takes the link of the section it sits in. A village Park sits in its town's section, so it takes the town's link (#214). Facility `rental` data and `sameAs` are not used (#214).

Which page to link (#214):

- A town: its parks and recreation page, or its home page when that is easier to find.
- The County: its parks reservation page.
- The City and the State: their booking page only if it is as easy to find as the County's, else their parks page.

These ~25 links are new data; no section holds one today (#214).

**Spec choice: the key.** #214 left the name to this spec. Existing keys are lower camel case (`hoursCheckedOn`, `sameAs`), and the prototype's notice needed both a name and a URL, so the key is an object:

```yaml
reservations:
  name: 'the Town of Riga'
  url: 'https://…'
```

The link text is `name`; the href is `url`.

**Spec choice: a missing link.** #214 left this to the spec too. A Park page whose section has no `reservations` key shows the Trail and Blog wording from §5.1, so no page ever breaks. A `bun test` case lists every section that holds a Park page and fails when one lacks the key, so the gap is caught in CI, not on the live site.

## 6. The submit path

### 6.1 Routing

- The form posts to `/comment` on `rochesterparks.org` (ADR-0012).
- `firebase.json` gets one Hosting rewrite: `{ "source": "/comment", "function": { "functionId": "<name>", "region": "us-east4" } }`. A rewrite may target a Function in any region (#29). **Spec choice**: the Function is named `comments`.
- The Function is 2nd gen, `us-east4` beside the database, runtime Node 22, and runs as the project's default service account with no key material (ADR-0012).
- Hosting imposes a 60-second request timeout (#23). A JS-off POST is a top-level navigation, so a cold start is visible wait time (#23). No warm minimum instance: it would cost about $4.64 a month (#23, ADR-0012).

### 6.2 What the Function does, in order

1. **Token.** Recompute the HMAC of the posted page path with the key from Secret Manager and compare it in constant time with the posted token. A mismatch is a blind POST: answer 400 (#24). A valid token proves the build made that page's form, so the Function needs no list of pages.
2. **Honeypot.** If the honeypot field has any value, answer the normal 303 (§6.3) and write nothing (#24). The honeypot is the only silent delete (#24). The token check runs first, so the 303 only ever goes to a page path the build signed, never to a URL a bot posted.
3. **Validate** (#24):
   - `subject` is one of the three tokens (§2.4).
   - `name` is present after trimming. **Spec choice**: at most 100 characters.
   - `email` parses loosely: something, `@`, something with a dot.
   - `body` is 1 to 5000 characters after trimming. The floor stays 1, because a real Comment is the word "Hi" (#24).
   - HTML in the body is stripped, not rejected, because a real 2015 Comment holds an `<a>` tag (#24).
4. **Flag.** Two or more links in the body adds `"links"` to `flags`. A flag never rejects (#24).
5. **Write** one document, `state: "queue"`, `owner: false`, `parent: null` (§2.2).
6. **Announce** (§8). A failure here is logged as an error and does not undo the write (#30).
7. **Answer 303** to the page (§6.3).

What a Comment never stores at launch: IP and user agent (#206).

**Spec choice: a failed check.** The map did not say what a reader sees when step 1 or 3 fails. The browser's own `required`, `type="email"` and `maxlength` checks catch nearly every human error before the POST. What reaches the server failing is almost always a bot. So the Function answers 400 with a small plain HTML page, "Your comment was not sent", naming the problem and asking the reader to go back. The browser's Back button keeps the typed text.

### 6.3 The redirect and the banner

The Function answers `303 See Other` with `Location` set to the page path plus a fragment. **Spec choice**: the fragment is `#comment-sent`. The banner is an element with that id, hidden by default and shown by `:target`, which is how the prototype drove it with no script (#28). Its text (#28):

> **Thanks.** Your comment is in the queue. It shows here once it has been read.

The Comments and the form stay under it (#28). No thank-you page (#28). No acknowledgement email to the reader, ever (#30).

## 7. Spam defences

The governing rule, forced by the archive: **defences rank the queue; they never delete from it.** The honeypot is the only safe silent delete, because no person fills a hidden field (#24). The `Moderation queue` is itself the last defence: nothing publishes until `Approved` (constraint 4).

### 7.1 Tier one: built on day one

Stateless, no JavaScript, no third party, no key beyond the HMAC (#24, #32). Tier one is the whole defence at launch (#32).

| Defence           | Where it runs                        | Rule                                                                                                                                                                |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Honeypot          | Form markup, checked in the Function | A visually hidden text field. A value means a bot: answer the normal 303, write nothing.                                                                            |
| Build-time HMAC   | Build writes it, Function checks it  | HMAC-SHA256 of the page path with a key held in GitHub Actions secrets and in Secret Manager. Blocks blind POSTs with a made-up page. Proves origin, not freshness. |
| Strict validation | Function                             | §6.2 step 3.                                                                                                                                                        |
| Link-count flag   | Function                             | Two or more links sets the `links` flag. Measured against the archive: it touches zero real rows (#24).                                                             |

**Honeypot name: the prototype is wrong.** The prototype names the field `website`. #24 found that Chrome autofills an invisible field named `url`, `website` or `phone`, which would flag a real person, and this archive is full of Commenters on yahoo, aol and rr.com addresses. **Spec choice**: the field is named `leave_blank`, with `autocomplete="off"`, `tabindex="-1"`, `aria-hidden="true"` on its wrapper, and hidden by a stylesheet class, never an inline `display:none` on the input (#24).

### 7.2 Tier two: designed, switched off

Tier two is added only when the queue proves noisy (#24, #32). The spam arrival rate is unknown and the archive cannot show it, because WordPress ran Akismet and the export holds only survivors (#24). So: ship tier one, watch the queue for a month (#24).

- **Akismet as a sort key.** `comment-check` at `rest.akismet.com/1.1/comment-check`, `comment_type` `comment`. The verdict goes in the `akismet` field and sorts the queue. Nothing is deleted on Akismet's word (#24). The owner's corrections go back through `submit-spam` and `submit-ham`, so the surface grows a control for each (#24). The key lives in Secret Manager as a config value, with no plan named (#32).
- **Any Akismet failure is no signal.** A timeout, an error or a suspended key queues the Comment unflagged and never blocks it (#32).
- **IP and user agent**, read from the forwarded client header and never the socket address, because the site sits behind a CDN (#24), are written on the Comment only while it is in the queue, for `submit-spam` and `submit-ham`, and removed on approval (#206). Confirm the header name against a live request through the Hosting rewrite; the map did not verify it.
- **Daily rate limits** of about 5 per address and 10 per page, one counter document per key per day with a 24-hour TTL (#24). The address key is an HMAC of the IP with the existing key, so no raw address is written (#206). TTL deletes bill as ordinary deletes, which rounds to $0 here (#29).
- **Which key.** Akismet Personal is free only while the site carries no monetisation; today it carries none (#32). The day any monetisation ships, including the reservation business on this domain, a Personal key is swapped for Pro ($119.40 a year, about $10 a month) or removed that same day, because suspension comes without notice (#32).
- **The disclosure line** under the email field gains "Checked for spam by Akismet." (#206).

## 8. The announcement

A new Comment announces itself by a GitHub issue that a workflow opens as `github-actions[bot]`, so GitHub emails the owner. This reverses the map's original constraint 11 (#30). Tested: the email arrived in 22 seconds with no setting changed (#209).

### 8.1 Why a workflow

GitHub does not notify a user of their own activity, and the fine-grained token acts as the owner. An issue the owner's token opens emails nobody. An issue the workflow's own `GITHUB_TOKEN` opens is authored by `github-actions[bot]`, and GitHub emails every watcher (#30, #209).

### 8.2 The flow

1. After step 5 in §6.2, the Function calls `workflow_dispatch` on a new workflow, with the fine-grained token from Secret Manager (#30).
2. **Spec choice**: the workflow is `.github/workflows/announce-comment.yml`, `on: workflow_dispatch` with inputs for the page title, the Subject, the date, the flag and the Comment id. It has `permissions: issues: write` and one `gh issue create` step with `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` (#209).
3. **Spec choice**: the issue title is "New comment on {page title}" and it carries the label `comment`.
4. The body carries the **page, Subject, date, a flag if any, and a link**. Never a name, a body or an email: the repo is public, and the email quotes the issue body in full (#30, #209).
5. A flagged Comment still announces itself, marked flagged. No daily cap on announcements in the first version (#30).
6. A failed dispatch logs an error; the Comment stays in the queue (#30). The error alert in §13 makes that failure loud.

A `workflow_dispatch` workflow must exist on `main` before it can be dispatched (#209). An issue made with `GITHUB_TOKEN` does not trigger other workflows, which is harmless here (#209).

**Spec choice: the link.** #30 left open whether the issue links to the Comment on the Moderation surface, which makes the Function's `run.app` URL public in a public repo, or to the park page, with the owner keeping a bookmark. The issue links to the Comment on the surface. #30 promised two clicks from email to Comment. Basic auth holds whatever the URL. A probe bills one invocation, and 2 million a month are free (#23).

### 8.3 Closing the issue

Approve and reject close the announcement issue, so the open issues are the queue (#30). Closing one's own issue notifies nobody (#30).

Because the document holds no issue number (§2.2), the Function lists open issues with the label `comment` and closes the one whose body holds the Comment's id. If none matches, it does nothing.

**Correction to #30: the token needs Issues write.** ADR-0012 and #30 give the fine-grained token one permission, Actions write. Closing an issue needs Issues write too. The token gets both, on this repo alone, no expiry.

## 9. The Moderation surface

### 9.1 Where it lives and who gets in

- Owner-only HTML pages served by the same Function that takes the POST (#30).
- At the Function's own `run.app` URL, not behind a Hosting rewrite. Only `/comment` is rewritten (#30).
- Plain HTML forms. No client JavaScript, no Firebase Auth, no Firestore rules change (#30).
- Login is HTTP Basic auth: one long random password in Secret Manager, compared in constant time, HTTPS only, one owner (#30). Every surface path checks it, whatever host the request came through.
- Every response sets `Cache-Control: no-store` and `X-Robots-Tag: noindex` (#30).
- Google sign-in stays available as a later upgrade (#30).

### 9.2 Pages

**Spec choice**: the paths.

- **`/queue`**: every Comment with `state: "queue"`. Each row shows the page, Subject, date, flags, name, email and body. Unflagged Comments first, by date; flagged Comments last (#30). A `reservation-question` gets no special sort, flag or list (#213).
- **`/c/{id}`**: one Comment, with its actions. This is what the announcement issue links to (§8.2).
- **`/approved`**: `Approved` Comments grouped per page, each with delete and a Reply form (#30).

### 9.3 Actions

Five, each one form (#30):

1. **Approve.** Sets `state: "approved"`, closes the announcement issue (§8.3), and dispatches the deploy workflow (§10.1). In tier two it also removes `ip` and `userAgent` (#206).
2. **Reject.** Deletes the document and closes the issue. No rejected state, no TTL (#30). For a "call me" Reservation inquiry the owner may write back by hand to the stored email and then reject (#213).
3. **Redact before approve.** The body in an editable field, pre-filled, saved on approve (#30). By eye, never by pattern: a private person's phone number, email or postal address becomes `[phone removed]`, `[email removed]` or `[address removed]`; a business's or government office's public number stays (#206).
4. **Reply as the site.** A Reply form under each top-level Comment in the queue and on the Approved list. The Reply is written `owner: true`, `state: "approved"`, `subject: null`, `email: null`, and never passes the queue. It dispatches the deploy (#30). No canned text; the owner types each Reply (#213). No Reply form under a Reply (§2.5).
5. **Delete an Approved Comment.** Deletes the document and its Replies (#206), then dispatches the deploy. This is the removal path for a Commenter who asks, with no proof of identity asked (#206).

**Spec choice: replying to a queued Comment.** #30 puts a Reply form under each queued Comment and lands the Reply `Approved`, but did not say what happens to the parent. The Reply action on a queued Comment approves the parent in the same step. And whatever the surface does, the build drops any Reply whose parent is not `Approved`, so a Reply never shows under nothing.

### 9.4 Failure is visible

If the deploy dispatch fails, the surface says so on the page after the action. The Comment is `Approved` all the same, and the daily cron publishes it next morning (ADR-0012, #30).

## 10. Publication and the build-time read

### 10.1 What starts a rebuild

A rebuild is the only way a Comment reaches a page. A submit writes one document and nothing else happens to the site (ADR-0012).

- **Approve, owner Reply and delete** each dispatch the deploy workflow through the GitHub API: `POST /repos/markgoho/rochester-parks/actions/workflows/firebase-hosting-merge.yml/dispatches` with `ref: main`, using the fine-grained token (ADR-0012, #30).
- **The daily cron** at 09:00 UTC, which already exists, is the backstop (#29).
- A full rebuild takes about 90 seconds (#29).

`firebase-hosting-merge.yml` has no `workflow_dispatch` trigger today. Add one. **Spec choice**: also add a `concurrency` group with `cancel-in-progress: false`, so two quick approvals queue two deploys rather than race them.

### 10.2 The read

- The GitHub Actions service account, `github-action-357220121@rochester-parks.iam.gserviceaccount.com`, which today holds Hosting admin, Auth admin and Run viewer, gets one more role: `roles/datastore.viewer` (#29).
- A workflow step before `bun run build` authenticates with the key the workflow already holds, `FIREBASE_SERVICE_ACCOUNT_ROCHESTER_PARKS` (ADR-0012), and reads every document with `state: "approved"` through the Admin SDK.
- It drops `email`, `ip`, `userAgent`, `akismet`, `subject`, `flags` and `state`, and writes the rest as JSON, grouped by `page` (ADR-0012). Only `page`, `parent`, `name`, `body`, `created`, `owner` and the id reach the build.
- It drops any Reply whose parent is not in the set (§9.3).
- No public read endpoint exists (ADR-0012).

**Spec choice: how the read meets the loader.** `src/lib/server/content.ts` loads content synchronously from files. The step is a script, `scripts/fetch-comments.ts`, that writes a gitignored JSON file; the loader reads that file and treats a missing file as no Comments. So `bun run dev` and a local build work with no credentials. In CI the step runs as its own workflow step and **fails the job** on any error, because a deploy with an empty file would take every Comment off the live site.

**Spec choice: a build with no HMAC key.** The page token (§7.1) needs the HMAC key at build time, and `bun run dev` and `ci.yml` have none. With no key, the build writes an empty token, so a form in dev or a CI build fails the token check, which is harmless there. The deploy workflow passes the key from GitHub Actions secrets and fails the job if it is missing, for the same reason as the fetch step.

### 10.3 The export path

If the vendor changes its free tier: one script reads one collection and writes JSON per page, about an hour; the build already reads Comments from a source, so the source is what moves (#29, ADR-0012). `scripts/fetch-comments.ts` is most of that script already.

## 11. The archive import

A one-time script the owner runs. It writes every `Archive comment` straight to Firestore through the Admin SDK, `Approved`, and bypasses the Function (#208).

### 11.1 Source

- The Google Sheet `RP Comments` (`150DeCFPU3RNlfJ2I0RkWNvqlRCLaVvoZVaEPHX5lNXE`), owned by `rochesterparksorg@gmail.com`. Columns: `author, email, url, IP, date, Park Name, content, parent` (map #22).
- **140 rows** after the About row was deleted (#212). **13 Pingbacks**, so **127 rows import** (#26, #212). **38 distinct names**, all placed (#208, #212).
- The sheet stays as it is: private, the only original record, and what a removal request is matched against (#206). It holds emails and IPs, so neither the sheet nor an export of it is ever committed.

**Spec choice: how the script reads the sheet and authenticates.** The owner downloads the sheet as CSV to a path outside the repo and passes the path to the script. The owner's own email reaches the script through an environment variable, never a committed file. The script authenticates with Application Default Credentials (`gcloud auth application-default login`), passing `--project=rochester-parks` wherever `gcloud` is involved, because `gcloud`'s default project on this machine is another one (#25).

### 11.2 Join files

Both files are copied onto `main` by this spec's pull request, from `research/archive-park-map`. Neither holds an email, an IP or a body (#27).

- [`docs/research/comment-archive-park-map.json`](research/comment-archive-park-map.json): one row per `Park Name`, with the content `path` (#26, #208, #212). This file is the join key, not `docs/park-name-changes.json`, which misses two names (#26).
- [`docs/research/comment-archive-reply-map.json`](research/comment-archive-reply-map.json): each reply row with its parent, keyed by `author + date` (#27, #208, #212).

### 11.3 Steps, per row

1. **Drop Pingbacks.** A Pingback has an empty email and a URL in the author cell (#26); its content is `[…]` (CONTEXT.md). Two names, `Forest Hills Playground` and `McAvoy Park`, are Pingback-only and contribute nothing (#26).
2. **Place.** Look up `Park Name` in the park map and turn its `path` into the page URL path. The map already resolves the hard cases (#208):
   - `Gates Town Park playground` and `Veteran's Memorial Park gazebo` are WordPress attachment pages; their rows go on the parent Park page, First Responders Park and Rush's Veteran's Memorial Park (#26).
   - The one real `Veterans Memorial Park` row (2014-10-10, a wedding inquiry) goes on Rush's Veteran's Memorial Park, from the Pingback URLs and the photo dates (#208).
   - The four `Badgerow Park North` rows go on Greece's Veteran's Memorial Park, following the #202 merge (#208).
   - The 8 rows of `What makes a Rochester park great?` go on that Blog post (#26).
   - The script fails if any name does not resolve to a page that exists.
3. **Mark the owner.** A row whose email equals the owner's email is `owner: true`, whether a Reply or top-level (#208). 27 rows, under two author strings, `Mark Goho` and `Mark`. `Mark Jesse` is a different person and is not the owner; only the email separates them, so this step runs before the email is dropped (#27).
4. **Pair Replies.** Look the row up in the reply map by `author + date`. If found, `parent` is the derived id (§2.3) of the parent row. **30 Replies, all certain** (#27, #208). Five are reader-to-reader and stay Replies (#27, #28). No reply-to-reply exists (#27).
5. **Body.** Decode HTML entities, strip tags, keep any URL as visible text: the same plain text a new Comment has (#208).
6. **Redact.** If the row's `author + date` is in the redaction file, use its replacement body (#208).
7. **Write** with the derived id (§2.3), `state: "approved"`, `email: null`, `subject: null`, `flags: []`, `created` from `date`, no IP (#206, #208). A re-run overwrites (#208).

The import opens no announcement issue and fires no deploy per row; the next build publishes all of them (#208). It uses no exclusion list: double posts, one-word rows, the 2016 survey-wall exchange on Devil's Cove Park and the 2020 reader-to-reader Reply on Joshua Park all go in. The owner deletes any that grate from the Approved list after the first build (#208).

**Checks the script makes before it writes anything:** 127 rows to write, 30 with a parent, every parent present in the set, 27 owner rows, zero unplaced names. A mismatch stops the run.

**Timezone: not decided on the map.** The export's `date` has no zone. **Spec choice**: read it as `America/New_York`. Only the ISO date shows on the page (§4.2), so an error of a few hours moves at most a late-evening date by one day.

### 11.4 The redaction file

A small file in the repo, keyed by `author + date`, holds the replacement body for three rows (#208). **Spec choice**: `scripts/archive-redactions.json`. The builder writes the three bodies from the sheet with the #206 rule (§9.3):

| Archive name     | Date       | What is removed                             |
| ---------------- | ---------- | ------------------------------------------- |
| Black Creek Park | 2012-11-24 | A phone number                              |
| Pappas Park      | 2016-05-03 | A phone number                              |
| Ellison Park     | 2017-02-07 | A home address, a phone number and an email |

The Riga Town Hall number in the owner's 2016 Sanford Road Park Reply stays: it is a public office number (#208).

## 12. Secrets, IAM and one-time setup

### 12.1 Secrets, in full

| Secret                                                              | Where                                     | Grants                                                                | Source              |
| ------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------- | ------------------- |
| The existing deploy key, `FIREBASE_SERVICE_ACCOUNT_ROCHESTER_PARKS` | GitHub Actions secrets                    | Hosting deploy, and now `roles/datastore.viewer`                      | ADR-0012            |
| The HMAC key                                                        | GitHub Actions secrets and Secret Manager | Signs and checks the page token; keys the tier-two rate-limit counter | ADR-0012, #24, #206 |
| The fine-grained GitHub token                                       | Secret Manager                            | Actions write and Issues write, this repo only, no expiry             | ADR-0012, #30, §8.3 |
| The Basic-auth password                                             | Secret Manager                            | The Moderation surface                                                | #30                 |
| The Akismet key, tier two only                                      | Secret Manager                            | `comment-check`, `submit-spam`, `submit-ham`                          | #32                 |

Nothing else. The Function runs as the default service account with no key material (ADR-0012). The announcement workflow uses its own `GITHUB_TOKEN` (#209).

### 12.2 One-time setup

1. Grant `roles/datastore.viewer` to `github-action-357220121@rochester-parks.iam.gserviceaccount.com` (#29).
2. Create the HMAC key and store it in both places. Create the Basic-auth password. Create the fine-grained token with Actions write and Issues write on this repo, no expiry. Store the password and the token in Secret Manager.
3. Add the Function's source directory. None exists today. Add `functions.source` to `firebase.json` and change the `functions.predeploy` block from `npm` to `bun` (#29). `firebase-tools` is already a devDependency, so `bunx firebase` works (#29).
4. The Function reads its Secret Manager values as declared function secrets (`defineSecret`), so the deploy grants the default service account access to each one. The Function's own `run.app` base URL, which the announcement link needs (§8.2), is a config value set after the first deploy.
5. The first Function deploy enables Cloud Run, Cloud Build and Artifact Registry. Eventarc is not needed for an HTTPS function (#25, #29).
6. Add the `/comment` rewrite to `firebase.json` (§6.1).
7. Add `workflow_dispatch` and the `concurrency` group to `firebase-hosting-merge.yml`, and the fetch step (§10).
8. Add `announce-comment.yml` to `main` (§8.2) and create the `comment` label.
9. Add the `reservations` key to each section `_index.md` that holds Park pages (§5.2).

**Spec choice: how the Function deploys.** By hand, `bunx firebase deploy --only functions`, from the owner's machine. The Function changes rarely, and the existing CI deploy stays Hosting only. The Hosting rewrite ships with the normal site deploy.

## 13. Operations

The map's sanity check was: does it still work if the owner ignores it for two years (#29)? These are the things that can stop it.

- **The runtime bump.** Google may disable a Function on a decommissioned runtime. Node 22 decommissions on **2027-10-31**. Node 24 decommissions on 2028-10-31, but Firebase CLI and SDK support for it is not confirmed (ADR-0012). The bump is a code change; the daily rebuild does not do it (ADR-0012). **Schedule**: when the Function first deploys, the build effort files a GitHub issue "Bump the comments Function off Node 22", due **2027-09-30**, one month ahead of the date.
- **The repo watch.** Announcements rest on the owner watching the repo with "All activity", or "Custom" with Issues. If the watch drops to "Participating and @mentions", announcements stop in silence. This is the one setting that must not change (#209).
- **An error alert.** A Cloud Monitoring alert on Function errors, emailing the owner, which is free. It makes a broken announcement path or a broken write loud (#30).
- **The token.** A GitHub token unused for a year is revoked. At one Comment a month that does not happen. If it does, approval shows the failure and the cron still publishes (ADR-0012).
- **The budget is an alert, not a cap.** $25 a month on this project, alerts at $1, $5 and $25 to `markgoho@gmail.com`. Nothing stops spend (#25). The expected bill is $0 (#23).
- **Monetisation.** The day the site carries any, a Personal Akismet key, if one is in use, goes that day (#32, §7.2).

## 14. Not built, and why

| Not built                                                                                                         | Why                                                                                                                               | Source                     |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Accounts of any kind; giscus, utterances                                                                          | Commenter friction beats owner convenience; the audience is the general public                                                    | Map constraint 1           |
| A hosted comment product, a third-party iframe or widget                                                          | Web-native, both sides                                                                                                            | Map constraints 2 and 3    |
| Turnstile, hCaptcha, reCAPTCHA                                                                                    | Each needs a third-party script; reCAPTCHA's no-JS fallback is gone                                                               | #24                        |
| reCAPTCHA Enterprise "express"                                                                                    | No-JS, but two coarse scores and a default of "low risk" on thin signals. Kept as a fallback to re-price if Akismet stops fitting | #24                        |
| A submission-timing check                                                                                         | A static page cannot stamp a fresh time per request, and JS-off has no client clock                                               | #24, #29                   |
| Keyword lists, a minimum length, all-caps, language, phone-in-body and duplicate filters, a per-minute rate limit | Each eats real archive Comments                                                                                                   | #24                        |
| Tier two at launch                                                                                                | The spam rate is unknown; ship tier one and watch                                                                                 | #24, #32                   |
| A rejected state, a TTL on rejects                                                                                | Reject is delete                                                                                                                  | #30                        |
| A runtime fetch or a public read endpoint                                                                         | Approved Comments are baked into the build                                                                                        | Map constraint 5, ADR-0012 |
| A pull request per Comment; Approved Comments as files in `content/`                                              | Email in git history for good; a second Function for nothing                                                                      | ADR-0012                   |
| Cloud SQL, SQLite on Cloud Run, Cloudflare, bare Cloud Run                                                        | A floor that bills at zero traffic; a week of storage work; a foreign hostname; a container build                                 | #23, ADR-0012              |
| A warm minimum instance                                                                                           | About $4.64 a month for a cold start at one Comment a month                                                                       | #23                        |
| A reader Reply on the live site                                                                                   | One level, reader asks and owner answers; the form has no parent field                                                            | Map constraint 7, #28      |
| Mail sent by the site: an acknowledgement, a notice on approve or reject, a mail API                              | The owner writes back by hand; the announcement goes through a GitHub issue                                                       | #30, #206                  |
| A name or body in the announcement issue                                                                          | The repo is public                                                                                                                | #30                        |
| Firebase Auth or Google sign-in on the surface                                                                    | Basic auth serves one owner; Google sign-in is a later upgrade                                                                    | #30                        |
| The Firestore console or GitHub Issues as the queue                                                               | A raw document list with email in view; a public repo                                                                             | #30                        |
| IP and user agent at launch                                                                                       | No defence at launch needs them                                                                                                   | #206                       |
| A privacy page                                                                                                    | One line under the email field is the disclosure                                                                                  | #206                       |
| Name-blanking or proof of identity on removal                                                                     | Delete is simpler and a false request does little harm                                                                            | #206                       |
| A queue pass or an exclusion list for Archive comments                                                            | 127 clicks buy one look the map already took                                                                                      | #208                       |
| An "old site" mark, a Subject on a published Comment, year headings                                               | Chosen out in the prototype review                                                                                                | #28, #213                  |
| Special handling for a reservation question: a sort, a flag, a list, a canned Reply                               | It is not spam, and the notice carries the link                                                                                   | #213                       |
| A per-Facility or per-page reservation link                                                                       | One owner link is the least effort; a per-page override is the later change if a village causes trouble                           | #214                       |
| Comments on About, list or index pages                                                                            | Only three page kinds take Comments                                                                                               | #212                       |
| A hard budget stop                                                                                                | Out of proportion for a $0 bill                                                                                                   | #25                        |
| The reservation middleman business                                                                                | Out of scope; a fresh effort if it proceeds                                                                                       | Map #22                    |
| Any other WordPress migration work                                                                                | Out of scope                                                                                                                      | Map #22                    |

**Never decided on the map, and not built in the first version:** structured data (JSON-LD) for Comments, and a Reply edit after approval. Neither came up in any ticket.

## 15. Build order

A suggested order for the build effort. Each step ships on its own.

1. **Reader side, read only.** The comment area component, the notice with the section `reservations` keys, the `comments: false` switch, the fetch script and the loader, reading an empty collection. Nothing changes on the live site except the notice and a form that posts nowhere yet. Hold the form back until step 2 if that is cleaner.
2. **Write path.** The Function's POST handler, the rewrite, tier one, the HMAC in the build, and the 303 with the banner.
3. **Announcement.** `announce-comment.yml` on `main`, the dispatch from the Function, and the error alert.
4. **Moderation surface.** The five actions, the deploy dispatch and the issue close.
5. **Archive import.** The redaction file and the script, then one build.
6. **Ops.** File the Node 22 bump issue, due 2027-09-30.
