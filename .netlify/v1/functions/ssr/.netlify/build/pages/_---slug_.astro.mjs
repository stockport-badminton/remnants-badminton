/* empty css                                  */
import { j as createComponent, m as maybeRenderHead, o as renderTemplate, i as createAstro, h as addAttribute, r as renderComponent } from '../chunks/astro/server_BrToKAhx.mjs';
import 'kleur/colors';
import { s as sanityClient, $ as $$Base } from '../chunks/Base_DkJd0nk9.mjs';
import { b as $$VenueSection, $ as $$AboutSection, a as $$HeroSection } from '../chunks/VenueSection_CkGsFkQQ.mjs';
import 'clsx';
import { v2 } from 'cloudinary';
export { renderers } from '../renderers.mjs';

const $$Astro$5 = createAstro();
const $$TextBlock = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$TextBlock;
  const { section } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="max-w-3xl mx-auto px-4 py-12"> ${section.heading && renderTemplate`<h2 class="text-2xl font-bold text-primary mb-4">${section.heading}</h2>`} <p class="text-gray-700 leading-relaxed whitespace-pre-line">${section.body}</p> </div>`;
}, "/Users/ncooper/remnants-badminton/src/components/sections/TextBlock.astro", void 0);

const $$Astro$4 = createAstro();
const $$MemberCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$MemberCard;
  const { name, role, bio, photo } = Astro2.props;
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return renderTemplate`${maybeRenderHead()}<div class="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"> <div class="bg-primary/10 flex items-center justify-center h-48"> ${photo ? renderTemplate`<img${addAttribute(photo, "src")}${addAttribute(`Photo of ${name}`, "alt")} class="w-full h-full object-cover object-top" loading="lazy">` : renderTemplate`<div class="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold" aria-hidden="true"> ${initials} </div>`} </div> <div class="p-5 flex-1 flex flex-col"> <h3 class="font-bold text-gray-900 text-lg">${name}</h3> <p class="text-secondary text-sm font-medium mt-0.5 mb-3">${role}</p> ${bio && renderTemplate`<p class="text-gray-600 text-sm leading-relaxed flex-1">${bio}</p>`} </div> </div>`;
}, "/Users/ncooper/remnants-badminton/src/components/MemberCard.astro", void 0);

const $$Astro$3 = createAstro();
const $$MembersGrid = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$MembersGrid;
  const { section } = Astro2.props;
  const members = await sanityClient.fetch(
    `*[_type == "member"] | order(order asc)`
  );
  return renderTemplate`${maybeRenderHead()}<div class="max-w-6xl mx-auto px-4 py-12"> <div class="mb-10"> <h1 class="text-3xl font-bold text-primary mb-2"> ${section.heading ?? "Members"} </h1> ${section.subheading && renderTemplate`<p class="text-gray-600">${section.subheading}</p>`} </div> ${members.length === 0 ? renderTemplate`<div class="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-gray-500"> <p class="font-medium">No members added yet.</p> </div>` : renderTemplate`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> ${members.map((member) => renderTemplate`${renderComponent($$result, "MemberCard", $$MemberCard, { "name": member.name, "role": member.role, "bio": member.bio, "photo": member.photo })}`)} </div>`} </div>`;
}, "/Users/ncooper/remnants-badminton/src/components/sections/MembersGrid.astro", void 0);

v2.config({
  cloud_name: "hvunsveuh",
  api_key: "798453632838949",
  api_secret: "eB7em7UmxX8boyLzXIu7w4d_WYs"
});

const $$Astro$2 = createAstro();
const $$GallerySection = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$GallerySection;
  const { section } = Astro2.props;
  const { resources } = await v2.api.resources_by_tag(section.tag, {
    context: true,
    max_results: 50
  });
  function thumbUrl(publicId) {
    return `https://res.cloudinary.com/${"hvunsveuh"}/image/upload/w_600,h_600,c_fill,q_auto,f_auto/${publicId}`;
  }
  return renderTemplate`${maybeRenderHead()}<section class="max-w-6xl mx-auto px-4 py-12"> ${section.heading && renderTemplate`<h2 class="text-3xl font-bold text-primary mb-8">${section.heading}</h2>`} ${resources.length === 0 ? renderTemplate`<p class="text-gray-500 text-center py-12">No images found for tag "${section.tag}".</p>` : renderTemplate`<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"> ${resources.map((image) => {
    const alt = image.context?.custom?.alt ?? image.public_id;
    const caption = image.context?.custom?.caption ?? null;
    return renderTemplate`<figure class="group relative overflow-hidden rounded-xl bg-gray-100"> <img${addAttribute(thumbUrl(image.public_id), "src")}${addAttribute(alt, "alt")} class="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy"> ${caption && renderTemplate`<figcaption class="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs px-3 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300"> ${caption} </figcaption>`} </figure>`;
  })} </div>`} </section>`;
}, "/Users/ncooper/remnants-badminton/src/components/sections/GallerySection.astro", void 0);

const $$Astro$1 = createAstro();
const $$LinksSection = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$LinksSection;
  const { section } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section class="max-w-4xl mx-auto px-4 py-12"> ${section.heading && renderTemplate`<h2 class="text-3xl font-bold text-primary mb-8">${section.heading}</h2>`} ${!section.links || section.links.length === 0 ? renderTemplate`<p class="text-gray-500">No links added yet.</p>` : renderTemplate`<ul class="space-y-4"> ${section.links.map((link) => renderTemplate`<li> <a${addAttribute(link.url, "href")} target="_blank" rel="noopener noreferrer" class="group flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-primary hover:shadow-md transition-all"> <div> <p class="font-semibold text-gray-900 group-hover:text-primary transition-colors"> ${link.title} </p> ${link.description && renderTemplate`<p class="text-sm text-gray-500 mt-1">${link.description}</p>`} <p class="text-xs text-gray-400 mt-2 truncate">${link.url}</p> </div> <svg class="w-5 h-5 text-gray-400 group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path> </svg> </a> </li>`)} </ul>`} </section>`;
}, "/Users/ncooper/remnants-badminton/src/components/sections/LinksSection.astro", void 0);

const $$Astro = createAstro();
const prerender = false;
const $$ = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$;
  const SECTION_COMPONENTS = {
    heroSection: $$HeroSection,
    aboutSection: $$AboutSection,
    textBlock: $$TextBlock,
    venueSection: $$VenueSection,
    membersGrid: $$MembersGrid,
    gallerySection: $$GallerySection,
    linksSection: $$LinksSection
  };
  const { slug } = Astro2.params;
  const page = await sanityClient.fetch(
    `*[_type == "page" && slug.current == $slug][0]`,
    { slug }
  );
  if (!page) return Astro2.redirect("/");
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "title": page.title }, { "default": async ($$result2) => renderTemplate`${(page.sections ?? []).map((section) => {
    const Component = SECTION_COMPONENTS[section._type];
    return Component ? renderTemplate`${renderComponent($$result2, "Component", Component, { "section": section })}` : null;
  })}` })}`;
}, "/Users/ncooper/remnants-badminton/src/pages/[...slug].astro", void 0);

const $$file = "/Users/ncooper/remnants-badminton/src/pages/[...slug].astro";
const $$url = "/[...slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
