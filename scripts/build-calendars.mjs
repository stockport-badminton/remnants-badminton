/**
 * Personal badminton calendar builder.
 *
 * Aggregates fixtures for the teams Neil & his wife play across five leagues and
 * writes three importable / subscribable iCalendar files:
 *   public/calendars/combined.ics  — everything (both of us)
 *   public/calendars/mine.ics      — Neil's teams
 *   public/calendars/wife.ics      — wife's teams
 *
 * Sources: Stockport & Tameside (JSON API), Crewe & Manchester (HTML scrape),
 * Wigan (LeagueRepublic). All-day events; venue + map in the details where known.
 *
 * Run: node scripts/build-calendars.mjs
 */
import { load } from 'cheerio';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../public/calendars');

// ── Who plays what ───────────────────────────────────────────────────────────
// who: 'me' | 'wife' | 'both'
const PLAN = [
  { league: 'Stockport',  source: 'stockport', club: 'Remnants', team: 'Remnants A', who: 'wife' },
  { league: 'Crewe',      source: 'crewe',     team: 'Remnants', comp: 'Mens 1',   who: 'me' },
  { league: 'Crewe',      source: 'crewe',     team: 'Remnants', comp: 'Hybrid 1', who: 'me' },
  { league: 'Tameside',   source: 'tameside',  club: 'Hyde',     team: 'Hyde A',   who: 'wife' },
  { league: 'Tameside',   source: 'tameside',  club: 'Hyde',     team: 'Hyde B',   who: 'me' },
  { league: 'Manchester', source: 'mcrbl',     team: 'Hyde 1',   who: 'wife' },
  // Wigan (LeagueRepublic) deferred: the league hasn't enabled LeagueRepublic
  // web services ("League is not authorised to access webservices") and the team
  // pages are JS-rendered, so there's no clean feed to pull. Re-enable here if
  // they turn web services on, or add a Playwright scrape.
  // { league: 'Wigan', source: 'leaguerepublic', team: 'Bridge A', who: 'both' },
  // { league: 'Wigan', source: 'leaguerepublic', team: 'Y Club A', who: 'both' },
];

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const norm = s => (s || '').trim().toLowerCase();
const eq = (a, b) => norm(a) === norm(b);

// Stockport & Tameside share a division id-scheme; Tameside's API omits the name.
const DIVISION_NAMES = { 7: 'Premier', 8: 'Division 1', 9: 'Division 2', 10: 'Division 3' };

// A normalised fixture: { uid, league, comp, date(YYYY-MM-DD), ourTeam, opponent, isHome, venue, mapUrl }
function slug(s) { return (s || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase(); }

// ── Stockport & Tameside share the same JSON API shape ───────────────────────
async function fetchLeagueApi({ league, base, club, entries }) {
  const url = `${base}/fixtures/club-${encodeURIComponent(club)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${league} API ${res.status}`);
  const raw = await res.json();
  const wanted = entries.map(e => norm(e.team));
  const out = [];
  for (const f of raw) {
    const home = f.homeTeam ?? '', away = f.awayTeam ?? '';
    const isHome = wanted.includes(norm(home));
    const isAway = wanted.includes(norm(away));
    if (!isHome && !isAway) continue;
    const ourTeam = isHome ? home : away;
    const plan = entries.find(e => eq(e.team, ourTeam));
    out.push({
      uid: `${league.toLowerCase()}-${f.id}@sdbl-cal`,
      league, comp: f.divisionName || DIVISION_NAMES[f.division] || (f.division != null ? `Div ${f.division}` : ''),
      date: String(f.date).slice(0, 10),
      ourTeam, opponent: isHome ? away : home, isHome,
      venue: f.venueName || '', mapUrl: f.venueLink || '',
      who: plan.who,
    });
  }
  return out;
}

// ── Current-season cutoff (Aug 1; season rolls over in June) ─────────────────
// Excludes last season's results so calendars only carry the current season.
function seasonCutoff() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const startYear = now.getUTCMonth() >= 5 /* June+ */ ? y : y - 1;
  return `${startYear}-08-01`;
}
const CUTOFF = seasonCutoff();

