// Scheduled: new-result notifications, once a day at 12:00 UK.
// The GitHub scrape updates fixtures.json overnight; this reads it and notifies
// any result it hasn't announced before. The ids already announced are kept in
// Netlify Blobs, so a missed day is caught up on the next run.
// Cron is UTC: runs at 11:00 and 12:00 UTC and acts only at 12:00 UK.
import bundled from '../../src/data/fixtures.json' with { type: 'json' };
import { resultNotifications } from '../../src/lib/push/diff.mjs';
import { deliver, fetchFixtures, stateStore, ukHour } from '../../src/lib/push/scheduled.mjs';

const KEY = 'results-announced'; // JSON array of fixture ids
const MAX_PER_RUN = 10; // more than this is a back-fill/re-import, not news
const scored = (fixtures) =>
  fixtures.filter((f) => f.status === 'complete' && f.homeScore != null && f.awayScore != null).map((f) => f.id);

export default async () => {
  if (ukHour() !== 12) return console.log(`push-results: ${ukHour()}:00 UK — not the 12:00 slot.`);

  const state = stateStore();
  const fixtures = await fetchFixtures();
  // First run: the results in this deploy's bundled fixtures.json were already
  // announced by the old GitHub workflow, so start from those.
  const announced = new Set((await state.get(KEY, { type: 'json' })) ?? scored(bundled.fixtures));

  const before = fixtures.filter((f) => announced.has(f.id));
  const notifications = resultNotifications(before, fixtures);

  // Record before sending: a failed send shouldn't repeat tomorrow as a burst.
  await state.setJSON(KEY, [...new Set([...announced, ...scored(fixtures)])]);

  if (!notifications.length) return console.log('push-results: no new results.');
  if (notifications.length > MAX_PER_RUN) {
    console.warn(`push-results: ${notifications.length} new results looks like a back-fill — not sending.`);
    return;
  }
  notifications.forEach((n) => console.log(`push-results: ${n.title} — ${n.body}`));
  console.log('push-results', JSON.stringify(await deliver(notifications)));
};

export const config = { schedule: '0 11,12 * * *' };
