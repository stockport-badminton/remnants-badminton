/**
 * Wigan badminton fixtures (LeagueRepublic) → src/data/wigan-fixtures.json
 *
 * LeagueRepublic's web-services API is disabled for this league and the site sits
 * behind an AWS WAF JS challenge, so we load the team pages in headless Chromium.
 * Runs weekly (.github/workflows/scrape-wigan.yml); build-calendars.mjs reads the
 * cached JSON so the daily calendar build never needs a browser.
 *
 * Each team page lists the full "Upcoming" fixtures plus recent "Results". Results
 * older than that list are kept from the previous cache so the season stays whole.
 *
 * Run: node scripts/scrape-wigan.mjs   (needs `npx playwright install chromium`)
 */
import { chromium } from 'playwright';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, '../src/data/wigan-fixtures.json');
const BASE = 'https://wiganbadminton.leaguerepublic.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// LeagueRepublic team ids are stable across seasons; only the season id changes.
const TEAMS = [
  { name: 'Bridge A', id: '955351176' },
  { name: 'Y Club A', id: '576777813' },
];

// "16/10/26" → "2026-10-16"
function parseDate(raw) {
  const m = raw.match(/(\d{2})\/(\d{2})\/(\d{2})/);
  return m ? `20${m[3]}-${m[2]}-${m[1]}` : null;
}

async function scrape() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ userAgent: UA });
    // Only the league site and its WAF challenge; skip the ad/tracker payload.
    await page.route('**/*', r =>
      /leaguerepublic\.com|awswaf\.com/.test(new URL(r.request().url()).host) ? r.continue() : r.abort());

    // Current season = the season selected by default on the match hub.
    await page.goto(`${BASE}/matchHub.html`, { waitUntil: 'networkidle' });
    const seasonId = await page.$eval('select[name="mhpc.filterOuterSeasonID"]', s => s.value);
    if (!seasonId) throw new Error('could not find current season id');

    const fixtures = [];
    for (const team of TEAMS) {
      await page.goto(`${BASE}/team/${seasonId}/${team.id}.html`, { waitUntil: 'networkidle' });
      const rows = await page.$$eval('tr', trs => trs
        .filter(tr => tr.querySelector('a[href*="/match/"]'))
        .map(tr => ({
          href: tr.querySelector('a[href*="/match/"]').href,
          cells: [...tr.querySelectorAll('td')].map(td => td.innerText.trim()),
        })));
      if (!rows.length) throw new Error(`${team.name}: no fixture rows found (page layout changed or blocked?)`);
      for (const { href, cells } of rows) {
        // Results:  [date+time, home, score, away]
        // Upcoming: [date+time, home, "vs", away, venue]
        const [when, home, mid, away, venue = ''] = cells.filter(c => c !== '');
        const date = parseDate(when || '');
        if (!date || !home || !away) continue;
        fixtures.push({
          matchId: href.match(/\/match\/(\d+)/)[1],
          date,
          time: (when.match(/\d{1,2}:\d{2}/) || [''])[0],
          home, away,
          venue: mid === 'vs' ? venue.replace(/[,\s]+$/, '') : '',
          url: href,
        });
      }
    }
    return { seasonId, fixtures };
  } finally {
    await browser.close();
  }
}

const { seasonId, fixtures } = await scrape();

// Merge: fresh rows win (Bridge A v Y Club A appears on both pages, same matchId);
// keep cached past matches that have dropped off the "Results" list.
const today = new Date().toISOString().slice(0, 10);
const byId = new Map();
if (existsSync(OUT_FILE)) {
  const prev = JSON.parse(readFileSync(OUT_FILE, 'utf8'));
  for (const f of prev.fixtures || []) if (f.date < today) byId.set(f.matchId, f);
}
for (const f of fixtures) byId.set(f.matchId, f);
const merged = [...byId.values()].sort((a, b) => a.date.localeCompare(b.date) || a.matchId.localeCompare(b.matchId));

writeFileSync(OUT_FILE, JSON.stringify({ seasonId, fixtures: merged }, null, 2) + '\n');
console.log(`Wigan: ${fixtures.length} rows scraped, ${merged.length} fixtures written to ${OUT_FILE}`);
