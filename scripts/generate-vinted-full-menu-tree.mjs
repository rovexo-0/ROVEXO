#!/usr/bin/env node
/**
 * ROVEXO — Full Vinted menu tree (100% structure) + ROVEXO functions
 * Inbox = hub exactly like Vinted (Messages | Notifications)
 * Vinted "Buyer Protection" → ROVEXO "Platform Fee" (5.5%)
 * Excludes Homepage / Login / Register redesign
 */
import { mkdirSync, writeFileSync, cpSync, existsSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "owner-review-screenshots", "vinted-full-menu-tree-v1");
const PACK = join(ROOT, "owner-review-screenshots", "master-image-pack-v1", "menus-vinted-full");

const W = 390;
const INSET = 16;
const PURPLE = "#9333ea";
const BLACK = "#1A1A1A";
const ICON_C = "#333333";
const GREY = "#666666";
const MUTED = "#999999";
const LINE = "#E0E0E0";
const BAND = "#F2F2F2";
const BG = "#FFFFFF";
const ROW = 56;
const ICON = 24;
const AVATAR = 64;

const P = {
  bag: `<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>`,
  heart: `<path d="M12 20.5 10.7 19.3C6.1 15.1 3 12.3 3 8.9 3 6.2 5.2 4 8 4c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2 2.8 0 5 2.2 5 4.9 0 3.4-3.1 6.2-7.7 10.4L12 20.5Z"/>`,
  tag: `<path d="M4 4h7.2a2 2 0 0 1 1.42.59l7 7a2 2 0 0 1 0 2.82l-4.8 4.8a2 2 0 0 1-2.82 0l-7-7A2 2 0 0 1 4 10.8V4z"/><circle cx="8.5" cy="8.5" r="1.3"/>`,
  shop: `<path d="M4 9.5 6 4h12l2 5.5"/><path d="M4 9.5h16v10.5H4z"/><path d="M9.5 20V14h5v6"/>`,
  wallet: `<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M3 7.5A2 2 0 0 1 5 5.5h12"/><path d="M16 12.5h3v3h-3a1.5 1.5 0 0 1 0-3z"/>`,
  chat: `<path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V16H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>`,
  bell: `<path d="M6 9.5a6 6 0 0 1 12 0c0 5 1.8 6.5 1.8 6.5H4.2S6 14.5 6 9.5z"/><path d="M9.8 19a2.3 2.3 0 0 0 4.4 0"/>`,
  shield: `<path d="M12 3.5l7 2.6v5c0 4.4-3 8-7 9.4-4-1.4-7-5-7-9.4v-5l7-2.6z"/><path d="M9 12l2 2 4-4.2"/>`,
  gear: `<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2"/>`,
  help: `<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.85.86c0 1.7-2.45 2.24-2.45 3.74"/><circle cx="12" cy="17" r="0.6" fill="${ICON_C}" stroke="none"/>`,
  doc: `<path d="M7 4h7l4 4v12H7z"/><path d="M14 4v4h4"/>`,
  truck: `<path d="M3 7h10v9H3z"/><path d="M13 10h4l3 3v3h-7V10z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>`,
  star: `<path d="M12 3.8 14.4 9l5.6.8-4.1 4 1 5.6L12 16.8 7.1 19.4l1-5.6-4.1-4L9.6 9 12 3.8Z"/>`,
  clock: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3.2 2"/>`,
  card: `<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 9.5h18"/>`,
  box: `<path d="M4 8.5 12 4l8 4.5v9L12 22 4 17.5z"/><path d="M12 13v9"/>`,
  chart: `<path d="M4 19h16"/><path d="M7 16V11"/><path d="M12 16V7"/><path d="M17 16v-4"/>`,
  pin: `<path d="M12 21s6.5-5.2 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.8 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.1"/>`,
  search: `<circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.5-3.5"/>`,
  check: `<path d="M4 12 10 18l10-12"/>`,
  warn: `<path d="M12 3.5 20.5 18H3.5L12 3.5Z"/><path d="M12 10v4"/>`,
  refund: `<path d="M7 10H4.5V7.5"/><path d="M4.5 10a7.5 7.5 0 1 1 2.2 5.3"/>`,
  user: `<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>`,
  headset: `<path d="M5 13v-1a7 7 0 0 1 14 0v1"/><rect x="4" y="13" width="3.5" height="6" rx="1"/><rect x="16.5" y="13" width="3.5" height="6" rx="1"/>`,
  folder: `<path d="M4 5.5h7.5L13 7.5H20v12H4z"/>`,
  camera: `<rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/>`,
  logout: `<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M16 8l4 4-4 4"/><path d="M8 12h12"/>`,
  home: `<path d="M4 10.5 12 4l8 6.5V20h-5v-6h-4v6H4z"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  fee: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M9 10h4.5a2 2 0 0 1 0 4H9"/>`,
};

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function ico(name, x, y, c = ICON_C) {
  return `<g transform="translate(${x} ${y})"><svg width="${ICON}" height="${ICON}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${P[name] || P.help}</svg></g>`;
}

