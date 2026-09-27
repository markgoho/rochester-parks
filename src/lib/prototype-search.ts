// PROTOTYPE (#298): throwaway. The result template for every Pagefind
// results list: the name, the second line from #297, then the excerpt. It is
// a string because Svelte would read the {{ }} as its own expressions.
export const RESULT_TEMPLATE = `<script type="text/pagefind-template">
<li class="pf-result">
  <div class="pf-result-card">
    <div class="pf-result-content">
      <p class="pf-result-title">
        <a class="pf-result-link" href="{{ meta.url | default(url) | safeUrl }}">{{ meta.title }}</a>
      </p>
      {{#if meta.line}}<p class="pr-line">{{ meta.line }}</p>{{/if}}
      {{#if excerpt}}<p class="pf-result-excerpt">{{+ excerpt +}}</p>{{/if}}
    </div>
  </div>
</li>
</script>`;
