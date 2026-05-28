/**
 * Fetches fixture data from two sources and writes a unified fixtures.json.
 *
 * Sources:
 *   1. Stockport Badminton League — JSON API (already filtered to Remnants)
 *   2. Crewe & District League    — HTML table scrape, filtered for Remnants
 *
 * Run: node scripts/scrape-fixtures.mjs
 * Or:  npm run scrape
 */

import { load } from 'cheerio';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '../src/data/fixtures.json');

const STOCKPORT_URL = 'https://stockport-badminton.co.uk/fixtures/club-Remnants';
const CREWE_URL = 'https://www.crewebadminton.org.uk/default.aspx?pageID=22';

// ── Helpers ──────────────────────────────────────────────────────────────────

function isRemnants(name) {
  return name.toLowerCase().includes('remnants');
}

function calcResult(isHome, homeScore, awayScore) {
  if (homeScore === null || awayScore === null) return null;
  const remnantScore = isHome ? homeScore : awayScore;
  const opponentScore = isHome ? awayScore : homeScore;
  if (remnantScore > opponentScore) return 'W';
  if (remnantScore < opponentScore) return 'L';
  return 'D';
}

// Infer year for a month/day string within a badminton season (Sep–May).
// Assumes the current season: if month >= 9 → autumn half, else → spring half.
function inferYear(month) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-based
  const currentYear = now.getFullYear();
  if (month >= 9) {
    // Autumn half of season
    return currentMonth >= 6 ? currentYear : currentYear - 1;
  } else {
    // Spring half of season
    return currentMonth >= 6 ? currentYear + 1 : currentYear;
  }
}

// ── Stockport (JSON API) ─────────────────────────────────────────────────────

