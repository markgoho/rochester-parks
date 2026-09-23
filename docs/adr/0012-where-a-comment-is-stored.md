# ADR-0012: Where a Comment is stored and how it reaches the page

- **Status**: Accepted
- **Date**: 2026-09-22

## Context

The site is static. SvelteKit builds it to `public/` and Firebase Hosting serves it. A Comment is the first thing a reader writes to the site, so the site needs one place to store it and one path to publish it. The map for this effort (#22) fixed the constraints before this decision: no accounts, Web-native on both sides, a Moderation queue, Approved Comments baked into the build, and a cost ceiling of $25 a month with ties going to the simplest thing that serves Comments.

The storage survey (#23) priced six candidates. At about one Comment a month, five of the six bill $0, so the free tiers do not discriminate. What discriminates is the floor that bills at zero traffic, the cold start a Commenter waits through, and where a secret has to live. Cloud SQL cannot scale to zero and costs about $8 a month always on. SQLite on Cloud Run is a week of storage work. Cloudflare Workers would post the form to a foreign hostname unless DNS moves off Firebase. The hosted Staticman service is dead, though its shape, one pull request per Comment, survives if the owner writes the service.

Two facts from the repo shaped the choice. A Firestore database already exists in the project, Native mode, `us-east4`. The deploy workflow already rebuilds the whole site on every push and every morning on a cron, and a run takes about 90 seconds.

## Decision

**A Comment lives in Firestore. One Firebase Function receives the form. The build reads Approved Comments from Firestore and bakes them into the pages. Approval fires a rebuild.**

1. **Storage.** One Firestore collection holds every Comment, new and Archive. A state field separates the Moderation queue from the Approved set. The Commenter's email sits in the same document as the body. Firestore rules stay deny-all to the public. The Function and the build read through the Admin SDK. The moderation surface (#30) may add an owner-only rule if it needs one; no rule ever opens a document to a reader.

2. **Write path.** The form posts to `/comment` on `rochesterparks.org`. A Hosting rewrite routes it to one 2nd-gen Firebase Function in `us-east4`, beside the database. The Function validates, writes one document to the queue, and answers a 303 back to the page. It runs as the project's default service account, with no key material anywhere.

3. **Build-time read.** The GitHub Actions service account that already deploys the site gets one more role, `roles/datastore.viewer`. A build step authenticates with the key the workflow already holds, reads the Approved Comments, drops email and IP, and hands the rest to the page loader. No public read endpoint exists.

4. **Publication.** The moderation surface (#30) approves a Comment and then fires the deploy workflow through the GitHub API with a fine-grained token that has one permission, Actions write, on this repo alone, and no expiry. The token lives in Secret Manager. The daily cron is the backstop: if the dispatch fails, the Comment still publishes the next morning.

5. **Secrets, in full.** The existing deploy key plus one role. The build-time HMAC key for the park slug (#24), held once in GitHub Actions secrets and once in Secret Manager. The GitHub token above. Nothing else.

## Considered options

- **One pull request per Comment, git as storage.** Rejected. It puts every Commenter's email in git history for good, turns a Reply into file naming, and makes the GitHub PR page the moderation surface. The two things it sells, no build-time secret and a free rebuild on merge, this decision gets from one role grant and the workflow that already runs.
- **Queue in Firestore, Approved Comments as files in `content/`.** Rejected for the first version. It is the same as the decision plus a second Function that commits to the repo. It returns only if the owner wants Approved Comments in the repo as files.
- **Cloud Run instead of a Firebase Function.** Rejected. Same runtime underneath, plus a container build step the repo does not have. A warm minimum instance would cost about $4.64 a month, which the survey found is a second recurring cost, not a free fix.

## Consequences

- **The runtime needs a bump before each decommission date.** Google may disable a Function on a decommissioned runtime. Node 22 decommissions on 2027-10-31. Node 24 is a Cloud Run functions runtime that decommissions on 2028-10-31, but Firebase CLI and SDK support for it is not confirmed. The bump is a code change, so the daily rebuild does not do it. The spec must schedule it.
- **A rebuild is the only way a Comment reaches a page.** A submit writes one document and nothing else happens. This is constraint 5 of the map, and it is why storage and rendering stay separate.
- **A GitHub token unused for a year is revoked.** At one Comment a month it stays in use. If it lapses, approval shows the failure in the moderation surface, and the cron publishes the Comment anyway.
- **Export is an hour.** A script reads one collection and writes JSON. If Firestore's free tier changes, the build already reads data from a source, so the source is what moves.
- **Rate limits are cheap, not free.** Firestore TTL deletes have no free allowance and bill as ordinary deletes from the first one. At a handful of counter documents a day that rounds to $0 on Blaze, so the daily counters from the spam survey stay on the table.
- **Cloud Run, Cloud Build and Artifact Registry become enabled** on the first Function deploy. Eventarc is not needed for an HTTPS function.
- This decision does not pick the moderation surface or its login. It rules out one candidate, the pull request per Comment, and it requires that the surface can write the state field and call the GitHub API. Whether it reaches Firestore through a Function or through an owner-only rule is #30's call.

## Amendments

- **2026-09-23, from the implementation spec (#217) and #222.** A submit now does one more thing after the write: the Function dispatches an announcement workflow, which opens one issue so GitHub emails the owner. A failed dispatch keeps the Comment. The fine-grained token therefore has two permissions, Actions write and Issues write: Actions write dispatches the announcement and the deploy, and Issues write lets approve and reject close the announcement issue. The Comment document stores no issue number; the issue carries the Comment's id instead.
