import { defineCollection, z } from 'astro:content';

const members = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string().optional(),
    photo: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const collections = { members };
