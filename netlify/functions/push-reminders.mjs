// Scheduled: match reminders for club fixtures.
//   18:00 UK the evening before → "Tomorrow: …"
//   17:00 UK on match day        → "Tonight: …"
// Cron is UTC, so it runs at 16:00, 17:00 and 18:00 UTC and acts only on the
// 17:00/18:00 UK slots (covers GMT and BST). Days with no fixture send nothing.
import { reminderNotifications } from '../../src/lib/push/reminders.mjs';
import { deliver, fetchFixtures, stateStore, ukDate, ukHour } from '../../src/lib/push/scheduled.mjs';

const SLOTS = { 17: 'tonight', 18: 'tomorrow' };

export default async () => {
  const now = new Date();
  const when = SLOTS[ukHour(now)];
  if (!when) return console.log(`push-reminders: ${ukHour(now)}:00 UK isn't a reminder slot.`);

  const notifications = reminderNotifications(await fetchFixtures(), { now, when });
  if (!notifications.length) return console.log(`push-reminders: no club fixtures ${when === 'tomorrow' ? 'tomorrow' : 'today'}.`);

  // Guard against a repeat invocation sending the same slot twice.
  const state = stateStore();
  const key = `reminders-${ukDate(now)}-${when}`;
  if (await state.get(key)) return console.log(`push-reminders: ${key} already sent.`);
  await state.set(key, now.toISOString());

  notifications.forEach((n) => console.log(`push-reminders: ${n.title} — ${n.body}`));
  console.log('push-reminders', JSON.stringify(await deliver(notifications)));
};

export const config = { schedule: '0 16-18 * * *' };
