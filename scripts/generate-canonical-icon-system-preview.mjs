#!/usr/bin/env node
/**
 * Generates Public Visual Preview for ROVEXO canonical marketplace icon system.
 * Excludes Homepage / Login / Register (frozen).
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "owner-review-screenshots", "canonical-icon-system-v1");
const PACK = join(ROOT, "owner-review-screenshots", "master-image-pack-v1", "icon-system");

const STROKE = 1.9;
const PURPLE = "#9333ea";

/** Inline path bodies matching AccountIcons (line only). */
const ICONS = {
  search: `<circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.5-3.5"/>`,
  saved: `<path d="M12 20.5 10.7 19.3C6.1 15.1 3 12.3 3 8.9 3 6.2 5.2 4 8 4c1.6 0 3.1.8 4 2 0.9-1.2 2.4-2 4-2 2.8 0 5 2.2 5 4.9 0 3.4-3.1 6.2-7.7 10.4L12 20.5Z"/>`,
  sell: `<path d="M12 3v18"/><path d="M8 7h6.5a3 3 0 0 1 0 6H9.5a3 3 0 0 0 0 6H16"/>`,
  categories: `<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>`,
  product: `<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="m4 15 4-4 3 3 3-3 6 6"/><circle cx="9" cy="9" r="1.4"/>`,
  checkout: `<path d="M4 12 10 18l10-12"/>`,
  cart: `<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 3h2.2l1.4 9.4a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 1.9-1.4L20 7H6.2"/>`,
  orders: `<rect x="3" y="7" width="18" height="13" rx="2.4"/><path d="M8.5 7V5.6A1.6 1.6 0 0 1 10.1 4h3.8a1.6 1.6 0 0 1 1.6 1.6V7"/><path d="M3 12h18"/>`,
  tracking: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3.2 2"/>`,
  wallet: `<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H17a1 1 0 0 1 1 1v1.5"/><rect x="3" y="7.5" width="18" height="12" rx="2.4"/><path d="M16 12.5h3.2a.8.8 0 0 1 .8.8v1.4a.8.8 0 0 1-.8.8H16a1.5 1.5 0 0 1 0-3z"/>`,
  notifications: `<path d="M6 9.5a6 6 0 0 1 12 0c0 5 1.8 6.5 1.8 6.5H4.2S6 14.5 6 9.5z"/><path d="M9.8 19a2.3 2.3 0 0 0 4.4 0"/>`,
  inbox: `<path d="M4 6.5h16v11H4z"/><path d="M4 6.5 12 13l8-6.5"/>`,
  messages: `<path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V16H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8 9.5h8M8 12.5h5"/>`,
  reviews: `<path d="M12 3.8 14.4 9l5.6.8-4.1 4 1 5.6L12 16.8 7.1 19.4l1-5.6-4.1-4L9.6 9 12 3.8Z"/>`,
  settings: `<circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V20a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 8.9 18.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03z"/>`,
  help: `<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.85.86c0 1.7-2.45 2.24-2.45 3.74"/><circle cx="12" cy="17" r="0.7"/>`,
  support: `<path d="M5 13v-1a7 7 0 0 1 14 0v1"/><rect x="4" y="13" width="3.5" height="6" rx="1"/><rect x="16.5" y="13" width="3.5" height="6" rx="1"/><path d="M19 17v.5a3 3 0 0 1-3 3h-2.5"/>`,
  trust: `<path d="M12 3.5l7 2.6v5c0 4.4-3 8-7 9.4-4-1.4-7-5-7-9.4v-5l7-2.6z"/><path d="M8.5 12.2h7"/><path d="M12 8.8v6.8"/>`,
  listings: `<path d="M4 4h7.2a2 2 0 0 1 1.42.59l7 7a2 2 0 0 1 0 2.82l-4.8 4.8a2 2 0 0 1-2.82 0l-7-7A2 2 0 0 1 4 10.8V4z"/><circle cx="8.5" cy="8.5" r="1.4"/>`,
  business: `<path d="M4 9.5 5.2 5.3A1 1 0 0 1 6.16 4.6h11.68a1 1 0 0 1 .96.7L20 9.5"/><path d="M4 9.5h16v1a2.5 2.5 0 0 1-4.2 1.83A2.5 2.5 0 0 1 12 12a2.5 2.5 0 0 1-3.8.83A2.5 2.5 0 0 1 4 10.5v-1z"/><path d="M5.5 13v6.5h13V13"/><path d="M10 19.5V16h4v3.5"/>`,
  profile: `<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>`,
  stores: `<path d="M4 9.5 6 4h12l2 5.5"/><path d="M4 9.5h16v10.5H4z"/><path d="M9.5 20V14h5v6"/>`,
  directory: `<path d="M4 5.5h7.5L13 7.5H20v12H4z"/><path d="M8 11h8M8 14.5h5"/>`,
  refunds: `<path d="M7 10H4.5V7.5"/><path d="M4.5 10a7.5 7.5 0 1 1 2.2 5.3"/><path d="M12 8v4l2.5 1.5"/>`,
  disputes: `<path d="M12 3.5 20.5 18H3.5L12 3.5Z"/><path d="M12 10v4"/><circle cx="12" cy="16.5" r="0.7"/>`,
  returns: `<path d="M3.5 7.5 12 4l8.5 3.5L12 11 3.5 7.5z"/><path d="M3.5 7.5v9L12 20l8.5-3.5v-9"/><path d="M12 11v9"/>`,
  shipping: `<path d="M3 6.5h10.5a1 1 0 0 1 1 1v8.5H3z"/><path d="M14.5 10h3.2a1 1 0 0 1 .82.43l2.1 3a1 1 0 0 1 .18.57V16h-6.3v-6z"/><circle cx="7" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/>`,
  payment: `<rect x="3" y="5.5" width="18" height="13" rx="2.4"/><path d="M3 9.5h18"/><path d="M6.5 14.5h4"/>`,
  legal: `<path d="M7 4h7l4 4v12H7z"/><path d="M14 4v4h4"/><path d="M9.5 12h6M9.5 15.5h6M9.5 19h4"/>`,
  verification: `<path d="M12 3.5l7 2.6v5c0 4.4-3 8-7 9.4-4-1.4-7-5-7-9.4v-5l7-2.6z"/><path d="M9 12l2 2 4-4.2"/>`,
  security: `<path d="M12 3.5l7 2.6v5c0 4.4-3 8-7 9.4-4-1.4-7-5-7-9.4v-5l7-2.6z"/><path d="M9 12l2 2 4-4.2"/>`,
  inventory: `<path d="M4 8.5 12 4l8 4.5v9L12 22 4 17.5z"/><path d="M12 13v9"/><path d="M4 8.5 12 13l8-4.5"/>`,
  analytics: `<path d="M4 19h16"/><path d="M7 16V11"/><path d="M12 16V7"/><path d="M17 16v-4"/>`,
  vat: `<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 10h8M8 14h5"/>`,
  recent: `<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5l3 1.8"/>`,
  address: `<path d="M12 21s6.5-5.2 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.8 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.2"/>`,
  language: `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5a14 14 0 0 1 0 17 14 14 0 0 1 0-17Z"/>`,
  accessibility: `<circle cx="12" cy="5.5" r="2"/><path d="M6.5 9.5h11"/><path d="M12 9.5v5.5l-3.5 5"/><path d="M12 15l3.5 5"/>`,
  ideas: `<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>`,
  promotions: `<path d="M3 11v2a4 4 0 0 0 4 4h9.2a3 3 0 0 0 2.8-1.9l1.5-4.1H8.5"/><path d="M7 7h11l-1.2-3.2A2 2 0 0 0 14.9 2H9.6A2 2 0 0 0 7.7 3.4L7 7z"/>`,
  following: `<path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.4L6 20V5.5a1 1 0 0 1 1-1z"/>`,
  import: `<path d="M12 4v9"/><path d="M8.5 10.5 12 14l3.5-3.5"/><path d="M4 14v3.5A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5V14"/>`,
};

