// Team identity for push topics. Leagues spell the same team differently
// (Crewe: "Remnants 'A'", Stockport: "Remnants A"), so subscriptions use a
// normalised key and one subscription covers a team in every league.

export const CLUB_PATTERN = /remnants/i;

export function teamKey(name) {
  return String(name).replace(/['"‘’“”]/g, '').replace(/\s+/g, ' ').trim();
}

export function isClubTeam(name) {
  return CLUB_PATTERN.test(String(name));
}

/** Sorted, de-duplicated club team keys found in a fixtures list. */
export function clubTeams(fixtures) {
  const keys = new Set();
  for (const f of fixtures) {
    for (const name of [f.homeTeam, f.awayTeam]) {
      if (isClubTeam(name)) keys.add(teamKey(name));
    }
  }
  return [...keys].sort();
}
