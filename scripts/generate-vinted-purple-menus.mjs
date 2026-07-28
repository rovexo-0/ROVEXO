#!/usr/bin/env node
/**
 * ROVEXO menus — true Vinted profile structure + ROVEXO purple accents only.
 * Excludes Homepage / Login / Register.
 *
 * Vinted profile traits matched:
 * - Full phone width, white canvas
 * - Profile header: avatar 64px + name + "View my profile" in brand colour
 * - Section bands (#F2F2F2) between groups
 * - Section titles 13px / 600 / #666
 * - Rows 56px, label 16px / 400 (NOT bold)
 * - Icons 24px DARK (#333) — brand colour NOT on every icon
 * - Dividers inset from left (after icon), not full-bleed from edge
 * - Chevron #BBB, thin
 * - Purple (#9333ea) ONLY for: View profile link, primary CTA, badges
 * - No cards, no shadows, no banners, no footers
 */
import { mkdirSync, writeFileSync, cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "owner-review-screenshots", "vinted-purple-menus-v1");
const PACK = join(ROOT, "owner-review-screenshots", "master-image-pack-v1", "menus-vinted");

const W = 390;
const INSET = 16;
const PURPLE = "#9333ea"; // ROVEXO (replaces Vinted teal #007782)
const BLACK = "#1A1A1A";
const ICON_COLOR = "#333333"; // Vinted: icons are dark, not brand
const GREY = "#666666";
const MUTED = "#999999";
const LINE = "#E0E0E0";
const BAND = "#F2F2F2";
const BG = "#FFFFFF";
const ROW_H = 56;
const ICON = 24;
const AVATAR = 64;

const PATHS = {
  bag: `<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>`,
  heart: `<path d="M12 20.5 10.7 19.3C6.1 15.1 3 12.3 3 8.9 3 6.2 5.2 4 8 4c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2 2.8 0 5 2.2 5 4.9 0 3.4-3.1 6.2-7.7 10.4L12 20.5Z"/>`,
  tag: `<path d="M4 4h7.2a2 2 0 0 1 1.42.59l7 7a2 2 0 0 1 0 2.82l-4.8 4.8a2 2 0 0 1-2.82 0l-7-7A2 2 0 0 1 4 10.8V4z"/><circle cx="8.5" cy="8.5" r="1.3"/>`,
  shop: `<path d="M4 9.5 6 4h12l2 5.5"/><path d="M4 9.5h16v10.5H4z"/><path d="M9.5 20V14h5v6"/>`,
  wallet: `<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M3 7.5A2 2 0 0 1 5 5.5h12"/><path d="M16 12.5h3v3h-3a1.5 1.5 0 0 1 0-3z"/>`,
  chat: `<path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V16H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>`,
  bell: `<path d="M6 9.5a6 6 0 0 1 12 0c0 5 1.8 6.5 1.8 6.5H4.2S6 14.5 6 9.5z"/><path d="M9.8 19a2.3 2.3 0 0 0 4.4 0"/>`,
  shield: `<path d="M12 3.5l7 2.6v5c0 4.4-3 8-7 9.4-4-1.4-7-5-7-9.4v-5l7-2.6z"/><path d="M9 12l2 2 4-4.2"/>`,
  gear: `<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>`,
  help: `<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.85.86c0 1.7-2.45 2.24-2.45 3.74"/><circle cx="12" cy="17" r="0.6" fill="${ICON_COLOR}" stroke="none"/>`,
  doc: `<path d="M7 4h7l4 4v12H7z"/><path d="M14 4v4h4"/><path d="M9.5 12h6M9.5 15.5h6"/>`,
  truck: `<path d="M3 7h10v9H3z"/><path d="M13 10h4l3 3v3h-7V10z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>`,
  star: `<path d="M12 3.8 14.4 9l5.6.8-4.1 4 1 5.6L12 16.8 7.1 19.4l1-5.6-4.1-4L9.6 9 12 3.8Z"/>`,
  clock: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3.2 2"/>`,
  card: `<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 9.5h18"/><path d="M6.5 14.5h4"/>`,
  box: `<path d="M4 8.5 12 4l8 4.5v9L12 22 4 17.5z"/><path d="M12 13v9"/><path d="M4 8.5 12 13l8-4.5"/>`,
  chart: `<path d="M4 19h16"/><path d="M7 16V11"/><path d="M12 16V7"/><path d="M17 16v-4"/>`,
  pin: `<path d="M12 21s6.5-5.2 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.8 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.1"/>`,
  search: `<circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.5-3.5"/>`,
  check: `<path d="M4 12 10 18l10-12"/>`,
  warn: `<path d="M12 3.5 20.5 18H3.5L12 3.5Z"/><path d="M12 10v4"/><circle cx="12" cy="16.5" r="0.6" fill="${ICON_COLOR}" stroke="none"/>`,
  refund: `<path d="M7 10H4.5V7.5"/><path d="M4.5 10a7.5 7.5 0 1 1 2.2 5.3"/>`,
  user: `<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>`,
  headset: `<path d="M5 13v-1a7 7 0 0 1 14 0v1"/><rect x="4" y="13" width="3.5" height="6" rx="1"/><rect x="16.5" y="13" width="3.5" height="6" rx="1"/>`,
  folder: `<path d="M4 5.5h7.5L13 7.5H20v12H4z"/>`,
  camera: `<rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6 9.5 4h5L16 6"/>`,
  logout: `<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M16 8l4 4-4 4"/><path d="M8 12h12"/>`,
};

