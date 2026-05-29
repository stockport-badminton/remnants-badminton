import { defineType, defineField } from 'sanity';

export const textBlockSchema = defineType({
  name: 'textBlock',
  title: 'Text Block',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'body', title: 'Body text', type: 'text' }),
  ],
});