const MENUS = {
  "my-account": {
    title: "My Account",
    rows: [
      ["orders", "Buying"],
      ["listings", "Selling"],
      ["business", "Business"],
      ["wallet", "Wallet"],
      ["messages", "Messages"],
      ["notifications", "Notifications"],
      ["verification", "Verification"],
      ["settings", "Settings"],
      ["help", "Help Centre"],
      ["trust", "Trust Centre"],
      ["legal", "Legal Centre"],
    ],
  },
  buying: {
    title: "Buyer Dashboard",
    rows: [
      ["orders", "My Orders"],
      ["tracking", "Tracking"],
      ["reviews", "Reviews"],
      ["refunds", "Refunds"],
      ["disputes", "Disputes"],
      ["saved", "Saved"],
      ["recent", "Recently Viewed"],
    ],
  },
  selling: {
    title: "Seller Dashboard",
    rows: [
      ["listings", "Listings"],
      ["orders", "Orders"],
      ["reviews", "Reviews"],
      ["shipping", "Shipping"],
      ["returns", "Returns"],
      ["analytics", "Performance"],
      ["legal", "Compliance"],
    ],
  },
  business: {
    title: "Business Seller",
    rows: [
      ["orders", "Orders"],
      ["inventory", "Inventory"],
      ["analytics", "Analytics"],
      ["reviews", "Reviews"],
      ["wallet", "Wallet"],
      ["vat", "VAT"],
      ["directory", "Directory"],
    ],
  },
  wallet: {
    title: "Wallet",
    rows: [
      ["wallet", "Available"],
      ["wallet", "Pending"],
      ["payment", "Withdraw"],
      ["wallet", "Transactions"],
      ["payment", "Personal Bank"],
      ["payment", "Business Bank"],
    ],
  },
  "transaction-hub": {
    title: "Transaction Hub",
    rows: [
      ["inbox", "Inbox"],
      ["orders", "Orders"],
      ["tracking", "Tracking"],
      ["messages", "Messages"],
      ["reviews", "Reviews"],
      ["support", "Support"],
      ["refunds", "Refunds"],
      ["disputes", "Disputes"],
    ],
  },
  settings: {
    title: "Settings",
    rows: [
      ["profile", "Profile"],
      ["address", "Addresses"],
      ["payment", "Payment Methods"],
      ["notifications", "Notifications"],
      ["ideas", "ROVEXO Ideas"],
      ["security", "Privacy & Security"],
      ["language", "Language & Currency"],
      ["accessibility", "Accessibility"],
      ["legal", "Terms & Policies"],
    ],
  },
  commerce: {
    title: "Commerce pages",
    rows: [
      ["search", "Search"],
      ["categories", "Categories"],
      ["product", "Product details"],
      ["cart", "Cart"],
      ["checkout", "Checkout"],
      ["sell", "Sell"],
      ["stores", "Stores"],
      ["payment", "Payments"],
      ["shipping", "Shipping"],
      ["trust", "Trust & Safety"],
      ["help", "Help"],
      ["support", "Support"],
      ["legal", "Legal"],
    ],
  },
};

