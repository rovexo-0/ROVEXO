/**
 * Local Master Image Pack generator — Absolute Final Freeze.
 * No network. Renders every locked hub + empty/error/loading as phone frames.
 * Output: owner-review-screenshots/master-image-pack-v1/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Plain data mirrors of Absolute Final PO hub locks (no TS import). */
const HUBS = [
  {
    id: "buying",
    title: "Buying",
    intro: "Manage everything you buy.",
    rows: ["My Orders", "Tracking", "Reviews", "Refunds", "Disputes", "Saved", "Recently Viewed"],
  },
  {
    id: "selling",
    title: "Selling",
    intro: "Manage everything you sell.",
    rows: ["Listings", "Orders", "Reviews", "Shipping", "Returns", "Performance"],
  },
  {
    id: "business",
    title: "Business",
    intro: "Manage your business.",
    rows: ["Orders", "Inventory", "Analytics", "Reviews", "Wallet", "VAT", "Directory"],
  },
  {
    id: "wallet",
    title: "Wallet",
    intro: "Manage your money.",
    rows: ["Available", "Pending", "Withdraw", "Transactions", "Personal Bank", "Business Bank"],
  },
  {
    id: "messages",
    title: "Messages",
    intro: "/messages → /inbox (Transaction hub)",
    rows: ["Inbox", "Orders", "Tracking", "Messages", "Reviews", "Support", "Refunds", "Disputes"],
  },
  {
    id: "trust",
    title: "Trust Centre",
    intro: "Protection, verification, and safety.",
    rows: ["Trust Score", "Buyer", "Seller", "Business", "Verification", "Recent"],
  },
  {
    id: "settings",
    title: "Settings",
    intro: "",
    rows: ["Profile", "Security", "Addresses", "Language", "Notifications", "Privacy", "Delete Account"],
  },
  {
    id: "account",
    title: "My Account",
    intro: "",
    rows: [
      "Buying",
      "Selling",
      "Business",
      "Wallet",
      "Messages",
      "Notifications",
      "Verification",
      "Settings",
      "Help Centre",
      "Trust Centre",
      "Legal Centre",
    ],
  },
  {
    id: "orders",
    title: "Orders",
    intro: "",
    rows: ["Bought", "Sold", "In progress", "Completed", "Cancelled"],
  },
  {
    id: "search",
    title: "Search",
    intro: "",
    rows: ["Search results", "Filters", "2-column grid"],
  },
  {
    id: "parcel",
    title: "Parcel",
    intro: "Four sizes only",
    rows: ["Small Parcel", "Medium Parcel", "Large Parcel", "Extra Large Parcel"],
  },
  {
    id: "checkout",
    title: "Checkout",
    intro: "",
    rows: ["Products", "Shipping", "Platform Fee", "Total", "Confirm & Pay"],
  },
  {
    id: "tracking",
    title: "Tracking",
    intro: "",
    rows: ["Order context", "Parcel 1 of N", "Timeline"],
  },
  {
    id: "reviews",
    title: "Reviews",
    intro: "",
    rows: ["To review", "Your reviews"],
  },
  {
    id: "refunds",
    title: "Refunds",
    intro: "",
    rows: ["Buying cases", "Selling cases"],
  },
  {
    id: "disputes",
    title: "Disputes",
    intro: "",
    rows: ["Buying cases", "Selling cases"],
  },
  {
    id: "saved",
    title: "Saved",
    intro: "",
    rows: ["2-column listings"],
  },
  {
    id: "directory",
    title: "Directory",
    intro: "",
    rows: ["Verified companies"],
  },
  {
    id: "help",
    title: "Help Centre",
    intro: "",
    rows: ["Search", "Categories", "Email", "Report Problem"],
  },
  {
    id: "legal",
    title: "Legal Centre",
    intro: "",
    rows: ["Terms", "Privacy", "Cookies"],
  },
  {
    id: "notifications",
    title: "Notifications",
    intro: "",
    rows: ["Unread", "Earlier"],
  },
  {
    id: "inventory",
    title: "Inventory",
    intro: "",
    rows: ["Stock rows"],
  },
  {
    id: "returns",
    title: "Returns",
    intro: "",
    rows: ["Open cases"],
  },
  {
    id: "shipping",
    title: "Shipping",
    intro: "ROVEXO creates labels and tracking.",
    rows: ["Orders", "Returns"],
  },
  {
    id: "performance",
    title: "Performance",
    intro: "Score from real selling activity.",
    rows: ["Score", "Factors", "Changes", "Achievements", "Trend"],
  },
  {
    id: "verification",
    title: "Verification",
    intro: "",
    rows: ["Identity", "Email", "Phone", "Business"],
  },
  {
    id: "store",
    title: "Visit Store",
    intro: "",
    rows: ["Store header", "Featured", "All products"],
  },
  {
    id: "followers",
    title: "Followers",
    intro: "",
    rows: ["Follower rows"],
  },
  {
    id: "recently-viewed",
    title: "Recently Viewed",
    intro: "Items you browsed recently.",
    rows: ["2-column listings"],
  },
  {
    id: "product",
    title: "Product",
    intro: "Images · price · Buy Now · Make Offer",
    rows: ["Gallery", "Title & price", "Seller", "Description", "Shipping", "Buy Now", "Make Offer"],
  },
  {
    id: "cart",
    title: "Cart",
    intro: "",
    rows: ["Item rows", "Subtotal", "Checkout"],
  },
  {
    id: "order-detail",
    title: "Order",
    intro: "One order · next action clear",
    rows: ["Status", "Items", "Tracking", "Messages", "Help"],
  },
  {
    id: "withdraw",
    title: "Withdraw",
    intro: "Same Wallet language",
    rows: ["Available", "Bank", "Amount", "Withdraw"],
  },
  {
    id: "transactions",
    title: "Transactions",
    intro: "",
    rows: ["Filters", "Sale", "Fee", "Refund", "Withdrawal"],
  },
  {
    id: "inbox-notifications",
    title: "Notifications",
    intro: "Unread then Earlier",
    rows: ["Unread", "Earlier", "Mark all read"],
  },
  {
    id: "compliance",
    title: "Compliance",
    intro: "Tax · documents · export",
    rows: ["Seller Tax Profile", "Monthly Statements", "Annual Statements", "Export CSV"],
  },
  {
    id: "homepage",
    title: "Homepage",
    intro: "BUY . SELL . GROW.",
    rows: ["Search", "Categories", "Listing cards", "Price · condition · rating"],
  },
  {
    id: "login",
    title: "Login",
    intro: "Guest entry",
    rows: ["Email", "Password", "Sign In", "Apple", "Google", "Create Account"],
  },
  {
    id: "register",
    title: "Register",
    intro: "Create your account",
    rows: ["First Name", "Last Name", "Email", "Password", "Country", "Create Account"],
  },
  {
    id: "sell",
    title: "Sell",
    intro: "List an item",
    rows: ["Photos", "Title", "Category", "Condition", "Price", "Publish"],
  },
  {
    id: "conversation",
    title: "Transaction",
    intro: "One order · one thread",
    rows: ["Product", "Offer", "Payment", "Tracking", "Message about this order"],
  },
  {
    id: "analytics",
    title: "Analytics",
    intro: "Same Master Menu language",
    rows: ["Overview", "Activity", "Top products", "Promotions", "Geography"],
  },
  {
    id: "vat",
    title: "VAT",
    intro: "Business hub",
    rows: ["VAT number", "Country", "Statements"],
  },
  {
    id: "personal-bank",
    title: "Personal Bank",
    intro: "Wallet hub",
    rows: ["Account name", "Sort code", "Account number", "Save"],
  },
  {
    id: "business-bank",
    title: "Business Bank",
    intro: "Wallet hub",
    rows: ["Business name", "Sort code", "Account number", "Save"],
  },
  {
    id: "addresses",
    title: "Addresses",
    intro: "Settings",
    rows: ["Delivery address", "Add address"],
  },
  {
    id: "profile",
    title: "Profile",
    intro: "Settings",
    rows: ["Name", "Email", "Photo", "Save"],
  },
  {
    id: "privacy",
    title: "Privacy",
    intro: "Settings",
    rows: ["Visibility", "Data", "Delete Account"],
  },
  {
    id: "security",
    title: "Security",
    intro: "Settings",
    rows: ["Password", "Sessions", "Sign out all"],
  },
  {
    id: "ideas",
    title: "ROVEXO Ideas",
    intro: "Private suggestion",
    rows: ["Your idea", "Send"],
  },
  {
    id: "plans",
    title: "Plans",
    intro: "Subscriptions and add-ons",
    rows: ["Current", "Plans", "Add-ons"],
  },
  {
    id: "wholesale",
    title: "Wholesale",
    intro: "MOQ · bulk · RFQ",
    rows: ["Links", "Account", "RFQ"],
  },
];