function statusBar() {
  return `<rect width="${W}" height="44" fill="${BG}"/><text x="${INSET}" y="28" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="15" font-weight="600" fill="${BLACK}">9:41</text>`;
}

function bottomNav(active = "inbox") {
  const items = [
    { id: "home", label: "Home", icon: "home" },
    { id: "search", label: "Search", icon: "search" },
    { id: "sell", label: "Sell", icon: "plus" },
    { id: "inbox", label: "Inbox", icon: "chat" },
    { id: "profile", label: "Profile", icon: "user" },
  ];
  const y0 = 0;
  let h = `<rect x="0" y="${y0}" width="${W}" height="64" fill="${BG}"/><line x1="0" y1="${y0}" x2="${W}" y2="${y0}" stroke="${LINE}" stroke-width="1"/>`;
  const slot = W / 5;
  items.forEach((it, i) => {
    const cx = slot * i + slot / 2;
    const on = it.id === active;
    const col = on ? PURPLE : MUTED;
    h += ico(it.icon, cx - 12, y0 + 8, col);
    h += `<text x="${cx}" y="${y0 + 52}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="10" font-weight="${on ? 700 : 500}" fill="${col}">${esc(it.label)}</text>`;
    if (it.id === "inbox") {
      h += `<circle cx="${cx + 10}" cy="${y0 + 10}" r="7" fill="${PURPLE}"/><text x="${cx + 10}" y="${y0 + 13}" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">3</text>`;
    }
  });
  return { svg: h, height: 64 };
}

