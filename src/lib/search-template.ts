/**
 * The result template for the search dialog (#320, decided in #297/#298/#310).
 * A string, not a Svelte snippet: Pagefind reads it as
 * `<script type="text/pagefind-template">`, and its own `{{ }}` placeholders
 * would otherwise read as Svelte expressions.
 *
 * `pf-result`, `pf-result-card`, `pf-result-title`, `pf-result-link` and
 * `pf-result-excerpt` are Pagefind's own class names, kept from its default
 * template. `search-row`, `search-picture`, `search-photo` and
 * `search-line` are this site's own, so none of them may start with `pf-`:
 * Pagefind resets every class that does (`all: revert`, high specificity).
 *
 * `search-picture` holds the result's picture (#341), in its card's order:
 * the photo from `meta.photo`, in the card's duotone, else the page's own
 * `map.svg` (the Park's outline, else its place map) when `meta.map` flags
 * one. The SVG is never a meta value itself (#333): Pagefind indexes every
 * meta value, and the SVG's words ("river", "canal", "village") would then
 * find every Park that draws one. The column stays when a result has no
 * picture, so a title starts in the same place either way.
 */
export const SEARCH_RESULT_TEMPLATE = `<script type="text/pagefind-template">
<li class="pf-result">
  <div class="pf-result-card">
    <div class="search-row">
      <div class="search-picture">{{#if meta.photo}}<span class="search-photo"><img src="{{ meta.photo | safeUrl }}" alt="" loading="lazy"></span>{{/if}}{{#if meta.map}}<img src="{{ url | safeUrl }}map.svg" alt="" loading="lazy">{{/if}}</div>
      <div class="pf-result-content">
        <p class="pf-result-title"><a class="pf-result-link" href="{{ meta.url | default(url) | safeUrl }}">{{ meta.title }}</a></p>
        {{#if meta.line}}<p class="search-line">{{ meta.line }}</p>{{/if}}
        {{#if excerpt}}<p class="pf-result-excerpt">{{+ excerpt +}}</p>{{/if}}
      </div>
    </div>
  </div>
</li>
</script>`;
