<script lang="ts">
  import type { CommentArea, PageComment } from '#lib/types.js';

  /**
   * The comment area at the end of a Park page, a Trail page or a Blog post:
   * view A, "Ledger", from the prototype (#28). Plain HTML with no client
   * JavaScript and no third-party script, iframe or widget.
   */
  let { area }: { area: CommentArea } = $props();

  const count = $derived(
    area.comments.reduce((n, comment) => n + 1 + comment.replies.length, 0)
  );
  const uid = $props.id();
</script>

{#snippet signed(comment: PageComment, reply: boolean)}
  <p class="meta">
    <span class="who">{comment.owner ? 'Rochester Parks' : comment.name}</span>
    {#if reply && !comment.owner}<span class="eyebrow">Reply</span>{/if}
    <time class="mono" datetime={comment.created}>{comment.created}</time>
  </p>
  <p class="text">{comment.body}</p>
{/snippet}

<section class="comments" aria-labelledby="comments-{uid}">
  <!-- The Function sends the reader back to this page with #comment-sent.
       :target shows the banner; nothing else does, and no script runs. -->
  <p id="comment-sent" class="sent" role="status">
    <strong>Thanks.</strong> Your comment is in the queue. It shows here once it
    has been read.
  </p>

  <div class="head">
    <h2 id="comments-{uid}">Comments</h2>
    {#if count > 0}<span class="eyebrow mono">{count} so far</span>{/if}
  </div>

  <!-- The notice sits above the Comments so a reader sees it before a
       Reservation inquiry, and it stays on a closed page (#212). -->
  <p class="note notice">
    This site is not the parks department. It cannot book anything.
    {#if area.reservations}
      To rent a lodge or a shelter, go to
      <a href={area.reservations.url} rel="noopener">{area.reservations.name}</a
      >.
    {:else}
      Each park's page names who takes its bookings. Start at
      <a href="/all-parks-in-rochester-ny/">All Parks in Rochester NY</a>.
    {/if}
  </p>

  {#if area.comments.length}
    <ol class="ledger">
      {#each area.comments as comment (comment.id)}
        <li class="entry">
          <div class="own" class:own--owner={comment.owner}>
            {@render signed(comment, false)}
          </div>
          {#each comment.replies as reply (reply.id)}
            <div class="reply" class:reply--owner={reply.owner}>
              {@render signed(reply, true)}
            </div>
          {/each}
        </li>
      {/each}
    </ol>
  {/if}

  {#if area.open}
    <!-- A plain form that works with JavaScript off. The browser checks the
         required fields; :user-invalid marks one only after the reader has
         been in it. The Function checks everything again. -->
    <form class="form" method="post" action="/comment">
      <h3>Leave a comment</h3>
      <fieldset class="subjects">
        <legend class="eyebrow">What is this about?</legend>
        <label
          ><input type="radio" name="subject" value="comment" checked /> A comment</label
        >
        <label
          ><input type="radio" name="subject" value="correction" /> A correction</label
        >
        <label
          ><input type="radio" name="subject" value="reservation-question" /> A reservation
          question</label
        >
      </fieldset>
      <div class="field">
        <label for="name-{uid}">Name</label>
        <input
          id="name-{uid}"
          name="name"
          autocomplete="name"
          maxlength="100"
          required
        />
        <span class="error">Enter your name.</span>
      </div>
      <div class="field">
        <label for="email-{uid}">Email</label>
        <input
          id="email-{uid}"
          name="email"
          type="email"
          autocomplete="email"
          aria-describedby="email-hint-{uid}"
          required
        />
        <span class="error">Enter an email address, like name@example.com.</span
        >
        <span id="email-hint-{uid}" class="hint"
          >Never shown. Only the site owner sees it. Ask and your Comment is
          removed.</span
        >
      </div>
      <div class="field">
        <label for="body-{uid}">Comment</label>
        <textarea id="body-{uid}" name="body" rows="5" maxlength="5000" required
        ></textarea>
        <span class="error">Write your comment.</span>
      </div>
      <!-- The honeypot. A person never sees or reaches it; a bot that fills
           every field fills it too. Named so Chrome does not autofill it.
           Clipped by a class, not display: none, which spam bots skip (#255). -->
      <div class="visually-hidden" aria-hidden="true">
        <label
          >Leave this blank <input
            name="leave_blank"
            autocomplete="off"
            tabindex="-1"
          /></label
        >
      </div>
      <input type="hidden" name="page" value={area.page} />
      <input type="hidden" name="token" value={area.token} />
      <button class="button button--primary" type="submit">Send comment</button>
    </form>
  {:else}
    <p class="closed">Comments are closed on this page.</p>
  {/if}
</section>

<style>
  .comments {
    max-inline-size: var(--measure);
    margin-block-start: var(--space-48);
  }

  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-4) var(--space-16);
    padding-block-end: var(--space-12);
    border-block-end: var(--line-heavy) solid var(--ink);
  }

  .notice {
    margin-block: var(--space-16) 0;
  }

  /* The area sits outside .prose, so its links state the prose link rule
     themselves. */
  .comments a {
    font-weight: var(--weight-bold);
    text-decoration: underline;
    text-underline-offset: var(--underline-offset-prose);
  }

  .ledger {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entry {
    padding-block: var(--space-20);
    border-block-end: var(--line-hair) solid var(--rule);
  }

  /* An owner top-level Comment is not indented: its text lines up with the
     other Comments, and the orange rule hangs in the margin to its left.
     The rule and the signature are its only mark. */
  .own--owner {
    position: relative;
  }

  /* The rule runs beside the Comment's own words only, not its Replies. */
  .own--owner::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline-start: calc(-1 * (var(--space-16) + var(--line-quote)));
    inline-size: var(--line-quote);
    background: var(--orange);
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-4) var(--space-12);
    margin-block: 0 var(--space-6);
  }

  .who {
    font-weight: var(--weight-bold);
  }

  .meta time {
    font-size: var(--step--1);
    color: var(--ink-muted);
  }

  /* Plain text: the line breaks the Commenter typed are kept. A pasted URL
     is one long word, so it may break to keep the page from scrolling
     sideways; ordinary words still wrap whole. */
  .text {
    margin: 0;
    color: var(--ink-soft);
    white-space: pre-line;
    overflow-wrap: break-word;
  }

  /* A Reply steps in under its Comment. The owner's carries the orange rule;
     a reader's, the plain one. */
  .reply {
    margin-block-start: var(--space-16);
    margin-inline-start: var(--space-16);
    padding-inline-start: var(--space-16);
    border-inline-start: var(--line-quote) solid var(--rule-strong);
  }

  .reply--owner {
    border-inline-start-color: var(--orange);
  }

  .sent {
    margin-block: 0 var(--space-24);
    padding: var(--space-16);
    border: var(--line-hair) solid var(--ink);
    background: var(--card);
    scroll-margin-block-start: var(--space-16);
  }

  .sent:not(:target) {
    display: none;
  }

  .form {
    display: grid;
    gap: var(--space-16);
    padding-block-start: var(--space-32);
  }

  .field {
    display: grid;
    gap: var(--space-4);
  }

  .field label {
    font-weight: var(--weight-bold);
  }

  .hint,
  .error {
    font-family: var(--mono);
    font-size: var(--step--2);
    letter-spacing: var(--tracking-snug);
    color: var(--ink-muted);
  }

  /* Each error says what to do in words, not only in color, and shows only
     after the reader has been in the field. */
  .error {
    display: none;
    color: var(--orange-ink);
  }

  input:user-invalid ~ .error,
  textarea:user-invalid ~ .error {
    display: block;
  }

  input:not([type='radio']),
  textarea {
    inline-size: 100%;
    min-block-size: var(--control-height);
    padding: var(--space-10) var(--space-12);
    border: var(--line-hair) solid var(--rule-strong);
    background: var(--card);
    color: var(--ink);
    font: inherit;
  }

  input:focus-visible,
  textarea:focus-visible {
    outline: var(--line-heavy) solid var(--orange);
    outline-offset: var(--focus-offset);
  }

  input:user-invalid,
  textarea:user-invalid {
    border-color: var(--orange-ink);
    border-width: var(--line-heavy);
  }

  input[type='radio'] {
    accent-color: var(--orange);
    inline-size: 1.25rem;
    block-size: 1.25rem;
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
    margin-block-end: var(--space-8);
    padding: 0;
  }

  .subjects label {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    min-block-size: var(--tap-target);
  }

  .form .button {
    justify-self: start;
    cursor: pointer;
    font-family: inherit;
  }

  .closed {
    margin-block: var(--space-24) 0;
    color: var(--ink-muted);
  }
</style>
