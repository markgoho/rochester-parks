/**
 * The offline test of the spam check (#259, #281, #284). Run it again after
 * any change to the Jev question or the model, and before a change to the
 * thresholds.
 *
 *   cd functions
 *   export TYPESAFE_API_KEY=$(gcloud secrets versions access latest \
 *     --secret=TYPESAFE_API_KEY --project rochester-parks)
 *   bun scripts/spam-eval.ts [results.json]
 *
 * It asks the shipped question and each question in CANDIDATES in one call
 * per post, so an A/B test is one run. The posts: the spam set
 * (`spam-set.json`), the Approved Comments read from Firestore (the Archive,
 * new Comments and owner Replies), and the synthetic posts below. It prints,
 * for each question and source, the lowest and highest score and how many
 * posts score from each threshold.
 *
 *   bun scripts/spam-eval.ts pull
 *
 * moves the samples that "Reject as spam" kept in Firestore into
 * `spam-set.json`, with any email address removed. Commit the file.
 *
 * Firestore is read with Application Default Credentials
 * (`gcloud auth application-default login`).
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, type Timestamp } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'node:fs';
import { titleOf } from '../src/handler.js';
import {
  SPAM_QUESTION,
  spamRequest,
  type NoulQuestion,
} from '../src/spam-question.js';

/** Questions to test beside the shipped one. Empty when no change is open. */
const CANDIDATES: Record<string, NoulQuestion> = {};

const QUESTIONS = { shipped: SPAM_QUESTION, ...CANDIDATES };
const THRESHOLDS = [0.5, 0.7, 0.8, 0.9];

/** One post in the spam set. Never an email address. */
interface SpamSetPost {
  /** The Comment's id, when it is known. */
  comment: string | null;
  page: string;
  name: string;
  /** The body as posted, with its links, when it was kept. */
  body: string;
  flags: string[] | null;
  created: string | null;
  note?: string;
}

interface Post {
  label: 'spam' | 'real';
  source: string;
  page: string;
  name: string;
  body: string;
}

type Scored = Post & { scores: Record<string, number>; ms: number };

const SET = new URL('./spam-set.json', import.meta.url);
const BLOG_POST = '/blog/what-makes-a-rochester-park-great/';
const PARK_PAGE = '/town-parks/riga-parks/sanford-road-park/';

