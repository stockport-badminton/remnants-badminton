// Subscription store backed by Netlify Blobs — the one piece that differs per
// site. Sites with a database implement the same four methods against a table:
//   put(id, record) · remove(id) · list() → [{ id, ...record }]
// Record shape: { subscription: { endpoint, keys }, teams: string[], createdAt, updatedAt }
import { getStore } from '@netlify/blobs';

/**
 * @param {string | undefined} deployContext  e.g. 'production', 'deploy-preview'.
 *   Non-production deploys get their own store so testing a preview never
 *   touches real subscribers.
 */
export function createBlobStore(deployContext) {
  const isProd = !deployContext || deployContext === 'production';
  const store = getStore({ name: isProd ? 'push-subscriptions' : 'push-subscriptions-preview', consistency: 'strong' });

  return {
    put: (id, record) => store.setJSON(id, record),
    get: (id) => store.get(id, { type: 'json' }),
    remove: (id) => store.delete(id),
    async list() {
      const { blobs } = await store.list();
      const records = await Promise.all(
        blobs.map(async ({ key }) => {
          const r = await store.get(key, { type: 'json' });
          return r ? { id: key, ...r } : null;
        }),
      );
      return records.filter(Boolean);
    },
  };
}
