/// <reference types="bun" />
import { beforeEach, describe, expect, test } from 'bun:test';
import {
  handle,
  type Announcement,
  type Deps,
  type SpamInput,
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
let judged: SpamInput[];
let spamScore: number | null;

beforeEach(() => {
  written = [];
  announced = [];
  logged = [];
  judged = [];
  spamScore = 0.1;
  deps = {
    github: {
      async announce(announcement) {
        announced.push(announcement);
      },
      closeAnnouncement: async () => {},
      deploy: async () => {},
    },
    logError: (message) => logged.push(message),
    logInfo: (message) => logged.push(message),
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
    spam: async (input) => {
      judged.push(input);
      return spamScore;
    },
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
    ['a bad Subject', { subject: 'reservation-question' }],
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
    for (const subject of ['comment', 'correction']) {
      expect((await post({ subject })).status).toBe(303);
    }
    expect(written.map((c) => c.subject)).toEqual(['comment', 'correction']);
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

  test('one HTML link sets the links flag and still writes', async () => {
    const response = await post({
      body: 'A <a href="https://a.example">seasonal palette test</a> helps',
    });
    expect(response.status).toBe(303);
    expect(written[0].flags).toEqual(['links']);
    expect(written[0].body).toBe('A seasonal palette test helps');
  });

  test('one BBCode link sets the links flag', async () => {
    await post({ body: 'A [url=https://a.example]palette test[/url] helps' });
    expect(written[0].flags).toEqual(['links']);
  });

  test('an HTML link and a plain link set the links flag', async () => {
    await post({
      body: '<a href="https://a.example">here</a> or https://b.example',
    });
    expect(written[0].flags).toEqual(['links']);
  });

  test('the same plain link posted twice counts twice', async () => {
    await post({ body: 'https://a.example and https://a.example' });
    expect(written[0].flags).toEqual(['links']);
  });

  test('a Cyrillic body sets the script flag and still writes', async () => {
    const response = await post({
      body: 'Вывод из запоя на дому в Москве, круглосуточно и недорого',
    });
    expect(response.status).toBe(303);
    expect(written[0].flags).toEqual(['script']);
  });

  test('an English body with a few non-Latin letters sets no flag', async () => {
    await post({
      body: 'My friend Дмитрий and I loved the café at the lodge',
    });
    expect(written[0].flags).toEqual([]);
  });

  test('a French or Spanish body sets no flag', async () => {
    await post({ body: 'Très joli parc, on a adoré le café près du lac' });
    await post({ body: 'El parque es pequeño pero muy bonito, ¡qué día!' });
    expect(written.map((c) => c.flags)).toEqual([[], []]);
  });

  test('a Cyrillic body with two links sets both flags', async () => {
    await post({ body: 'Вывод из запоя https://a.example https://b.example' });
    expect(written[0].flags).toEqual(['links', 'script']);
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

describe('the spam check', () => {
  test('sends the body as posted, with its links, not as stored', async () => {
    await post({
      body: ' A <a href="https://a.example">palette test</a> helps ',
    });
    expect(judged[0].body).toBe(
      'A <a href="https://a.example">palette test</a> helps'
    );
    expect(written[0].body).toBe('A palette test helps');
  });

  test('sends the page title, the name and the body, never the email', async () => {
    await post();
    expect(judged).toEqual([
      {
        pageTitle: 'Sanford Road Park',
        name: 'Barbara',
        body: 'How do I reserve the lodge?',
      },
    ]);
  });

  test('a likely spam post answers 400, writes nothing and announces nothing', async () => {
    spamScore = 0.9;
    const response = await post();
    expect(response.status).toBe(400);
    expect(response.body).toContain(
      'looks like an advertisement or a post about another subject'
    );
    expect(written).toEqual([]);
    expect(announced).toEqual([]);
    expect(logged).toEqual([`Refused as spam (0.9) on ${PAGE}`]);
  });

  test('a possible spam post writes with the spam flag and announces nothing', async () => {
    spamScore = 0.7;
    const response = await post();
    expect(response.status).toBe(303);
    expect(written[0].flags).toEqual(['spam']);
    expect(announced).toEqual([]);
  });

  test('a clean post writes with no flag and announces', async () => {
    spamScore = 0.69;
    await post();
    expect(written[0].flags).toEqual([]);
    expect(announced).toHaveLength(1);
  });

  test('a failed check is no signal: the post writes and announces', async () => {
    spamScore = null;
    const response = await post();
    expect(response.status).toBe(303);
    expect(written[0].flags).toEqual([]);
    expect(announced).toHaveLength(1);
  });

  test('the honeypot, a bad token and a refused post are never checked', async () => {
    await post({ leave_blank: 'x' });
    await post({ token: 'nope' });
    await post({ body: '' });
    expect(judged).toEqual([]);
  });
});

describe('the announcement', () => {
  test('a valid post dispatches one announcement with no private words', async () => {
    await post({ subject: 'correction' });
    expect(announced).toEqual([
      {
        pageTitle: 'Sanford Road Park',
        subject: 'correction',
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

  test.each([
    ['links', 'See https://a.example and https://b.example'],
    ['script', 'Вывод из запоя на дому в Москве'],
  ])('a post flagged %s writes and announces nothing', async (_, body) => {
    const response = await post({ body });
    expect(response.status).toBe(303);
    expect(written).toHaveLength(1);
    expect(written[0].flags).not.toEqual([]);
    expect(announced).toEqual([]);
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