function svgIcon(key, size = 24) {
  const body = ICONS[key];
  if (!body) return "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${PURPLE}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

function menuPhone(menu) {
  const rows = menu.rows
    .map(
      ([icon, label]) => `
    <div class="row">
      <span class="ico">${svgIcon(icon, 22)}</span>
      <span class="label">${label}</span>
      <span class="chev">›</span>
    </div>`,
    )
    .join("");
  return `<article class="phone"><header><h2>${menu.title}</h2><p>16px · 100% · line icons</p></header><div class="list">${rows}</div></article>`;
}

function writeTree(dir) {
  mkdirSync(join(dir, "icons"), { recursive: true });
  mkdirSync(join(dir, "menus"), { recursive: true });
  mkdirSync(join(dir, "responsive"), { recursive: true });

  for (const [key, body] of Object.entries(ICONS)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="${PURPLE}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    writeFileSync(join(dir, "icons", `${key}.svg`), svg);
  }

  const iconCards = Object.keys(ICONS)
    .map(
      (key) => `<figure class="icon-card"><img src="icons/${key}.svg" alt="${key}" width="64" height="64"/><figcaption>${key}</figcaption></figure>`,
    )
    .join("\n");

  const menuCards = Object.entries(MENUS)
    .map(([id, menu]) => {
      const html = `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${menu.title}</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#f8fafc}
.wrap{max-width:390px;margin:0 auto;padding:16px;width:100%;box-sizing:border-box}
.phone{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden}
header{padding:16px;border-bottom:1px solid #e2e8f0}header h2{margin:0;font-size:18px}header p{margin:4px 0 0;font-size:12px;color:#64748b}
.row{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #f1f5f9}
.ico{width:22px;height:22px;display:inline-flex;color:${PURPLE}}
.label{flex:1;font-size:15px;font-weight:600;color:#111}
.chev{color:#94a3b8;font-size:18px}
a{color:${PURPLE}}
</style></head><body><div class="wrap"><p><a href="../index.html">← Icon system</a></p>${menuPhone(menu)}</div></body></html>`;
      writeFileSync(join(dir, "menus", `${id}.html`), html);
      return `<a class="menu-link" href="menus/${id}.html">${menu.title}</a>`;
    })
    .join("\n");

  const index = `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex, nofollow"/>
<title>ROVEXO v1.0 — Canonical Icon &amp; UI Visual System</title>
<style>
:root{--purple:${PURPLE}}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,sans-serif;background:#f8fafc;color:#111}
.banner{background:var(--purple);color:#fff;padding:14px 16px;font-size:13px;line-height:1.45}
.top{padding:16px;background:#fff;border-bottom:1px solid #e2e8f0}
.top h1{margin:0;font-size:18px}
.top p{margin:6px 0 0;font-size:13px;color:#64748b;max-width:70ch}
.panel{margin:16px;padding:16px;background:#fff;border:1px solid #e2e8f0;border-radius:12px}
.panel h2{margin:0 0 10px;font-size:15px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:12px}
.icon-card{margin:0;padding:12px;border:1px solid #e2e8f0;border-radius:12px;text-align:center;background:#fff}
.icon-card img{display:block;margin:0 auto}
.icon-card figcaption{margin-top:8px;font-size:11px;color:#64748b;word-break:break-word}
.menu-nav{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
.menu-link{display:block;padding:12px;border:1px solid #e2e8f0;border-radius:10px;text-decoration:none;color:#111;font-weight:600;font-size:13px;background:#fff}
.menu-link:hover{border-color:var(--purple);color:var(--purple)}
.phones{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;padding:0 16px 24px}
.phone{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;max-width:390px;width:100%}
.phone header{padding:14px 16px;border-bottom:1px solid #e2e8f0}
.phone header h2{margin:0;font-size:16px}
.phone header p{margin:4px 0 0;font-size:11px;color:#64748b}
.row{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f1f5f9}
.ico{width:22px;height:22px;display:inline-flex}
.label{flex:1;font-size:14px;font-weight:600}
.chev{color:#94a3b8}
.ok{color:#15803d;font-weight:700;font-size:13px}
</style>
</head>
<body>
<div class="banner"><strong>CANONICAL UI IMAGE &amp; ICON SYSTEM</strong><br/>Classic · standard · minimalist · purple · 16px · 100% phone width · NO Homepage/Login/Register</div>
<header class="top">
  <h1>ROVEXO v1.0 Canonical Marketplace Visual System</h1>
  <p>One icon system · one colour system · one spacing/width system. Every menu and submenu uses the same line icon family.</p>
  <p class="ok">Status: VISUAL PREVIEW READY · NOT PRODUCTION</p>
</header>
<section class="panel">
  <h2>All icons (${Object.keys(ICONS).length})</h2>
  <div class="grid">${iconCards}</div>
</section>
<section class="panel">
  <h2>Menus &amp; submenus (open full page)</h2>
  <div class="menu-nav">${menuCards}</div>
</section>
<p style="padding:0 16px;font-size:14px;font-weight:700">Menu visual previews (mobile)</p>
<div class="phones">
${Object.values(MENUS).map(menuPhone).join("\n")}
</div>
</body>
</html>`;

  writeFileSync(join(dir, "index.html"), index);

  // Responsive composite: same index note
  writeFileSync(
    join(dir, "responsive", "index.html"),
    `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Responsive — Icon System</title>
<style>body{margin:0;font-family:system-ui;padding:16px;background:#f8fafc}iframe{width:100%;max-width:390px;height:720px;border:1px solid #e2e8f0;border-radius:16px;background:#fff}</style>
</head><body><h1>Mobile responsive check</h1><p>Phone-width iframe of icon system (16px insets).</p><iframe src="../index.html" title="Icon system mobile"></iframe></body></html>`,
  );

  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify(
      {
        version: "canonical-icon-system-v1",
        excluded: ["homepage", "login", "register"],
        stroke: STROKE,
        colour: { bg: "#ffffff", primary: PURPLE, text: "#111111", secondary: "#64748b" },
        width: "16px · 100% · 16px",
        iconCount: Object.keys(ICONS).length,
        icons: Object.keys(ICONS),
        menus: Object.keys(MENUS),
      },
      null,
      2,
    ),
  );
}

writeTree(OUT);
writeTree(PACK);

// Link from master preview index if present
const masterIndex = join(ROOT, "owner-review-screenshots", "master-image-pack-v1", "index.html");
if (existsSync(masterIndex)) {
  let html = readFileSync(masterIndex, "utf8");
  if (!html.includes("icon-system/")) {
    html = html.replace(
      '<a href="responsive/">Responsive</a>',
      '<a href="responsive/">Responsive</a> · <a href="icon-system/">Canonical Icon System</a>',
    );
    writeFileSync(masterIndex, html);
  }
}

console.log(`Wrote ${OUT}`);
console.log(`Wrote ${PACK}`);
console.log(`Icons: ${Object.keys(ICONS).length} · Menus: ${Object.keys(MENUS).length}`);
