/// <reference types="bun" />
import { beforeEach, describe, expect, test } from 'bun:test';
import {
  handle,
  type Deps,
  type FunctionRequest,
  type StoredComment,
} from './handler.js';

const PASSWORD = 'correct horse battery staple';
const BASE = 'https://comments-test.a.run.app';

let docs: Map<string, StoredComment>;
let closed: string[];
let deploys: number;
let logged: string[];
let deps: Deps;

function comment(id: string, overrides: Partial<StoredComment> = {}) {
  const doc: StoredComment = {
    id,
    page: '/town-parks/riga-parks/sanford-road-park/',
    parent: null,
    state: 'queue',
    name: 'Barbara',
    email: 'barbara@example.com',
    body: 'Call me at 585-555-0100 about the lodge.',
    subject: 'reservation-question',
    created: new Date('2026-09-20T12:00:00Z'),
    owner: false,
    flags: [],
    ...overrides,
  };
  docs.set(id, doc);
  return doc;
}

beforeEach(() => {
  docs = new Map();
  closed = [];
  deploys = 0;
  logged = [];
  deps = {
    store: {
      async add(doc) {
        const id = `new-${docs.size}`;
        docs.set(id, { ...doc, id });
        return id;
      },
      async approved() {
        return [...docs.values()].filter((doc) => doc.state === 'approved');
      },
      async replies(id) {
        return [...docs.values()].filter((doc) => doc.parent === id);
      },
      async get(id) {
        return docs.get(id);
      },
      async inQueue() {
        return [...docs.values()].filter((doc) => doc.state === 'queue');
      },
      async approve(id, body) {
        const doc = docs.get(id);
        if (doc) docs.set(id, { ...doc, state: 'approved', body });
      },
      async remove(id) {
        docs.delete(id);
      },
    },
    github: {
      async announce() {},
      async closeAnnouncement(commentId) {
        closed.push(commentId);
      },
      async deploy() {
        deploys++;
      },
    },
    logError: (message) => logged.push(message),
    secrets: { hmacKey: 'k', password: PASSWORD },
    clock: () => new Date('2026-09-22T12:00:00Z'),
  };
});

const basic = (password: string) =>
  `Basic ${Buffer.from(`owner:${password}`).toString('base64')}`;

/** A request as the owner's browser sends it, signed in. */
function owner(
  method: string,
  path: string,
  form: Record<string, string> = {},
  headers: Record<string, string> = {}
): FunctionRequest {
  return {
    method,
    path,
    form,
    headers: {
      authorization: basic(PASSWORD),
      origin: BASE,
      host: new URL(BASE).host,
      ...headers,
    },
  };
}

describe('the password', () => {
  const routes: [string, string][] = [
    ['GET', '/comments'],
    ['GET', '/comments/a'],
    ['POST', '/comments/a/approve'],
    ['POST', '/comments/a/reject'],
  ];

  test.each(routes)('%s %s refuses a missing password', async (m, p) => {
    comment('a');
    const response = await handle({ method: m, path: p, form: {} }, deps);
    expect(response.status).toBe(401);
    expect(response.headers['WWW-Authenticate']).toContain('Basic');
    expect(response.body).not.toContain('Barbara');
    expect(docs.get('a')?.state).toBe('queue');
  });

  test.each(routes)('%s %s refuses a wrong password', async (m, p) => {
    comment('a');
    const response = await handle(
      owner(m, p, {}, { authorization: basic('wrong') }),
      deps
    );
    expect(response.status).toBe(401);
    expect(docs.get('a')?.state).toBe('queue');
    expect(closed).toEqual([]);
  });

  test('every surface response is private and not indexed', async () => {
    for (const response of [
      await handle({ method: 'GET', path: '/comments', form: {} }, deps),
      await handle(owner('GET', '/comments'), deps),
    ]) {
      expect(response.headers['Cache-Control']).toBe('no-store');
      expect(response.headers['X-Robots-Tag']).toBe('noindex');
    }
  });

  test('a malformed Origin is refused, not a crash', async () => {
    comment('a');
    const response = await handle(
      owner('POST', '/comments/a/reject', {}, { origin: 'not a url' }),
      deps
    );
    expect(response.status).toBe(403);
    expect(docs.has('a')).toBe(true);
  });

  test('a store failure answers 500 and stays private', async () => {
    deps.store.inQueue = async () => {
      throw new Error('Firestore down');
    };
    const response = await handle(owner('GET', '/comments'), deps);
    expect(response.status).toBe(500);
    expect(response.headers['Cache-Control']).toBe('no-store');
    expect(logged).toHaveLength(1);
  });

  test('a post from another site is refused', async () => {
    comment('a');
    const response = await handle(
      owner(
        'POST',
        '/comments/a/approve',
        {},
        { origin: 'https://evil.example' }
      ),
      deps
    );
    expect(response.status).toBe(403);
    expect(docs.get('a')?.state).toBe('queue');
  });
});

