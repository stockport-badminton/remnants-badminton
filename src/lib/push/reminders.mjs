// Match-day reminders: one notification per club fixture being played today.
// Site-specific, like diff.mjs; emits the shared notification shape.
//
// Neither league publishes start times (Crewe's 19:00 is a placeholder,
// Stockport's dates are midnight), so "today" is the fixture's UK calendar date
// and the message says "tonight" rather than giving a time.
import { teamKey, topicOf } from './teams.mjs';

const TZ = 'Europe/London';
const ukDate = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d); // YYYY-MM-DD

/** @param {Array} fixtures  @param {{ now?: Date }} opts */
export function matchDayNotifications(fixtures, { now = new Date() } = {}) {
  const today = ukDate(now);
  const out = [];
  for (const f of fixtures) {
    if (f.status === 'complete') continue;
    if (ukDate(new Date(f.date)) !== today) continue;
    const topic = topicOf(f);
    if (!topic) continue;
    const opponent = teamKey(f.isHome ? f.awayTeam : f.homeTeam);
    out.push({
      type: 'reminders',
      teams: [topic.key],
      title: `Match day: ${topic.label}`,
      body: `vs ${opponent} (${f.isHome ? 'home' : 'away'}) tonight`,
      url: '/fixtures',
      tag: `reminder-${f.id}`,
    });
  }
  return out;
}
