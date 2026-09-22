<script lang="ts">
  /**
   * PROTOTYPE (comment area, wayfinder #28): three views of the comment
   * area on a Park page, switched by the URL hash with :target, because the
   * site ships no client JavaScript. Seeded with real Archive comments from
   * the WordPress export, emails and IPs stripped. The form posts nowhere:
   * `method="get" action="#sent-x"` reloads the same page with the fields in
   * the query string and the hash that shows the after-submit state. A real
   * form is a POST, so the email never reaches the URL bar.
   *
   * Throwaway. Lives on the prototype/comment-area branch only.
   */
  import type { Page } from '#lib/types.js';

  let { page }: { page: Page } = $props();

  const VIEWS = [
    { key: 'a', name: 'Ledger' },
    { key: 'b', name: 'Ask first' },
    { key: 'c', name: 'Correspondence' },
  ];
  const dev = import.meta.env.DEV;

  interface Seed {
    author: string;
    /** The site owner. The archive has the owner under two author strings. */
    owner?: boolean;
    /** ISO date, local. */
    date: string;
    /** One paragraph of HTML. Owner replies carry the links they had. */
    html: string;
    replies?: Seed[];
  }

  /** Where a reader books this park's lodge, per page. Hardcoded here; the
   * spec has not said where the notice's link comes from. */
  const RESERVE: Record<string, { name: string; url: string }> = {
    '/town-parks/riga-parks/sanford-road-park/': {
      name: 'the Town of Riga',
      url: 'https://www.townofriga.com/town-clerk/maher-lodge/',
    },
    '/town-parks/pittsford-parks/griffith-park/': {
      name: 'the Town of Pittsford',
      url: 'https://www.townofpittsfordny.gov/parks-and-trails',
    },
  };

  const riga = 'https://www.townofriga.com/town-clerk/maher-lodge/';
  const SEEDS: Record<string, Seed[]> = {
    '/town-parks/riga-parks/sanford-road-park/': [
      {
        author: 'Barbara Blanchard',
        date: '2015-06-14',
        html: 'How do I go about reserving the lodge on July 3 or check the availability?',
        replies: [
          {
            author: 'Mark',
            owner: true,
            date: '2015-06-18',
            html: `Hey Barbara check this link out: <a href="${riga}">townofriga.org/town-clerk/maher-lodge/</a>`,
          },
        ],
      },
      {
        author: 'Wendy Didas',
        date: '2015-07-13',
        html: "I'm looking to reserve the Maher Lodge in late February or early March on a Friday evening for a bridal shower... Can we use the fireplace? I'm a non-resident, how soon can I reserve it?",
        replies: [
          {
            author: 'Mark',
            owner: true,
            date: '2015-07-13',
            html: `Hi Wendy, check this link out: <a href="${riga}">townofriga.org/town-clerk/maher-lodge/</a>`,
          },
        ],
      },
      {
        author: 'Nicole',
        date: '2015-11-01',
        html: "I'm looking to rent this lodge but the website page does not work. Is there a number I can call?",
        replies: [
          {
            author: 'Mark',
            owner: true,
            date: '2016-02-15',
            html: `Nicole make sure you're clicking on this link: <a href="${riga}">townofriga.org/town-clerk/maher-lodge/</a> If you're having trouble, try calling the Town hall at 585-293-3880`,
          },
        ],
      },
      {
        author: 'Susan Simmons',
        date: '2018-04-14',
        html: 'Is the lodge on Sanford Road available to rent 12/31 2018? what is the cost?',
      },
      {
        author: 'Jessie DiNitto',
        date: '2024-11-29',
        html: 'I am a non resident but very interested in seeing inside of Maher Lodge and reserving it for 2025 Thanksgiving day. what are the charges',
      },
    ],
    '/town-parks/pittsford-parks/griffith-park/': [
      {
        author: 'Susan Bridges',
        date: '2018-01-03',
        html: "I grew up in 362 Marsh Rd, the house immediately next to the road that leads into Griffith Park. When my family moved there in 1960, there was a pump station that pumped water from a well that supplied much of the water then used in Pittsford. Surrounding the pump station was an area intentionally left undeveloped as a 'watershed'. Looking at your pictures of Griffith Park and the Google map, I think that the concrete pad shown in Google is probably where the pump station was. The road running off of Marsh Rd to the pad used to be a gravel-on-dirt-base road that was used by town trucks to service the well. Back in the 1960s, that 'road' then turned into a rutted dirt track that led to the housing subdivision behind the park. The two trails that you speak of appear to be in the same locations as two rutted dirt roads used to access the watershed. There used to be a very large oak tree that the neighborhood kids used as a hangout just off the junction of the pump road and the road that branched off into the watershed. I think that the park may be named Griffith Park because all of the land in the area along both sides of Marsh Rd up to the Pittsford-Palmyra road and down to the cemetery belonged to a family that was named Griffith during that mid-20th century period.",
      },
      {
        author: 'Robin Brennan (Burns)',
        date: '2019-10-03',
        html: 'I grew up living at 409 Marsh Road. The property was Griffith Farms....a large horse farm. The farm is where the church is now. I rode my horse all over the property. Susan.....my sister Barb and I remember you and your sister Laurie. I remember swimming in your pool!',
      },
      {
        author: 'Henry Gould Griffith',
        date: '2020-02-13',
        html: "The Pumping station from the 1930's on was leased to the Town by my grandfather, Frederick A. Griffith who owned the horse farm where the Church now resides. After he passed away in 1978 the property was sold and cleared of the House, Barn and indoor riding track for the Church. My Grandfather was from Palmyra, the older son of Senator Frederick Winter Griffith and Mary Adams of Phelps and Palmyra respectfully.",
        replies: [
          {
            author: 'Greg Geer',
            date: '2022-08-26',
            html: "Dear Mr. Griffith: My mother's maiden name was Beverly Ann (Griffith) Geer. I am wondering if you have any genealogical records. This branch of my family is murky. My grandfather was George F. Griffith of Scottsville, NY. Sincerely, Gregory C. Geer, Ph.D.",
          },
        ],
      },
      {
        author: 'Justin',
        date: '2020-05-01',
        html: 'I just moved in to the area, and this park is dog friendly (provided you bring a poo bag) It would also serve as a nice open field for kids to play: tag, soccer, kick ball, football, etc. Good place for a picnic on a blanket, assuming the grass is dry. Just a decent place to relax and pass a little time. A park does not have to be big or "fully loaded" in order to be worthwhile. So, in terms of why anyone would or should come here, I hope I gave a reasonable answer. As someone who enjoys nice wooded areas to walk... I believe the park\'s existence is worth defending on those grounds.',
      },
    ],
  };

  const comments = $derived(SEEDS[page.url] ?? []);
  const reserve = $derived(RESERVE[page.url]);
  const count = $derived(
    comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0)
  );

  const noon = (iso: string) => new Date(`${iso}T12:00:00`);
  /** "January 3, 2018" */
  const longDate = (iso: string) =>
    noon(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  /** "2018-01-03", the data face. */
  const isoDate = (iso: string) => iso;
  /** "January 2018" */
  const monthYear = (iso: string) =>
    noon(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const year = (iso: string) => iso.slice(0, 4);
  /** Comments grouped by year, newest year first, for the view that uses it. */
  const byYear = $derived.by(() => {
    const groups = new Map<string, Seed[]>();
    for (const c of comments) {
      const y = year(c.date);
      groups.set(y, [...(groups.get(y) ?? []), c]);
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  });
  const uid = $props.id();
</script>

{#if comments.length}
  <div class="proto">
    <span id="view-a" class="target"></span>
    <span id="view-b" class="target"></span>
    <span id="view-c" class="target"></span>
    <span id="sent-a" class="target"></span>
    <span id="sent-b" class="target"></span>
    <span id="sent-c" class="target"></span>

    <!-- VIEW A, Ledger. Comments first, form last. The notice is a banner
         above the whole area. An owner reply is indented under an orange
         rule and signed as the site, not a person. Age is the plain ISO date
         plus an "old site" mark on every Archive comment. Subject radios head
         the form. After submit: a banner at the top, the list stays. -->
    <section class="view view--a area-a" aria-labelledby="comments-a-{uid}">
      <p class="sent sent-a">
        <strong>Thanks.</strong> Your comment is in the queue. It shows here
        once it has been read.
      </p>
      <div class="head-a">
        <h2 id="comments-a-{uid}">Comments</h2>
        <span class="eyebrow mono">{count} so far</span>
      </div>
      <p class="note notice-a">
        This site is not the parks department. It cannot book anything. To
        rent the lodge or a shelter, go to
        <a href={reserve.url} rel="noopener">{reserve.name}</a>.
      </p>
      <ol class="ledger">
        {#each comments as c (c.date + c.author)}
          <li class="entry-a">
            <p class="meta-a">
              <span class="who">{c.author}</span>
              <time class="mono" datetime={c.date}>{isoDate(c.date)}</time>
              <span class="eyebrow">From the old site</span>
            </p>
            <p class="text">{@html c.html}</p>
            {#each c.replies ?? [] as r (r.date + r.author)}
              <div class="reply-a" class:reply-a--owner={r.owner}>
                <p class="meta-a">
                  <span class="who">{r.owner ? 'Rochester Parks' : r.author}</span
                  >
                  {#if r.owner}<span class="eyebrow eyebrow--accent"
                      >Reply from this site</span
                    >{:else}<span class="eyebrow">Reply</span>{/if}
                  <time class="mono" datetime={r.date}>{isoDate(r.date)}</time>
                </p>
                <p class="text">{@html r.html}</p>
              </div>
            {/each}
          </li>
        {/each}
      </ol>
      <form class="form form-a" method="get" action="#sent-a">
        <h3>Leave a comment</h3>
        <fieldset class="subjects subjects--tiles">
          <legend class="eyebrow">What is this about?</legend>
          <label
            ><input type="radio" name="subject" value="comment" checked /> A comment</label
          >
          <label
            ><input type="radio" name="subject" value="correction" /> A correction</label
          >
          <label
            ><input type="radio" name="subject" value="reservation" /> A reservation
            question</label
          >
        </fieldset>
        <div class="field">
          <label for="name-a-{uid}">Name</label>
          <input id="name-a-{uid}" name="name" autocomplete="name" required />
        </div>
        <div class="field">
          <label for="email-a-{uid}">Email</label>
          <input
            id="email-a-{uid}"
            name="email"
            type="email"
            autocomplete="email"
            aria-describedby="email-hint-a-{uid}"
            required
          />
          <span id="email-hint-a-{uid}" class="hint">Never published.</span>
        </div>
        <div class="field">
          <label for="body-a-{uid}">Comment</label>
          <textarea id="body-a-{uid}" name="body" rows="5" required></textarea>
        </div>
        <label class="visually-hidden"
          >Leave this empty <input name="website" tabindex="-1" autocomplete="off"
          /></label
        >
        <button class="button button--primary" type="submit">Send comment</button
        >
      </form>
    </section>

    <!-- VIEW B, Ask first. The form comes first, the comments after it as
         question-and-answer pairs. The Subject radios are the first control;
         the notice lives beside the reservation option and opens in full only
         when that option is picked (:has, no script). An owner answer takes a
         badge and a sunk background, no indent. Age: comments grouped under
         year headings, newest year first. After submit: the form gives way to
         a confirmation, the comments stay. -->
    <section class="view view--b area-b" aria-labelledby="comments-b-{uid}">
      <h2 id="comments-b-{uid}">Ask or tell us something</h2>
      <p class="sent sent-b panel">
        <span class="panel__head eyebrow">Sent</span>
        <span class="panel__body"
          >Thanks. Comments are read by one person, so it can take a few days
          to show up here.</span
        >
      </p>
      <form class="form form-b" method="get" action="#sent-b">
        <fieldset class="subjects">
          <legend class="eyebrow">What is this about?</legend>
          <label
            ><input type="radio" name="subject" value="comment" checked /> A comment</label
          >
          <label
            ><input type="radio" name="subject" value="correction" /> A correction</label
          >
          <label
            ><input type="radio" name="subject" value="reservation" /> A reservation
            question <span class="hint">· this site cannot book it</span></label
          >
        </fieldset>
        <p class="note notice-b">
          This site is not the parks department, and nobody here can take a
          booking. Rentals for {page.title} go through
          <a href={reserve.url} rel="noopener">{reserve.name}</a>. Your
          question is still welcome; it will be answered here.
        </p>
        <div class="field">
          <label for="body-b-{uid}">Your comment or question</label>
          <textarea id="body-b-{uid}" name="body" rows="5" required></textarea>
        </div>
        <div class="pair">
          <div class="field">
            <label for="name-b-{uid}">Name</label>
            <input id="name-b-{uid}" name="name" autocomplete="name" required />
          </div>
          <div class="field">
            <label for="email-b-{uid}">Email <span class="hint">never published</span></label>
            <input
              id="email-b-{uid}"
              name="email"
              type="email"
              autocomplete="email"
              required
            />
          </div>
        </div>
        <label class="visually-hidden"
          >Leave this empty <input name="website" tabindex="-1" autocomplete="off"
          /></label
        >
        <button class="button button--primary" type="submit">Send</button>
      </form>

      {#each byYear as [y, group] (y)}
        <h3 class="year-b"><span class="eyebrow">{y}</span></h3>
        {#each group as c (c.date + c.author)}
          <div class="qa">
            <div class="q">
              <p class="meta-b">
                <span class="who">{c.author}</span>
                <time datetime={c.date}>{longDate(c.date)}</time>
              </p>
              <p class="text">{@html c.html}</p>
            </div>
            {#each c.replies ?? [] as r (r.date + r.author)}
              <div class="a" class:a--owner={r.owner}>
                <p class="meta-b">
                  {#if r.owner}<span class="badge">Owner</span>{/if}
                  <span class="who">{r.author}</span>
                  <time datetime={r.date}>{longDate(r.date)}</time>
                </p>
                <p class="text">{@html r.html}</p>
              </div>
            {/each}
          </div>
        {/each}
      {/each}
    </section>

    <!-- VIEW C, Correspondence. Comments read as letters, the date in the
         margin as a month and year only, no archive mark at all. An owner
         reply follows in line, no indent or badge: the signature names the
         person who runs the site. The form is closed inside a disclosure
         until the reader opens it; the notice is the first thing inside,
         above the fields. Subject is a select at the bottom, above the
         button. After submit: the whole area is replaced by a thank-you,
         standing in for a thank-you page. -->
    <section class="view view--c area-c" aria-labelledby="comments-c-{uid}">
      <div class="sent sent-c">
        <h2>Thank you</h2>
        <p>
          Your note about {page.title} has reached the one person who reads
          them. If it is a question, the answer will appear under it on this
          page.
        </p>
        <a class="button button--ghost" href={page.url}>Back to {page.title}</a>
      </div>
      <div class="letters">
        <h2 id="comments-c-{uid}" class="head-c">
          Letters about {page.title}
        </h2>
        {#each comments as c (c.date + c.author)}
          <article class="letter">
            <p class="margin-c">
              <time datetime={c.date}>{monthYear(c.date)}</time>
            </p>
            <div class="letter__body">
              <p class="text">{@html c.html}</p>
              <p class="sign">— {c.author}</p>
              {#each c.replies ?? [] as r (r.date + r.author)}
                <div class="reply-c" class:reply-c--owner={r.owner}>
                  <p class="margin-c margin-c--reply">
                    <time datetime={r.date}>{monthYear(r.date)}</time>
                  </p>
                  <p class="text">{@html r.html}</p>
                  <p class="sign">
                    — {#if r.owner}<span class="owner-c">Mark</span>, who runs
                      this site{:else}{r.author}{/if}
                  </p>
                </div>
              {/each}
            </div>
          </article>
        {/each}
        <details class="write">
          <summary class="button">Write to us</summary>
          <form class="form form-c" method="get" action="#sent-c">
            <p class="notice-c">
              <span class="eyebrow eyebrow--accent">Before you write</span>
              This site is not the parks department. To rent the lodge, go to
              <a href={reserve.url} rel="noopener">{reserve.name}</a>. Anything
              else, write below.
            </p>
            <div class="field">
              <label for="name-c-{uid}">Name</label>
              <input id="name-c-{uid}" name="name" autocomplete="name" required />
            </div>
            <div class="field">
              <label for="email-c-{uid}">Email</label>
              <input
                id="email-c-{uid}"
                name="email"
                type="email"
                autocomplete="email"
                aria-describedby="email-hint-c-{uid}"
                required
              />
              <span id="email-hint-c-{uid}" class="hint"
                >Only so we can reply. Never published.</span
              >
            </div>
            <div class="field">
              <label for="body-c-{uid}">Your letter</label>
              <textarea id="body-c-{uid}" name="body" rows="6" required
              ></textarea>
            </div>
            <div class="field">
              <label for="subject-c-{uid}">This is</label>
              <select id="subject-c-{uid}" name="subject">
                <option value="comment">a comment</option>
                <option value="correction">a correction</option>
                <option value="reservation">a reservation question</option>
              </select>
            </div>
            <label class="visually-hidden"
              >Leave this empty <input
                name="website"
                tabindex="-1"
                autocomplete="off"
              /></label
            >
            <button class="button button--primary" type="submit">Send</button>
          </form>
        </details>
      </div>
    </section>

    {#if dev}
      <!-- Not part of the design: flips between the views. Dev only. -->
      <nav class="switcher" aria-label="Prototype views">
        {#each VIEWS as v (v.key)}
          <a href="#view-{v.key}" class="switcher__{v.key}"
            >{v.key.toUpperCase()} · {v.name}</a
          >
        {/each}
      </nav>
    {/if}
  </div>
{/if}

<style>
  /* SHARED */

  .proto {
    container: comments / inline-size;
    max-width: var(--measure);
    margin-top: var(--space-48);
  }

  /* The hash picks the view. No hash, or any other, shows A. A "sent"
     hash shows its view in the after-submit state. */
  .target {
    display: block;
    scroll-margin-top: var(--space-16);
  }

  .view {
    display: none;
  }

  .proto:not(:has(.target:target)) .view--a,
  .proto:has(#view-a:target, #sent-a:target) .view--a,
  .proto:has(#view-b:target, #sent-b:target) .view--b,
  .proto:has(#view-c:target, #sent-c:target) .view--c {
    display: block;
  }

  .sent {
    display: none;
  }

  .proto:has(#sent-a:target) .sent-a,
  .proto:has(#sent-b:target) .sent-b,
  .proto:has(#sent-c:target) .sent-c {
    display: block;
  }

  /* Comment text sits outside .prose, so its links state the same three
     properties themselves. */
  .text :global(a) {
    color: var(--orange-ink);
    text-decoration: underline;
    text-underline-offset: var(--underline-offset-prose);
  }

  .text {
    margin: 0;
    color: var(--ink-soft);
  }

  .who {
    font-weight: var(--weight-bold);
  }

  /* Form controls, one column, labels above. */
  .form {
    display: grid;
    gap: var(--space-16);
  }

  .form h3 {
    margin: 0;
  }

  .field {
    display: grid;
    gap: var(--space-4);
  }

  .field label {
    font-weight: var(--weight-bold);
  }

  .hint {
    font-family: var(--mono);
    font-size: var(--step--2);
    letter-spacing: var(--tracking-snug);
    color: var(--ink-muted);
  }

  input:not([type='radio']),
  textarea,
  select {
    width: 100%;
    min-height: var(--control-height);
    padding: var(--space-10) var(--space-12);
    border: var(--line-hair) solid var(--rule-strong);
    background: var(--card);
    color: var(--ink);
    font: inherit;
  }

  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: var(--line-heavy) solid var(--orange);
    outline-offset: var(--focus-offset);
  }

  /* An error shows only after the reader has been in the field. */
  input:user-invalid,
  textarea:user-invalid {
    border-color: var(--orange-ink);
    border-width: var(--line-heavy);
  }

  input[type='radio'] {
    accent-color: var(--orange);
    width: 1.25rem;
    height: 1.25rem;
    margin: 0;
  }

  .subjects {
    display: grid;
    gap: var(--space-8);
    margin: 0;
    padding: 0;
    border: 0;
  }

  .subjects legend {
    margin-bottom: var(--space-8);
    padding: 0;
  }

  .subjects label {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    min-height: var(--tap-target);
  }

  .button {
    justify-self: start;
    cursor: pointer;
    font-family: inherit;
  }

  /* Not part of the design: the dev-only switcher. */
  .switcher {
    position: fixed;
    bottom: var(--space-16);
    left: 50%;
    translate: -50% 0;
    z-index: 10;
    display: flex;
    gap: 2px;
    padding: 4px;
    border-radius: 999px;
    background: #111;
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.35);
    font: 700 12px/1 system-ui, sans-serif;
  }

  .switcher a {
    padding: 8px 12px;
    border-radius: 999px;
    color: #ddd;
    white-space: nowrap;
  }

  .proto:not(:has(.target:target)) .switcher__a,
  .proto:has(#view-a:target, #sent-a:target) .switcher__a,
  .proto:has(#view-b:target, #sent-b:target) .switcher__b,
  .proto:has(#view-c:target, #sent-c:target) .switcher__c {
    background: #fff;
    color: #111;
  }

  /* VIEW A */

  .head-a {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-16);
    padding-bottom: var(--space-12);
    border-bottom: var(--line-heavy) solid var(--ink);
  }

  .notice-a {
    margin: var(--space-16) 0 0;
  }

  .notice-a a {
    font-weight: var(--weight-bold);
    text-decoration: underline;
    text-underline-offset: var(--underline-offset-prose);
  }

  .ledger {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entry-a {
    padding: var(--space-20) 0;
    border-bottom: var(--line-hair) solid var(--rule);
  }

  .meta-a {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-4) var(--space-12);
    margin: 0 0 var(--space-6);
  }

  .meta-a time {
    font-size: var(--step--1);
    color: var(--ink-muted);
  }

  /* A reply steps in under its comment. The owner's carries the orange
     rule; a reader's, the plain one. */
  .reply-a {
    margin: var(--space-16) 0 0 var(--space-16);
    padding-left: var(--space-16);
    border-left: var(--line-quote) solid var(--rule-strong);
  }

  .reply-a--owner {
    border-left-color: var(--orange);
  }

  .form-a {
    padding-top: var(--space-32);
  }

  .sent-a {
    margin: 0 0 var(--space-24);
    padding: var(--space-16);
    border: var(--line-hair) solid var(--ink);
    background: var(--card);
  }

  /* VIEW B */

  .area-b h2 {
    margin-bottom: var(--space-16);
  }

  /* The notice opens only once the reservation option is picked. */
  .notice-b {
    display: none;
    margin: 0;
  }

  .form-b:has(input[value='reservation']:checked) .notice-b {
    display: block;
  }

  .notice-b a {
    font-weight: var(--weight-bold);
    text-decoration: underline;
    text-underline-offset: var(--underline-offset-prose);
  }

  .pair {
    display: grid;
    gap: var(--space-16);
  }

  @container comments (inline-size >= 32rem) {
    .pair {
      grid-template-columns: 1fr 1fr;
    }
  }

  /* After submit the form gives way to the confirmation. */
  .proto:has(#sent-b:target) .form-b {
    display: none;
  }

  .sent-b {
    margin: 0 0 var(--space-24);
    padding: 0;
  }

  .sent-b .panel__head,
  .sent-b .panel__body {
    display: block;
  }

  .year-b {
    margin: var(--space-40) 0 var(--space-12);
    padding-bottom: var(--space-6);
    border-bottom: var(--line-hair) solid var(--rule-strong);
  }

  .qa {
    display: grid;
    gap: var(--space-8);
    margin-bottom: var(--space-24);
  }

  .q,
  .a {
    padding: var(--space-14) var(--space-16);
    border: var(--line-hair) solid var(--rule);
    background: var(--card);
  }

  .a--owner {
    background: var(--paper-sunk);
    border-color: var(--ink);
  }

  .meta-b {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4) var(--space-10);
    margin: 0 0 var(--space-6);
  }

  .meta-b time {
    font-size: var(--step--1);
    color: var(--ink-muted);
  }

  .badge {
    padding: 0 var(--space-8);
    background: var(--ink);
    color: var(--paper);
    font-family: var(--mono);
    font-size: var(--step--2);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
  }

  /* VIEW C */

  .head-c {
    margin-bottom: var(--space-24);
  }

  .letter {
    display: grid;
    gap: var(--space-4);
    padding: var(--space-20) 0;
    border-top: var(--line-hair) solid var(--rule);
  }

  .margin-c {
    margin: 0;
    font-family: var(--mono);
    font-size: var(--step--2);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--ink-muted);
  }

  .sign {
    margin: var(--space-8) 0 0;
    font-weight: var(--weight-bold);
  }

  /* An owner reply reads on, in line; only its signature says who. */
  .reply-c {
    margin-top: var(--space-16);
    padding-top: var(--space-12);
    border-top: var(--line-hair) dashed var(--rule-strong);
  }

  .owner-c {
    color: var(--orange-ink);
  }

  .margin-c--reply {
    margin-bottom: var(--space-4);
  }

  /* Wide: the date moves into a margin column beside the letter. */
  @container comments (inline-size >= 40rem) {
    .letter {
      grid-template-columns: 9em minmax(0, 1fr);
      gap: var(--space-16);
    }

    .letter__body {
      min-width: 0;
    }

    /* The reply is inside the body column, not a grid item of the letter,
       so subgrid cannot reach it. It draws the same two columns itself and
       pulls left by the margin column, so its date lines up with the
       letter's. */
    .reply-c {
      display: grid;
      grid-template-columns: 9em minmax(0, 1fr);
      column-gap: var(--space-16);
      margin-left: calc(-9em - var(--space-16));
    }

    .reply-c .margin-c--reply {
      grid-column: 1;
    }

    .reply-c .text,
    .reply-c .sign {
      grid-column: 2;
    }
  }

  .write {
    margin-top: var(--space-24);
    border-top: var(--line-hair) solid var(--rule);
    padding-top: var(--space-24);
  }

  .write summary {
    list-style: none;
    cursor: pointer;
  }

  .write summary::-webkit-details-marker {
    display: none;
  }

  .write[open] summary {
    background: var(--ink);
    color: var(--paper);
  }

  .form-c {
    margin-top: var(--space-24);
  }

  .notice-c {
    display: grid;
    gap: var(--space-4);
    margin: 0;
    padding: var(--space-16);
    border-left: var(--line-accent) solid var(--orange);
    background: var(--paper-sunk);
  }

  .notice-c a {
    font-weight: var(--weight-bold);
    text-decoration: underline;
    text-underline-offset: var(--underline-offset-prose);
  }

  /* After submit the whole area is the thank-you. */
  .proto:has(#sent-c:target) .letters {
    display: none;
  }

  .sent-c {
    padding: var(--space-24);
    border: var(--line-hair) solid var(--ink);
    background: var(--card);
  }

  .sent-c h2 {
    margin-bottom: var(--space-12);
  }

  .sent-c p {
    max-width: var(--measure);
  }
</style>