const STATES = [
  { id: "default", label: "Default" },
  { id: "empty", label: "Empty" },
  { id: "error", label: "Error" },
  { id: "loading", label: "Loading" },
];

/** E2E flow stacks — same row language, proves zero learning curve across journeys. */
const E2E_FLOWS = [
  {
    id: "e2e-buy",
    title: "Buy flow",
    intro: "Search → Product → Checkout → Orders → Tracking",
    rows: ["Search", "Product", "Checkout", "My Orders", "Tracking"],
  },
  {
    id: "e2e-sell",
    title: "Sell flow",
    intro: "Sell → Listings → Orders → Shipping → Performance",
    rows: ["Sell", "Listings", "Orders", "Shipping", "Performance"],
  },
  {
    id: "e2e-wallet",
    title: "Wallet flow",
    intro: "Available → Withdraw → Personal Bank → Transactions",
    rows: ["Available", "Withdraw", "Personal Bank", "Transactions"],
  },
  {
    id: "e2e-messages",
    title: "Messages flow",
    intro: "Transaction Hub at /inbox — product · payment · tracking · offer · review · support · refund · dispute",
    rows: ["Inbox", "Orders", "Tracking", "Messages", "Reviews", "Support", "Refunds", "Disputes"],
  },
  {
    id: "e2e-business",
    title: "Business flow",
    intro: "Orders → Inventory → Analytics → Wallet → VAT",
    rows: ["Orders", "Inventory", "Analytics", "Wallet", "VAT", "Directory"],
  },
  {
    id: "e2e-trust",
    title: "Trust flow",
    intro: "Score → Verification → Disputes → Safety",
    rows: ["Trust Score", "Verification", "Dispute Center", "Security Center"],
  },
  {
    id: "e2e-settings",
    title: "Settings flow",
    intro: "Same rows as every other hub",
    rows: ["Profile", "Addresses", "Notifications", "Privacy & Security", "Sign Out"],
  },
  {
    id: "checkout-confirm",
    title: "Checkout",
    intro: "Products → Shipping → Platform Fee → Total → Confirm & Pay",
    rows: ["Products", "Shipping", "Platform Fee", "Total", "Confirm & Pay"],
  },
  {
    id: "order-detail-final",
    title: "Order Details",
    intro: "Photo · title · status · tracking · payment · delivery · messages · review · support",
    rows: [
      "Product",
      "Order status",
      "Payment status",
      "Delivery status",
      "Tracking",
      "Messages",
      "Review",
      "Support",
    ],
  },
  {
    id: "tracking-final",
    title: "Tracking",
    intro: "Status · courier · parcel · delivery updates",
    rows: ["Order", "Tracking status", "Courier", "Tracking number", "Delivery updates"],
  },
  {
    id: "transaction-hub",
    title: "Transaction Hub",
    intro: "Not a chat app",
    rows: ["Inbox", "Orders", "Tracking", "Messages", "Reviews", "Support", "Refunds", "Disputes"],
  },
];

