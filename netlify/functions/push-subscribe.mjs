// POST   /.netlify/functions/push-subscribe  { subscription, teams }  → save / update
// DELETE /.netlify/functions/push-subscribe  { endpoint }             → remove
import fixtures from '../../src/data/fixtures.json' with { type: 'json' };
import { clubTopics } from '../../src/lib/push/teams.mjs';
import { subscriptionId, validateSubscription, validateTeams } from '../../src/lib/push/subscription.mjs';
import { createBlobStore } from '../../src/lib/push/store-blobs.mjs';

const MAX_BODY = 4096;
// Accept any topic seen in the data (not just this season) so a stale page
// can't make a save fail; the UI only offers current-season topics.
const TEAMS = clubTopics(fixtures.fixtures, { allSeasons: true }).map((t) => t.key);

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req, context) => {
  if (req.method !== 'POST' && req.method !== 'DELETE') return json(405, { error: 'method not allowed' });

  // Browsers always send Origin on fetch POST/DELETE; reject other sites' pages.
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) return json(403, { error: 'forbidden' });

  const text = await req.text();
  if (text.length > MAX_BODY) return json(413, { error: 'too large' });
  let body;
  try { body = JSON.parse(text); } catch { return json(400, { error: 'invalid json' }); }

  const store = createBlobStore(context?.deploy?.context);

  try {
    if (req.method === 'DELETE') {
      if (typeof body.endpoint !== 'string') throw new Error('missing endpoint');
      await store.remove(subscriptionId(body.endpoint));
      return json(200, { ok: true });
    }

    const subscription = validateSubscription(body.subscription);
    const teams = validateTeams(body.teams, TEAMS);
    const id = subscriptionId(subscription.endpoint);
    const now = new Date().toISOString();
    const existing = await store.get(id);
    await store.put(id, { subscription, teams, createdAt: existing?.createdAt ?? now, updatedAt: now });
    return json(200, { ok: true, teams });
  } catch (err) {
    return json(400, { error: err.message });
  }
};
