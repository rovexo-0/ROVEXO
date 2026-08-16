import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = (searchParams.get("kind") ?? "").trim();

  const svg = kind === "store" ? renderStoreOgSvg(searchParams) : renderDefaultOgSvg(searchParams);
  const username = (searchParams.get("username") ?? "").trim();
  const cacheControl =
    kind === "store"
      ? "public, max-age=3600, stale-while-revalidate=86400"
      : "public, max-age=86400, stale-while-revalidate=604800";

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": cacheControl,
      Vary: "Accept",
      ...(kind === "store" && username
        ? { "X-ROVEXO-OG-Store": username.slice(0, 64) }
        : {}),
    },
  });
}

function renderDefaultOgSvg(searchParams: URLSearchParams): string {
  const title = (searchParams.get("title") ?? "ROVEXO").slice(0, 80);
  const subtitle = (searchParams.get("subtitle") ?? "UK Marketplace").slice(0, 120);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f172a"/>
  <text x="60" y="280" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="700">${escapeXml(title)}</text>
  <text x="60" y="350" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="32">${escapeXml(subtitle)}</text>
  <text x="60" y="560" fill="#6366f1" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">ROVEXO</text>
</svg>`;
}

function renderStoreOgSvg(searchParams: URLSearchParams): string {
  const name = (searchParams.get("name") ?? searchParams.get("username") ?? "ROVEXO Store").slice(0, 80);
  const username = (searchParams.get("username") ?? "").slice(0, 64);
  const verified = searchParams.get("verified") === "1";
  const reviews = Math.max(0, Number(searchParams.get("reviews") ?? 0) || 0);
  const rating = searchParams.get("rating");
  const followers = Math.max(0, Number(searchParams.get("followers") ?? 0) || 0);
  const listings = Math.max(0, Number(searchParams.get("listings") ?? 0) || 0);
  const avatar = (searchParams.get("avatar") ?? "").trim();
  const safeAvatar =
    avatar.startsWith("https://") &&
    !/localhost|127\.0\.0\.1|192\.168\.|10\./i.test(avatar)
      ? escapeXml(avatar)
      : "";
  const ratingLabel =
    reviews > 0 && rating
      ? `${escapeXml(rating)} (${reviews} ${reviews === 1 ? "Review" : "Reviews"})`
      : "New seller";
  const initial = escapeXml((name.trim()[0] || "R").toUpperCase());
  const handle = username ? `@${escapeXml(username)}` : "";
  const verifiedMark = verified ? " ✓" : "";
  const avatarMarkup = safeAvatar
    ? `<defs><clipPath id="store-avatar"><circle cx="160" cy="250" r="72"/></clipPath></defs>
  <circle cx="160" cy="250" r="72" fill="#f3e8ff"/>
  <image href="${safeAvatar}" x="88" y="178" width="144" height="144" preserveAspectRatio="xMidYMid slice" clip-path="url(#store-avatar)"/>`
    : `<circle cx="160" cy="250" r="72" fill="#f3e8ff"/>
  <text x="160" y="268" text-anchor="middle" fill="#7c3aed" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="700">${initial}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="0" y="0" width="1200" height="12" fill="#9333ea"/>
  <text x="64" y="78" fill="#9333ea" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">ROVEXO</text>
  ${avatarMarkup}
  <text x="268" y="230" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700">${escapeXml(name)}${verifiedMark}</text>
  <text x="268" y="278" fill="#6b7280" font-family="Arial, Helvetica, sans-serif" font-size="28">${handle}</text>
  <text x="268" y="328" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="24">${ratingLabel}</text>
  <text x="64" y="430" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="26">${followers} Followers · ${listings} Listings</text>
  <text x="64" y="500" fill="#9333ea" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">BUY • SELL • GROW</text>
  <text x="64" y="548" fill="#6b7280" font-family="Arial, Helvetica, sans-serif" font-size="22">Discover this store on ROVEXO</text>
  <rect x="860" y="500" width="276" height="64" rx="16" fill="#9333ea"/>
  <text x="998" y="542" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">VIEW STORE</text>
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
