const names = [
  "user", "gender-neutral-user", "manager", "businessman", "woman", "man", "contact",
  "shopping-cart", "chat", "gear", "settings", "combo-chart", "line-chart",
  "company", "organization", "warehouse", "boxes", "goods", "vip", "crown",
  "address", "bank-card", "auction", "justice", "category", "receipt", "bill",
  "admin-settings", "control-panel", "buy", "lifebuoy", "globe", "coins", "money",
  "paint-palette", "cancel", "no-entry", "stripe", "terms-and-conditions", "document",
  "privacy", "sales-performance", "money-bag", "group", "conference-call", "logout", "exit",
  "info", "sent", "paper-plane", "double-tick", "menu-2", "more", "plus", "camera",
  "left", "back", "like", "share", "verified-account", "checkmark", "trash",
  "satellite", "radar", "google", "seo", "broom", "clean", "coupon", "ticket",
  "megaphone", "email", "mail", "heartbeat", "health", "sparkling", "artificial-intelligence",
  "bot", "audit", "clipboard", "trophy", "certificate", "iphone", "omega", "sun",
  "registry", "folder-invoices", "workflow", "flow-chart", "data-backup", "database",
  "plug", "cpu", "bank", "puzzle", "theme", "design", "compass", "image-gallery",
  "lightning-bolt", "timeline", "clock", "fraud", "warning-shield", "up",
  "subscription", "gift", "visible", "siren", "code", "shopping-bag", "speech-bubble",
  "faq", "customer-support", "delivery", "truck", "scales", "heart",
];

const failed = [];
for (const name of names) {
  const res = await fetch(`https://img.icons8.com/3d-fluency/512/${encodeURIComponent(name)}.png`, { method: "HEAD" });
  if (res.ok) console.log("OK", name);
  else failed.push(name);
}
console.error("FAILED", failed.length);