/** Generic Vinted list screen */
function listScreen({ id, title, showBack = true, sections = [], profile = false, cta, feeNote, bottomActive }) {
  let y = 0;
  const parts = [statusBar()];
  y = 44;

  if (profile) {
    const ph = 100;
    parts.push(`<rect x="0" y="${y}" width="${W}" height="${ph}" fill="${BG}"/>`);
    const ax = INSET, ay = y + 18;
    parts.push(`<circle cx="${ax + AVATAR / 2}" cy="${ay + AVATAR / 2}" r="${AVATAR / 2}" fill="#E8E8E8"/>`);
    parts.push(`<text x="${ax + AVATAR + 14}" y="${ay + 28}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="18" font-weight="700" fill="${BLACK}">Alex Morgan</text>`);
    parts.push(`<text x="${ax + AVATAR + 14}" y="${ay + 52}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="14" font-weight="600" fill="${PURPLE}">View my profile</text>`);
    parts.push(`<path d="M${ax + AVATAR + 122} ${ay + 47} l4 4 -4 4" fill="none" stroke="${PURPLE}" stroke-width="1.6" stroke-linecap="round"/>`);
    y += ph;
    parts.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${LINE}" stroke-width="1"/>`);
  } else {
    parts.push(`<rect x="0" y="${y}" width="${W}" height="52" fill="${BG}"/>`);
    if (showBack) {
      parts.push(`<path d="M${INSET + 8} ${y + 26} l-6 -6 6 -6" fill="none" stroke="${BLACK}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
    parts.push(`<text x="${W / 2}" y="${y + 32}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="17" font-weight="700" fill="${BLACK}">${esc(title)}</text>`);
    y += 52;
    parts.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${LINE}" stroke-width="1"/>`);
  }

  sections.forEach((section, si) => {
    if (si > 0 || profile) {
      parts.push(`<rect x="0" y="${y}" width="${W}" height="8" fill="${BAND}"/>`);
      y += 8;
    }
    if (section.title) {
      parts.push(`<rect x="0" y="${y}" width="${W}" height="36" fill="${BG}"/><text x="${INSET}" y="${y + 24}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="13" font-weight="700" fill="${GREY}">${esc(section.title)}</text>`);
      y += 36;
    }
    section.rows.forEach((row, i) => {
      const top = y;
      parts.push(`<rect x="0" y="${top}" width="${W}" height="${ROW}" fill="${BG}"/>`);
      parts.push(ico(row.icon, INSET, top + (ROW - ICON) / 2));
      parts.push(`<text x="${INSET + ICON + 14}" y="${top + 34}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="16" font-weight="400" fill="${BLACK}">${esc(row.label)}</text>`);
      if (row.sub) {
        parts.push(`<text x="${INSET + ICON + 14}" y="${top + 48}" font-size="0" fill="none"/>`);
      }
      if (row.badge) {
        const bx = W - INSET - 28;
        parts.push(`<circle cx="${bx}" cy="${top + ROW / 2}" r="10" fill="${PURPLE}"/><text x="${bx}" y="${top + ROW / 2 + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${esc(row.badge)}</text>`);
      } else {
        parts.push(`<path d="M${W - INSET - 4} ${top + ROW / 2 - 5} l5 5 -5 5" fill="none" stroke="#BBBBBB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`);
      }
      if (i < section.rows.length - 1) {
        parts.push(`<line x1="${INSET + ICON + 14}" y1="${top + ROW}" x2="${W}" y2="${top + ROW}" stroke="${LINE}" stroke-width="1"/>`);
      }
      y += ROW;
    });
  });

  if (feeNote) {
    parts.push(`<rect x="0" y="${y}" width="${W}" height="8" fill="${BAND}"/>`);
    y += 8;
    parts.push(`<rect x="0" y="${y}" width="${W}" height="88" fill="${BG}"/>`);
    parts.push(ico("fee", INSET, y + 20, PURPLE));
    parts.push(`<text x="${INSET + ICON + 14}" y="${y + 32}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="15" font-weight="700" fill="${BLACK}">Platform Fee</text>`);
    parts.push(`<text x="${INSET + ICON + 14}" y="${y + 52}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="13" font-weight="400" fill="${GREY}">${esc(feeNote)}</text>`);
    parts.push(`<text x="${INSET + ICON + 14}" y="${y + 72}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="12" font-weight="400" fill="${MUTED}">Vinted Buyer Protection → ROVEXO Platform Fee (5.5%)</text>`);
    y += 88;
  }

  if (cta) {
    parts.push(`<rect x="0" y="${y}" width="${W}" height="8" fill="${BAND}"/>`);
    y += 8;
    parts.push(`<rect x="0" y="${y}" width="${W}" height="72" fill="${BG}"/><rect x="${INSET}" y="${y + 12}" width="${W - INSET * 2}" height="48" rx="4" fill="${PURPLE}"/><text x="${W / 2}" y="${y + 42}" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">${esc(cta)}</text>`);
    y += 72;
  }

  let navH = 0;
  if (bottomActive) {
    const nav = bottomNav(bottomActive);
    parts.push(`<g transform="translate(0 ${y})">${nav.svg}</g>`);
    navH = nav.height;
    y += navH;
  }

  parts.push(`<rect x="0" y="${y}" width="${W}" height="20" fill="${BAND}"/><text x="${INSET}" y="${y + 14}" font-family="ui-monospace,monospace" font-size="9" fill="${MUTED}">Vinted menu 100% · ROVEXO functions · ${esc(id)}</text>`);
  y += 20;

  return {
    id,
    title,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}"><rect width="${W}" height="${y}" fill="${BAND}"/>${parts.join("\n")}</svg>`,
  };
}

/** Inbox hub — exact Vinted pattern: Messages | Notifications tabs + thread list */
function inboxHub({ tab = "messages" }) {
  let y = 0;
  const parts = [statusBar()];
  y = 44;
  // Title Inbox
  parts.push(`<rect x="0" y="${y}" width="${W}" height="48" fill="${BG}"/><text x="${W / 2}" y="${y + 30}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="17" font-weight="700" fill="${BLACK}">Inbox</text>`);
  y += 48;
  // Tabs like Vinted
  parts.push(`<rect x="0" y="${y}" width="${W}" height="44" fill="${BG}"/>`);
  const tabs = [
    { id: "messages", label: "Messages" },
    { id: "notifications", label: "Notifications" },
  ];
  tabs.forEach((t, i) => {
    const x = i === 0 ? 0 : W / 2;
    const on = t.id === tab;
    parts.push(`<text x="${x + W / 4}" y="${y + 26}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="15" font-weight="${on ? 700 : 500}" fill="${on ? BLACK : GREY}">${t.label}</text>`);
    if (on) parts.push(`<rect x="${x + 24}" y="${y + 42}" width="${W / 2 - 48}" height="2" fill="${PURPLE}"/>`);
  });
  y += 44;
  parts.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${LINE}" stroke-width="1"/>`);

  if (tab === "messages") {
    const threads = [
      { name: "Sam · Order #4821", preview: "Parcel shipped — tracking updated", time: "2m", unread: true, kind: "Tracking" },
      { name: "Jordan · Offer", preview: "Would you take £28?", time: "14m", unread: true, kind: "Offer" },
      { name: "Casey · Order #4790", preview: "Thanks! Leave a review?", time: "1h", unread: false, kind: "Review" },
      { name: "ROVEXO Support", preview: "Refund request received", time: "3h", unread: false, kind: "Support" },
      { name: "Alex · Order #4702", preview: "Item arrived — confirm?", time: "Yesterday", unread: false, kind: "Orders" },
    ];
    threads.forEach((th, i) => {
      const top = y;
      const h = 76;
      parts.push(`<rect x="0" y="${top}" width="${W}" height="${h}" fill="${BG}"/>`);
      parts.push(`<circle cx="${INSET + 22}" cy="${top + h / 2}" r="22" fill="#E8E8E8"/>`);
      parts.push(`<text x="${INSET + 54}" y="${top + 28}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="15" font-weight="${th.unread ? 700 : 600}" fill="${BLACK}">${esc(th.name)}</text>`);
      parts.push(`<text x="${INSET + 54}" y="${top + 48}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="13" font-weight="400" fill="${GREY}">${esc(th.preview)}</text>`);
      parts.push(`<text x="${W - INSET}" y="${top + 28}" text-anchor="end" font-size="12" fill="${MUTED}">${esc(th.time)}</text>`);
      parts.push(`<rect x="${INSET + 54}" y="${top + 54}" width="64" height="16" rx="8" fill="${BAND}"/><text x="${INSET + 86}" y="${top + 66}" text-anchor="middle" font-size="10" font-weight="600" fill="${GREY}">${esc(th.kind)}</text>`);
      if (th.unread) parts.push(`<circle cx="${W - INSET - 6}" cy="${top + 48}" r="5" fill="${PURPLE}"/>`);
      if (i < threads.length - 1) parts.push(`<line x1="${INSET + 54}" y1="${top + h}" x2="${W}" y2="${top + h}" stroke="${LINE}" stroke-width="1"/>`);
      y += h;
    });
  } else {
    const notes = [
      { title: "Price drop on Saved item", body: "Nike trainers now £22", time: "5m" },
      { title: "Someone favourited your listing", body: "Vintage denim jacket", time: "40m" },
      { title: "Platform Fee receipt", body: "Order #4821 · £1.65 fee", time: "2h" },
      { title: "New follower", body: "Sam started following you", time: "Yesterday" },
    ];
    notes.forEach((n, i) => {
      const top = y;
      const h = 72;
      parts.push(`<rect x="0" y="${top}" width="${W}" height="${h}" fill="${BG}"/>`);
      parts.push(ico("bell", INSET, top + 24));
      parts.push(`<text x="${INSET + ICON + 14}" y="${top + 28}" font-size="15" font-weight="600" fill="${BLACK}">${esc(n.title)}</text>`);
      parts.push(`<text x="${INSET + ICON + 14}" y="${top + 48}" font-size="13" fill="${GREY}">${esc(n.body)}</text>`);
      parts.push(`<text x="${W - INSET}" y="${top + 28}" text-anchor="end" font-size="12" fill="${MUTED}">${esc(n.time)}</text>`);
      if (i < notes.length - 1) parts.push(`<line x1="${INSET + ICON + 14}" y1="${top + h}" x2="${W}" y2="${top + h}" stroke="${LINE}" stroke-width="1"/>`);
      y += h;
    });
  }

  // Hub function strip
  parts.push(`<rect x="0" y="${y}" width="${W}" height="8" fill="${BAND}"/>`);
  y += 8;
  parts.push(`<rect x="0" y="${y}" width="${W}" height="100" fill="${BG}"/>`);
  parts.push(`<text x="${INSET}" y="${y + 24}" font-size="13" font-weight="700" fill="${GREY}">Inbox Hub · funcții ROVEXO</text>`);
  const funcs = ["Orders", "Tracking", "Offers", "Reviews", "Refunds", "Disputes", "Support"];
  funcs.forEach((f, i) => {
    const x = INSET + (i % 4) * 90;
    const yy = y + 40 + Math.floor(i / 4) * 28;
    parts.push(`<text x="${x}" y="${yy}" font-size="12" font-weight="600" fill="${PURPLE}">${esc(f)}</text>`);
  });
  y += 100;

  const nav = bottomNav("inbox");
  parts.push(`<g transform="translate(0 ${y})">${nav.svg}</g>`);
  y += nav.height;
  parts.push(`<rect x="0" y="${y}" width="${W}" height="28" fill="${BAND}"/><text x="${INSET}" y="${y + 18}" font-size="9" font-family="ui-monospace,monospace" fill="${MUTED}">Vinted Inbox = Messages + Notifications · ROVEXO Transaction Hub</text>`);
  y += 28;

  return {
    id: tab === "messages" ? "inbox-messages" : "inbox-notifications",
    title: `Inbox · ${tab}`,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}"><rect width="${W}" height="${y}" fill="${BAND}"/>${parts.join("\n")}</svg>`,
  };
}

