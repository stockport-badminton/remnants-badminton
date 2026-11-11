import type { APIRoute } from 'astro';
import theme from '../data/theme.json';

// Web app manifest, generated at build time from theme.json so name/colours
// stay in sync with the CMS-managed branding.
export const prerender = true;

const t = theme as typeof theme & { shortName?: string };
const shortName = t.shortName ?? t.siteName.replace(/\s+(Badminton\s+)?Club$/i, '');

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        id: '/',
        name: t.siteName,
        short_name: shortName,
        description: t.tagline,
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: t.primaryColor,
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Fixtures & results', short_name: 'Fixtures', url: '/fixtures' },
          { name: 'Calendars', url: '/calendars' },
        ],
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
