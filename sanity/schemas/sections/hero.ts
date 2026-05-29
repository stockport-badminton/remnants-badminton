import { defineType, defineField } from 'sanity';

export const heroSectionSchema = defineType({
  name: 'heroSection',
  title: 'Hero Section',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'subheading', title: 'Subheading', type: 'string' }),
    defineField({ name: 'ctaText', title: 'Button text', type: 'string' }),
    defineField({ name: 'ctaUrl', title: 'Button URL', type: 'string' }),
  ],
});