/** Product / Checkout with Platform Fee (not Buyer Protection) */
function checkoutPlatformFee() {
  let y = 0;
  const parts = [statusBar()];
  y = 44;
  parts.push(`<rect x="0" y="${y}" width="${W}" height="52" fill="${BG}"/><path d="M${INSET + 8} ${y + 26} l-6 -6 6 -6" fill="none" stroke="${BLACK}" stroke-width="1.7" stroke-linecap="round"/><text x="${W / 2}" y="${y + 32}" text-anchor="middle" font-size="17" font-weight="700" fill="${BLACK}">Checkout</text>`);
  y += 52;
  parts.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${LINE}"/>`);

  const lines = [
    ["Item price", "£30.00"],
    ["Shipping", "£3.49"],
    ["Platform Fee (5.5%)", "£1.65"],
  ];
  lines.forEach(([l, r]) => {
    const top = y;
    const isFee = l.startsWith("Platform");
    parts.push(`<rect x="0" y="${top}" width="${W}" height="48" fill="${BG}"/>`);
    parts.push(`<text x="${INSET}" y="${top + 30}" font-size="15" font-weight="${isFee ? 700 : 400}" fill="${isFee ? PURPLE : BLACK}">${esc(l)}</text>`);
    parts.push(`<text x="${W - INSET}" y="${top + 30}" text-anchor="end" font-size="15" font-weight="${isFee ? 700 : 400}" fill="${isFee ? PURPLE : BLACK}">${esc(r)}</text>`);
    parts.push(`<line x1="${INSET}" y1="${top + 48}" x2="${W - INSET}" y2="${top + 48}" stroke="${LINE}"/>`);
    y += 48;
  });
  parts.push(`<rect x="0" y="${y}" width="${W}" height="56" fill="${BG}"/><text x="${INSET}" y="${y + 34}" font-size="17" font-weight="700" fill="${BLACK}">Total</text><text x="${W - INSET}" y="${y + 34}" text-anchor="end" font-size="17" font-weight="700" fill="${BLACK}">£35.14</text>`);
  y += 56;
  parts.push(`<rect x="0" y="${y}" width="${W}" height="64" fill="${BAND}"/><text x="${INSET}" y="${y + 28}" font-size="12" fill="${GREY}">Pe Vinted: „Buyer Protection fee”</text><text x="${INSET}" y="${y + 48}" font-size="12" font-weight="700" fill="${PURPLE}">Pe ROVEXO: „Platform Fee” (aceeași poziție în sumar)</text>`);
  y += 64;
  parts.push(`<rect x="0" y="${y}" width="${W}" height="72" fill="${BG}"/><rect x="${INSET}" y="${y + 12}" width="${W - INSET * 2}" height="48" rx="4" fill="${PURPLE}"/><text x="${W / 2}" y="${y + 42}" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">Confirm &amp; Pay</text>`);
  y += 72;
  return {
    id: "checkout-platform-fee",
    title: "Checkout · Platform Fee",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}"><rect width="${W}" height="${y}" fill="${BAND}"/>${parts.join("\n")}</svg>`,
  };
}

