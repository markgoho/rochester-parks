/**
 * Lists the search terms that found nothing, most first, over a date range
 * (#319). The owner (or an agent) reads the output to find a missing Park
 * or a missing name; a term with a high count is worth adding first.
 *
 *   bun scripts/search-misses.ts <from> <to>
 *   bun scripts/search-misses.ts 2026-09-01 2026-09-27
 *
 * `from` and `to` are `YYYY-MM-DD`, the range Pirsch's API takes. `bun`
 * loads `.env` itself; it must hold `PIRSCH_CLIENT_ID` and
 * `PIRSCH_CLIENT_SECRET` for a read-only OAuth client (`scope_statistics:
 * r`) made on the Pirsch dashboard for this site.
 *
 * Every search is recorded as a `Search` Pirsch event with `meta.term` and
 * `meta.results` (search.js, #322); this script asks for the rows where
 * `meta.results` is `0`, one page (at most 100 rows) at a time, and sums
 * each term's count with `pagesToMisses` (search-misses-report.ts).
 */
import { pagesToMisses, type EventRow } from './search-misses-report';

const API = 'https://api.pirsch.io/api/v1';
const PAGE_SIZE = 100;

function usageError(message: string): never {
  console.error(message);
  console.error(
    'Usage: bun scripts/search-misses.ts <from YYYY-MM-DD> <to YYYY-MM-DD>'
  );
  console.error(
    'Needs PIRSCH_CLIENT_ID and PIRSCH_CLIENT_SECRET in .env, from a read-only Pirsch OAuth client (scope_statistics: r).'
  );
  process.exit(1);
}

const clientId = process.env.PIRSCH_CLIENT_ID;
const clientSecret = process.env.PIRSCH_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  usageError('Missing PIRSCH_CLIENT_ID or PIRSCH_CLIENT_SECRET.');
}

const [from, to] = process.argv.slice(2);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
if (!from || !to || !DATE.test(from) || !DATE.test(to)) {
  usageError('Give a from and a to date, each YYYY-MM-DD.');
}

async function pirsch<T>(
  path: string,
  token?: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    console.error(`Pirsch API error: ${response.status} ${path}\n${body}`);
    process.exit(1);
  }
  return response.json() as Promise<T>;
}

const { access_token: token } = await pirsch<{ access_token: string }>(
  '/token',
  undefined,
  {
    method: 'POST',
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  }
);

const domains = await pirsch<Array<{ id: string; hostname: string }>>(
  '/domain',
  token
);
if (domains.length !== 1) {
  console.error(
    domains.length === 0
      ? 'The Pirsch client has no domain.'
      : `The Pirsch client has ${domains.length} domains: ${domains.map((d) => `${d.hostname} (${d.id})`).join(', ')}.`
  );
  process.exit(1);
}
const domainId = domains[0].id;

const pages: EventRow[][] = [];
let offset = 0;
for (;;) {
  const params = new URLSearchParams({
    id: domainId,
    from,
    to,
    event: 'Search',
    meta_results: '0',
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });
  const page = await pirsch<EventRow[]>(
    `/statistics/event/list?${params}`,
    token
  );
  pages.push(page);
  if (page.length < PAGE_SIZE) break;
  offset += PAGE_SIZE;
}

const misses = pagesToMisses(pages);
if (misses.length === 0) {
  console.error('No search in this range found nothing.');
} else {
  for (const { term, count } of misses) console.log(`${count}\t${term}`);
}
