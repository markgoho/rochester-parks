/// <reference types="bun" />
import { beforeEach, describe, expect, test } from 'bun:test';
import {
  handle,
  type Announcement,
  type Deps,
  type StoredComment,
} from './handler.js';
import { pageToken } from './token.js';

const KEY = 'test-key';
const PAGE = '/town-parks/riga-parks/sanford-road-park/';
const NOW = new Date('2026-09-22T12:00:00Z');

let written: Omit<StoredComment, 'id'>[];
let announced: Announcement[];
let logged: string[];
let deps: Deps;

beforeEach(() => {
  written = [];
  announced = [];
  logged = [];
  deps = {
    github: {
      async announce(announcement) {
        announced.push(announcement);
      },
      closeAnnouncement: async () => {},
      deploy: async () => {},
    },
    logError: (message) => logged.push(message),
    store: {
      async add(comment) {
        written.push(comment);
        return `id-${written.length}`;
      },
      get: async () => undefined,
      inQueue: async () => [],
      approved: async () => [],
      removeWithReplies: async () => {},
      approve: async () => {},
      remove: async () => {},
    },
    secrets: { hmacKey: KEY, password: 'p' },
    clock: () => NOW,
  };
});

/** A post as the form sends it, valid unless a field is overridden. */
function post(fields: Record<string, string> = {}) {
  return handle(
    {
      method: 'POST',
      path: '/comment',
      form: {
        subject: 'comment',
        name: 'Barbara',
        email: 'barbara@example.com',
        body: 'How do I reserve the lodge?',
        leave_blank: '',
        page: PAGE,
        token: pageToken(PAGE, KEY),
        ...fields,
      },
    },
    deps
  );
}

describe('the public post', () => {
  test('a valid post writes one queue document and answers 303', async () => {
    const response = await post();
    expect(response.status).toBe(303);
    expect(response.headers.Location).toBe(`${PAGE}#comment-sent`);
    expect(written).toEqual([
      {
        page: PAGE,
        parent: null,
        state: 'queue',
        name: 'Barbara',
        email: 'barbara@example.com',
        body: 'How do I reserve the lodge?',
        subject: 'comment',
        created: NOW,
        owner: false,
        flags: [],
      },
    ]);
  });

  test('stores no IP and no user agent', async () => {
    await post();
    expect(Object.keys(written[0])).not.toContain('ip');
    expect(Object.keys(written[0])).not.toContain('userAgent');
  });

  test('a bad token answers 400 and writes nothing', async () => {
    const response = await post({ token: pageToken(PAGE, 'other-key') });
    expect(response.status).toBe(400);
    expect(response.body).toContain('Your comment was not sent');
    expect(written).toEqual([]);
  });

  test('a bad token with the honeypot filled still answers 400', async () => {
    const response = await post({ token: 'nope', leave_blank: 'x' });
    expect(response.status).toBe(400);
    expect(written).toEqual([]);
  });

  test('a bad token never redirects to the posted page', async () => {
    const response = await post({
      page: 'https://evil.example/',
      token: pageToken(PAGE, KEY),
    });
    expect(response.status).toBe(400);
    expect(response.headers.Location).toBeUndefined();
    expect(response.body).not.toContain('evil.example');
  });

  test('with no key set, every post answers 400', async () => {
    deps.secrets.hmacKey = '';
    const response = await post({ token: '' });
    expect(response.status).toBe(400);
    expect(written).toEqual([]);
  });

  test('the honeypot answers the normal 303 and writes nothing', async () => {
    const response = await post({ leave_blank: 'http://spam.example' });
    expect(response.status).toBe(303);
    expect(response.headers.Location).toBe(`${PAGE}#comment-sent`);
    expect(written).toEqual([]);
  });

  test('a one-character body passes', async () => {
    expect((await post({ body: 'k' })).status).toBe(303);
    expect(written).toHaveLength(1);
  });

  test.each([
    ['an empty body', { body: '   ' }],
    ['a missing name', { name: ' ' }],
    ['a bad Subject', { subject: 'reservation' }],
    ['a 5001-character body', { body: 'a'.repeat(5001) }],
    ['a 101-character name', { name: 'a'.repeat(101) }],
    ['an email with no @', { email: 'barbara.example.com' }],
  ])('%s answers 400 and writes nothing', async (_, fields) => {
    const response = await post(fields);
    expect(response.status).toBe(400);
    expect(response.headers['Content-Type']).toContain('text/html');
    expect(written).toEqual([]);
  });

  test('each Subject token is accepted', async () => {
    for (const subject of ['comment', 'correction', 'reservation-question']) {
      expect((await post({ subject })).status).toBe(303);
    }
    expect(written.map((c) => c.subject)).toEqual([
      'comment',
      'correction',
      'reservation-question',
    ]);
  });

  test('HTML is stripped from the stored body, not rejected', async () => {
    await post({ body: '<p>Nice <b>park</b></p><script>x()</script>' });
    expect(written[0].body).toBe('Nice parkx()');
  });

  test('a body that is only HTML answers 400', async () => {
    expect((await post({ body: '<br><br>' })).status).toBe(400);
  });

  test('two links set the links flag and still write', async () => {
    const response = await post({
      body: 'See https://a.example and http://b.example',
    });
    expect(response.status).toBe(303);
    expect(written[0].flags).toEqual(['links']);
  });

  test('one link sets no flag', async () => {
    await post({ body: 'See https://a.example' });
    expect(written[0].flags).toEqual([]);
  });

  test('one https://www. link is one link, not two', async () => {
    await post({ body: 'See https://www.example.com/x' });
    expect(written[0].flags).toEqual([]);
  });

  test('a bare www. link counts', async () => {
    await post({ body: 'See www.a.example and https://b.example' });
    expect(written[0].flags).toEqual(['links']);
  });

  test('two HTML links set the links flag and still write', async () => {
    const response = await post({
      body: 'Try <a href="https://a.example">this</a> or <a href=\'https://b.example\'>that</a>',
    });
    expect(response.status).toBe(303);
    expect(written[0].flags).toEqual(['links']);
    expect(written[0].body).toBe('Try this or that');
  });

  test('an HTML link whose words are its own URL counts once', async () => {
    await post({
      body: 'See <a href="https://a.example/x">https://a.example/x</a>',
    });
    expect(written[0].flags).toEqual([]);
    expect(written[0].body).toBe('See https://a.example/x');
  });

  test('trims the name, email and body it stores', async () => {
    await post({ name: ' Barbara ', email: ' b@example.com ', body: ' Hi ' });
    expect(written[0]).toMatchObject({
      name: 'Barbara',
      email: 'b@example.com',
      body: 'Hi',
    });
  });
});

