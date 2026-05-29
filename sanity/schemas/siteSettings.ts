import { defineType, defineField } from 'sanity';

export const siteSettingsSchema = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  // Prevent editors creating more than one instance
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({
      name: 'navLinks',
      title: 'Navigation links',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'label', title: 'Label', type: 'string' }),
          defineField({ name: 'href',  title: 'Path (e.g. /members)', type: 'string' }),
        ],
      }],
    }),
  ],
});