const ALL_SURFACES = [...HUBS, ...E2E_FLOWS];

const OUT = join(process.cwd(), "owner-review-screenshots", "master-image-pack-v1");
const FRAMES_DIR = join(OUT, "frames");

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowLabels(hub, state) {
  if (state.id === "loading") return ["Loading…", "Loading…", "Loading…"];
  if (state.id === "error") return ["Something went wrong", "Try again"];
  if (state.id === "empty") return ["Nothing here yet"];
  return hub.rows;
}

/** Vector phone frame — works without Chromium (WSL/sandbox safe). */
function phoneSvg(hub, state) {
  const labels = rowLabels(hub, state);
  const introH = hub.intro && state.id === "default" ? 36 : 0;
  const cardTop = 64 + introH + 12;
  const rowH = 56;
  const cardH = labels.length * rowH;
  const height = cardTop + cardH + 40;
  const rows = labels
    .map((title, i) => {
      const y = cardTop + i * rowH;
      const muted = state.id === "loading" || state.id === "empty";
      const danger = state.id === "error" && i === 0;
      const fill = danger ? "#dc2626" : muted ? "#64748b" : "#111111";
      return `
  <line x1="16" y1="${y + rowH}" x2="374" y2="${y + rowH}" stroke="#0f172a14"/>
  <rect x="32" y="${y + 18}" width="20" height="20" rx="6" fill="#f3e8ff"/>
  <text x="64" y="${y + 34}" font-family="system-ui,sans-serif" font-size="15" font-weight="500" fill="${fill}">${escapeXml(title)}</text>
  <text x="360" y="${y + 36}" font-family="system-ui,sans-serif" font-size="18" fill="#cbd5e1" text-anchor="end">›</text>`;
    })
    .join("");
  const intro =
    hub.intro && state.id === "default"
      ? `<text x="16" y="88" font-family="system-ui,sans-serif" font-size="13" fill="#64748b">${escapeXml(hub.intro)}</text>`
      : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="390" height="${height}" viewBox="0 0 390 ${height}">
  <rect width="390" height="${height}" rx="20" fill="#ffffff" stroke="#0f172a14"/>
  <rect x="0" y="0" width="390" height="64" fill="#ffffff"/>
  <line x1="0" y1="64" x2="390" y2="64" stroke="#0f172a14"/>
  <text x="24" y="40" font-family="system-ui,sans-serif" font-size="22" fill="#64748b">‹</text>
  <text x="195" y="40" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="#111111" text-anchor="middle">${escapeXml(hub.title)}</text>
  ${intro}
  <rect x="16" y="${cardTop}" width="358" height="${cardH}" rx="20" fill="#ffffff" stroke="#0f172a14"/>
  ${rows}
  <text x="16" y="${height - 14}" font-family="system-ui,sans-serif" font-size="11" fill="#64748b">${escapeXml(state.label)} · 16px · 100% · purple/white/black/grey</text>
</svg>`;
}

function phoneFrame(hub, state) {
  const idx = ALL_SURFACES.indexOf(hub) * STATES.length + STATES.indexOf(state) + 1;
  const src = `frames/${String(idx).padStart(3, "0")}-${hub.id}-${state.id}.svg`;
  return `<article class="phone" data-hub="${hub.id}" data-state="${state.id}">
  <img src="${src}" alt="${escapeXml(hub.title)} — ${escapeXml(state.label)}" width="390" />
</article>`;
}

function buildHtml() {
  const frames = ALL_SURFACES.flatMap((hub) => STATES.map((state) => phoneFrame(hub, state))).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ROVEXO Master Image Pack v1 — One Product Freeze</title>
<style>
:root {
  --purple: #9333ea;
  --black: #111111;
  --grey: #64748b;
  --line: rgb(15 23 42 / 0.08);
  --bg: #ffffff;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background: #f1f5f9; color: var(--black); }
.top { padding: 16px; background: #fff; border-bottom: 1px solid var(--line); }
.top h1 { margin: 0; font-size: 16px; }
.top p { margin: 6px 0 0; font-size: 13px; color: var(--grey); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; padding: 16px; }
.phone {
  width: 100%;
  max-width: 398px;
  margin: 0 auto;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgb(15 23 42 / 0.04);
}
.phone img { display: block; width: 100%; height: auto; }
</style>
</head>
<body>
<header class="top">
  <h1>ROVEXO Master Image Pack v1 — One Product Freeze</h1>
  <p>Zero learning curve · one menu · one icon · one row · 16px / 100% / 16px · classic · standard · simple · compact</p>
  <p>${ALL_SURFACES.length} surfaces (${HUBS.length} hubs + ${E2E_FLOWS.length} E2E) × ${STATES.length} states = ${ALL_SURFACES.length * STATES.length} frames</p>
</header>
<main class="grid">${frames}</main>
</body>
</html>`;
}

