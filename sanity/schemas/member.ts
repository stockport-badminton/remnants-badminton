import { defineType, defineField } from 'sanity';

export const memberSchema = defineType({
  name: 'member',
  title: 'Member',
  type: 'document',
  orderings: [{
    title: 'Display order',
    name: 'orderAsc',
    by: [{ field: 'order', direction: 'asc' }],
  }],
  fields: [
    defineField({ name: 'name', title: 'Full name', type: 'string' }),
    defineField({ name: 'role', title: 'Role / Position', type: 'string' }),
    defineField({ name: 'bio', title: 'Short bio', type: 'text' }),
    defineField({ name: 'order', title: 'Display order', type: 'number',
      description: 'Lower numbers appear first.' }),
  ],
});
