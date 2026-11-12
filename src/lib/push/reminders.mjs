// Match reminders: one notification per unplayed club fixture, sent twice —
// the evening before ("tomorrow") and early on match evening ("tonight").
// Site-specific, like diff.mjs; emits the shared notification shape.
//
// Neither league publishes start times (Crewe's 19:00 is a placeholder,
// Stockport's dates are midnight), so fixtures are matched on their UK calendar
// date and the send times are fixed around the usual 7–8pm start; see
// .github/workflows/match-day-reminders.yml.
import { teamKey, topicOf } from './teams.mjs';

const TZ = 'Europe/London';
const ukDate = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d); // YYYY-MM-DD
const DAY_MS = 24 * 60 * 60 * 1000;

export const REMINDER_KINDS = ['tonight', 'tomorrow'];

/**
 * @param {Array} fixtures
 * @param {{ now?: Date, when?: 'tonight' | 'tomorrow' }} opts
 */
export function reminderNotifications(fixtures, { now = new Date(), when = 'tonight' } = {}) {
  if (!REMINDER_KINDS.includes(when)) throw new Error(`unknown reminder kind: ${when}`);
  // +24h lands on the next UK date even across a clock change, as long as `now`
  // isn't within an hour of midnight (sends are at 17:00/18:00 UK).
  const target = ukDate(when === 'tomorrow' ? new Date(now.getTime() + DAY_MS) : now);
  const word = when === 'tomorrow' ? 'Tomorrow' : 'Tonight';
  const out = [];
  for (const f of fixtures) {
    if (f.status === 'complete') continue;
    if (ukDate(new Date(f.date)) !== target) continue;
    const topic = topicOf(f);
    if (!topic) continue;
    const opponent = teamKey(f.isHome ? f.awayTeam : f.homeTeam);
    out.push({
      type: 'reminders',
      teams: [topic.key],
      title: `${word}: ${topic.label}`,
      body: `vs ${opponent} (${f.isHome ? 'home' : 'away'})`,
      url: '/fixtures',
      // Distinct per kind: a same-tag notification replaces the old one silently,
      // so tonight's reminder wouldn't buzz if it reused tomorrow's tag.
      tag: `reminder-${when}-${f.id}`,
    });
  }
  return out;
}
