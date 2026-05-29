import { pageSchema } from './page';
import { memberSchema } from './member';
import { siteSettingsSchema } from './siteSettings';
import { heroSectionSchema } from './sections/hero';
import { aboutSectionSchema } from './sections/aboutSection';
import { textBlockSchema } from './sections/textBlock';
import { venueSectionSchema } from './sections/venueSection';
import { membersGridSchema } from './sections/membersGrid';
import { gallerySectionSchema } from './sections/gallerySection';
import { linksSectionSchema } from './sections/linksSection';

export const schemas = [
  // Documents
  pageSchema,
  memberSchema,
  siteSettingsSchema,
  // Section types
  heroSectionSchema,
  aboutSectionSchema,
  textBlockSchema,
  venueSectionSchema,
  membersGridSchema,
  gallerySectionSchema,
  linksSectionSchema,
];
