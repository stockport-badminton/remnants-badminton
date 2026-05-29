import { j as createComponent, m as maybeRenderHead, h as addAttribute, o as renderTemplate, i as createAstro, u as unescapeHTML, l as renderHead, r as renderComponent, n as renderSlot } from './astro/server_BrToKAhx.mjs';
import 'kleur/colors';
import 'clsx';
import { createClient } from '@sanity/client';

const $$Astro$2 = createAstro();
const $$Nav = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Nav;
  const { siteName, links = [
    { href: "/", label: "Home" },
    { href: "/fixtures", label: "Fixtures" },
    { href: "/members", label: "Members" },
    { href: "/contact", label: "Contact" }
  ] } = Astro2.props;
  const currentPath = Astro2.url.pathname;
  return renderTemplate`${maybeRenderHead()}<header class="bg-primary text-white shadow-lg"> <nav class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between"> <a href="/" class="flex items-center gap-3 group"> <span class="text-2xl" aria-hidden="true">🏸</span> <span class="font-bold text-lg leading-tight group-hover:text-accent transition-colors"> ${siteName} </span> </a> <!-- Desktop nav --> <ul class="hidden md:flex items-center gap-1"> ${links.map(({ href, label }) => renderTemplate`<li> <a${addAttribute(href, "href")}${addAttribute([
    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
    currentPath === href ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
  ], "class:list")}> ${label} </a> </li>`)} </ul> <!-- Mobile hamburger --> <button id="nav-toggle" class="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors" aria-label="Toggle menu" aria-expanded="false"> <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path class="menu-icon" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path> <path class="close-icon hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path> </svg> </button> </nav> <!-- Mobile menu --> <div id="mobile-menu" class="hidden md:hidden border-t border-white/20"> <ul class="max-w-6xl mx-auto px-4 py-2 space-y-1"> ${links.map(({ href, label }) => renderTemplate`<li> <a${addAttribute(href, "href")}${addAttribute([
    "block px-4 py-2 rounded-md text-sm font-medium transition-colors",
    currentPath === href ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
  ], "class:list")}> ${label} </a> </li>`)} </ul> </div> </header> `;
}, "/Users/ncooper/remnants-badminton/src/components/Nav.astro", void 0);

const $$Astro$1 = createAstro();
const $$Footer = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Footer;
  const { siteName, tagline } = Astro2.props;
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  return renderTemplate`${maybeRenderHead()}<footer class="bg-primary text-white mt-16"> <div class="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8"> <div> <div class="flex items-center gap-2 mb-3"> <span class="text-xl" aria-hidden="true">🏸</span> <span class="font-bold">${siteName}</span> </div> <p class="text-white/70 text-sm">${tagline}</p> </div> <div> <h3 class="font-semibold mb-3 text-accent">Quick links</h3> <ul class="space-y-1 text-sm"> <li><a href="/" class="text-white/70 hover:text-white transition-colors">Home</a></li> <li><a href="/fixtures" class="text-white/70 hover:text-white transition-colors">Fixtures &amp; Results</a></li> <li><a href="/members" class="text-white/70 hover:text-white transition-colors">Members</a></li> <li><a href="/contact" class="text-white/70 hover:text-white transition-colors">Contact Us</a></li> </ul> </div> <div> <h3 class="font-semibold mb-3 text-accent">Leagues</h3> <ul class="space-y-1 text-sm text-white/70"> <li>Stockport Badminton League</li> <li>Crewe &amp; District Badminton League</li> </ul> </div> </div> <div class="border-t border-white/20"> <div class="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/50"> <span>&copy; ${year} ${siteName}. All rights reserved.</span> <a href="/admin/" class="hover:text-white/80 transition-colors">Club admin</a> </div> </div> </footer>`;
}, "/Users/ncooper/remnants-badminton/src/components/Footer.astro", void 0);

const primaryColor = "#1e3a5f";
const secondaryColor = "#16a34a";
const accentColor = "#f59e0b";
const siteName = "Remnants Badminton Club";
const tagline = "Playing in Lymm, Cheshire since 2025";
const theme = {
	primaryColor: primaryColor,
	secondaryColor: secondaryColor,
	accentColor: accentColor,
	siteName: siteName,
	tagline: tagline
};

const sanityClient = createClient({
  projectId: "mzvj5e9t",
  dataset: "production",
  useCdn: false,
  apiVersion: "2024-01-01"
});

const $$Astro = createAstro();
const $$Base = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Base;
  const settings = await sanityClient.fetch(`*[_type == "siteSettings"][0]{ navLinks }`);
  const navLinks = settings?.navLinks ?? void 0;
  const {
    title = theme.siteName,
    description = theme.tagline
  } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description"${addAttribute(description, "content")}><title>${title === theme.siteName ? title : `${title} | ${theme.siteName}`}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>${unescapeHTML(`
      :root {
        --color-primary: ${theme.primaryColor};
        --color-secondary: ${theme.secondaryColor};
        --color-accent: ${theme.accentColor};
      }
    `)}</style>${renderHead()}</head> <body class="min-h-screen flex flex-col bg-white text-gray-900 font-sans"> ${renderComponent($$result, "Nav", $$Nav, { "siteName": theme.siteName, "links": navLinks })} <main class="flex-1"> ${renderSlot($$result, $$slots["default"])} </main> ${renderComponent($$result, "Footer", $$Footer, { "siteName": theme.siteName, "tagline": theme.tagline })} </body></html>`;
}, "/Users/ncooper/remnants-badminton/src/layouts/Base.astro", void 0);

export { $$Base as $, sanityClient as s };