mkdirSync(OUT, { recursive: true });
mkdirSync(FRAMES_DIR, { recursive: true });
writeFileSync(join(OUT, "index.html"), buildHtml(), "utf8");

let frameIndex = 0;
const frameFiles = [];
for (const hub of ALL_SURFACES) {
  for (const state of STATES) {
    frameIndex += 1;
    const name = `${String(frameIndex).padStart(3, "0")}-${hub.id}-${state.id}.svg`;
    writeFileSync(join(FRAMES_DIR, name), phoneSvg(hub, state), "utf8");
    frameFiles.push(name);
  }
}

writeFileSync(
  join(OUT, "manifest.json"),
  JSON.stringify(
    {
      version: "v1-one-product-freeze",
      generatedAt: new Date().toISOString(),
      phoneWidthPx: 390,
      insetPx: 16,
      colors: ["purple", "white", "black", "grey"],
      philosophy: ["classic", "standard", "simple", "compact", "mobile-first", "zero-learning-curve"],
      hubs: HUBS.map((h) => ({ id: h.id, title: h.title, rows: h.rows })),
      e2eFlows: E2E_FLOWS.map((h) => ({ id: h.id, title: h.title, rows: h.rows })),
      states: STATES,
      frameCount: frameFiles.length,
      framesDir: "frames",
      frames: frameFiles,
    },
    null,
    2,
  ),
  "utf8",
);
writeFileSync(
  join(OUT, "README.md"),
  `# ROVEXO Master Image Pack v1 — One Product

**Absolute Final Freeze** — local visual pack (no network / no Chromium required).

1. Open \`index.html\` for the full grid.
2. Open \`frames/\` for ${frameFiles.length} individual SVG phone images.

- ${HUBS.length} platform hubs/surfaces
- ${E2E_FLOWS.length} E2E flow stacks
- ${STATES.length} states each (default / empty / error / loading)
- ${frameFiles.length} image files total
- Width: 16px · 100% · 16px
- Palette: purple · white · black · grey only
- Philosophy: classic · standard · simple · compact · zero learning curve
`,
  "utf8",
);

console.log(`Master Image Pack written: ${OUT}`);
console.log(`SVG frames: ${frameFiles.length} → ${FRAMES_DIR}`);
console.log(`Open: ${join(OUT, "index.html")}`);
