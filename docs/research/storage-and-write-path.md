# Storage and write path options for the comment system

Research for issue #23, under map #22. **Facts only. No recommendation.**
All prices checked **2026-09-15** on the pages cited. Prices are Iowa (`us-central1`)
list prices in USD unless stated. Arithmetic marked "(computed)" is mine, from the
published rates; the rates themselves are quoted.

## Scope and shared assumptions

- Volume: about 140 `Comment` rows in 12 years, roughly **1 `Comment` per month**.
  Every candidate below is far inside every free tier at this volume, so the
  interesting numbers are the **floors that bill even at zero traffic**.
- `Approved` Comments are baked into the static build, so storage needs only a
  **read API for approved Comments at build time**. No runtime read path.
- The reader side is plain HTML with JavaScript off. A JS-off form POST is a
  **top-level navigation**: the browser blocks on the response, so any cold start
  is visible wait time for the `Commenter`, and the service must answer with a
  redirect (303) back to the page. No CORS is involved, because the browser is
  navigating, not fetching. This applies to every candidate equally.
- Existing deploy: `.github/workflows/firebase-hosting-merge.yml` builds with Bun
  and deploys to Firebase Hosting on push to `main`, using the repository secret
  `FIREBASE_SERVICE_ACCOUNT_ROCHESTER_PARKS`, project `rochester-parks`.
- **The repository is private** (`gh repo view markgoho/rochester-parks` →
  `"visibility":"PRIVATE"`, checked 2026-09-15). This matters only for candidate 6.
- Whether the `rochester-parks` Firebase project is already on Blaze is not
  recorded anywhere in the repo. **Unknown.**

## Two facts that cut across the GCP candidates

**Same-origin POST is free on Firebase Hosting.** Firebase Hosting rewrites can
route a path such as `/comment` to a Cloud Function or a Cloud Run service in the
same project, so the form can POST to `https://rochesterparks.org/comment` with no
second hostname. The docs give the `rewrites` block with `function.functionId` and
`function.region`, note the region defaults to `us-central1`, and state that
"Firebase Hosting is subject to a 60-second request timeout" regardless of the
function timeout. Cloud Run containers are supported the same way.
Source: https://firebase.google.com/docs/hosting/functions (checked 2026-09-15).
Candidates 1 to 4 get this. Candidates 5 and 6 do not.

**A public read API removes the build-time secret.** `Approved` Comments are public
by definition, so the build-time read can be an unauthenticated GET. The catch is
that the email field lives in the same record and must never reach the build.
Firestore security rules match documents, not fields — "All match statements should
point to documents, not collections" — so a rule can allow or deny a whole document
but cannot strip `email` out of the response. Keeping email out of a public read
means a separate collection, or a read endpoint that projects the fields.
Source: https://firebase.google.com/docs/firestore/security/rules-structure
(checked 2026-09-15).

## Published rates used below (all checked 2026-09-15)

