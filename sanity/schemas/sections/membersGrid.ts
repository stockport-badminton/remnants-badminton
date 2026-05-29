import { defineType, defineField } from 'sanity';

export const membersGridSchema = defineType({
  name: 'membersGrid',
  title: 'Members Grid',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'subheading', title: 'Subheading', type: 'string' }),
  ],
});
