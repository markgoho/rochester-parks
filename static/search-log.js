// The search-log module (#313, #322): pure, fed only by the browser glue in
// search.js. It decides which search a reader "stopped on" and turns it
// into at most one event to send, so nothing here talks to Pagefind or
// Pirsch directly.

const MAX_LENGTH = 40;
const DIGIT_RUN = /\d{5,}/;

/**
 * The term filter (#313): drops a term that looks personal — an email, a
 * phone number, or a long free text — so analytics hold no personal data.
 * @param {string} term
 * @returns {boolean}
 */
function allow(term) {
  if (term.length > MAX_LENGTH) return false;
  if (term.includes('@')) return false;
  if (DIGIT_RUN.test(term)) return false;
  return true;
}

/**
 * One search-log instance for one dialog session. Feed it the dialog's
 * events (`search`, `results`); read back at most one `{ term, results }`
 * from `closed()`, `opened()` or `left()`, or `undefined`.
 */
export function createSearchLog() {
  let keptTerm = '';
  let keptResults = 0;
  // True from a non-empty `search` until its matching `results` arrives.
  // Pagefind's own reset (clear, Escape, close) fires `results` too, for
  // the empty search it made; that count belongs to no term, and without
  // this guard it would overwrite the kept term's real count with 0.
  let awaitingResults = false;

  /** @param {string} term */
  function search(term) {
    const trimmed = term.trim();
    // Pagefind fires an empty search on clear, Escape and close
    // (reset-on-close). That is not a new term to log, so it is ignored,
    // and the term already kept survives to the send that follows.
    if (!trimmed) {
      awaitingResults = false;
      return;
    }
    keptTerm = trimmed;
    keptResults = 0;
    awaitingResults = true;
  }

  /** @param {number} count */
  function results(count) {
    if (!awaitingResults) return;
    keptResults = count;
    awaitingResults = false;
  }

  function send() {
    if (!keptTerm) return undefined;
    const term = keptTerm.toLowerCase();
    const resultCount = keptResults;
    keptTerm = '';
    keptResults = 0;
    awaitingResults = false;
    return allow(term) ? { term, results: resultCount } : undefined;
  }

  return { search, results, closed: send, opened: send, left: send };
}
