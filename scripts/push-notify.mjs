#!/usr/bin/env node
/**
 * Sends push notifications via the site's push-send function.
 *
 * Results (run after the daily scrape): diffs fixtures.json between two git
 * revisions and notifies new results.
 *   node scripts/push-notify.mjs                 # compare HEAD~1 → HEAD and send
 *   node scripts/push-notify.mjs --base <ref>    # compare <ref> → HEAD
 *
 * Match reminders: unplayed club fixtures tonight (sent ~17:00 UK) or
 * tomorrow (sent ~18:00 UK the evening before). Default: tonight.
 *   node scripts/push-notify.mjs --reminders tonight
 *   node scripts/push-notify.mjs --reminders tomorrow --date 2026-11-25 --dry-run
 *
 *   --dry-run       print what would be sent
 *   --test "msg"    send a test notification to everyone
 *
 * Env: PUSH_SEND_SECRET (required to send), SITE_URL (default: production site)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resultNotifications } from '../src/lib/push/diff.mjs';
import { REMINDER_KINDS, reminderNotifications } from '../src/lib/push/reminders.mjs';

const FILE = 'src/data/fixtures.json';
const MAX_PER_RUN = 10; // more than this is a back-fill/re-import, not news

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

const dryRun = flag('--dry-run');
const base = value('--base') ?? 'HEAD~1';
const testMessage = value('--test');
const reminders = flag('--reminders');
const when = REMINDER_KINDS.includes(value('--reminders')) ? value('--reminders') : 'tonight';
const date = value('--date'); // YYYY-MM-DD, reminders only
const siteUrl = (process.env.SITE_URL || 'https://quiet-kringle-2ac59b.netlify.app').replace(/\/$/, '');

function fixturesAt(ref) {
  try {
    return JSON.parse(execFileSync('git', ['show', `${ref}:${FILE}`], { encoding: 'utf8' })).fixtures ?? [];
  } catch {
    return null;
  }
}

let notifications;
if (testMessage) {
  notifications = [{ title: 'Remnants test notification', body: testMessage, url: '/fixtures', tag: 'test' }];
} else if (reminders) {
  const { fixtures = [] } = JSON.parse(readFileSync(FILE, 'utf8'));
  // Noon UK time on --date, so the UK calendar date is unambiguous.
  const now = date ? new Date(`${date}T12:00:00Z`) : new Date();
  notifications = reminderNotifications(fixtures, { now, when });
  if (!notifications.length) {
    console.log(`push-notify: no club fixtures ${when === 'tomorrow' ? 'tomorrow' : 'today'}.`);
    process.exit(0);
  }
} else {
  const before = fixturesAt(base);
  const after = fixturesAt('HEAD');
  if (!before || !after) {
    console.log(`push-notify: couldn't read ${FILE} at ${base} or HEAD — skipping.`);
    process.exit(0);
  }
  notifications = resultNotifications(before, after);
  if (notifications.length > MAX_PER_RUN) {
    console.warn(`push-notify: ${notifications.length} new results looks like a back-fill — not sending.`);
    notifications.forEach((n) => console.warn(`  · ${n.title}`));
    process.exit(0);
  }
}

if (!notifications.length) {
  console.log('push-notify: no new results.');
  process.exit(0);
}

notifications.forEach((n) => console.log(`push-notify: ${n.title} — ${n.body} [${n.teams?.join(', ') || 'all'}]`));

if (dryRun) process.exit(0);

const secret = process.env.PUSH_SEND_SECRET;
if (!secret) {
  console.log('push-notify: PUSH_SEND_SECRET not set — not sending.');
  process.exit(0);
}

const res = await fetch(`${siteUrl}/.netlify/functions/push-send`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
  body: JSON.stringify({ notifications }),
});
const text = await res.text();
console.log(`push-notify: ${res.status} ${text}`);
// Don't fail the scrape workflow over a notification problem, but make it visible.
if (!res.ok) console.log('::warning::push-notify failed: ' + res.status);
