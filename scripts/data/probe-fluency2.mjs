const names = [
  "bell", "shield", "wallet", "lock", "package", "folder", "flag", "star",
  "credit-card", "help", "headset", "heart", "bookmark", "home", "search",
  "price-tag", "user", "manager", "businessman", "woman", "man",
  "gender-neutral-user", "administrator", "shop", "store", "heart-with-pulse",
  "privacy", "logout", "exit", "menu", "double-tick", "sent", "share",
  "google", "seo", "clean", "coupon", "heartbeat", "health", "image", "picture",
  "artificial-intelligence", "audit", "clipboard", "iphone", "smartphone", "omega",
  "rocket", "data-backup", "cpu", "theme", "paint-palette", "fraud", "siren",
  "subscription", "auction", "hammer", "justice", "boxes", "warehouse", "goods",
  "organization", "buy", "sell", "lifebuoy", "customer-support", "terms-and-conditions",
  "double-tick", "menu-2", "admin-settings",
];

for (const name of names) {
  const res = await fetch(`https://img.icons8.com/3d-fluency/512/${encodeURIComponent(name)}.png`, { method: "HEAD" });
  if (res.ok) console.log("OK", name);
}
