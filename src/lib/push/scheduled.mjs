// Helpers for the Netlify scheduled push functions (push-reminders, push-results).
// They run on Netlify's clock rather than GitHub cron, which was running hours
// late. Fixtures are read live from GitHub because scrape commits skip the
// Netlify build, so the deployed bundle is usually behind.
import { getStore } from '@netlify/blobs';
import push from '../../data/push.json' with { type: 'json' };
import { createBlobStore } from './store-blobs.mjs';
import { sendNotifications } from './send.mjs';

export const FIXTURES_URL =
  'https://raw.githubusercontent.com/stockport-badminton/remnants-badminton/master/src/data/fixtures.json';

/** Current hour in the UK (0–23), GMT or BST. */
export function ukHour(now = new Date()) {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hourCycle: 'h23' }).format(now));
}

/** YYYY-MM-DD in the UK. */
export function ukDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(now);
}

export async function fetchFixtures() {
  const res = await fetch(FIXTURES_URL, { headers: { 'Cache-Control': 'no-cache' } });
  if (!res.ok) throw new Error(`fixtures fetch failed: ${res.status}`);
  const data = await res.json();
  return data.fixtures ?? [];
}

/** Small key/value store for "what have we already sent" bookkeeping. */
export const stateStore = () => getStore({ name: 'push-state', consistency: 'strong' });

/** Send to the production subscriber store (scheduled functions only run in production). */
export async function deliver(notifications) {
  if (!process.env.VAPID_PRIVATE_KEY) throw new Error('VAPID_PRIVATE_KEY not set');
  return sendNotifications({
    store: createBlobStore('production'),
    notifications,
    vapid: { subject: push.vapidSubject, publicKey: push.vapidPublicKey, privateKey: process.env.VAPID_PRIVATE_KEY },
  });
}
