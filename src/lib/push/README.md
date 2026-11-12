# Push notifications

Result notifications and match-day reminders for club teams, using standard Web Push with our own VAPID keys. There is no third-party service.

Subscribers choose **teams** (topics) and **types** (`results`, `reminders`). An empty list means "everything", so older subscriptions with no `types` still get everything.

## How it fits together

```
fixtures page ── PushSubscribe.astro ──POST──▶ netlify/functions/push-subscribe ──▶ store
                                                                                     │
GitHub Action (daily scrape) ── scripts/push-notify.mjs                              │
   diffs fixtures.json HEAD~1→HEAD ──POST (Bearer secret)──▶ push-send ── list ◀────┘
GitHub Action (17:00/18:00 UK) ── push-notify.mjs --reminders tonight|tomorrow ──┘
                                                               │
                                                     web-push → FCM / Apple / Mozilla
                                                               │
                                              public/sw.js `push` → showNotification
```

| File | Portable? | Notes |
|---|---|---|
| `send.mjs` | ✅ as-is | Fans out notifications in batches of 25 and prunes 404/410 subscriptions. Needs a store with `list()` and `remove(id)`. |
| `subscription.mjs` | ✅ as-is | Validates the endpoint against known push services and hashes it to an id. |
| `store-blobs.mjs` | 🔁 swap | Netlify Blobs. For a site with a database, implement `put/get/remove/list` against a table (see below). Preview deploys use a separate store. |
| `teams.mjs` | 🔁 adapt | Defines the *topics* people subscribe to: one per club side per competition. Keys ignore the division level so they survive promotion and relegation (`Stockport\|Remnants A\|`, `Crewe\|Remnants A\|Hybrid`). Labels show the current division ("Stockport – Division 1"). The UI offers the current season's topics; the server accepts topics from any season. |
| `diff.mjs` | 🔁 adapt | Converts the site's data changes into `{ type: 'results', teams, title, body, url, tag }`. |
| `reminders.mjs` | 🔁 adapt | Builds `{ type: 'reminders', … }` for tomorrow's fixtures (sent 18:00 UK the evening before) or tonight's (sent 17:00 UK). No league publishes start times, so the send times are fixed around the usual 7–8pm start. The workflow turns UTC cron into UK slots, including across clock changes. With real start times you could send relative to each match instead. Each kind has its own tag, because a same-tag notification replaces the old one silently. |
| `public/sw.js` (push section) | ✅ as-is | Handles `push` and `notificationclick`. |
| `PushSubscribe.astro` | ✅ mostly | The UI handles unsupported browsers, iOS "add to Home Screen" first, blocked permission, subscribe, change teams and turn off. |

### Database store (for sites with a DB)

```sql
create table push_subscriptions (
  id          text primary key,          -- sha256(endpoint)
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  teams       text[] not null default '{}', -- empty = all teams
  types       text[] not null default '{}', -- 'results' | 'reminders'; empty = all
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

At scale, filter by team in SQL (`where teams = '{}' or teams && $1`) instead of `list()`ing everything. If a send runs past the function timeout (thousands of subscribers), move it to a background function or queue.

## Setup

1. Generate keys: `node -e "console.log(require('web-push').generateVAPIDKeys())"`. Put the **public** key in `src/data/push.json`. It's safe to commit.
2. Add these Netlify environment variables (Functions scope):
   - `VAPID_PRIVATE_KEY`
   - `PUSH_SEND_SECRET` (any long random string)
3. Add `PUSH_SEND_SECRET` as a GitHub Actions secret. Optionally add a `SITE_URL` repo variable, which defaults to the production Netlify URL.

If you rotate the VAPID keys, every existing subscription stops working and everyone has to opt in again.

## Testing

```bash
node scripts/push-notify.mjs --dry-run                 # what would the last scrape have sent?
node scripts/push-notify.mjs --base HEAD~20 --dry-run  # diff over a longer range
node scripts/push-notify.mjs --reminders tonight --date 2026-11-17 --dry-run    # that evening's reminders
node scripts/push-notify.mjs --reminders tomorrow --date 2026-11-16 --dry-run   # the day-before ones
PUSH_SEND_SECRET=… node scripts/push-notify.mjs --test "Hello"   # send to every subscriber
PUSH_SEND_SECRET=… SITE_URL=https://deploy-preview-N--….netlify.app node scripts/push-notify.mjs --test "Hi"  # preview store only
```

Push needs HTTPS (or localhost) and a production build: the service worker isn't registered by `npm run dev`. On iOS it only works from the Home Screen app (iOS 16.4+).
