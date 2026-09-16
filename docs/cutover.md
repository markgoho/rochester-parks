# WordPress to SvelteKit cutover

Moving `rochesterparks.org` from WordPress to this Firebase-hosted static site.

Target: **the bare apex, no `www` anywhere.** WordPress currently 301s the apex to `www`, so the entire existing Google index lives on `www`. Cutover reverses that.

## State before cutover

| Thing | Value |
|---|---|
| Registrar | Squarespace |
| Nameservers | Cloudflare (`asa`/`carter.ns.cloudflare.com`) — **DNS is edited in Cloudflare, not Squarespace** |
| Apex today | 301 to `www.rochesterparks.org`, proxied through Cloudflare |
| New site today | Live and public at `rochester-parks.web.app` |
| `SITE_URL` | `https://rochesterparks.org` — already apex, no change needed |
| `www` in the codebase | None, outside XML namespaces |

## Already done

- [x] Seven old URLs with no match here now 301 in `firebase.json`.
- [x] Gates Town Park added. It was the one old URL with no equivalent page.
- [x] Pirsch Analytics in `src/app.html`. Ignores localhost, so dev and preview never report.

## Step 1 — robots.txt. Do not skip this.

`static/robots.txt` currently reads:

```
User-agent: *

Disallow: /
```

That is correct **today**, because it stops Google indexing `rochester-parks.web.app` as a duplicate of the live site. It becomes a catastrophe the moment DNS moves: it de-indexes the entire site.

Replace it at cutover, not before:

```
User-agent: *
Disallow:

Sitemap: https://rochesterparks.org/sitemap.xml
```

Note the sitemap path differs from WordPress. Yours is `/sitemap.xml`; Yoast served `/sitemap_index.xml`.

Firebase Hosting cannot serve a different `robots.txt` per hostname on one site, so there is no way to have both at once. It is a swap, and it has to be timed.

## Step 2 — verify on a preview channel

```
bunx firebase hosting:channel:deploy cutover --expires 7d
```

Check on the preview URL:

- A park page loads: `/town-parks/gates-parks/gates-town-park/`
- `/sitemap.xml` returns XML, not a redirect. **This is the one to watch.** `trailingSlash: true` was deliberately left out of `firebase.json` because it might rewrite `/sitemap.xml` to `/sitemap.xml/`. If you ever add it, re-test this.
- One redirect fires: `/uncategorized/belmanor-park` should 301 to `/town-parks/brighton-parks/belmanor-park/`.

## Step 3 — add the custom domains in Firebase

In the Firebase console, Hosting, add **both**:

1. `rochesterparks.org` — the live site
2. `www.rochesterparks.org` — set to **redirect** to the apex

Firebase issues a TXT record for verification, then A records for the apex.

**Cloudflare proxying breaks this.** The apex is orange-clouded today. Set the records to **DNS only** (grey cloud) for verification and certificate issuance. Firebase provisions its own certificate; leaving Cloudflare's proxy in front causes a redirect loop or a certificate failure.

## Step 4 — DNS in Cloudflare

Lower the TTL on the apex and `www` records to 5 minutes **a day ahead**, so a rollback is fast.

Then, at cutover:

1. Replace the apex A records with the ones Firebase gives you. Grey cloud.
2. Point `www` at Firebase too, so the redirect in step 3 can fire. A `www` that simply stops resolving turns 200 indexed URLs into dead ends rather than redirects.
3. Leave MX and any other records alone.

## Step 5 — merge the robots swap

The `robots.txt` change from step 1 deploys on push to `main`. Time it with the DNS change. Deploy takes about 2m30s.

## Step 6 — after cutover

- Add `https://rochesterparks.org` as a **new property** in Search Console. The `www` property will not carry over.
- Submit `https://rochesterparks.org/sitemap.xml`.
- Keep the old `www` property to watch the redirects being followed.
- Spot-check three old `www` URLs from the archive and confirm each lands on the apex equivalent.

## The 143 orphan URLs

WordPress indexes URL classes this site has no equivalent for:

| Class | Count |
|---|---|
| Attachment pages | 75 |
| Category pages | 25 |
| Tag pages | 37 |
| Slide pages | 5 |
| Author page | 1 |

**Recommendation: let them 404.** They are thin, mostly unlinked, and Google drops 404s within a few weeks. A blanket redirect to the home page is worse — Google treats it as a soft 404 and it hides the loss instead of resolving it.

The exception worth checking: if Search Console shows any category or tag page with real impressions, redirect that one to its nearest section page. Check before deciding rather than assuming.

## Rollback

Put the old Cloudflare A records back and re-enable the orange cloud. With a 5-minute TTL, this is quick. The WordPress site stays up throughout, so rollback costs nothing but the DNS propagation.

Do not roll back by reverting `robots.txt` alone. That leaves DNS pointing at a site telling Google to go away.
