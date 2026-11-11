// Push topics. A subscriber picks the club sides they care about; each side is
// one team in one competition, e.g. "Stockport – Division 1", "Crewe – Hybrid".
//
// Topic keys must survive promotion/relegation, so they drop the division
// *level* ("Premier", "Division 1") and keep only what identifies the
// competition. Crewe runs Mens / Mens(6) / Mixed / Hybrid, all as
// "<X> Division N"; Stockport's divisions are pure levels. So:
//   Stockport "Premier" and "Division 1"  → key "Stockport|Remnants A|"
//   Crewe "Hybrid Division 1" (or 2)       → key "Crewe|Remnants A|Hybrid"
// Labels shown to people use the current division name instead.

export const CLUB_PATTERN = /remnants/i;

export function teamKey(name) {
  return String(name).replace(/['"‘’“”]/g, '').replace(/\s+/g, ' ').trim();
}

export function isClubTeam(name) {
  return CLUB_PATTERN.test(String(name));
}

/** "Hybrid Division 1" → "Hybrid"; "Premier" / "Division 1" → "". */
export function competitionStem(division) {
  return String(division ?? '')
    .replace(/\s*(Premier(\s+Division)?|Division\s*\d+)\s*$/i, '')
    .trim();
}

/** { key, label, team } for a club fixture, or null if the club isn't playing. */
export function topicOf(f) {
  const ours = f.isHome ? f.homeTeam : f.awayTeam;
  if (!isClubTeam(ours)) return null;
  const team = teamKey(ours);
  const stem = competitionStem(f.division);
  return {
    key: [f.league, team, stem].join('|'),
    label: `${f.league} – ${stem || f.division || 'League'}`,
    team,
  };
}

/**
 * Topics to offer, sorted by label. By default only the season of the most
 * recent fixture (Jul–Jun), so last season's competitions aren't offered;
 * pass { allSeasons: true } for the full set (used for server-side validation).
 */
export function clubTopics(fixtures, { allSeasons = false } = {}) {
  let pool = fixtures;
  if (!allSeasons && fixtures.length) {
    const latest = new Date(Math.max(...fixtures.map((f) => new Date(f.date).getTime())));
    const seasonYear = latest.getUTCMonth() >= 6 ? latest.getUTCFullYear() : latest.getUTCFullYear() - 1;
    const start = Date.UTC(seasonYear, 6, 1);
    pool = fixtures.filter((f) => new Date(f.date).getTime() >= start);
  }

  // Latest fixture wins the label, so it shows the current division name.
  const byKey = new Map();
  for (const f of [...pool].sort((a, b) => a.date.localeCompare(b.date))) {
    const t = topicOf(f);
    if (t) byKey.set(t.key, t);
  }
  const topics = [...byKey.values()];
  // Only name the team when the club has more than one side in play.
  const multiTeam = new Set(topics.map((t) => t.team)).size > 1;
  return topics
    .map(({ key, label, team }) => ({ key, label: multiTeam ? `${team} · ${label}` : label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