// ── Crewe (HTML scrape of the ASP.NET fixtures table) ────────────────────────
const MONTH_MAP = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
function inferYear(month) {
  const now = new Date(); const cm = now.getMonth() + 1, cy = now.getFullYear();
  if (month >= 9) return cm >= 6 ? cy : cy - 1;
  return cm >= 6 ? cy + 1 : cy;
}
function parseCreweDate(raw) {
  const p = raw.trim().split(/\s+/); if (p.length < 2) return null;
  const day = parseInt(p[0], 10); const month = MONTH_MAP[p[1].toLowerCase().slice(0, 3)];
  if (!month || isNaN(day)) return null;
  const year = p[2] ? parseInt(p[2], 10) : inferYear(month);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
async function fetchCrewe(entries) {
  const res = await fetch('https://www.crewebadminton.org.uk/default.aspx?pageID=22&ClubID=67', { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Crewe ${res.status}`);
  const $ = load(await res.text());
  const out = [];
  $('#ctl00_MainContent_ctl00_dgrFixtures td[id*="dgrFixtures"]').each((_, cell) => {
    const $cell = $(cell);
    const dateStr = $cell.find('[id*="txtMatchDate"]').text().trim();
    const s = $cell.nextAll('td');
    // Crewe labels teams like "Remnants 'A'" and comps like "Mens(6) Division 1";
    // tidy to "Remnants A" and "Mens 1".
    const cleanTeam = t => t.replace(/'/g, '').replace(/\s+/g, ' ').trim();
    const cleanComp = c => { const w = (c.match(/^[A-Za-z]+/) || [''])[0]; const n = (c.match(/(\d+)\s*$/) || [])[1]; return n ? `${w} ${n}` : c.trim(); };
    const comp = cleanComp(s.eq(0).text().trim());
    const home = cleanTeam(s.eq(1).text());
    const away = cleanTeam(s.eq(2).text());
    if (!dateStr || !home || !away) return;
    const isHome = norm(home).includes('remnants');
    const isAway = norm(away).includes('remnants');
    if (!isHome && !isAway) return;
    const date = parseCreweDate(dateStr); if (!date) return;
    const ourTeam = isHome ? home : away;
    out.push({
      uid: `crewe-${date}-${slug(home)}-${slug(away)}@sdbl-cal`,
      league: 'Crewe', comp, date, ourTeam, opponent: isHome ? away : home, isHome,
      venue: '', mapUrl: '', who: 'me', // all Crewe Remnants (Mens 1 + Hybrid 1) are Neil's
    });
  });
  return out;
}

// ── Manchester (MCRBL) — chronological table scrape ──────────────────────────
async function fetchMcrbl(entries) {
  const teams = entries.map(e => norm(e.team));
  const res = await fetch('https://mcrbl.org.uk/fixtures.php', { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`MCRBL ${res.status}`);
  const $ = load(await res.text());
  const out = [];
  $('tr').each((_, tr) => {
    const td = $(tr).find('td');
    if (td.length < 4) return;
    const date = $(td[0]).text().trim();
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return; // only chronological-list rows
    const comp = $(td[2]).text().trim();
    const parts = $(td[3]).text().trim().split(/\s+v\s+/i);
    if (parts.length !== 2) return;
    const home = parts[0].trim(), away = parts[1].trim();
    const isHome = teams.includes(norm(home)), isAway = teams.includes(norm(away));
    if (!isHome && !isAway) return;
    const [d, mo, y] = date.split('/');
    const ourTeam = isHome ? home : away;
    const plan = entries.find(e => eq(e.team, ourTeam)) || entries[0];
    out.push({
      uid: `manchester-${y}${mo}${d}-${slug(home)}-${slug(away)}@sdbl-cal`,
      league: 'Manchester', comp, date: `${y}-${mo}-${d}`,
      ourTeam, opponent: isHome ? away : home, isHome, venue: '', mapUrl: '', who: plan.who,
    });
  });
  return out;
}

// ── Source dispatch ──────────────────────────────────────────────────────────
async function gather() {
  const bySource = {};
  for (const p of PLAN) (bySource[p.source] = bySource[p.source] || []).push(p);
  const all = [];
  const report = [];

  for (const [source, entries] of Object.entries(bySource)) {
    try {
      let fx = [];
      if (source === 'stockport') fx = await fetchLeagueApi({ league: 'Stockport', base: 'https://stockport-badminton.co.uk', club: 'Remnants', entries });
      else if (source === 'tameside') fx = await fetchLeagueApi({ league: 'Tameside', base: 'https://tameside-badminton.co.uk', club: 'Hyde', entries });
      else if (source === 'crewe') fx = await fetchCrewe(entries);
      else if (source === 'mcrbl') fx = await fetchMcrbl(entries);
      else { report.push(`${source}: (not implemented yet)`); continue; }
      const kept = fx.filter(f => f.date >= CUTOFF); // current season only
      all.push(...kept);
      report.push(`${source}: ${kept.length} fixtures (${fx.length - kept.length} pre-season dropped)`);
    } catch (err) {
      report.push(`${source}: FAILED — ${err.message}`);
    }
  }
  return { all, report };
}

// ── iCalendar output ─────────────────────────────────────────────────────────
function esc(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
function fold(line) { // RFC5545: fold at 75 octets
  if (line.length <= 75) return line;
  let out = line.slice(0, 75); let rest = line.slice(75);
  while (rest.length) { out += '\r\n ' + rest.slice(0, 74); rest = rest.slice(74); }
  return out;
}
function ymd(dateStr) { return dateStr.replace(/-/g, ''); }
function nextDay(dateStr) { const d = new Date(dateStr + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }

function title(f) {
  // e.g. "Tameside · Div 1 · Hyde B (A) v Medlock A"
  const ha = f.isHome ? 'H' : 'A';
  const bits = [f.league, f.comp, `${f.ourTeam} (${ha}) v ${f.opponent}`].filter(Boolean);
  return bits.join(' · ');
}
function description(f) {
  const lines = [`${f.league}${f.comp ? ' ' + f.comp : ''}: ${f.isHome ? f.ourTeam + ' v ' + f.opponent + ' (home)' : f.opponent + ' v ' + f.ourTeam + ' (away)'}`];
  if (f.venue) lines.push(`Venue: ${f.venue}`);
  if (f.mapUrl) lines.push(`Map: ${f.mapUrl}`);
  if (!f.venue) lines.push('Venue/time: check the league site');
  return lines.join('\n');
}

function buildIcs(fixtures, calName, stampIso) {
  const stamp = stampIso.replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace(/(\d{8}T\d{6}).*/, '$1Z');
  const out = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//sdbl//personal-badminton-cal//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(calName)}`,
  ];
  for (const f of fixtures.slice().sort((a, b) => a.date.localeCompare(b.date))) {
    out.push('BEGIN:VEVENT');
    out.push(`UID:${f.uid}`);
    out.push(`DTSTAMP:${stamp}`);
    out.push(`DTSTART;VALUE=DATE:${ymd(f.date)}`);
    out.push(`DTEND;VALUE=DATE:${ymd(nextDay(f.date))}`);
    out.push(fold(`SUMMARY:${esc(title(f))}`));
    if (f.venue) out.push(fold(`LOCATION:${esc(f.venue)}`));
    out.push(fold(`DESCRIPTION:${esc(description(f))}`));
    if (f.mapUrl) out.push(fold(`URL:${esc(f.mapUrl)}`));
    out.push('TRANSP:OPAQUE');                 // show as Busy (blocks time)
    out.push('X-MICROSOFT-CDO-BUSYSTATUS:BUSY'); // same for Outlook
    out.push('END:VEVENT');
  }
  out.push('END:VCALENDAR');
  return out.map(fold).join('\r\n') + '\r\n';
}

// ── Main ─────────────────────────────────────────────────────────────────────
const stampIso = new Date().toISOString();
const { all, report } = await gather();

// dedupe by uid (Wigan "both" etc.)
const byUid = new Map(all.map(f => [f.uid, f]));
const unique = [...byUid.values()];

const mine = unique.filter(f => f.who === 'me' || f.who === 'both');
const wife = unique.filter(f => f.who === 'wife' || f.who === 'both');
const combined = unique;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'combined.ics'), buildIcs(combined, 'Badminton — Both of us', stampIso));
writeFileSync(join(OUT_DIR, 'mine.ics'), buildIcs(mine, 'Badminton — Mine', stampIso));
writeFileSync(join(OUT_DIR, 'wife.ics'), buildIcs(wife, 'Badminton — Wife', stampIso));

console.log('Sources:');
report.forEach(r => console.log('  ' + r));
console.log(`\nTotals — combined ${combined.length}, mine ${mine.length}, wife ${wife.length}`);
console.log(`Wrote ${OUT_DIR}/{combined,mine,wife}.ics`);
