# Spam defence for an anonymous, no-JavaScript comment form

Research note for issue [#24](https://github.com/markgoho/rochester-parks/issues/24), under map [#22](https://github.com/markgoho/rochester-parks/issues/22).

All web sources were read on **2026-09-15**. Vocabulary follows `CONTEXT.md`: Comment, Commenter, Reply, Archive comment, Moderation queue, Approved, Subject, Web-native.

## 1. The question

How do we stop spam on a form that any person can use, that needs no account, and that must work with JavaScript off?

The failure mode is not spam that readers see. The Moderation queue already stops that. The failure mode is a Moderation queue with so much noise that the owner stops opening it.

## 2. Summary of the answer

1. **The ticket's reading of the widget CAPTCHAs is correct.** Turnstile, hCaptcha and every ordinary reCAPTCHA mode need a script from a third party. reCAPTCHA's old `<noscript>` fallback has been removed from the current documentation. See section 3.
2. **One genuine no-JavaScript exception exists, and it is not on the ticket's list.** reCAPTCHA Enterprise "express" scores a request from backend signals only, with no client integration at all. It is admissible. It is not recommended, for reasons in 3.3.
3. **The submission timing check cannot work on this site as designed.** A statically built page has no per-request render, so it cannot carry a fresh timestamp, and with JavaScript off there is no client clock. This removes one item from the ticket's own list and feeds the write-path ticket #29. See 5.2.
4. **The archive rules out most content heuristics.** Real Comments here are short one-liners, Reservation inquiries carrying telephone numbers, and long local-history reminiscences. Keyword lists, minimum length, all-capitals checks and duplicate detection all eat named real rows. Link count at two or more eats none. See section 4.
5. **Akismet Personal fits, is free at $0 with unlimited monthly calls, and is verified against current terms.** One condition applies. See section 6.
6. **The minimum viable defence is honeypot plus strict server-side validation plus a link-count flag.** Akismet joins later, as a sort key, if the queue proves noisy. See section 7.

## 3. Why the widget CAPTCHAs fail

The ticket asks us to confirm the reading rather than assume it. We checked the current official documentation on 2026-09-15. **The ticket's reading is correct for Turnstile, hCaptcha and ordinary reCAPTCHA. There is one exception, and it is not in that list.**

### 3.1 Cloudflare Turnstile: fails

`developers.cloudflare.com/turnstile/get-started/client-side-rendering/` shows both implicit and explicit rendering loading `https://challenges.cloudflare.com/turnstile/v0/api.js`. The overview page describes Turnstile running "non-interactive JavaScript challenges". No no-JavaScript mode appears anywhere in the Turnstile documentation. **Turnstile fails constraint 2.**

We also checked Cloudflare's other bot products, because they are server side:

- **Bot Fight Mode** (free plan) "Issues computationally expensive challenges that force the requesting client to perform CPU-intensive calculations", and `developers.cloudflare.com/bots/additional-configurations/javascript-detections/` states that "For Bot Fight Mode customers, JavaScript Detections is automatically enabled and cannot be disabled." So the free tier injects client JavaScript. **Fails.**
- **Super Bot Fight Mode** and **Bot Management** can switch JavaScript Detections off and fall back to passive signals. That is genuinely script-free, but it needs a Business or Enterprise plan, and it is a coarse allow, block or log heuristic. Out of budget and out of proportion.
- **WAF Managed Rules** with a Block action are purely server side, but they are attack-signature filtering, not comment-spam filtering, and they are not on the free plan.

### 3.2 reCAPTCHA v2 checkbox, v2 invisible, v3: fail

The old `<noscript>` iframe-and-textarea fallback is **gone from the current documentation**. `developers.google.com/recaptcha/docs/display` and the reCAPTCHA FAQ contain zero occurrences of `noscript`, verified against the raw HTML. The invisible and v3 pages both require `https://www.google.com/recaptcha/api.js`. **All fail constraint 2.**

### 3.3 reCAPTCHA Enterprise "express": the one genuine exception

`docs.cloud.google.com/recaptcha/docs/express-standalone` documents a mode that needs no browser code at all. Quoting the page:

> reCAPTCHA express can be set up on an application server when a client-side integration with the reCAPTCHA JavaScript or mobile SDK is not feasible, for example, for protection of API endpoints. reCAPTCHA express is a feature that lets you create assessments without a client-side integration or client-side signals. reCAPTCHA express uses only backend signals to generate a reCAPTCHA risk score.

So the honest answer to the ticket is: **yes, one product in that family offers a real no-JavaScript path.** It is not a widget. The reader never sees it. It is a server-to-server call, the same category as Akismet.

Two reasons it is still not the recommendation:

1. The same page states that express returns only two coarse scores, 0.3 for high risk and 0.7 for low risk, instead of a continuous 0.0 to 1.0 score, and that it **defaults to 0.7 when signals are insufficient**. A defence that defaults to "probably fine" on thin evidence is weak for a form with no other signal.
2. It is a Google Cloud Enterprise product. Its cost for this volume is **unverified** here. Akismet covers the same job and its terms for a personal site are known (section 6).

Record express as admissible but not chosen. If Akismet's terms ever stop fitting, this is the fallback to re-price.

### 3.4 hCaptcha: fails

`docs.hcaptcha.com/` loads `https://js.hcaptcha.com/1/api.js`. The FAQ does not address a no-JavaScript path. `www.hcaptcha.com/accessibility` documents a text-based Accessibility Challenge and an email-token flow, but both still need the widget and its script to load first; they change the kind of challenge, not the requirement. A secondary web result claimed hCaptcha "supports non-JavaScript clients". That claim traces to no hCaptcha documentation page and is **unverified**. Treat it as wrong. **hCaptcha fails constraint 2.**

## 4. The archive, and what it tells us about false positives

Source: the `RP Comments` sheet named in map #22. It holds about 140 rows, 2012 to 2024. This note gives no email address, no IP address and no telephone number from that sheet. Rows are named by first name, Park and year.

**Important limit on this evidence.** The sheet holds the Comments that WordPress let through. WordPress runs Akismet by default, so the sheet shows the survivors, not the arrivals. The sheet therefore grounds false-positive risk very well. It tells us nothing about how much spam arrives. That number is **unverified**, and section 7 shows that it is the one fact that moves the decision.

**Baseline volume.** About 140 Comments in 12 years is close to one Comment each month. Even three spam Comments each day is 100 times the real signal. A noisy queue arrives fast.

### 4.1 The shapes that real Comments take

1. **Reservation inquiry.** The largest class. Short, and full of the words a generic spam filter dislikes: rent, book, reserve, cost, price, availability, "please contact me", "please call me". Examples: Vanessa (Adeline, 2023), Diane (Westgate, 2024), Melvin (Sanford Road, 2024).
2. **Long local-history reminiscence.** Several hundred words, many place names, street names and family names. Examples: Susan (Griffith, 2018), Henry (Griffith, 2020), Sege (Rose Turner, 2024), Angela (St. Joseph's, 2019).
3. **Very short question or remark.** Examples: Dave (Braddock Bay, 2015) whose whole Comment is "Hi". G Lipani (Badgerow North, 2015): "where is the park located??". Joel (Snick Hawkins, 2020): "Who was Snick Hawkins?". Cassandra (Gates Memorial, 2024): "I need to talk to someone". Timbo (Gates Town Park playground, 2016): "Awesome time there".
4. **Contact details inside the body.** Deborah (Black Creek, 2012) put a 585 telephone number and a second person's name in the body. Bob (Ellison, 2017) put a full postal address, a telephone number and his email address in the body. Ofelia (Pappas, 2016) put a telephone number in the body and asked to be called.
5. **A single link in the body.** Rita (Adeline, 2014) sent a correction that was one Town of Greece URL. Dale (Abraham Lincoln, 2014) quoted the site's own URL. Kevin (Black Creek, 2015) wrote an appreciative first-visit Comment that contains a raw `<a>` tag to his own dog blog. Shape 5 is the exact shape of link spam.

### 4.2 Which defence would flag which real Comment

| Defence | Archive rows it would flag |
| --- | --- |
| Link count, threshold 2 or more | **None.** No Commenter row in the sheet has two links in the body. Rita, Dale and Kevin each have exactly one. This is a measured result, not an estimate. |
| Link count, threshold 1 or more | Rita's correction, Dale, Kevin. A correction is the second value of the `Subject` enum, so this threshold attacks a class the form exists to collect. |
| Generic comment-spam keyword list | Almost every Reservation inquiry. Lists borrowed from generic filters carry rent, book, cheap, price, "contact me", "call me". Only a narrow list of pharma, casino, SEO and crypto terms is safe here. |
| All-capitals heuristic | Janice (Braddock Bay 2019 and Grandview 2020). Both rows are real, and both are shouted. |
| Country or language filter | Silvana (Braddock Bay, 2014) posted from a non-US address. Angela (St. Joseph's, 2019) used an Italian ISP email domain. Both are real. |
| Minimum body length | Dave's "Hi", G Lipani's one line, Joel's one line, Cassandra's two one-line rows, Timbo's two. Shape 3 is a real and common class. |
| Telephone number or email address in body | Deborah, Bob, Ofelia. All three are real, and two are Reservation inquiries. |
| Duplicate or near-duplicate content | Cassandra posted two near-identical rows 60 seconds apart. Ilene (Sanford Road) asked the same thing twice in 2020 from two different email addresses. |
| Rate limit of one post each minute for each IP | Cassandra (60 seconds apart), Timbo (49 seconds apart), Ginny (Union Station, 2019, about 100 seconds apart). All are real people who pressed send twice. |

The rule that follows: **a defence must rank the queue, not delete from it.** The only safe delete is a honeypot hit, because no person fills a hidden field.

### 4.3 The IP data in the archive is proxy data

Many rows carry addresses in `162.158.x`, `172.68.x`, `172.69.x`, `172.70.x`, `108.162.216-219.x` and `173.245.52.x`. Cloudflare publishes its ranges at `https://www.cloudflare.com/ips-v4`, read 2026-09-15. That list contains `162.158.0.0/15`, `172.64.0.0/13`, `108.162.192.0/18` and `173.245.48.0/20`. Every one of those archive addresses falls inside a published Cloudflare range.

Three consequences:

1. The old WordPress site logged the Cloudflare edge address, not the Commenter address. Several different people in the sheet share one address.
2. The archive therefore cannot tell us how well per-IP rate limiting would have worked. **Unverified.**
3. Firebase Hosting also puts a CDN in front of the Function. Any rate limit must read the forwarded client address header, never the socket address. If it reads the socket address it will count the whole CDN as one Commenter and block everybody.

## 5. Each candidate defence

### 5.1 Honeypot field

**How it works.** The form carries a field that a person never sees. A bot that fills every input fills it too. The service drops any submission that has a value in it.

**Needs JavaScript?** No. Plain HTML and one CSS rule.

**Effectiveness.** Good against the naive form-filling bots that make up most of the traffic against a small site. Poor against a bot written for this one form. There is **no primary quantitative source** for how well honeypots work in 2026. Any percentage in a blog post is marketing. Treat the number as **unverified**. The nearest citable primary reference for the mechanism is the OWASP Automated Threats to Web Applications material.

**False-positive risk.** Low, but not zero, and this audience raises it. The archive is full of yahoo, aol and rr.com addresses, so many readers are older and lean on browser autofill. Chrome autofills a field named `url`, `website`, `phone`, `address` or `company` even when it is invisible. A honeypot with one of those names flags a real person.

**Therefore:**

- Give it a name that autofill does not recognise and that the real form does not use.
- Set `autocomplete="off"`, `tabindex="-1"` and `aria-hidden="true"`.
- Hide it with a CSS class in the stylesheet, not with an inline `display:none` on the input. A bot that parses inline styles skips an inline-hidden field.

**Cost.** Near zero. A few lines of markup and one server-side check.

### 5.2 Submission timing check

**The finding that matters: this does not work on this site as currently designed.**

The site is SvelteKit with `adapter-static`. Every page is built once and served from the Firebase Hosting CDN. There is no per-request render. Nothing can stamp "this form was shown at time T" into the HTML, because the HTML is the same for every reader and it is months old. With JavaScript off there is no client clock to read either.

Every no-JavaScript route puts a Function in the view path of the page, so each one changes the write-path design:

1. Render the form page from a Function, so the page is dynamic and can carry a signed timestamp. This gives up static hosting for that page, and the reader clicks through to it.
2. Embed the form as a first-party fragment served by a Function. Constraint 2 forbids a **third-party** iframe, so a first-party one is arguably admissible, but it is extra machinery for one weak signal.
3. Serve a small asset on the page from a Function, and let it set a timestamp cookie that the POST carries. This keeps the page static, but it puts a Function in the read path of every page view.

**Recommendation: drop the timing check.** It is the only item on the ticket's list that the static architecture rules out. Record this in the write-path ticket (#29), because it is a real discriminator between designs.

**A related note on tokens.** The same reasoning limits CSRF-style tokens. The most a static build can bake in is an HMAC over the page slug, computed at build time with a secret the Function also holds. That is worth doing. It costs nothing, it proves the submission came from a real built page for a real Park, and it blocks a blind POST to the endpoint with a made-up slug. It does **not** prove freshness, because the same token sits in the page for the life of the build.

### 5.3 Server-side validation

**How it works.** The Function rejects anything structurally wrong before it looks at content at all.

Checks that are safe against the archive:

- `Subject` must be one of the three enum values: comment, correction, reservation question.
- The Park slug must match a Park that exists in the build.
- Name is present, and shorter than about 100 characters.
- Email parses as an email address. The archive shows this is safe: every real row has a real-looking address.
- Body length between 1 and about 5000 characters. **Do not set a lower bound above 1 character.** Dave's whole Comment is "Hi".
- Reject a body that is pure HTML, or that contains a `<script>` tag. Note that Kevin's real 2015 Comment contains an `<a>` tag, so strip tags rather than reject on any tag.

**Needs JavaScript?** No. This is all server side.

**Effectiveness.** Moderate on its own. It stops the crudest scripted posts, which send junk field values. It stops nothing written for this form.

**False-positive risk.** None, if the length floor stays at 1 and email syntax checking stays loose.

**Cost.** Near zero. It is code the write path needs anyway.

### 5.4 Content heuristics

**Link count.** Measured above: no Commenter row in the archive carries two links. Flag at two or more. This costs one regular expression and touches zero archive rows.

**Keyword lists.** Dangerous here. The dominant real class is the Reservation inquiry, and its vocabulary is the vocabulary a generic spam list blocks. Use only a narrow list, aimed at classes this site never sees: pharmaceutical, casino and betting, SEO and backlink offers, crypto and forex. Even then, **flag, never delete.**

**All capitals, minimum length, body language, telephone-number detection.** All fail against named archive rows. See the table in 4.2. Do not use them.

**Needs JavaScript?** No.

**Cost.** Near zero.

### 5.5 Rate limiting

**What the archive says.** Real people double-post. Cassandra posted twice 60 seconds apart. Timbo twice 49 seconds apart. Ginny twice about 100 seconds apart. A limit of one post each minute for each address flags real people.

**Safe thresholds.** The real rate is about one Comment each month across the whole site. A ceiling of about five submissions each day for each client address, and about ten each day for each Park page, sits roughly 100 times above real behaviour and still caps a flood. Treat a breach as a reason to hold and tag, not to reject without trace. A bot that gets a clean 200 stops retrying; a bot that gets a 429 may retry from a new address.

**Needs JavaScript?** No.

**The state question, which the ticket asks explicitly.** Rate limiting is the only defence in this whole list that needs state. Everything else is a pure function of one request.

What it needs is a counter for each key, with a time to live. Concretely: one small record keyed by client address plus day, and one keyed by Park slug plus day, each expiring after 24 hours. Firebase Function instances do not share memory and scale to zero, so an in-process counter is useless. The counter must live in whatever store the write path picks.

The cost is tiny at this volume: a few reads and writes each day. If the write path picks Firestore, a document for each key with a TTL policy is trivial and effectively free. If the write path picks something with no cheap small-record store, **rate limiting is the item to drop.** It is the least valuable defence here, because the queue already blocks publication and because the archive cannot tell us it would have helped.

The client address must come from the forwarded header, not the socket. See 4.3.

### 5.6 The Moderation queue itself

The queue is already the strongest defence, and it is free. Nothing reaches a reader unapproved, and constraint 5 means even an Approved Comment needs a rebuild. Spam costs the owner attention, and costs the site's reputation nothing.

This reframes everything above. The other defences do not exist to keep spam off the site. They exist to keep the queue short enough that the owner keeps opening it.

## 6. Akismet and other server-side APIs

A server-side API is not a widget. The reader never loads it, never sees it, and it works with JavaScript off. It therefore passes constraint 2. It is still a third party, and section 6.4 says what that costs.

### 6.1 How the Akismet API works

Read 2026-09-15 from `akismet.com/developers/`.

- **Verify the key**: `POST https://rest.akismet.com/1.1/verify-key`, with `api_key` and `blog`. The `blog` value must be "a full URI, including http://". The response body is the literal string `valid` or `invalid`.
- **Check a Comment**: `POST https://rest.akismet.com/1.1/comment-check`. Required: `api_key`, `blog`, `user_ip`. Recommended: `user_agent`, `referrer` (note the spelling, it differs from the HTTP header), `permalink`, `comment_type`, `comment_author`, `comment_author_email`, `comment_author_url`, `comment_content`, `comment_date_gmt`, `blog_lang`, `blog_charset`, `honeypot_field_name`. The response body is the literal string `true` for spam or `false` for ham.
- `is_test` marks a test query so it does not train the filter. `user_role` set to `administrator` forces a ham result, which is how the owner's own Replies bypass the filter.
- `comment_type` accepts `comment` and `reply`, which maps cleanly onto the `Comment` and `Reply` distinction in `CONTEXT.md`.
- **Teach it**: `POST .../1.1/submit-spam` and `.../1.1/submit-ham`, with the same arguments. This matters. Every time the owner corrects a verdict in the Moderation queue, the queue should send it back. That is how the false-positive rate falls over time.
- **The discard header.** Quoting the comment-check page: "If the X-akismet-pro-tip header is set to discard, then Akismet has determined that the comment is blatant spam, and you can safely discard it without saving it in any spam queue." This is a documented auto-drop tier. Given section 4.2, use it cautiously: log that a discard happened, even if the body is thrown away, so a silent failure is visible.
- **Usage**: `https://rest.akismet.com/1.2/usage-limit` returns JSON with `limit`, `usage` and `throttled`.

### 6.2 Does a free key cover this site?

**Yes, on the current published terms, subject to one condition in 6.3.**

- The Personal plan is pay-what-you-want and **$0 is a selectable price**. The signup page slider config on `akismet.com/plan/personal` runs from a minimum of 0 to a maximum of 120 dollars a year.
- Eligibility is self-certified with three checkboxes, quoted exactly from that page: "I don't have ads on my site / I don't sell products/services on my site / I don't promote a business on my site."
- `akismet.com/support/getting-started/free-or-paid/` gives a fuller disqualifying list, quoted: "Loading code on your site for ad services like Google AdSense, Taboola, Infolinks, or ExoClick. Affiliate links. Using live chat plugins or services. Promoting a business or service. Using a domain recognized as commercial. Accepting donations or using donation plugins. Running on e-commerce plugins or platforms." The same page adds: "Noncompliance with these terms will result in immediate suspension of services without notice."
- **Call volume is not a problem.** `akismet.com/support/general/akismet-api-usage-limits/` states "Akismet Personal is a non-commercial plan with unlimited API calls per month." At one Comment a month this is not close to any limit.
- The Terms of Service at `akismet.com/tos/`, last updated 9 November 2021, say "Free keys are for personal, non-commercial sites only."
- **Per-second rate limits and any required attribution badge: unverified.** No page we read addressed either.

### 6.3 The condition the owner must check

The archive contains a 2016 exchange on Devil's Cove Park where a reader complained that a survey wall blocked the content, and the owner replied that the surveys "are meant to help support this free website."

That is monetisation. If anything of that kind still runs on `rochesterparks.org`, or returns later, the free Personal key does not apply, and the penalty is stated as immediate suspension without notice. **This is a condition, not a fact.** The owner must confirm the live site carries no ads, no affiliate links, no donation link and no survey wall before ticking those boxes.

If it fails, the fallbacks are CleanTalk at 12 dollars a year for one site, or reCAPTCHA Enterprise express from section 3.3. CleanTalk sits well inside the 25-dollar monthly ceiling, though it spends headroom the map reserved for other things. Express is not priced here (see section 8).

### 6.4 The privacy cost

Akismet's `comment-check` requires `user_ip` and wants `comment_author_email`. Sending those means the Commenter's address and email reach Automattic. That is admissible under constraint 3, which bars a hosted comment **product**, not a server API. But it is a fact about the site's handling of reader data, and it belongs in the notice that constraint 9 already puts beside every comment area.

Note the direction of travel here. Constraint 10 says the archive import must strip email and IP. It would be odd to strip them from the build and then ship them to a third party without saying so.

### 6.5 The alternatives, briefly

All read 2026-09-15.

| Service | Cost | Free for a personal site? | Fit |
| --- | --- | --- | --- |
| **CleanTalk**, `cleantalk.org/price` | 12 dollars a year for one site | **No.** The page says plainly: "Is it free? Short answer is no". | A clean server-side API with no free tier. The fallback if Akismet's terms stop fitting. |
| **OOPSpam**, `oopspam.com` | 40 free checks to start, then from 23 dollars a month | Trial only | Explicitly server side: "Runs silently — no JavaScript, fonts, or CSS needed". Too expensive for this volume. |
| **Stop Forum Spam**, `stopforumspam.com/usage` | Free, no key needed | Yes | IP, email and username reputation only, not content. Their page warns: "Checking every incoming connection against the API will be treated as a denial of service attack against us". At one Comment a month that is not a risk. A cheap supplement, not a replacement. |
| **Project Honey Pot http:BL**, `projecthoneypot.org/httpbl_api.php` | Free, needs a registered access key | Yes | DNS-based IP reputation. Same category and same limit as Stop Forum Spam. Remember 4.3: the address must come from the forwarded header, or this checks the CDN. |
| **Postmark SpamCheck**, `spamcheck.postmarkapp.com` | Free | Yes | Scores raw **email messages** through SpamAssassin. It is built for MIME, not for a comment body. Poor fit. |
| **Self-hosted** | Free | Yes | Antispam Bee is a WordPress plugin and cannot serve a SvelteKit site. No credible, maintained, general-purpose self-hostable equivalent was found in primary sources. Treat "a self-hosted Akismet equivalent exists" as **unverified**. |

**Conclusion: Akismet Personal is the right choice if it is ever needed.** It is the only option that is content-aware, free at this volume, documented, and reversible.

## 7. The minimum viable defence

The ticket asks for a minimum, given that the queue already blocks publication. Here it is, in two tiers.

### The governing principle

**Defences rank the queue. They do not delete from it.** Section 4.2 shows that every content heuristic strong enough to delete would delete a real Comment. There is exactly one safe delete: a honeypot hit, because no person fills a hidden field.

### Tier 1: build this on day one. Stateless, no JavaScript, no third party.

1. **Honeypot field**, named so browser autofill ignores it, hidden by a stylesheet class, with `autocomplete="off"`, `tabindex="-1"` and `aria-hidden="true"`. A hit is the one safe silent drop. Return the normal success page so the bot learns nothing.
2. **Strict server-side validation**: `Subject` in the enum, Park slug exists in the build, name present and capped, email parses, body between 1 and about 5000 characters, HTML stripped rather than rejected.
3. **A build-time HMAC of the Park slug**, carried as a hidden field, verified by the Function. It blocks blind POSTs to the endpoint. It does not prove freshness.
4. **A link-count flag at two or more links.** This tags the row in the queue. It never rejects. It touches zero archive rows.

That set costs nothing to run, costs the Commenter nothing, adds no third party, and needs no JavaScript and no state. It is the honest minimum.

### Tier 2: add when, and only when, the queue proves noisy

5. **Akismet as a sort key.** Run every submission through `comment-check`. Store the verdict on the row. The Moderation queue then shows clean Comments first and suspected spam in a second list the owner can skim or ignore. Nothing is deleted on Akismet's word alone, because the archive shows what a wrong verdict costs: a Reservation inquiry with a telephone number in the body is both the most common real Comment and the most spam-shaped one.
6. **Per-address and per-page daily rate limits**, at about five and about ten, but only if the storage the write path picks makes a TTL counter cheap. Otherwise drop it.

### The single fact that moves the line

**The spam arrival rate.** It is currently **unverified**, and it cannot be recovered from the archive, because the archive shows only what WordPress and Akismet let through (see 4.1).

The decision rule is therefore empirical, not architectural. Ship Tier 1. Watch the queue for a month. The real signal is about one Comment each month, so the owner will know inside days whether Tier 1 holds. If the queue stays readable, stop. If it does not, add Akismet, which is a server-side call the Function makes and needs no change to the form, the page or the reader's browser.

This ordering is deliberate. Akismet is admissible but it is not free of cost: it sends the Commenter's address and email to a third party, and that belongs in the privacy notice the page already carries under constraint 9. Do not pay that cost before the queue proves it is needed.

### What is explicitly not recommended

- **Any widget CAPTCHA.** Section 3.
- **The submission timing check.** Section 5.2. The static build cannot support it without a design change.
- **Keyword lists, all-capitals checks, minimum body length, country filters, duplicate detection.** Section 4.2 names the real Comments each one would eat.

## 8. What stays unverified

State these as open, not as settled.

1. **The spam arrival rate for this site.** Not recoverable from the archive, because WordPress ran Akismet and the export shows survivors. This is the fact that decides between Tier 1 and Tier 1 plus Akismet.
2. **How well honeypots work in 2026.** No primary quantitative source exists. Every number circulating is vendor marketing. The mechanism is sound; the effectiveness figure is not knowable from a trustworthy source.
3. **Whether `rochesterparks.org` today carries ads, affiliate links, donations or a survey wall.** The 2016 archive exchange shows it once did. This decides whether the free Akismet key is legitimate. The owner must check the live site.
4. **Akismet per-second rate limits and any attribution badge requirement.** Not addressed on any page we read.
5. **The cost of reCAPTCHA Enterprise express at this volume.** Not priced here.
6. **How well per-IP rate limiting would have performed historically.** Unknowable, because the archive logged Cloudflare edge addresses, not Commenter addresses (4.3).

## 9. What this hands to other tickets

- **Write path (#29).** The timing check is off the table unless the form page becomes dynamic. Rate limiting needs a small keyed record with a 24-hour TTL, and it is the one defence to drop if the chosen storage makes that awkward. The Function must read the forwarded client address header, never the socket address.
- **Moderation surface.** The queue needs a place to show a tag ("2 or more links", "Akismet: spam") and a sort order, not just a list. It also needs a control that calls `submit-spam` or `submit-ham` when the owner corrects a verdict.
- **The page notice (constraint 9).** If Akismet is ever switched on, the notice must say that submissions are checked by a third-party service that receives the submitter's address and email.
- **Archive import (#26 and #27).** Nothing here changes it. Archive comments do not pass through any spam check.