/** Written for #259 (the first 14) and #281 (off-topic posts). */
const SYNTHETIC: [Post['label'], string, string, string][] = [
  [
    'spam',
    BLOG_POST,
    'Jennifer Smith',
    'Great article! I learned a lot. If anyone needs help with their essays, our writing service offers affordable prices and fast delivery. Check us out at essaypro-help.com',
  ],
  [
    'spam',
    BLOG_POST,
    'CryptoMike',
    'Parks are nice but have you heard about the new staking platform? I made 300% in two weeks. DM me on Telegram @cryptomike_real to learn how.',
  ],
  [
    'spam',
    PARK_PAGE,
    'Best Roofing Rochester',
    'Nice park! By the way, if you need roof repair in Rochester NY, we offer free estimates and 24/7 emergency service. Call 585-555-0199 today.',
  ],
  [
    'spam',
    BLOG_POST,
    'Lucy',
    'I really like this post. Very informative content and well written. Keep up the good work, I will bookmark your site and come back for more.',
  ],
  [
    'spam',
    BLOG_POST,
    'SEO Expert',
    'Your website could rank #1 on Google. We noticed some issues with your site SEO. Reply to get a free audit of your website.',
  ],
  [
    'spam',
    PARK_PAGE,
    'Mark',
    'Buy cheap viagra and cialis online without prescription, discreet shipping to USA.',
  ],
  [
    'spam',
    BLOG_POST,
    'Samantha',
    'Online casino with the best bonuses in 2026, 200 free spins for new players, fast withdrawals.',
  ],
  [
    'spam',
    BLOG_POST,
    'Kevin',
    'Hello, I am writing to offer a guest post partnership. We publish high quality articles with dofollow links on your blog for a small fee.',
  ],
  [
    'real',
    PARK_PAGE,
    'Barbara',
    'How much does it cost to rent the Maher Lodge for a birthday party in June? Is there a kitchen?',
  ],
  [
    'real',
    PARK_PAGE,
    'Tom K.',
    'The trail behind the ball fields was flooded last Saturday, bring boots. Still a great walk.',
  ],
  [
    'real',
    BLOG_POST,
    'Dana',
    'I think you left out Durand Eastman. The beach and the arboretum there make it one of the best parks in Rochester. See https://www.cityofrochester.gov/durandeastman/',
  ],
  [
    'real',
    PARK_PAGE,
    'Pete',
    'Correction: the pavilion is now called the Sanford Pavilion, not the Riga Shelter. The town changed the sign in 2025.',
  ],
  [
    'real',
    BLOG_POST,
    'Maria',
    'Great list. My kids love the splash pad at Genesee Valley Park. Do you know when it opens for the summer?',
  ],
  [
    'real',
    PARK_PAGE,
    'Jim',
    'Is the dog park fenced? My dog does not come back when called lol',
  ],
  [
    'spam',
    BLOG_POST,
    'Ellaviody',
    'I have been comparing two ways to store winter tires in a small garage. One forum says to stack them flat, another says to hang them on hooks. My garage gets damp in spring and I worry about the rubber. Has anyone tried a <a href="https://tire-racks.example">wall mounted tire rack</a> for more than one season? I would like to decide before the snow comes.',
  ],
  [
    'spam',
    BLOG_POST,
    'Brianvot',
    'My grandmother is moving into assisted living next month and we are trying to understand the paperwork. The facility gave us a long list of forms and I am not sure which ones come first. Would you start with the medical records or the insurance? I found this <a href="https://senior-help.example/checklist">moving checklist</a> but it seems quite general.',
  ],
  [
    'real',
    PARK_PAGE,
    'Carol',
    'Does anyone know a good place to get ice cream near here after a walk? We always end up at the same stand.',
  ],
  [
    'real',
    BLOG_POST,
    'Mike R.',
    'My dad used to take us fishing off the pier in the 70s. He passed away last year and I found this page while looking through his old photos. Thank you for writing it.',
  ],
  [
    'real',
    PARK_PAGE,
    'Anne',
    'Is there a bus from downtown Rochester that stops near this park? I do not drive.',
  ],
  [
    'real',
    BLOG_POST,
    'Greg',
    'Off topic, but does anyone know if the Wegmans on East Ave still has the cafe upstairs? Going there before the park on Saturday.',
  ],
];

const readSet = (): SpamSetPost[] => JSON.parse(readFileSync(SET, 'utf8'));
const writeSet = (set: SpamSetPost[]) =>
  writeFileSync(SET, JSON.stringify(set, null, 2) + '\n');

