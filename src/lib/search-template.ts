/**
 * The result template for the search dialog (#320, decided in #297/#298/#310).
 * A string, not a Svelte snippet: Pagefind reads it as
 * `<script type="text/pagefind-template">`, and its own `{{ }}` placeholders
 * would otherwise read as Svelte expressions.
 *
 * `pf-result`, `pf-result-card`, `pf-result-title`, `pf-result-link` and
 * `pf-result-excerpt` are Pagefind's own class names, kept from its default
 * template. `search-row`, `search-map` and `search-line` are this site's
 * own, so none of them may start with `pf-`: Pagefind resets every class
 * that does (`all: revert`, high specificity).
 *
 * `search-map` holds the place map (#310, #323), the page's own `map.svg`
 * shown with `<img>` when `meta.map` flags one (#333). The SVG is never a
 * meta value itself: Pagefind indexes every meta value, and the SVG's words
 * ("river", "canal", "village") would then find every Park that draws one.
 * The column stays when a result has no map, so a title starts in the same
 * place either way.
 */
export const SEARCH_RESULT_TEMPLATE = `<script type="text/pagefind-template">
<li class="pf-result">
  <div class="pf-result-card">
    <div class="search-row">
      <div class="search-map">{{#if meta.map}}<img src="{{ url | safeUrl }}map.svg" alt="" loading="lazy">{{/if}}</div>
      <div class="pf-result-content">
        <p class="pf-result-title"><a class="pf-result-link" href="{{ meta.url | default(url) | safeUrl }}">{{ meta.title }}</a></p>
        {{#if meta.line}}<p class="search-line">{{ meta.line }}</p>{{/if}}
        {{#if excerpt}}<p class="pf-result-excerpt">{{+ excerpt +}}</p>{{/if}}
      </div>
    </div>
  </div>
</li>
</script>`;
