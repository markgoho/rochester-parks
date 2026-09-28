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
 * `search-map` is always empty for now: the place map is a later ticket
 * (#323). It still reserves its column, so a title starts in the same place
 * whether or not the row beside it ever gets a map.
 */
export const SEARCH_RESULT_TEMPLATE = `<script type="text/pagefind-template">
<li class="pf-result">
  <div class="pf-result-card">
    <div class="search-row">
      <div class="search-map">{{#if meta.map}}{{+ meta.map +}}{{/if}}</div>
      <div class="pf-result-content">
        <p class="pf-result-title"><a class="pf-result-link" href="{{ meta.url | default(url) | safeUrl }}">{{ meta.title }}</a></p>
        {{#if meta.line}}<p class="search-line">{{ meta.line }}</p>{{/if}}
        {{#if excerpt}}<p class="pf-result-excerpt">{{+ excerpt +}}</p>{{/if}}
      </div>
    </div>
  </div>
</li>
</script>`;
