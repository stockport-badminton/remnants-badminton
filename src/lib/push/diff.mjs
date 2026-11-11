// Turns a before/after pair of fixtures.json snapshots into push notifications.
// Site-specific: other projects will have their own version of this file that
// emits the same notification shape ({ teams, title, body, url, tag }).
import { isClubTeam, teamKey } from './teams.mjs';

const RESULT_WORD = { W: 'Won', L: 'Lost', D: 'Drew' };

function hasScore(f) {
  return f && f.status === 'complete' && f.homeScore != null && f.awayScore != null;
}

/**
 * @param {Array} before  fixtures from the previous snapshot
 * @param {Array} after   fixtures from the new snapshot
 * @param {{ now?: Date, maxAgeDays?: number }} opts
 *   maxAgeDays guards against back-fills: a completed fixture that is new to the
 *   data (no previous id, e.g. first scrape of a season) only notifies if recent.
 */
export function resultNotifications(before, after, { now = new Date(), maxAgeDays = 14 } = {}) {
  const prev = new Map(before.map((f) => [f.id, f]));
  const cutoff = now.getTime() - maxAgeDays * 86_400_000;
  const out = [];

  for (const f of after) {
    if (!hasScore(f)) continue;
    const old = prev.get(f.id);
    if (hasScore(old)) continue; // already reported
    if (!old && new Date(f.date).getTime() < cutoff) continue;

    const ours = f.isHome ? f.homeTeam : f.awayTeam;
    const theirs = f.isHome ? f.awayTeam : f.homeTeam;
    if (!isClubTeam(ours)) continue;
    const us = f.isHome ? f.homeScore : f.awayScore;
    const them = f.isHome ? f.awayScore : f.homeScore;
    const team = teamKey(ours);
    const word = RESULT_WORD[f.result] ?? 'Result';

    out.push({
      teams: [team],
      title: `${team}: ${word} ${us}–${them}`,
      body: `vs ${teamKey(theirs)} (${f.isHome ? 'home' : 'away'}) · ${f.league} ${f.division ?? ''}`.trim(),
      url: '/fixtures',
      tag: `result-${f.id}`,
    });
  }
  return out;
}
