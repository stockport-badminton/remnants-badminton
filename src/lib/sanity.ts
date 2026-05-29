import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: 'mzvj5e9t',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
});
