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
        <li class="entry" class:entry--owner={comment.owner}>
          {@render signed(comment, false)}
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
    <!-- The form goes here with the write path (#221), so a form never
         posts to nothing. -->
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
  .entry--owner {
    margin-inline-start: calc(-1 * (var(--space-16) + var(--line-quote)));
    padding-inline-start: var(--space-16);
    border-inline-start: var(--line-quote) solid var(--orange);
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

  .closed {
    margin-block: var(--space-24) 0;
    color: var(--ink-muted);
  }
</style>
