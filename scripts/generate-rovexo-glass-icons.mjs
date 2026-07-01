/**
 * Generates ROVEXO 3D Glass SVG icons (VisionOS-style, original assets).
 * Run: node scripts/generate-rovexo-glass-icons.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "icons");

const GLYPHS = {
  car: '<path d="M14 34h36l-4-10h-8l-2-4H20l-2 4h-8l-4 10Zm6 8a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm24 0a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" fill="url(#glyph)" />',
  house:
    '<path d="M32 14 16 28v18h12V38h8v8h12V28L32 14Zm0 6 10 9v11H36V35h-8v5H22V29l10-9Z" fill="url(#glyph)" />',
  phone:
    '<rect x="24" y="14" width="16" height="36" rx="4" fill="url(#glyph)" /><rect x="28" y="18" width="8" height="24" rx="1.5" fill="#fff" opacity="0.45" /><circle cx="32" cy="44" r="2" fill="#fff" opacity="0.7" />',
  laptop:
    '<path d="M16 22h32v18H16V22Zm-2 20h36l2 4H14l2-4Z" fill="url(#glyph)" /><rect x="20" y="26" width="24" height="12" rx="1.5" fill="#fff" opacity="0.35" />',
  chip: '<rect x="20" y="20" width="24" height="24" rx="4" fill="url(#glyph)" /><path d="M26 16v8M32 16v8M38 16v8M26 40v8M32 40v8M38 40v8M16 26h8M16 32h8M40 26h8M40 32h8" stroke="url(#glyph)" stroke-width="2.5" stroke-linecap="round" />',
  gamepad:
    '<path d="M18 28a14 14 0 0 1 28 0v6a8 8 0 0 1-8 8h-4a6 6 0 0 1-6-6h-4a6 6 0 0 1-6 6h-4a8 8 0 0 1-8-8v-6Z" fill="url(#glyph)" /><circle cx="26" cy="32" r="2.5" fill="#fff" opacity="0.7" /><rect x="36" y="30" width="2.5" height="8" rx="1" fill="#fff" opacity="0.7" /><rect x="33.5" y="32.5" width="7" height="2.5" rx="1" fill="#fff" opacity="0.7" />',
  flower:
    '<circle cx="32" cy="28" r="6" fill="url(#glyph)" /><circle cx="24" cy="34" r="5" fill="url(#glyph)" opacity="0.85" /><circle cx="40" cy="34" r="5" fill="url(#glyph)" opacity="0.85" /><path d="M32 34v14" stroke="url(#glyph)" stroke-width="3" stroke-linecap="round" />',
  hammer:
    '<path d="M22 40 40 22l4 4-18 18-6-4Z" fill="url(#glyph)" /><rect x="18" y="38" width="12" height="6" rx="2" transform="rotate(-45 24 41)" fill="url(#glyph)" opacity="0.8" />',
  wrench:
    '<path d="M40 20a8 8 0 0 0-11 11L18 42l4 4 11-11a8 8 0 0 0 7-15Z" fill="url(#glyph)" />',
  shirt:
    '<path d="M24 18 32 24l8-6 8 6v24H16V24l8-6Z" fill="url(#glyph)" /><path d="M28 24v20M36 24v20" stroke="#fff" stroke-width="1.5" opacity="0.4" />',
  baby:
    '<circle cx="32" cy="26" r="8" fill="url(#glyph)" /><path d="M18 44c2-8 8-12 14-12s12 4 14 12" fill="url(#glyph)" />',
  shoe:
    '<path d="M16 36c4-2 8-2 12 0l8 4h12v6H16v-10Z" fill="url(#glyph)" /><path d="M22 32h16l4 4H18l4-4Z" fill="url(#glyph)" opacity="0.75" />',
  gem: '<path d="M32 16 44 28 32 46 20 28 32 16Z" fill="url(#glyph)" /><path d="M20 28h24" stroke="#fff" stroke-width="1.5" opacity="0.45" />',
  sparkle:
    '<path d="M32 14v12M32 38v12M14 32h12M38 32h12M20 20l8.5 8.5M35.5 35.5 44 44M44 20l-8.5 8.5M20 44l8.5-8.5" stroke="url(#glyph)" stroke-width="3.5" stroke-linecap="round" />',
  heartPulse:
    '<path d="M32 44S18 36 18 26c0-5 4-9 9-9 3 0 5 1.5 5 4 0-2.5 2-4 5-4 5 0 9 4 9 9 0 10-14 18-14 18Z" fill="url(#glyph)" /><path d="M22 30h4l2 6 4-12 2 6h6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />',
  paw:
    '<ellipse cx="24" cy="26" rx="4" ry="5" fill="url(#glyph)" /><ellipse cx="40" cy="26" rx="4" ry="5" fill="url(#glyph)" /><ellipse cx="18" cy="36" rx="3.5" ry="4.5" fill="url(#glyph)" /><ellipse cx="46" cy="36" rx="3.5" ry="4.5" fill="url(#glyph)" /><ellipse cx="32" cy="40" rx="7" ry="6" fill="url(#glyph)" />',
  dumbbell:
    '<rect x="14" y="28" width="8" height="8" rx="2" fill="url(#glyph)" /><rect x="42" y="28" width="8" height="8" rx="2" fill="url(#glyph)" /><rect x="22" y="30" width="20" height="4" rx="2" fill="url(#glyph)" />',
  briefcase:
    '<rect x="16" y="22" width="32" height="22" rx="4" fill="url(#glyph)" /><path d="M26 22v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" stroke="url(#glyph)" stroke-width="3" fill="none" />',
  cog: '<circle cx="32" cy="32" r="8" fill="url(#glyph)" /><path d="M32 16v6M32 42v6M16 32h6M42 32h6M21 21l4 4M39 39l4 4M43 21l-4 4M21 43l4-4" stroke="url(#glyph)" stroke-width="2.5" stroke-linecap="round" />',
  home: '<path d="M16 30 32 16l16 14v16H16V30Z" fill="url(#glyph)" /><rect x="26" y="34" width="12" height="12" rx="2" fill="#fff" opacity="0.4" />',
  search:
    '<circle cx="28" cy="28" r="10" stroke="url(#glyph)" stroke-width="4" fill="none" /><path d="M35 35 44 44" stroke="url(#glyph)" stroke-width="4" stroke-linecap="round" />',
  plus: '<path d="M32 18v28M18 32h28" stroke="url(#glyph)" stroke-width="5" stroke-linecap="round" />',
  heart:
    '<path d="M32 46S16 36 16 26c0-6 5-10 10-10 3 0 6 1.5 6 4.5 0-3 3-4.5 6-4.5 5 0 10 4 10 10 0 10-16 20-16 20Z" fill="url(#glyph)" />',
  user:
    '<circle cx="32" cy="24" r="8" fill="url(#glyph)" /><path d="M16 48c3-8 10-12 16-12s13 4 16 12" fill="url(#glyph)" />',
  messages:
    '<path d="M14 18h36a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H24l-10 8V22a4 4 0 0 1 4-4Z" fill="url(#glyph)" /><circle cx="24" cy="30" r="2" fill="#fff" /><circle cx="32" cy="30" r="2" fill="#fff" /><circle cx="40" cy="30" r="2" fill="#fff" />',
  bell:
    '<path d="M32 14c-8 0-12 6-12 12v8l-4 6h32l-4-6V26c0-6-4-12-12-12Z" fill="url(#glyph)" /><path d="M26 46h12a6 6 0 0 1-12 0Z" fill="url(#glyph)" opacity="0.85" />',
  eye:
    '<path d="M12 32s8-14 20-14 20 14 20 14-8 14-20 14S12 32 12 32Z" fill="url(#glyph)" /><circle cx="32" cy="32" r="6" fill="#fff" opacity="0.55" /><circle cx="32" cy="32" r="3" fill="url(#glyph)" />',
  star:
    '<path d="M32 14l6 14 15 1-11 10 3 15-13-8-13 8 3-15-11-10 15-1 6-14Z" fill="url(#glyph)" />',
  arrow:
    '<path d="M18 32h24M34 22l10 10-10 10" stroke="url(#glyph)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" />',
  verified:
    '<circle cx="32" cy="32" r="16" fill="url(#glyph)" /><path d="M22 32 28 38 42 24" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" />',
  settings:
    '<circle cx="32" cy="32" r="7" fill="url(#glyph)" /><path d="M32 14v6M32 44v6M14 32h6M44 32h6" stroke="url(#glyph)" stroke-width="3" stroke-linecap="round" /><circle cx="32" cy="32" r="14" stroke="url(#glyph)" stroke-width="3" fill="none" />',
  shield:
    '<path d="M32 12 48 18v14c0 12-8 18-16 22-8-4-16-10-16-22V18l16-6Z" fill="url(#glyph)" />',
  logout:
    '<path d="M24 16H16v32h8M30 32H44M40 26l6 6-6 6" stroke="url(#glyph)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" />',
  orders:
    '<rect x="16" y="16" width="32" height="36" rx="4" fill="url(#glyph)" /><path d="M22 24h20M22 32h20M22 40h14" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />',
  cart:
    '<path d="M14 18h6l4 20h24l4-14H20" stroke="url(#glyph)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" /><circle cx="26" cy="46" r="3" fill="url(#glyph)" /><circle cx="40" cy="46" r="3" fill="url(#glyph)" />',
  payment:
    '<rect x="12" y="22" width="40" height="24" rx="4" fill="url(#glyph)" /><rect x="12" y="30" width="40" height="6" fill="#fff" opacity="0.35" /><rect x="16" y="38" width="12" height="4" rx="1" fill="#fff" opacity="0.55" />',
  shipping:
    '<rect x="10" y="24" width="28" height="18" rx="3" fill="url(#glyph)" /><path d="M38 28h10v14H38" fill="url(#glyph)" opacity="0.85" /><circle cx="20" cy="46" r="4" fill="url(#glyph)" /><circle cx="42" cy="46" r="4" fill="url(#glyph)" />',
  business:
    '<rect x="16" y="20" width="32" height="28" rx="3" fill="url(#glyph)" /><rect x="22" y="28" width="8" height="8" fill="#fff" opacity="0.4" /><rect x="34" y="28" width="8" height="8" fill="#fff" opacity="0.4" /><rect x="28" y="14" width="8" height="8" fill="url(#glyph)" />',
  analytics:
    '<rect x="16" y="34" width="8" height="14" rx="2" fill="url(#glyph)" /><rect x="28" y="26" width="8" height="22" rx="2" fill="url(#glyph)" opacity="0.9" /><rect x="40" y="18" width="8" height="30" rx="2" fill="url(#glyph)" opacity="0.8" />',
  wallet:
    '<rect x="14" y="24" width="36" height="22" rx="4" fill="url(#glyph)" /><circle cx="40" cy="35" r="4" fill="#fff" opacity="0.65" />',
  listings:
    '<rect x="16" y="18" width="32" height="28" rx="4" fill="url(#glyph)" /><path d="M22 26h20M22 34h14" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />',
  trust: '<path d="M32 12 48 18v14c0 12-8 18-16 22-8-4-16-10-16-22V18l16-6Z" fill="url(#glyph)" /><path d="M24 32 30 38 42 24" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />',
  help: '<circle cx="32" cy="32" r="16" fill="url(#glyph)" /><path d="M24 26a8 8 0 0 1 16 0c0 4-4 4-4 8M32 42h.01" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" />',
  support:
    '<path d="M16 24h32v20H28l-8 8V24Z" fill="url(#glyph)" /><path d="M24 32h16M24 38h10" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />',
  inventory:
    '<path d="M16 20h32l-4 24H20l-4-24Z" fill="url(#glyph)" /><path d="M24 20V16h16v4" stroke="url(#glyph)" stroke-width="3" fill="none" />',
  wholesale:
    '<rect x="14" y="22" width="16" height="16" rx="2" fill="url(#glyph)" /><rect x="34" y="22" width="16" height="16" rx="2" fill="url(#glyph)" opacity="0.85" /><rect x="24" y="34" width="16" height="16" rx="2" fill="url(#glyph)" opacity="0.7" />',
  plans:
    '<rect x="16" y="14" width="32" height="36" rx="4" fill="url(#glyph)" /><path d="M22 24h20M22 32h16M22 40h12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />',
  addresses:
    '<path d="M32 14c-8 0-14 6-14 14 0 10 14 22 14 22s14-12 14-22c0-8-6-14-14-14Z" fill="url(#glyph)" /><circle cx="32" cy="28" r="5" fill="#fff" opacity="0.55" />',
  auctions:
    '<path d="M20 40h24M26 20l10 10-10 10" stroke="url(#glyph)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" /><rect x="18" y="40" width="28" height="6" rx="2" fill="url(#glyph)" />',
  resolution:
    '<path d="M16 20h32v28H16V20Z" fill="url(#glyph)" /><path d="M22 30h20M22 38h14" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />',
  categories:
    '<rect x="16" y="16" width="14" height="14" rx="3" fill="url(#glyph)" /><rect x="34" y="16" width="14" height="14" rx="3" fill="url(#glyph)" opacity="0.85" /><rect x="16" y="34" width="14" height="14" rx="3" fill="url(#glyph)" opacity="0.85" /><rect x="34" y="34" width="14" height="14" rx="3" fill="url(#glyph)" opacity="0.7" />',
  tax: '<rect x="16" y="18" width="32" height="28" rx="4" fill="url(#glyph)" /><path d="M22 30h20M22 38h12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.7" /><text x="32" y="34" text-anchor="middle" font-size="10" fill="#fff" font-family="system-ui,sans-serif">%</text>',
  admin:
    '<rect x="14" y="18" width="36" height="28" rx="4" fill="url(#glyph)" /><circle cx="32" cy="32" r="6" fill="#fff" opacity="0.45" />',
  folderBlue:
    '<path d="M12 20h14l4 6h26v24H12V20Z" fill="url(#glyph)" />',
  folderGreen:
    '<path d="M12 20h14l4 6h26v24H12V20Z" fill="url(#glyph)" />',
  folderAmber:
    '<path d="M12 20h14l4 6h26v24H12V20Z" fill="url(#glyph)" />',
  folderPurple:
    '<path d="M12 20h14l4 6h26v24H12V20Z" fill="url(#glyph)" />',
};

function buildSvg(glyph) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="glyph" x1="18" y1="12" x2="46" y2="52" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#BFDBFE"/>
      <stop offset="32%" stop-color="#60A5FA"/>
      <stop offset="68%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="glyphSheen" x1="22" y1="14" x2="42" y2="34" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.62"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <filter id="glyphDepth" x="-35%" y="-35%" width="170%" height="170%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.8" flood-color="#1E3A8A" flood-opacity="0.26"/>
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#93C5FD" flood-opacity="0.38"/>
    </filter>
  </defs>
  <g filter="url(#glyphDepth)">${glyph}</g>
</svg>
`;
}

/** @type {Array<[string, string, keyof typeof GLYPHS]>} */
const ICON_MANIFEST = [
  // categories
  ["categories", "vehicles", "car"],
  ["categories", "property", "house"],
  ["categories", "phones", "phone"],
  ["categories", "computers", "laptop"],
  ["categories", "electronics", "chip"],
  ["categories", "gaming", "gamepad"],
  ["categories", "home-garden", "flower"],
  ["categories", "diy", "hammer"],
  ["categories", "tools", "wrench"],
  ["categories", "womens-fashion", "shirt"],
  ["categories", "mens-fashion", "shirt"],
  ["categories", "kids-fashion", "baby"],
  ["categories", "shoes", "shoe"],
  ["categories", "jewellery", "gem"],
  ["categories", "beauty", "sparkle"],
  ["categories", "health", "heartPulse"],
  ["categories", "pets", "paw"],
  ["categories", "sports", "dumbbell"],
  ["categories", "services", "briefcase"],
  ["categories", "autoparts", "cog"],
  ["vehicles", "vehicles", "car"],
  ["property", "property", "house"],
  ["electronics", "electronics", "chip"],
  ["home", "home-garden", "flower"],
  ["fashion", "womens-fashion", "shirt"],
  ["beauty", "beauty", "sparkle"],
  ["pets", "pets", "paw"],
  ["sports", "sports", "dumbbell"],
  ["tools", "tools", "wrench"],
  // navigation
  ["navigation", "home", "home"],
  ["navigation", "search", "search"],
  ["navigation", "sell", "plus"],
  ["navigation", "saved", "heart"],
  ["navigation", "account", "user"],
  ["navigation", "heart", "heart"],
  // chat / notifications / account
  ["chat", "messages", "messages"],
  ["notifications", "bell", "bell"],
  ["account", "user", "user"],
  ["search", "search", "search"],
  // actions
  ["actions", "eye", "eye"],
  ["actions", "star", "star"],
  ["actions", "heart", "heart"],
  ["actions", "wishlist", "heart"],
  ["actions", "arrow-right", "arrow"],
  ["actions", "plus", "plus"],
  // badges
  ["badges", "verified", "verified"],
  ["badges", "badge-check", "verified"],
  // settings / security
  ["settings", "settings", "settings"],
  ["security", "shield", "shield"],
  ["security", "logout", "logout"],
  // commerce
  ["orders", "orders", "orders"],
  ["orders", "cart", "cart"],
  ["payments", "payment", "payment"],
  ["shipping", "shipping", "shipping"],
  ["business", "business", "business"],
  // dashboard
  ["dashboard", "listings", "listings"],
  ["dashboard", "wallet", "wallet"],
  ["dashboard", "analytics", "analytics"],
  ["dashboard", "trust", "trust"],
  ["dashboard", "help", "help"],
  ["dashboard", "support", "support"],
  ["dashboard", "inventory", "inventory"],
  ["dashboard", "wholesale", "wholesale"],
  ["dashboard", "plans", "plans"],
  ["dashboard", "addresses", "addresses"],
  ["dashboard", "auctions", "auctions"],
  ["dashboard", "resolution", "resolution"],
  ["dashboard", "categories", "categories"],
  ["dashboard", "tax", "tax"],
  ["dashboard", "admin", "admin"],
  ["dashboard", "messages", "messages"],
  ["dashboard", "notifications", "bell"],
  ["dashboard", "settings", "settings"],
  ["dashboard", "orders", "orders"],
  ["dashboard", "cart", "cart"],
  ["dashboard", "payment", "payment"],
  ["dashboard", "shipping", "shipping"],
  ["dashboard", "business", "business"],
  ["dashboard", "buy-hub", "folderBlue"],
  ["dashboard", "sell-hub", "folderGreen"],
  ["dashboard", "business-hub", "folderAmber"],
  ["dashboard", "support-hub", "folderPurple"],
  ["analytics", "analytics", "analytics"],
  ["support", "support", "support"],
  ["admin", "admin", "admin"],
  ["seller", "listings", "listings"],
  ["seller", "wallet", "wallet"],
  ["seller", "analytics", "analytics"],
  ["status", "verified", "verified"],
  ["misc", "help", "help"],
];

const written = new Set();

for (const [folder, name, glyphKey] of ICON_MANIFEST) {
  const dir = join(OUT, folder);
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, `${name}.svg`);
  const key = `${folder}/${name}`;
  if (written.has(key)) continue;
  written.add(key);
  const svg = buildSvg(GLYPHS[glyphKey]);
  await writeFile(filePath, svg, "utf8");
}

await writeFile(
  join(OUT, "ATTRIBUTION.md"),
  `# ROVEXO 3D Glass Icons

Original SVG assets generated for ROVEXO (VisionOS-inspired glassmorphism).
Commercial use within the ROVEXO platform.

Regenerate: \`node scripts/generate-rovexo-glass-icons.mjs\`
`,
  "utf8",
);

console.log(`Generated ${written.size} glass SVG icons in public/icons/`);
