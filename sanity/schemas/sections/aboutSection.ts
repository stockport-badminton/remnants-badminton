import { defineType, defineField } from 'sanity';

export const aboutSectionSchema = defineType({
  name: 'aboutSection',
  title: 'About Section',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'body', title: 'Body text', type: 'text',
      description: 'Separate paragraphs with a blank line.' }),
  ],
});