**Cloud Run, services, request-based billing** (https://cloud.google.com/run/pricing):
free tier "CPU - First 180,000 vCPU-seconds free per month, RAM - First 360,000
GiB-seconds free per month, Requests - 2 million requests free per month". Iowa
rates: CPU active `$0.000024` per vCPU-second, memory active `$0.0000025` per
GiB-second, requests `$0.40` per million. Idle time under a **minimum instance** is
billed at `$0.0000025` per vCPU-second and `$0.0000025` per GiB-second. The page
states: "idle min instance refers to idle billable time for instances kept warm
using minimum instances. Idle instances that are not minimum instances are not
charged."

**Cloud Functions for Firebase, Blaze** (https://firebase.google.com/pricing):
invocations "No-cost up to 2M/month, then $0.40/million"; GB-seconds "No-cost up to
400K/month"; CPU-seconds "No-cost up to 200K/month"; outbound networking "No-cost
up to 5 GB/month, then $0.12/GB"; Cloud Build minutes "No-cost up to 120 min/day,
then $0.003/min"; "Container storage in Artifact Registry — No-cost up to 500MB of
storage, then Google Cloud pricing".

**Firestore, Spark and Blaze** (https://firebase.google.com/pricing): stored data
"1 GiB total"; "20K writes/day"; "50K reads/day"; "20K deletes/day"; network egress
"10 GiB/month". The same numbers appear as Always Free at
https://docs.cloud.google.com/free/docs/free-cloud-features.

**Cloud SQL** (https://cloud.google.com/sql/pricing): `db-f1-micro` (shared vCPU,
0.6 GiB RAM) `$0.0105 / 1 hour`; `db-g1-small` `$0.035 / 1 hour`; SSD storage
capacity `$0.000232877 / 1 gibibyte hour`; "IPv4 addresses while idle $0.01 / 1
hour". Footnote: "Shared CPU machine types (db-f1-micro and db-g1-small) are not
covered by the Cloud SQL SLA." The smallest dedicated Enterprise vCPU is
`$0.0413 / 1 hour` plus `$0.007 / 1 gibibyte hour` of memory. Cloud SQL has **no
always-free tier** — the free-tier page lists only "a 30-day Cloud SQL free trial
instance at no cost". The minimum storage size for an instance is **unverified**;
the instance-settings page states only a maximum (3054 GB for shared-core).

**Cloud Storage, Always Free** (free-cloud-features): "5 GB-months of regional
storage (US regions only) per month", "5,000 Class A Operations per month",
"50,000 Class B Operations per month".

**Secret Manager, Always Free**: "6 active secret versions per month. 10,000 access
operations per month."

**Cloudflare Workers** (https://developers.cloudflare.com/workers/platform/pricing/):
free plan "100,000 [requests] per day" and "10 milliseconds of CPU time per
invocation"; paid plan "$5 USD per account" per month minimum, 10 million requests
included, "+$0.30 per additional million", 30 million CPU-milliseconds included.
"No charges for data egress or bandwidth."

**Cloudflare D1** (https://developers.cloudflare.com/d1/platform/pricing/): free
plan "Rows read: 5 million / day", "Rows written: 100,000 / day", "Storage: 5 GB
(total)". Paid plan includes 25 billion rows read, 50 million rows written and 5 GB
storage per month. "There are no data transfer (egress) or throughput (bandwidth)
charges."

## 1. Firebase Cloud Functions plus Firestore

- **Free tier and real bill.** At ~1 Comment per month, invocations, GB-seconds,
  CPU-seconds, Firestore reads, writes and storage are all orders of magnitude
  under the no-cost allowances quoted above. The expected bill is **$0**, with two
  small non-zero risks the pricing page names explicitly: Cloud Build minutes
  beyond 120 per day (deploys only) and Artifact Registry container storage beyond
  500 MB. Both are per-deploy artefacts, not per-Comment. A Blaze billing account
  is required for Cloud Functions at all — the Spark column reads "Not applicable"
  for every Functions row.
- **Scales to zero.** Yes, unless `minInstances` is set, which maps onto Cloud Run
  idle billing (see candidate 2).
- **Cold start on a form POST.** Present. The `Commenter` waits through container
  startup on a top-level navigation. The docs describe the startup steps and note
  requests "will pend for up to 3.5 times average startup time of container
  instances of this service, or 10 seconds, whichever is greater". Startup CPU
  boost and minimum instances are the documented mitigations. No latency number is
  published, so the actual wait is **unverified**.
  Source: https://docs.cloud.google.com/run/docs/tips/general.
- **Build-time read.** Either a public unauthenticated GET on a second HTTP
  function that projects only publishable fields, or the Firestore REST API with a
  service-account OAuth 2.0 token. The REST docs say to "Use a Google Identity
  OAuth 2.0 token and a service account to authenticate requests from your
  application" and that for unauthenticated requests "Cloud Firestore uses your
  Cloud Firestore Security Rules to determine if a request is authorized".
  Source: https://firebase.google.com/docs/firestore/use-rest-api.
- **Secrets.** None new if the read is a public endpoint. If the build reads
  Firestore directly, GitHub Actions needs GCP credentials. The existing workflow
  already holds `FIREBASE_SERVICE_ACCOUNT_ROCHESTER_PARKS`; what IAM roles that
  service account carries is **unverified** from the repo. `google-github-actions/auth`
  recommends against reusing a key: "Workload Identity Federation is recommended
  over Service Account Keys as it obviates the need to export a long-lived
  credential". Source: https://github.com/google-github-actions/auth.
- **Lock-in.** Firestore's document model and its query language are proprietary;
  there is no SQL dump. Moving off means writing an export script against the
  Firestore API and reshaping ~140 documents. At this row count that is hours, not
  a migration.
- **Effort.** A weekend. One HTTP function, one collection, one rules file, and the
  Hosting rewrite. Nothing new in the deploy chain.

## 2. Cloud Run (Go or JS) plus Firestore

- **Free tier and real bill.** Same Firestore story. Cloud Run request-based
  billing gives 2 million requests, 180,000 vCPU-seconds and 360,000 GiB-seconds
  free per month; ~1 POST per month plus moderation traffic is nowhere near.
  Expected bill **$0**, same Artifact Registry and Cloud Build caveats as above.
- **The min-instance floor.** If cold starts are killed with `min-instances=1`,
  idle billing applies at `$0.0000025` per vCPU-second and per GiB-second. For one
  always-warm 1 vCPU / 512 MiB instance over a 730-hour month (2,628,000 seconds):
  gross `$6.57` CPU plus `$3.29` memory = **about $9.86 per month**; net of the
  free vCPU-seconds and GiB-seconds, about **$8.51 per month** (computed). That is
  the same order as the Cloud SQL floor. Map note 12 names Cloud SQL as "the one
  real recurring cost in play"; a warm minimum instance is a second one.
- **Scales to zero.** Yes, at `min-instances=0`, which is the default.
- **Cold start on a form POST.** Same as candidate 1; Cloud Run is the same
  substrate.
- **Build-time read.** Same options as candidate 1, plus the obvious one: the same
  container serves `GET /comments.json` publicly, filtered to `Approved` and
  projected to publishable fields, so the build just curls it with no credentials.
- **Secrets.** None required if the read endpoint is public.
- **Lock-in.** Lowest of the GCP set on the compute side — it is a container, and
  it runs anywhere. The Firestore dependency is the sticky part.
- **Effort.** A weekend, plus the container build and a deploy step the repo does
  not have yet.

## 3. Cloud Run plus Cloud SQL

- **The always-on floor, explicitly.** Cloud SQL bills by the hour whether or not
  anything connects. Cheapest running instance: `db-f1-micro` at `$0.0105 / 1 hour`
  = **$7.67 per month** over 730 hours (computed), plus SSD at `$0.000232877 / 1
  gibibyte hour` = `$0.17` per GiB-month (computed). A 10 GiB instance therefore
  lands near **$9.37 per month** — but the minimum storage size is **unverified**,
  so treat the 10 GiB as an illustration, not a quote. There is **no free tier**.
  Shared-core machines carry no SLA. If the instance is stopped, the reserved IPv4
  address still bills at `$0.01 / 1 hour` (about `$7.30` per month, computed), so
  stopping it between comments saves less than it looks. A dedicated 1-vCPU
  Enterprise instance instead would be `$0.0413 / 1 hour` = about `$30 per month`
  (computed), above the $25 ceiling on its own.
- **Scales to zero.** **No.** This is the only candidate here that cannot.
- **Cold start on a form POST.** The Cloud Run side cold-starts as in candidate 2.
  The database is already warm, so the connection is fast, but the container start
  is unchanged.
- **Build-time read.** Two routes. Either Cloud Run exposes a read endpoint (as in
  candidate 2) and GitHub Actions needs nothing; or GitHub Actions connects to the
  database directly, which needs the Cloud SQL Auth Proxy or a public IP plus
  credentials. From Cloud Run itself the connector is built in: the service reaches
  "your Cloud SQL instance's Unix domain socket accessed on the environment's
  filesystem at the following path: `/cloudsql/INSTANCE_CONNECTION_NAME`", the
  instance needs "a public IP address" on the default path, and the service account
  needs "the `Cloud SQL Client` IAM role".
  Source: https://docs.cloud.google.com/sql/docs/mysql/connect-run.
- **Secrets.** A database password in Secret Manager (6 active secret versions and
  10,000 access operations are Always Free), or IAM database authentication. If the
  build talks to the database directly, GitHub Actions holds GCP credentials too.
- **Lock-in.** Lowest of any candidate. It is MySQL or PostgreSQL; `mysqldump` or
  `pg_dump` moves it anywhere.
- **Effort.** A weekend for the code, plus schema, migrations, connection config
  and a password to rotate. Call it the long end of a weekend.

## 4. Cloud Run plus SQLite on a volume, or Litestream

- **Cloud Run has no persistent disk.** The supported volume mounts are Cloud
  Storage buckets via Cloud Storage FUSE, NFS, in-memory, CIFS/SMB and ephemeral
  disk. The GCS FUSE page states plainly: "Cloud Storage FUSE does not provide
  concurrency control for multiple writes (file locking) to the same file. When
  multiple writes try to replace a file, the last write wins and all previous
  writes are lost," and "Cloud Storage FUSE is not a fully POSIX-compliant file
  system." SQLite depends on file locking, so a SQLite file on a FUSE mount is
  outside what the documented semantics support.
  Source: https://docs.cloud.google.com/run/docs/configuring/services/cloud-storage-volume-mounts.
- **Filestore / NFS** gives real POSIX locking but is a provisioned always-on
  appliance with a minimum capacity, which is the opposite of scale-to-zero. Its
  exact minimum and price were **not checked** for this survey.
- **Litestream** replicates a local SQLite file to a GCS bucket and restores it on
  start. The GCS guide covers `litestream replicate` and `litestream restore` and
  says external deployments need "a service account with Storage Admin permissions
  and a JSON credentials file". The caveats page warns that "Multiple applications
  replicating into the same bucket & path can cause situations where you will be
  unable to restore," and that "Litestream prevents other processes from
  checkpointing by maintaining a read lock on the database in between its
  checkpoint requests" — i.e. **one writer only**, which on Cloud Run means
  pinning `max-instances=1` and accepting that a scale-to-zero instance must
  restore from GCS on every cold start, and that any write not yet replicated when
  an instance is reclaimed is at risk.
  Sources: https://litestream.io/guides/gcs/, https://litestream.io/tips/.
- **Free tier and real bill.** Cloud Run as in candidate 2 (**$0**), GCS within
  Always Free (5 GB-months US regional, 5,000 Class A and 50,000 Class B operations
  per month) — but Litestream replicates on a timer, not only on write, so the
  Class A operation count depends on the replication interval and is **unverified**
  at the default settings.
- **Scales to zero.** Yes, at the cost of a restore on every cold start.
- **Cold start on a form POST.** Worst of the set: container start **plus** a
  Litestream restore from GCS before the first write can be served.
- **Build-time read.** Two ways, and the second is unique to this candidate: serve
  a read endpoint from Cloud Run, or have GitHub Actions run `litestream restore`
  from the bucket and query the resulting SQLite file locally with no service
  running at all.
- **Secrets.** A GCS service-account credential, held by the service and, for the
  restore-in-CI route, by GitHub Actions as well.
- **Lock-in.** Near zero. It is a SQLite file in a bucket.
- **Effort.** A week. The storage story is the whole project here, not a detail.

## 5. Cloudflare Workers plus D1

- **Free tier and real bill.** The Workers free plan allows 100,000 requests per
  day and 10 ms CPU per invocation; D1's free plan allows 5 million rows read per
  day, 100,000 rows written per day and 5 GB storage. One Comment a month plus a
  build-time read is invisible against those. Expected bill **$0**, with no paid
  plan needed. The paid plan, if ever wanted, has a **$5 per month account
  minimum**.
- **Scales to zero.** Yes, and D1's page calls the model "scale-to-zero".
- **Cold start on a form POST.** The isolate model is the point: "This model
  eliminates the cold starts of the virtual machine model" and "Any given isolate
  can start around a hundred times faster than a Node process on a container or
  virtual machine." No latency figure is quoted, so the absolute number is
  **unverified**, but the documented mechanism has no container to start.
  Source: https://developers.cloudflare.com/workers/reference/how-workers-works/.
- **Origin problem.** Attaching a Worker to `rochesterparks.org` needs "An active
  Cloudflare zone", i.e. the domain's DNS must move to Cloudflare. The site is on
  Firebase Hosting today. Without that move the form posts cross-origin to a
  `workers.dev` subdomain — still fine for a JS-off navigation POST, but the
  `Commenter` sees a foreign hostname in the address bar mid-submit, and the
  redirect back is cross-origin.
  Source: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/.
- **Build-time read.** Two ways. The Worker itself serves a public read endpoint,
  which needs no secret; or the D1 HTTP API is called directly at
  `POST /accounts/{account_id}/d1/database/{database_id}/query`, which needs a
  Cloudflare API token. Cloudflare's own guidance is that "D1's built-in REST API
  is best suited for administrative use as the global Cloudflare API rate limit
  applies" and that a proxy Worker is the way to query D1 from outside.
  Sources: https://developers.cloudflare.com/api/resources/d1/,
  https://developers.cloudflare.com/d1/tutorials/build-an-api-to-access-d1/.
- **Secrets.** A `CLOUDFLARE_API_TOKEN` in GitHub Actions if the build calls the D1
  HTTP API, and in any case a deploy token for `wrangler` if the Worker is deployed
  from CI. None needed for the build if the read endpoint is public.
- **Lock-in.** D1 is SQLite, and it can be exported with `wrangler d1 export`, so
  the data is portable. The Worker runtime API is Cloudflare-specific but the
  handler is small.
- **Effort.** A weekend. The new cost is not code, it is a second vendor account,
  a second deploy pipeline and a second dashboard — which the map's note calls
  "allowed but not preferred".

## 6. Staticman-style: the POST becomes a pull request

- **The hosted Staticman instance is gone.** `https://staticman.net/` now returns
  `301` to `https://methstreams.click` (checked 2026-09-15) — an unrelated site, so
  the project's domain has lapsed. The upstream repository
  `eduardoboucas/staticman` is not archived but its default branch's last commit is
  dated **2020-07-06**, its only release is `v1.0.0` from 2016, and it has 131 open
  issues (GitHub API, checked 2026-09-15). Running Staticman itself means
  self-hosting a 2020-vintage Node service somewhere — which collapses back into
  candidate 2 or 5 with extra baggage.
- **The shape without Staticman.** The owner's own small service takes the POST,
  calls the GitHub API, and writes the Comment as a file on a branch, opening a
  pull request. `Moderation queue` = open pull requests. `Approved` = merged. Merge
  to `main` already triggers the existing Hosting deploy, so the rebuild trigger
  that map #22 lists as unspecified comes for free here.
- **Free tier and real bill.** The storage is the repository, so **$0**. The
  service still has to run somewhere — a Cloud Function, a Cloud Run service or a
  Worker — so the compute numbers are whichever of 1, 2 or 5 hosts it, all $0 at
  this volume.
- **Scales to zero.** Yes, inherited from the host.
- **Cold start on a form POST.** Inherited from the host, plus one or more GitHub
  API round-trips inside the request while the `Commenter` waits.
- **Build-time read.** Zero work. The Comments are files in the checkout the build
  already has. No API, no token, no network.
- **Secrets.** A GitHub credential with write access to this repository — a
  fine-grained PAT or a GitHub App installation — held by **the service**, not by
  GitHub Actions. That is the one secret in this survey that is a write credential
  on the repository itself.
- **PII.** The repository is **private**, so an email committed to a Comment file
  is not public. It is still permanent in git history, and the build must strip it
  before rendering, per map notes 8 and 10. Staticman's own answer to this was
  field encryption, but that feature belongs to the project whose hosted instance
  is gone and is **not verified** here.
- **Lock-in.** Effectively none — the data is markdown or JSON in the repository.
  The coupling is to GitHub, which the project already has.
- **Effort.** A weekend for the happy path. The moderation surface is the GitHub
  pull-request UI, which is free but is a developer surface, and `Reply` threading
  and duplicate-file naming are fiddlier than a database row.

## What this survey did not settle

- Whether the `rochester-parks` Firebase project is on Blaze today.
- The IAM roles on `FIREBASE_SERVICE_ACCOUNT_ROCHESTER_PARKS`.
- Cloud SQL's minimum instance storage size, and therefore the exact floor.
- Filestore's minimum capacity and price.
- Real-world cold-start latency for Cloud Run or Workers; no vendor publishes one.
- Litestream's default replication interval and its Class A operation cost.
