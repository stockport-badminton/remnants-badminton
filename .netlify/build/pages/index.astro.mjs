/* empty css                                  */
import { j as createComponent, r as renderComponent, o as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BrToKAhx.mjs';
import 'kleur/colors';
import { s as sanityClient, $ as $$Base } from '../chunks/Base_DkJd0nk9.mjs';
import { b as $$VenueSection, $ as $$AboutSection, a as $$HeroSection } from '../chunks/VenueSection_CkGsFkQQ.mjs';
export { renderers } from '../renderers.mjs';

const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const SECTION_COMPONENTS = {
    heroSection: $$HeroSection,
    aboutSection: $$AboutSection,
    venueSection: $$VenueSection
  };
  const page = await sanityClient.fetch(
    `*[_type == "page" && slug.current == "home"][0]`
  );
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "title": page?.title }, { "default": async ($$result2) => renderTemplate`${page ? (page.sections ?? []).map((section) => {
    const Component = SECTION_COMPONENTS[section._type];
    return Component ? renderTemplate`${renderComponent($$result2, "Component", Component, { "section": section })}` : null;
  }) : renderTemplate`${maybeRenderHead()}<div class="max-w-4xl mx-auto px-4 py-24 text-center text-gray-400"> <p>Create a page in Sanity with slug <code>home</code> to get started.</p> </div>`}` })}`;
}, "/Users/ncooper/remnants-badminton/src/pages/index.astro", void 0);

const $$file = "/Users/ncooper/remnants-badminton/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
