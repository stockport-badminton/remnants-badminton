import { defineType, defineField } from 'sanity';

export const linksSectionSchema = defineType({
  name: 'linksSection',
  title: 'Links Section',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'title',       title: 'Title',       type: 'string' }),
          defineField({ name: 'url',         title: 'URL',         type: 'url' }),
          defineField({ name: 'description', title: 'Description', type: 'string' }),
        ],
      }],
    }),
  ],
});