describe('the announcement', () => {
  test('a valid post dispatches one announcement with no private words', async () => {
    await post({ subject: 'reservation-question' });
    expect(announced).toEqual([
      {
        pageTitle: 'Sanford Road Park',
        subject: 'reservation-question',
        date: '2026-09-22',
        flag: 'none',
        commentId: 'id-1',
      },
    ]);
    const inputs = JSON.stringify(announced);
    for (const secret of [
      'Barbara',
      'barbara@example.com',
      'reserve the lodge',
    ]) {
      expect(inputs).not.toContain(secret);
    }
  });

  test('a flagged Comment still announces, marked', async () => {
    await post({ body: 'See https://a.example and https://b.example' });
    expect(announced[0].flag).toBe('links');
  });

  test('a failing GitHub client still writes and still answers 303', async () => {
    deps.github.announce = async () => {
      throw new Error('401 Bad credentials');
    };
    const response = await post();
    expect(response.status).toBe(303);
    expect(written).toHaveLength(1);
    expect(logged).toHaveLength(1);
    expect(logged[0]).toContain('id-1');
  });

  test('the honeypot and a bad token announce nothing', async () => {
    await post({ leave_blank: 'x' });
    await post({ token: 'nope' });
    await post({ body: '' });
    expect(announced).toEqual([]);
  });
});

describe('other requests', () => {
  test('a GET to /comment answers 405', async () => {
    const response = await handle(
      { method: 'GET', path: '/comment', form: {} },
      deps
    );
    expect(response.status).toBe(405);
  });

  test('an unknown path answers 404', async () => {
    const response = await handle(
      { method: 'POST', path: '/elsewhere', form: {} },
      deps
    );
    expect(response.status).toBe(404);
  });
});
