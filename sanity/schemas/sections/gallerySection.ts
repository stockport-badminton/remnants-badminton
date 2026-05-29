import { defineType, defineField } from 'sanity';

export const gallerySectionSchema = defineType({
  name: 'gallerySection',
  title: 'Gallery Section',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'tag',
      title: 'Cloudinary tag',
      type: 'string',
      description: 'Images tagged with this value in Cloudinary will appear here.',
    }),
  ],
});
