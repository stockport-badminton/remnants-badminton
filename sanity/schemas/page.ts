import { defineType, defineField } from 'sanity';

export const pageSchema = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        { type: 'heroSection' },
        { type: 'aboutSection' },
        { type: 'textBlock' },
        { type: 'venueSection' },
        { type: 'membersGrid' },
        { type: 'gallerySection' },
        { type: 'linksSection' },
      ],
    }),
  ],
});