async function fetchStockport() {
  console.log('Fetching Stockport fixtures…');
  const res = await fetch(STOCKPORT_URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Stockport API ${res.status}`);

  const raw = await res.json();
  const fixtures = [];

  for (const f of raw) {
    const homeTeam = f.homeTeam ?? '';
    const awayTeam = f.awayTeam ?? '';
    const isHome = isRemnants(homeTeam);
    const isAway = isRemnants(awayTeam);

    // Only include matches involving Remnants
    if (!isHome && !isAway) continue;

    const homeScore = f.homeScore ?? null;
    const awayScore = f.awayScore ?? null;

    fixtures.push({
      id: `stockport-${f.id}`,
      league: 'Stockport',
      date: f.date,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      status: f.status === 'outstanding' ? 'outstanding' : 'complete',
      isHome,
      division: f.division ? `Division ${f.division}` : '',
      result: calcResult(isHome, homeScore, awayScore),
    });
  }

  console.log(`  → ${fixtures.length} Stockport fixtures`);
  return fixtures;
}

// ── Crewe (HTML scrape) ──────────────────────────────────────────────────────

const MONTH_MAP = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function parseCreweDate(raw) {
  // Raw format: "21 Apr" or "21 Apr 2026"
  const parts = raw.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const day = parseInt(parts[0], 10);
  const month = MONTH_MAP[parts[1].toLowerCase().slice(0, 3)];
  if (!month || isNaN(day)) return null;
  const year = parts[2] ? parseInt(parts[2], 10) : inferYear(month);
  return new Date(year, month - 1, day, 19, 0, 0).toISOString();
}

async function fetchCrewe() {
  console.log('Fetching Crewe fixtures…');
  const res = await fetch(CREWE_URL);
  if (!res.ok) throw new Error(`Crewe page ${res.status}`);
  const html = await res.text();
  const $ = load(html);

  const fixtures = [];

  // Target the main fixtures table by its known ID on the Crewe site.
  // Fall back to scanning all tables if the ID changes in future.
  const tableSelector =
    '#ctl00_MainContent_ctl00_dgrFixtures, table.table-condensed';

  $(tableSelector).each((_, table) => {
    // Crewe uses <tr class="headerrow"><td> rather than <thead><th>
    const headerRow = $(table).find('tr.headerrow').first();
    const headers = headerRow.length
      ? headerRow.find('td').map((_, el) => $(el).text().trim().toLowerCase()).get()
      : $(table).find('th, thead td').map((_, el) => $(el).text().trim().toLowerCase()).get();

    const hasFixtureColumns =
      headers.some((h) => h.includes('home')) &&
      headers.some((h) => h.includes('away'));

    if (!hasFixtureColumns) return;

    $(table).find('tr').not('.headerrow').each((rowIdx, row) => {
      const cells = $(row).find('td');
      if (cells.length < 4) return;

      // Try to map cells by header position, fall back to positional
      let dateStr, division, homeTeam, awayTeam, resultText, gamesHome, gamesAway;

      if (headers.length >= 4) {
        const dateIdx = headers.findIndex((h) => h.includes('date'));
        const divIdx = headers.findIndex((h) => h.includes('div'));
        const homeIdx = headers.findIndex((h) => h.includes('home'));
        const awayIdx = headers.findIndex((h) => h.includes('away'));
        const resultIdx = headers.findIndex((h) => h.includes('result') || h.includes('score'));

        dateStr = dateIdx >= 0 ? $(cells[dateIdx]).text().trim() : $(cells[0]).text().trim();
        division = divIdx >= 0 ? $(cells[divIdx]).text().trim() : '';
        homeTeam = homeIdx >= 0 ? $(cells[homeIdx]).text().trim() : $(cells[2]).text().trim();
        awayTeam = awayIdx >= 0 ? $(cells[awayIdx]).text().trim() : $(cells[3]).text().trim();
        resultText = resultIdx >= 0 ? $(cells[resultIdx]).text().trim() : '';

        // Games columns (typically after result)
        if (resultIdx >= 0 && cells.length > resultIdx + 1) {
          gamesHome = $(cells[resultIdx + 1]).text().trim();
          gamesAway = $(cells[resultIdx + 2])?.text().trim();
        }
      } else {
        // Positional fallback: Date | Division | Home | Away | Result | GH | GA
        dateStr = $(cells[0]).text().trim();
        division = $(cells[1]).text().trim();
        homeTeam = $(cells[2]).text().trim();
        awayTeam = $(cells[3]).text().trim();
        resultText = $(cells[4])?.text().trim() ?? '';
        gamesHome = $(cells[5])?.text().trim();
        gamesAway = $(cells[6])?.text().trim();
      }

      if (!homeTeam || !awayTeam) return;

      const isHome = isRemnants(homeTeam);
      const isAway = isRemnants(awayTeam);
      if (!isHome && !isAway) return;

      const parsedDate = parseCreweDate(dateStr);
      if (!parsedDate) return;

      // Parse scores: "8 - 10" or "8-10"
      const scoreMatch = resultText.match(/(\d+)\s*[-–]\s*(\d+)/);
      const homeScore = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
      const awayScore = scoreMatch ? parseInt(scoreMatch[2], 10) : null;
      const status = homeScore !== null ? 'complete' : 'outstanding';

      fixtures.push({
        id: `crewe-${parsedDate}-${homeTeam.replace(/\s+/g, '-')}`,
        league: 'Crewe',
        date: parsedDate,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        status,
        isHome,
        division: division || 'Crewe League',
        result: calcResult(isHome, homeScore, awayScore),
      });
    });
  });

  console.log(`  → ${fixtures.length} Crewe fixtures`);
  return fixtures;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Read existing data so we can preserve whatever source didn't error
  let existing = { fixtures: [], lastUpdated: null };
  try {
    existing = JSON.parse(readFileSync(OUTPUT, 'utf-8'));
  } catch {
    // First run
  }

  const existingStockport = existing.fixtures.filter((f) => f.id.startsWith('stockport-'));
  const existingCrewe = existing.fixtures.filter((f) => f.id.startsWith('crewe-'));

  let stockportFixtures = existingStockport;
  let creweFixtures = existingCrewe;
  let anyError = false;

  try {
    stockportFixtures = await fetchStockport();
  } catch (err) {
    console.error('Stockport fetch failed:', err.message);
    console.warn('  Keeping existing Stockport data.');
    anyError = true;
  }

  try {
    creweFixtures = await fetchCrewe();
  } catch (err) {
    console.error('Crewe fetch failed:', err.message);
    console.warn('  Keeping existing Crewe data.');
    anyError = true;
  }

  const combined = [...stockportFixtures, ...creweFixtures].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const output = {
    fixtures: combined,
    lastUpdated: anyError ? existing.lastUpdated : new Date().toISOString(),
  };

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${combined.length} fixtures to ${OUTPUT}`);
}

main().catch((err) => {
  console.error('Fatal scraper error:', err);
  process.exit(1);
});
