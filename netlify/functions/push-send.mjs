// POST /.netlify/functions/push-send
//   Authorization: Bearer <PUSH_SEND_SECRET>
//   { notifications: [{ type?: 'results'|'reminders', teams?: string[], title, body, url?, tag? }] }
// Called by the fixtures GitHub Action (scripts/push-notify.mjs).
import { timingSafeEqual } from 'node:crypto';
import push from '../../src/data/push.json' with { type: 'json' };
import { createBlobStore } from '../../src/lib/push/store-blobs.mjs';
import { NOTIFICATION_TYPES } from '../../src/lib/push/subscription.mjs';
import { sendNotifications } from '../../src/lib/push/send.mjs';

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function authorised(req) {
  const secret = process.env.PUSH_SEND_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function clean(n) {
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : undefined);
  const title = str(n?.title, 120);
  if (!title) throw new Error('notification missing title');
  const url = str(n.url, 200);
  return {
    title,
    body: str(n.body, 300) ?? '',
    // same-site paths only ('//host' would be protocol-relative)
    url: url?.startsWith('/') && !url.startsWith('//') ? url : '/',
    tag: str(n.tag, 120),
    type: NOTIFICATION_TYPES.includes(n.type) ? n.type : undefined,
    teams: Array.isArray(n.teams) ? n.teams.filter((t) => typeof t === 'string') : [],
  };
}

export default async (req, context) => {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });
  if (!authorised(req)) return json(401, { error: 'unauthorised' });
  if (!process.env.VAPID_PRIVATE_KEY) return json(500, { error: 'VAPID_PRIVATE_KEY not set' });

  let notifications;
  try {
    const body = await req.json();
    notifications = (body.notifications ?? []).slice(0, 50).map(clean);
  } catch (err) {
    return json(400, { error: err.message });
  }
  if (!notifications.length) return json(200, { sent: 0 });

  const summary = await sendNotifications({
    store: createBlobStore(context?.deploy?.context),
    notifications,
    vapid: { subject: push.vapidSubject, publicKey: push.vapidPublicKey, privateKey: process.env.VAPID_PRIVATE_KEY },
  });
  console.log('push-send', JSON.stringify(summary));
  return json(200, summary);
};