/** Spam is not personal data, but an email address in it may be. The words are the ones the surface asks the owner to use. */
const noEmail = (text: string) =>
  text.replace(/[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+/g, '[email removed]');

async function pull(): Promise<void> {
  const set = readSet();
  const known = new Set(set.map((post) => post.comment));
  const snapshot = await getFirestore().collection('spam').get();
  let added = 0;
  for (const doc of snapshot.docs) {
    const sample = doc.data();
    if (!known.has(sample.comment)) {
      set.push({
        comment: sample.comment,
        page: sample.page,
        name: noEmail(sample.name),
        body: noEmail(sample.body),
        flags: sample.flags,
        created: (sample.created as Timestamp).toDate().toISOString(),
      });
      added++;
    }
  }
  // Written before the delete, so a failed write loses nothing.
  writeSet(set);
  const batch = getFirestore().batch();
  for (const doc of snapshot.docs) batch.delete(doc.ref);
  await batch.commit();
  console.log(`${added} added, ${set.length} in the spam set.`);
}

async function posts(): Promise<Post[]> {
  const spamSet = readSet().map(
    (post): Post => ({ label: 'spam', source: 'spam set', ...post })
  );
  const approved = await getFirestore()
    .collection('comments')
    .where('state', '==', 'approved')
    .get();
  const real = approved.docs.map((doc): Post => {
    const comment = doc.data();
    return {
      label: 'real',
      source: comment.owner ? 'owner reply' : 'approved',
      page: comment.page,
      name: comment.owner ? 'Rochester Parks' : comment.name,
      body: comment.body,
    };
  });
  const synthetic = SYNTHETIC.map(
    ([label, page, name, body]): Post => ({
      label,
      source: `synthetic ${label}`,
      page,
      name,
      body,
    })
  );
  return [...spamSet, ...real, ...synthetic];
}

async function judge(post: Post): Promise<Scored> {
  const start = performance.now();
  const response = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      spamRequest({ ...post, pageTitle: titleOf(post.page) }, QUESTIONS)
    ),
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }
  const { answers } = (await response.json()) as {
    answers: Record<string, { noul: number }>;
  };
  const scores = Object.fromEntries(
    Object.keys(QUESTIONS).map((key) => [key, answers[key].noul])
  );
  return { ...post, scores, ms: Math.round(performance.now() - start) };
}

const fixed = (n: number) => n.toFixed(2);

function summary(scored: Scored[]): void {
  const sources = [...new Set(scored.map((post) => post.source))];
  for (const key of Object.keys(QUESTIONS)) {
    console.log(`\n== ${key}`);
    console.table(
      Object.fromEntries(
        sources.map((source) => {
          const scores = scored
            .filter((post) => post.source === source)
            .map((post) => post.scores[key])
            .sort((a, b) => a - b);
          return [
            source,
            {
              n: scores.length,
              lowest: fixed(scores[0]),
              highest: fixed(scores.at(-1)!),
              ...Object.fromEntries(
                THRESHOLDS.map((t) => [
                  `≥ ${t}`,
                  scores.filter((s) => s >= t).length,
                ])
              ),
            },
          ];
        })
      )
    );
  }
  const last = Object.keys(QUESTIONS).at(-1)!;
  const line = (post: Scored) =>
    `  ${Object.values(post.scores).map(fixed).join(' ')}  ${post.source}  ${post.name}: ${JSON.stringify(post.body.slice(0, 70))}`;
  console.log(
    `\nThe spam set and synthetic posts (${Object.keys(QUESTIONS).join(' ')}):`
  );
  scored
    .filter(
      (post) =>
        post.source === 'spam set' || post.source.startsWith('synthetic')
    )
    .forEach((post) => console.log(line(post)));
  console.log(`\nThe 10 highest real Comments, by ${last}:`);
  scored
    .filter(
      (post) => post.label === 'real' && !post.source.startsWith('synthetic')
    )
    .sort((a, b) => b.scores[last] - a.scores[last])
    .slice(0, 10)
    .forEach((post) => console.log(line(post)));
  const ms = scored.map((post) => post.ms).sort((a, b) => a - b);
  console.log(
    `\nMedian call ${ms[Math.floor(ms.length / 2)]} ms, longest ${ms.at(-1)} ms.`
  );
}

initializeApp({ projectId: 'rochester-parks' });
if (process.argv[2] === 'pull') {
  await pull();
} else {
  if (!process.env.TYPESAFE_API_KEY) throw new Error('Set TYPESAFE_API_KEY.');
  const all = await posts();
  const scored: Scored[] = [];
  // 8 at a time, well inside TypeSafe's rate limit.
  for (let i = 0; i < all.length; i += 8) {
    scored.push(...(await Promise.all(all.slice(i, i + 8).map(judge))));
  }
  summary(scored);
  if (process.argv[2]) {
    writeFileSync(process.argv[2], JSON.stringify(scored, null, 1));
  }
}