// ——— Full menu tree (Vinted structure → ROVEXO functions) ———
const SCREENS = [
  listScreen({
    id: "profile",
    title: "Profile",
    profile: true,
    bottomActive: "profile",
    sections: [
      {
        title: "Buying",
        rows: [
          { icon: "bag", label: "My orders", badge: "2" },
          { icon: "heart", label: "Favourites" },
          { icon: "clock", label: "Recently viewed" },
          { icon: "refund", label: "Refunds" },
          { icon: "warn", label: "Disputes" },
        ],
      },
      {
        title: "Selling",
        rows: [
          { icon: "tag", label: "My listings" },
          { icon: "bag", label: "Seller orders" },
          { icon: "truck", label: "Shipping" },
          { icon: "star", label: "Reviews" },
          { icon: "chart", label: "Performance" },
        ],
      },
      {
        title: "Business",
        rows: [
          { icon: "shop", label: "Business tools" },
          { icon: "box", label: "Inventory" },
          { icon: "chart", label: "Analytics" },
          { icon: "folder", label: "Directory" },
          { icon: "doc", label: "VAT" },
        ],
      },
      {
        title: "Wallet",
        rows: [
          { icon: "wallet", label: "Balance" },
          { icon: "card", label: "Withdraw" },
          { icon: "doc", label: "Transactions" },
          { icon: "card", label: "Personal bank" },
          { icon: "shop", label: "Business bank" },
        ],
      },
      {
        title: "Settings & help",
        rows: [
          { icon: "gear", label: "Settings" },
          { icon: "shield", label: "Verification" },
          { icon: "help", label: "Help Centre" },
          { icon: "shield", label: "Trust & Safety" },
          { icon: "doc", label: "Legal" },
          { icon: "fee", label: "Platform Fee policy" },
          { icon: "logout", label: "Log out" },
        ],
      },
    ],
  }),
  inboxHub({ tab: "messages" }),
  inboxHub({ tab: "notifications" }),
  listScreen({
    id: "inbox-hub-menu",
    title: "Inbox hub",
    bottomActive: "inbox",
    sections: [
      {
        title: "Vinted Inbox → ROVEXO Hub",
        rows: [
          { icon: "chat", label: "Messages tab", badge: "3" },
          { icon: "bell", label: "Notifications tab" },
        ],
      },
      {
        title: "Transaction actions (ROVEXO)",
        rows: [
          { icon: "bag", label: "Orders" },
          { icon: "truck", label: "Tracking" },
          { icon: "star", label: "Reviews" },
          { icon: "refund", label: "Refunds" },
          { icon: "warn", label: "Disputes" },
          { icon: "headset", label: "Support" },
          { icon: "tag", label: "Offers" },
        ],
      },
    ],
  }),
  listScreen({
    id: "buying",
    title: "Buying",
    sections: [{ rows: [
      { icon: "bag", label: "My orders" },
      { icon: "truck", label: "Tracking" },
      { icon: "star", label: "Reviews" },
      { icon: "refund", label: "Refunds" },
      { icon: "warn", label: "Disputes" },
      { icon: "heart", label: "Favourites" },
      { icon: "clock", label: "Recently viewed" },
    ]}],
  }),
  listScreen({
    id: "selling",
    title: "Selling",
    cta: "Sell now",
    sections: [{ rows: [
      { icon: "tag", label: "My listings" },
      { icon: "bag", label: "Seller orders" },
      { icon: "truck", label: "Shipping" },
      { icon: "star", label: "Reviews" },
      { icon: "refund", label: "Returns" },
      { icon: "chart", label: "Performance" },
      { icon: "doc", label: "Compliance" },
    ]}],
  }),
  listScreen({
    id: "business",
    title: "Business",
    sections: [{ rows: [
      { icon: "bag", label: "Orders" },
      { icon: "box", label: "Inventory" },
      { icon: "chart", label: "Analytics" },
      { icon: "star", label: "Reviews" },
      { icon: "wallet", label: "Wallet" },
      { icon: "doc", label: "VAT" },
      { icon: "folder", label: "Directory" },
    ]}],
  }),
  listScreen({
    id: "wallet",
    title: "Wallet",
    cta: "Withdraw",
    sections: [
      { title: "Balance", rows: [
        { icon: "wallet", label: "Available" },
        { icon: "clock", label: "Pending" },
        { icon: "card", label: "Withdraw" },
      ]},
      { title: "Bank", rows: [
        { icon: "card", label: "Personal bank" },
        { icon: "shop", label: "Business bank" },
        { icon: "doc", label: "Transactions" },
      ]},
    ],
  }),
  listScreen({
    id: "orders",
    title: "My orders",
    sections: [{ rows: [
      { icon: "bag", label: "Bought" },
      { icon: "tag", label: "Sold" },
      { icon: "clock", label: "In progress" },
      { icon: "check", label: "Completed" },
      { icon: "warn", label: "Cancelled" },
    ]}],
  }),
  listScreen({
    id: "settings",
    title: "Settings",
    sections: [
      { title: "Account", rows: [
        { icon: "user", label: "Profile" },
        { icon: "pin", label: "Addresses" },
        { icon: "card", label: "Payment methods" },
        { icon: "bell", label: "Notifications" },
      ]},
      { title: "Privacy", rows: [
        { icon: "shield", label: "Privacy & security" },
        { icon: "gear", label: "Language & currency" },
      ]},
      { title: "About", rows: [
        { icon: "fee", label: "Platform Fee policy" },
        { icon: "doc", label: "Terms & policies" },
        { icon: "help", label: "About ROVEXO" },
      ]},
    ],
  }),
  listScreen({
    id: "search",
    title: "Search",
    bottomActive: "search",
    sections: [{ rows: [
      { icon: "search", label: "Search items" },
      { icon: "tag", label: "Categories" },
      { icon: "gear", label: "Filters" },
      { icon: "heart", label: "Saved searches" },
    ]}],
  }),
  listScreen({
    id: "sell",
    title: "Sell an item",
    bottomActive: "sell",
    cta: "Upload",
    sections: [{ rows: [
      { icon: "camera", label: "Photos" },
      { icon: "tag", label: "Title & description" },
      { icon: "card", label: "Price" },
      { icon: "box", label: "Parcel size (S/M/L/XL)" },
      { icon: "truck", label: "Shipping" },
      { icon: "fee", label: "Platform Fee info" },
    ]}],
  }),
  listScreen({
    id: "tracking",
    title: "Tracking",
    sections: [{ rows: [
      { icon: "bag", label: "Order" },
      { icon: "truck", label: "Parcel" },
      { icon: "clock", label: "Timeline" },
      { icon: "headset", label: "Help with delivery" },
    ]}],
  }),
  listScreen({
    id: "refunds",
    title: "Refunds",
    sections: [{ rows: [
      { icon: "refund", label: "Open refunds" },
      { icon: "bag", label: "Refund history" },
      { icon: "headset", label: "Need help?" },
    ]}],
  }),
  listScreen({
    id: "disputes",
    title: "Disputes",
    sections: [{ rows: [
      { icon: "warn", label: "Open disputes" },
      { icon: "bag", label: "Dispute history" },
      { icon: "headset", label: "Support" },
    ]}],
  }),
  listScreen({
    id: "help",
    title: "Help Centre",
    sections: [{ rows: [
      { icon: "help", label: "Help topics" },
      { icon: "headset", label: "Contact support" },
      { icon: "shield", label: "Trust & Safety" },
      { icon: "fee", label: "Platform Fee explained" },
      { icon: "doc", label: "Legal" },
    ]}],
  }),
  listScreen({
    id: "platform-fee-policy",
    title: "Platform Fee",
    feeNote: "5.5% of item price · shown at checkout (replaces Vinted Buyer Protection fee line)",
    sections: [{ rows: [
      { icon: "fee", label: "What is Platform Fee?" },
      { icon: "card", label: "How it’s calculated" },
      { icon: "doc", label: "Where it appears" },
      { icon: "help", label: "FAQs" },
    ]}],
  }),
  checkoutPlatformFee(),
  listScreen({
    id: "product-platform-fee",
    title: "Product",
    feeNote: "Inclusive total shows item + Platform Fee + shipping",
    sections: [{ rows: [
      { icon: "tag", label: "Item · £30.00" },
      { icon: "fee", label: "Platform Fee · £1.65" },
      { icon: "truck", label: "Shipping · from £3.49" },
      { icon: "star", label: "Seller · 4.9" },
    ]}],
    cta: "Buy now",
  }),
];

