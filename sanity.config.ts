import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';
import { schemas } from './sanity/schemas';

export default defineConfig({
  projectId: 'mzvj5e9t',
  dataset: 'production',
  plugins: [deskTool()],
  schema: { types: schemas },
});
