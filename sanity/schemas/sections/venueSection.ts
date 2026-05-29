import { defineType, defineField } from 'sanity';

export const venueSectionSchema = defineType({
  name: 'venueSection',
  title: 'Venue Section',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'address', title: 'Address', type: 'string' }),
    defineField({ name: 'lat', title: 'Latitude', type: 'number' }),
    defineField({ name: 'lng', title: 'Longitude', type: 'number' }),
  ],
});