function writeTree(dir) {
  mkdirSync(join(dir, "frames"), { recursive: true });
  mkdirSync(join(dir, "menus"), { recursive: true });
  const cards = [];
  for (const s of SCREENS) {
    writeFileSync(join(dir, "frames", `${s.id}.svg`), s.svg);
    const page = `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(s.title)}</title>
<style>*{box-sizing:border-box}body{margin:0;background:${BAND}}.bar{padding:10px 16px;background:${PURPLE};color:#fff;font:600 12px -apple-system,sans-serif}.bar a{color:#fff}.phone{max-width:390px;margin:0 auto;background:#fff}</style>
</head><body><div class="bar"><a href="../">← All</a> · ${esc(s.title)}</div><div class="phone">${s.svg}</div></body></html>`;
    mkdirSync(join(dir, "menus", s.id), { recursive: true });
    writeFileSync(join(dir, "menus", s.id, "index.html"), page);
    cards.push(`<a class="card" href="menus/${s.id}/"><div class="f">${s.svg}</div><span>${esc(s.title)}</span></a>`);
  }

  const map = `| Vinted | ROVEXO |
|--------|--------|
| Profile tab | Profile / My Account |
| Inbox (Messages + Notifications) | Inbox Hub = Transaction Hub |
| My orders | Orders (Bought / Sold / …) |
| Favourites | Saved / Favourites |
| Balance | Wallet (Available / Pending / Withdraw) |
| Buyer Protection fee | **Platform Fee (5.5%)** |
| Sell now | Sell / Upload |
| Help Centre | Help Centre |
| (n/a Business) | Business tools (ROVEXO) |`;

  const index = `<!DOCTYPE html>
<html lang="ro"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ROVEXO — Meniu Vinted 100% + Platform Fee + Inbox Hub</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:${BAND};color:${BLACK}}
.banner{background:${PURPLE};color:#fff;padding:14px 16px;font-size:13px;line-height:1.45}
.panel{margin:16px;padding:16px;background:#fff}
.panel h1{margin:0 0 8px;font-size:18px}.panel h2{margin:16px 0 8px;font-size:15px}
.panel p,li{font-size:13px;color:${GREY};line-height:1.45}
table{width:100%;border-collapse:collapse;font-size:13px}td,th{border-bottom:1px solid ${LINE};padding:8px;text-align:left}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;padding:16px}
.card{display:block;background:#fff;text-decoration:none;color:${BLACK};border:1px solid ${LINE}}
.card .f svg{display:block;width:100%;height:auto}.card span{display:block;padding:12px 16px;font-weight:700;border-top:1px solid ${LINE}}
code{background:${BAND};padding:1px 4px}
</style></head><body>
<div class="banner"><strong>MENIU VINTED 100% · FUNCȚII ROVEXO · INBOX = HUB · BUYER PROTECTION → PLATFORM FEE</strong><br/>
Fără Homepage / Login / Register</div>
<section class="panel">
<h1>Mapare Vinted → ROVEXO</h1>
<table>${map.split("\n").slice(2).filter(Boolean).map((line) => {
  const m = line.match(/\|([^|]+)\|([^|]+)\|/);
  return m ? `<tr><td>${m[1].trim()}</td><td>${m[2].trim()}</td></tr>` : "";
}).join("")}</table>
<h2>Inbox Hub — detalii tehnice &amp; funcționare (ca Vinted)</h2>
<ul>
<li><strong>Bottom nav:</strong> Home · Search · Sell · <em>Inbox</em> · Profile — Inbox e tab dedicat (nu doar rând în Profile)</li>
<li><strong>Ecran Inbox:</strong> titlu „Inbox” + 2 taburi: <code>Messages</code> | <code>Notifications</code> (underline purple pe tab activ)</li>
<li><strong>Messages:</strong> listă thread-uri tranzacționale (Orders / Tracking / Offers / Reviews / Support) — avatar · titlu · preview · timp · badge unread · chip tip</li>
<li><strong>Notifications:</strong> alerte sistem (favourites, price drop, Platform Fee receipt) — nu chat</li>
<li><strong>Badge:</strong> punct/număr purple pe icon Inbox în bottom nav</li>
<li><strong>ROVEXO:</strong> același hub = Transaction Hub (<code>/inbox</code>) cu acțiuni: Orders, Tracking, Reviews, Refunds, Disputes, Support, Offers</li>
</ul>
<h2>Platform Fee (înlocuiește Buyer Protection)</h2>
<ul>
<li>Pe Vinted: linie „Buyer Protection fee” în sumarul de plată</li>
<li>Pe ROVEXO: linie <strong>Platform Fee (5.5%)</strong> în aceeași poziție (Product / Checkout)</li>
<li>Calcul: <code>round(itemPrice × 0.055, 2)</code> — fără shipping în bază</li>
</ul>
</section>
<p style="padding:0 16px;font-weight:700">${SCREENS.length} ecrane — meniu + submeniuri</p>
<div class="grid">${cards.join("\n")}</div>
</body></html>`;
  writeFileSync(join(dir, "index.html"), index);
  writeFileSync(join(dir, "VINTED_TO_ROVEXO_MAP.md"), `# Vinted → ROVEXO menu map\n\n${map}\n\n## Inbox Hub\nMessages | Notifications tabs · Transaction actions · bottom-nav Inbox\n\n## Fee\nBuyer Protection → Platform Fee 5.5%\n`);
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
writeTree(OUT);
if (existsSync(PACK)) rmSync(PACK, { recursive: true, force: true });
cpSync(OUT, PACK, { recursive: true });

// Link from master preview
const master = join(ROOT, "owner-review-screenshots", "master-image-pack-v1", "index.html");
if (existsSync(master)) {
  let html = readFileSync(master, "utf8");
  if (!html.includes("menus-vinted-full/")) {
    html = html.replace(
      "Vinted Purple Menus</a>",
      'Vinted Purple Menus</a> · <a href="menus-vinted-full/">Vinted Full Menu + Inbox Hub</a>',
    );
    writeFileSync(master, html);
  }
}
console.log(`Generated ${SCREENS.length} screens → ${OUT}`);
