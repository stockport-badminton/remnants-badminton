import { j as createComponent, m as maybeRenderHead, o as renderTemplate, h as addAttribute, i as createAstro } from './astro/server_BrToKAhx.mjs';
import 'kleur/colors';
import 'clsx';

const $$Astro$2 = createAstro();
const $$HeroSection = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$HeroSection;
  const { section } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="bg-primary text-white py-20 px-4 text-center"> <h1 class="text-4xl font-bold mb-4">${section.heading}</h1> ${section.subheading && renderTemplate`<p class="text-xl mb-8 opacity-90">${section.subheading}</p>`} ${section.ctaText && section.ctaUrl && renderTemplate`<a${addAttribute(section.ctaUrl, "href")} class="inline-block bg-white text-primary font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"> ${section.ctaText} </a>`} </div>`;
}, "/Users/ncooper/remnants-badminton/src/components/sections/HeroSection.astro", void 0);

const $$Astro$1 = createAstro();
const $$AboutSection = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$AboutSection;
  const { section } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section class="max-w-4xl mx-auto px-4 py-16"> ${section.heading && renderTemplate`<h2 class="text-3xl font-bold text-primary mb-4">${section.heading}</h2>`} ${section.body.split("\n\n").map((para) => renderTemplate`<p class="text-gray-600 mb-4 leading-relaxed">${para}</p>`)} </section>`;
}, "/Users/ncooper/remnants-badminton/src/components/sections/AboutSection.astro", void 0);

const $$Astro = createAstro();
const $$VenueSection = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$VenueSection;
  const { section } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section class="max-w-5xl mx-auto px-4 py-16"> ${section.heading && renderTemplate`<h2 class="text-2xl font-bold text-primary mb-2">${section.heading}</h2>`} <p class="text-gray-600 mb-6">${section.address}</p> <div class="rounded-xl overflow-hidden border border-gray-200 shadow-sm"> <iframe${addAttribute(`https://www.google.com/maps?q=${section.lat},${section.lng}&z=15&output=embed`, "src")} width="100%" height="400" style="border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Venue location on Google Maps"></iframe> </div> <div class="mt-4"> <a${addAttribute(`https://www.google.com/maps/dir/?api=1&destination=${section.lat},${section.lng}`, "href")} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-secondary text-sm font-medium hover:underline"> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path> </svg>
Get directions
</a> </div> </section>`;
}, "/Users/ncooper/remnants-badminton/src/components/sections/VenueSection.astro", void 0);

export { $$AboutSection as $, $$HeroSection as a, $$VenueSection as b };