function ico(name, x, y, color = ICON_COLOR) {
  const body = PATHS[name] || PATHS.help;
  return `<g transform="translate(${x} ${y})"><svg width="${ICON}" height="${ICON}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</svg></g>`;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * sections: [{ title?: string, rows: [{icon, label, badge?}] }]
 * showProfile: boolean
 */
function renderScreen({ id, title, showProfile = false, sections, cta }) {
  let y = 0;
  const parts = [];
  // status
  parts.push(`<rect width="${W}" height="44" fill="${BG}"/>`);
  parts.push(`<text x="${INSET}" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="${BLACK}">9:41</text>`);
  y = 44;

  if (showProfile) {
    const ph = 100;
    parts.push(`<rect x="0" y="${y}" width="${W}" height="${ph}" fill="${BG}"/>`);
    // avatar
    const ax = INSET;
    const ay = y + 18;
    parts.push(`<circle cx="${ax + AVATAR / 2}" cy="${ay + AVATAR / 2}" r="${AVATAR / 2}" fill="#E8E8E8"/>`);
    parts.push(`<circle cx="${ax + AVATAR / 2}" cy="${ay + 26}" r="12" fill="none" stroke="#BDBDBD" stroke-width="1.5"/>`);
    parts.push(`<path d="M${ax + 20} ${ay + 42} a12 8 0 0 0 24 0" fill="none" stroke="#BDBDBD" stroke-width="1.5"/>`);
    // name + view profile (Vinted pattern)
    const tx = ax + AVATAR + 14;
    parts.push(`<text x="${tx}" y="${ay + 28}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="${BLACK}">Alex Morgan</text>`);
    parts.push(`<text x="${tx}" y="${ay + 52}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="${PURPLE}">View my profile</text>`);
    parts.push(`<path d="M${tx + 108} ${ay + 47} l4 4 -4 4" fill="none" stroke="${PURPLE}" stroke-width="1.6" stroke-linecap="round"/>`);
    y += ph;
    // thin full divider under profile
    parts.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${LINE}" stroke-width="1"/>`);
  } else {
    // simple centered title bar like Vinted sub-pages
    parts.push(`<rect x="0" y="${y}" width="${W}" height="52" fill="${BG}"/>`);
    parts.push(`<path d="M${INSET + 8} ${y + 26} l-6 -6 6 -6" fill="none" stroke="${BLACK}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`);
    parts.push(`<text x="${W / 2}" y="${y + 32}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="700" fill="${BLACK}">${esc(title)}</text>`);
    y += 52;
    parts.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${LINE}" stroke-width="1"/>`);
  }

  for (let s = 0; s < sections.length; s++) {
    const section = sections[s];
    // grey band between sections (Vinted)
    if (s > 0 || showProfile) {
      parts.push(`<rect x="0" y="${y}" width="${W}" height="8" fill="${BAND}"/>`);
      y += 8;
    }
    if (section.title) {
      parts.push(`<rect x="0" y="${y}" width="${W}" height="36" fill="${BG}"/>`);
      parts.push(`<text x="${INSET}" y="${y + 24}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="${GREY}">${esc(section.title)}</text>`);
      y += 36;
    }
    for (let i = 0; i < section.rows.length; i++) {
      const row = section.rows[i];
      const top = y;
      parts.push(`<rect x="0" y="${top}" width="${W}" height="${ROW_H}" fill="${BG}"/>`);
      parts.push(ico(row.icon, INSET, top + (ROW_H - ICON) / 2));
      // label — Vinted uses regular weight
      parts.push(`<text x="${INSET + ICON + 14}" y="${top + 34}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="400" fill="${BLACK}">${esc(row.label)}</text>`);
      if (row.badge) {
        const bx = W - INSET - 28;
        parts.push(`<circle cx="${bx}" cy="${top + ROW_H / 2}" r="10" fill="${PURPLE}"/>`);
        parts.push(`<text x="${bx}" y="${top + ROW_H / 2 + 4}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#fff">${esc(row.badge)}</text>`);
      } else {
        parts.push(`<path d="M${W - INSET - 4} ${top + ROW_H / 2 - 5} l5 5 -5 5" fill="none" stroke="#BBBBBB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`);
      }
      // inset divider (Vinted / iOS) — starts after icon column
      if (i < section.rows.length - 1) {
        const dx = INSET + ICON + 14;
        parts.push(`<line x1="${dx}" y1="${top + ROW_H}" x2="${W}" y2="${top + ROW_H}" stroke="${LINE}" stroke-width="1"/>`);
      }
      y += ROW_H;
    }
  }

  if (cta) {
    parts.push(`<rect x="0" y="${y}" width="${W}" height="8" fill="${BAND}"/>`);
    y += 8;
    parts.push(`<rect x="0" y="${y}" width="${W}" height="72" fill="${BG}"/>`);
    parts.push(`<rect x="${INSET}" y="${y + 12}" width="${W - INSET * 2}" height="48" rx="4" fill="${PURPLE}"/>`);
    parts.push(`<text x="${W / 2}" y="${y + 42}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF">${esc(cta)}</text>`);
    y += 72;
  }

  // bottom band
  parts.push(`<rect x="0" y="${y}" width="${W}" height="24" fill="${BAND}"/>`);
  y += 24;
  parts.push(`<text x="${INSET}" y="${y - 8}" font-family="ui-monospace,monospace" font-size="9" fill="${MUTED}">Vinted structure · icons #333 · accent ${PURPLE} · row ${ROW_H}px · inset divider</text>`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}">
  <rect width="${W}" height="${y}" fill="${BAND}"/>
  ${parts.join("\n")}
</svg>`;
  return { id, title, svg, height: y };
}

const SCREENS = [
  renderScreen({
    id: "my-account",
    title: "My Account",
    showProfile: true,
    sections: [
      {
        title: "Buying",
        rows: [
          { icon: "bag", label: "My orders", badge: "2" },
          { icon: "heart", label: "Favourites" },
          { icon: "clock", label: "Recently viewed" },
        ],
      },
      {
        title: "Selling",
        rows: [
          { icon: "tag", label: "My listings" },
          { icon: "bag", label: "Seller orders" },
          { icon: "truck", label: "Shipping" },
          { icon: "star", label: "Reviews" },
        ],
      },
      {
        title: "Business",
        rows: [
          { icon: "shop", label: "Business tools" },
          { icon: "box", label: "Inventory" },
          { icon: "chart", label: "Analytics" },
          { icon: "folder", label: "Directory" },
        ],
      },
      {
        title: "Wallet & account",
        rows: [
          { icon: "wallet", label: "Wallet" },
          { icon: "card", label: "Personal bank" },
          { icon: "chat", label: "Messages", badge: "3" },
          { icon: "bell", label: "Notifications" },
          { icon: "shield", label: "Verification" },
          { icon: "gear", label: "Settings" },
        ],
      },
      {
        title: "Support",
        rows: [
          { icon: "help", label: "Help Centre" },
          { icon: "shield", label: "Trust & Safety" },
          { icon: "doc", label: "Legal" },
          { icon: "logout", label: "Log out" },
        ],
      },
    ],
  }),
  renderScreen({
    id: "buying",
    title: "Buying",
    sections: [
      {
        rows: [
          { icon: "bag", label: "My orders" },
          { icon: "truck", label: "Tracking" },
          { icon: "star", label: "Reviews" },
          { icon: "refund", label: "Refunds" },
          { icon: "warn", label: "Disputes" },
          { icon: "heart", label: "Favourites" },
          { icon: "clock", label: "Recently viewed" },
        ],
      },
    ],
  }),
  renderScreen({
    id: "selling",
    title: "Selling",
    sections: [
      {
        rows: [
          { icon: "tag", label: "Listings" },
          { icon: "bag", label: "Orders" },
          { icon: "star", label: "Reviews" },
          { icon: "truck", label: "Shipping" },
          { icon: "refund", label: "Returns" },
          { icon: "chart", label: "Performance" },
          { icon: "doc", label: "Compliance" },
        ],
      },
    ],
    cta: "Sell now",
  }),
  renderScreen({
    id: "business",
    title: "Business",
    sections: [
      {
        rows: [
          { icon: "bag", label: "Orders" },
          { icon: "box", label: "Inventory" },
          { icon: "chart", label: "Analytics" },
          { icon: "star", label: "Reviews" },
          { icon: "wallet", label: "Wallet" },
          { icon: "doc", label: "VAT" },
          { icon: "folder", label: "Directory" },
        ],
      },
    ],
  }),
  renderScreen({
    id: "wallet",
    title: "Wallet",
    sections: [
      {
        title: "Balance",
        rows: [
          { icon: "wallet", label: "Available" },
          { icon: "clock", label: "Pending" },
          { icon: "card", label: "Withdraw" },
        ],
      },
      {
        title: "Bank",
        rows: [
          { icon: "card", label: "Personal bank" },
          { icon: "shop", label: "Business bank" },
          { icon: "doc", label: "Transactions" },
        ],
      },
    ],
    cta: "Withdraw",
  }),
  renderScreen({
    id: "transaction-hub",
    title: "Messages",
    sections: [
      {
        rows: [
          { icon: "chat", label: "Inbox", badge: "3" },
          { icon: "bag", label: "Orders" },
          { icon: "truck", label: "Tracking" },
          { icon: "chat", label: "Messages" },
          { icon: "star", label: "Reviews" },
          { icon: "headset", label: "Support" },
          { icon: "refund", label: "Refunds" },
          { icon: "warn", label: "Disputes" },
        ],
      },
    ],
  }),
  renderScreen({
    id: "settings",
    title: "Settings",
    sections: [
      {
        title: "Account",
        rows: [
          { icon: "user", label: "Profile" },
          { icon: "pin", label: "Addresses" },
          { icon: "card", label: "Payment methods" },
          { icon: "bell", label: "Notifications" },
        ],
      },
      {
        title: "Privacy & security",
        rows: [
          { icon: "shield", label: "Privacy & security" },
          { icon: "gear", label: "Language & currency" },
          { icon: "help", label: "Accessibility" },
        ],
      },
      {
        title: "About",
        rows: [
          { icon: "doc", label: "Terms & policies" },
          { icon: "help", label: "About ROVEXO" },
        ],
      },
    ],
  }),
  renderScreen({
    id: "search",
    title: "Search",
    sections: [
      {
        rows: [
          { icon: "search", label: "Search items" },
          { icon: "tag", label: "Categories" },
          { icon: "gear", label: "Filters" },
          { icon: "heart", label: "Saved searches" },
        ],
      },
    ],
  }),
  renderScreen({
    id: "sell",
    title: "Sell an item",
    sections: [
      {
        rows: [
          { icon: "camera", label: "Photos" },
          { icon: "tag", label: "Title & description" },
          { icon: "card", label: "Price" },
          { icon: "box", label: "Parcel size" },
          { icon: "truck", label: "Shipping" },
        ],
      },
    ],
    cta: "Upload",
  }),
  renderScreen({
    id: "orders",
    title: "Orders",
    sections: [
      {
        rows: [
          { icon: "bag", label: "Bought" },
          { icon: "tag", label: "Sold" },
          { icon: "clock", label: "In progress" },
          { icon: "check", label: "Completed" },
          { icon: "warn", label: "Cancelled" },
        ],
      },
    ],
  }),
  renderScreen({
    id: "notifications",
    title: "Notifications",
    sections: [
      {
        rows: [
          { icon: "bell", label: "All" },
          { icon: "bag", label: "Orders" },
          { icon: "wallet", label: "Wallet" },
          { icon: "chat", label: "Messages" },
        ],
      },
    ],
  }),
  renderScreen({
    id: "help",
    title: "Help Centre",
    sections: [
      {
        rows: [
          { icon: "help", label: "Help topics" },
          { icon: "headset", label: "Contact support" },
          { icon: "shield", label: "Trust & Safety" },
          { icon: "doc", label: "Legal" },
        ],
      },
    ],
  }),
];

function writeTree(dir) {
  mkdirSync(join(dir, "frames"), { recursive: true });
  mkdirSync(join(dir, "menus"), { recursive: true });

  const cards = [];
  for (const screen of SCREENS) {
    writeFileSync(join(dir, "frames", `${screen.id}.svg`), screen.svg);
    const page = `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(screen.title)} — Vinted-structure · ROVEXO purple</title>
<style>
*{box-sizing:border-box}html,body{margin:0;background:${BAND}}
.bar{padding:10px 16px;background:${PURPLE};color:#fff;font:600 12px -apple-system,sans-serif}
.bar a{color:#fff}
.phone{width:100%;max-width:390px;margin:0 auto;background:#fff}
</style></head><body>
<div class="bar"><a href="../">← All menus</a> · ${esc(screen.title)} · Vinted layout · purple accents</div>
<div class="phone">${screen.svg}</div>
</body></html>`;
    mkdirSync(join(dir, "menus", screen.id), { recursive: true });
    writeFileSync(join(dir, "menus", screen.id, "index.html"), page);
    cards.push(`<a class="card" href="menus/${screen.id}/"><div class="frame">${screen.svg}</div><span>${esc(screen.title)}</span></a>`);
  }

  const index = `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ROVEXO menus = structură Vinted + purple</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:${BAND};color:${BLACK}}
.banner{background:${PURPLE};color:#fff;padding:14px 16px;font-size:13px;line-height:1.45}
.panel{margin:16px;padding:16px;background:#fff}
.panel h1{margin:0 0 8px;font-size:18px}
.panel li{font-size:13px;color:${GREY};margin:6px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;padding:16px}
.card{display:block;background:#fff;text-decoration:none;color:${BLACK};border:1px solid ${LINE}}
.card .frame{width:100%;overflow:hidden}
.card .frame svg{display:block;width:100%;height:auto}
.card span{display:block;padding:12px 16px;font-size:15px;font-weight:600;border-top:1px solid ${LINE}}
</style>
</head>
<body>
<div class="banner">
  <strong>CORECTAT: structură Vinted reală</strong><br/>
  Iconuri gri #333 (ca Vinted) · purple doar pe „View my profile” / CTA / badge · divider inset · secțiuni cu bandă gri · fără carduri
</div>
<section class="panel">
  <h1>Ce s-a schimbat ca să fie ca pe Vinted</h1>
  <ul>
    <li>Header profil: avatar 64px + nume + <strong style="color:${PURPLE}">View my profile</strong> (accent brand)</li>
    <li>Iconuri meniu <strong>gri închis #333</strong> — nu purple pe fiecare rând (Vinted folosește brand doar pe linkuri/CTA)</li>
    <li>Text rând: <strong>16px / regular (400)</strong>, nu bold</li>
    <li>Înălțime rând: <strong>56px</strong></li>
    <li>Divider <strong>inset</strong> (începe după icon), nu full de la margine</li>
    <li>Secțiuni separate cu bandă <strong>#F2F2F2</strong> + titlu gri 13px</li>
    <li>CTA plin brand (Sell now / Withdraw / Upload) — height 48, radius 4</li>
    <li>Fără carduri, fără umbre, fără bannere</li>
    <li>Exclus: Homepage, Login, Register</li>
  </ul>
</section>
<div class="grid">${cards.join("\n")}</div>
</body>
</html>`;
  writeFileSync(join(dir, "index.html"), index);
  writeFileSync(
    join(dir, "VINTED_MATCH_NOTES.md"),
    `# Vinted match notes (ROVEXO purple)

Brand accent (ROVEXO purple instead of Vinted teal #007782): ${PURPLE}

| Token | Vinted-like value |
|-------|-------------------|
| Icon colour | #333 (not brand) |
| Row height | 56 |
| Label | 16 / 400 |
| Inset | 16 |
| Divider | inset after icon |
| Section band | #F2F2F2 8px |
| Avatar | 64 |
| CTA | 48h / radius 4 / brand fill |
`,
  );
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
writeTree(OUT);
if (existsSync(PACK)) rmSync(PACK, { recursive: true, force: true });
cpSync(OUT, PACK, { recursive: true });
console.log(`Screens: ${SCREENS.length} → ${OUT}`);
