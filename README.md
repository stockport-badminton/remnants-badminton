# Remnants Badminton Club Website

Static site built with [Astro](https://astro.build), hosted on [Netlify](https://netlify.com), content managed via [Decap CMS](https://decapcms.org).

## Stack

| Layer | Tool |
|---|---|
| Framework | Astro (static output) |
| Styling | Tailwind CSS |
| Hosting | Netlify (free tier) |
| CMS | Decap CMS (`/admin`) |
| Contact form | Netlify Forms |
| Fixtures | GitHub Actions cron scraper |

## Local development

```bash
npm install
npm run dev        # dev server at http://localhost:4321
npm run scrape     # fetch latest fixtures manually
npm run build      # production build → dist/
```

## Deploying to Netlify

1. Push this repo to **github.com/stockportbadminton/remnants-badminton** (or your chosen name)
2. In Netlify: **Add new site → Import from Git** → select the repo
3. Build command: `npm run build` | Publish dir: `dist` (auto-detected)
4. Enable **Netlify Identity** in Site settings → Identity
5. Under Identity → **Git Gateway**: enable it
6. Invite club editors via Identity → **Invite users**

Editors then visit `https://yoursite.netlify.app/admin/` to log in and manage content.

## Content management (for club editors)

Go to `https://yoursite/admin/` and log in with your Netlify Identity invite.

- **Members** — add/edit/remove rogues gallery entries; upload photos
- **Home Page** — edit hero text and about section
- **Theme & Branding** — change site colours and name

## Fixture scraper

The scraper runs automatically every 6 hours via GitHub Actions.

Sources:
- **Stockport**: `https://stockport-badminton.co.uk/fixtures/club-Remnants` (JSON API)
- **Crewe**: `https://www.crewebadminton.org.uk/default.aspx?pageID=22` (HTML scrape)

When the scraper commits an updated `fixtures.json`, Netlify automatically rebuilds and deploys the site.

To run manually: `npm run scrape` (or trigger via GitHub Actions → Scrape Fixtures → Run workflow).

## Theming

Edit `src/data/theme.json` (or use the CMS) to change:
- `primaryColor` — navigation bar, headings, table headers
- `secondaryColor` — links, badge accents
- `accentColor` — call-to-action buttons

Colours accept any CSS colour value (`#hex`, `rgb()`, named colours).