describe('the queue', () => {
  test('lists unflagged Comments by date, then flagged ones last', async () => {
    comment('flagged-old', {
      flags: ['links'],
      created: new Date('2026-01-01T12:00:00Z'),
    });
    comment('late', { created: new Date('2026-09-21T12:00:00Z') });
    comment('early', { created: new Date('2026-09-01T12:00:00Z') });
    comment('published', { state: 'approved' });
    const { body, status } = await handle(owner('GET', '/comments'), deps);
    expect(status).toBe(200);
    const order = ['early', 'late', 'flagged-old'].map((id) =>
      body.indexOf(`/comments/${id}"`)
    );
    expect(order.every((at) => at > -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(body).not.toContain('/comments/published"');
  });

  test('shows page, Subject, date, flags, name, email and body', async () => {
    comment('a', { flags: ['links'] });
    const { body } = await handle(owner('GET', '/comments'), deps);
    for (const shown of [
      '/town-parks/riga-parks/sanford-road-park/',
      'reservation-question',
      '2026-09-20',
      'links',
      'Barbara',
      'barbara@example.com',
      '585-555-0100',
    ]) {
      expect(body).toContain(shown);
    }
  });

  test('escapes what a Commenter wrote', async () => {
    comment('a', { name: '<script>alert(1)</script>', body: '<b>hi</b>' });
    const { body } = await handle(owner('GET', '/comments'), deps);
    expect(body).not.toContain('<script>alert(1)');
    expect(body).toContain('&lt;script&gt;');
  });
});

describe('one Comment', () => {
  test('shows the Comment with its actions', async () => {
    comment('a');
    const { body, status } = await handle(owner('GET', '/comments/a'), deps);
    expect(status).toBe(200);
    expect(body).toContain('action="/comments/a/approve"');
    expect(body).toContain('action="/comments/a/reject"');
    expect(body).toContain('585-555-0100');
  });

  test('an unknown id answers 404', async () => {
    const response = await handle(owner('GET', '/comments/nope'), deps);
    expect(response.status).toBe(404);
  });
});

describe('approve', () => {
  test('sets approved, closes the issue and dispatches the deploy', async () => {
    comment('a');
    const response = await handle(
      owner('POST', '/comments/a/approve', {
        body: 'Call me at 585-555-0100 about the lodge.',
      }),
      deps
    );
    expect(response.status).toBe(303);
    expect(response.headers.Location).toBe(
      '/comments?done=approved&issue=closed&deploy=started'
    );
    expect(docs.get('a')?.state).toBe('approved');
    expect(closed).toEqual(['a']);
    expect(deploys).toBe(1);
  });

  test('saves the edited body, for a redaction', async () => {
    comment('a');
    await handle(
      owner('POST', '/comments/a/approve', {
        body: 'Call me at [phone removed] about the lodge.',
      }),
      deps
    );
    expect(docs.get('a')?.body).toBe(
      'Call me at [phone removed] about the lodge.'
    );
  });

  test('a failing deploy dispatch shows and leaves the Comment Approved', async () => {
    comment('a');
    deps.github.deploy = async () => {
      throw new Error('403');
    };
    const response = await handle(
      owner('POST', '/comments/a/approve', { body: 'Hi' }),
      deps
    );
    expect(response.headers.Location).toContain('deploy=failed');
    expect(docs.get('a')?.state).toBe('approved');
    expect(logged).toHaveLength(1);
    const shown = await handle(
      {
        ...owner('GET', '/comments'),
        query: { done: 'approved', issue: 'closed', deploy: 'failed' },
      },
      deps
    );
    expect(shown.body).toContain('did not start');
  });

  test('an empty edited body is refused with a reason', async () => {
    comment('a');
    const response = await handle(
      owner('POST', '/comments/a/approve', { body: '  ' }),
      deps
    );
    expect(response.status).toBe(400);
    expect(response.body).toContain('The body is empty');
  });

  test('an Approved Comment shows no approve or reject', async () => {
    comment('a', { state: 'approved' });
    const { body } = await handle(owner('GET', '/comments/a'), deps);
    expect(body).not.toContain('/approve"');
    expect(body).not.toContain('/reject"');
    for (const action of ['approve', 'reject']) {
      const response = await handle(
        owner('POST', `/comments/a/${action}`, { body: 'x' }),
        deps
      );
      expect(response.status).toBe(409);
    }
    expect(docs.has('a')).toBe(true);
    expect(deploys).toBe(0);
  });
});

describe('reject', () => {
  test('deletes the document and closes the issue', async () => {
    comment('a');
    const response = await handle(owner('POST', '/comments/a/reject'), deps);
    expect(response.status).toBe(303);
    expect(response.headers.Location).toBe(
      '/comments?done=rejected&issue=closed'
    );
    expect(docs.has('a')).toBe(false);
    expect(closed).toEqual(['a']);
    expect(deploys).toBe(0);
  });
});

describe('reply as the site', () => {
  test('writes an owner Reply under an Approved Comment and dispatches the deploy', async () => {
    comment('a', { state: 'approved' });
    const response = await handle(
      owner('POST', '/comments/a/reply', { body: 'Call the Town Hall.' }),
      deps
    );
    expect(response.status).toBe(303);
    const reply = [...docs.values()].find((doc) => doc.parent === 'a');
    expect(reply).toMatchObject({
      page: '/town-parks/riga-parks/sanford-road-park/',
      parent: 'a',
      state: 'approved',
      body: 'Call the Town Hall.',
      subject: null,
      email: null,
      owner: true,
      flags: [],
      created: new Date('2026-09-22T12:00:00Z'),
    });
    expect(deploys).toBe(1);
  });

  test('replying to a queued Comment approves it and closes its issue', async () => {
    comment('a');
    await handle(
      owner('POST', '/comments/a/reply', { body: 'Call the Town Hall.' }),
      deps
    );
    expect(docs.get('a')?.state).toBe('approved');
    expect(closed).toEqual(['a']);
    expect(deploys).toBe(1);
  });

  test('a Reply never has a Reply', async () => {
    comment('a', { state: 'approved' });
    comment('r', { state: 'approved', parent: 'a', owner: true });
    const response = await handle(
      owner('POST', '/comments/r/reply', { body: 'x' }),
      deps
    );
    expect(response.status).toBe(409);
    expect([...docs.values()].filter((doc) => doc.parent === 'r')).toEqual([]);
    const { body } = await handle(owner('GET', '/comments/r'), deps);
    expect(body).not.toContain('/reply"');
  });

  test('an empty Reply is refused', async () => {
    comment('a', { state: 'approved' });
    const response = await handle(
      owner('POST', '/comments/a/reply', { body: ' ' }),
      deps
    );
    expect(response.status).toBe(400);
    expect(docs.size).toBe(1);
  });
});

describe('the Approved list', () => {
  test('lists Approved Comments per page, with delete, and Reply only on a top-level one', async () => {
    comment('a', { state: 'approved' });
    comment('r', { state: 'approved', parent: 'a', owner: true });
    comment('b', { state: 'approved', page: '/trails/erie-canal/' });
    comment('q');
    const { body, status } = await handle(
      owner('GET', '/comments/approved'),
      deps
    );
    expect(status).toBe(200);
    expect(body).toContain('/trails/erie-canal/');
    for (const id of ['a', 'r', 'b']) {
      expect(body).toContain(`action="/comments/${id}/delete"`);
    }
    expect(body).toContain('action="/comments/a/reply"');
    expect(body).toContain('action="/comments/b/reply"');
    expect(body).not.toContain('action="/comments/r/reply"');
    expect(body).not.toContain('/comments/q/');
  });
});

describe('delete an Approved Comment', () => {
  test('removes the Comment and its Replies and dispatches the deploy', async () => {
    comment('a', { state: 'approved' });
    comment('r1', { state: 'approved', parent: 'a' });
    comment('r2', { state: 'approved', parent: 'a', owner: true });
    comment('other', { state: 'approved' });
    const response = await handle(owner('POST', '/comments/a/delete'), deps);
    expect(response.status).toBe(303);
    expect([...docs.keys()]).toEqual(['other']);
    expect(deploys).toBe(1);
  });

  test('a queued Comment is rejected, not deleted here', async () => {
    comment('q');
    const response = await handle(owner('POST', '/comments/q/delete'), deps);
    expect(response.status).toBe(409);
    expect(docs.has('q')).toBe(true);
  });

  test('a failing deploy dispatch shows on the page', async () => {
    comment('a', { state: 'approved' });
    deps.github.deploy = async () => {
      throw new Error('403');
    };
    const response = await handle(owner('POST', '/comments/a/delete'), deps);
    expect(response.headers.Location).toContain('deploy=failed');
    expect(docs.has('a')).toBe(false);
  });
});
