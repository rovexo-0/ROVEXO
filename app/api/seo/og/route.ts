import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { safeFetch } from "@/lib/security/ssrf-guard-v1";
import {
  STORE_SHARE_COPY,
  formatStoreSharePublicHost,
  formatStoreShareStatusLabel,
  resolveStoreShareCardDescription,
  truncateStoreShareCardText,
} from "@/lib/store-sharing/store-share-v1";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const MAX_AVATAR_BYTES = 1_200_000;

let cachedBrandMark: string | null | undefined;

function brandMarkDataUri(): string | null {
  if (cachedBrandMark !== undefined) return cachedBrandMark;
  try {
    const buffer = readFileSync(join(process.cwd(), "public/brand/canonical-rx/app-icon-v1.png"));
    cachedBrandMark = `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    cachedBrandMark = null;
  }
  return cachedBrandMark;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isPublicHttpsAvatar(url: string): boolean {
  if (!url.startsWith("https://")) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".localhost") ||
      host.startsWith("192.168.") ||
      host.startsWith("10.")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function embedPublicAvatar(avatarUrl: string | null): Promise<string | null> {
  if (!avatarUrl || !isPublicHttpsAvatar(avatarUrl)) return null;
  try {
    const response = await safeFetch(avatarUrl, {
      method: "GET",
      signal: AbortSignal.timeout(2500),
      headers: { Accept: "image/*" },
    });
    if (!response.ok) return null;
    const contentType = (response.headers.get("content-type") ?? "").split(";")[0]?.trim() ?? "";
    if (!contentType.startsWith("image/")) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_AVATAR_BYTES) return null;
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

async function svgToPng(svg: string): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(Buffer.from(svg), { density: 144 })
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "fill" })
    .png({ compressionLevel: 8 })
    .toBuffer();
}

function renderDefaultOgSvg(searchParams: URLSearchParams): string {
  const title = (searchParams.get("title") ?? "ROVEXO").slice(0, 80);
  const subtitle = (searchParams.get("subtitle") ?? "UK Marketplace").slice(0, 120);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="#0f172a"/>
  <text x="60" y="280" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="700">${escapeXml(title)}</text>
  <text x="60" y="350" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="32">${escapeXml(subtitle)}</text>
  <text x="60" y="560" fill="#6366f1" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">ROVEXO</text>
</svg>`;
}

function renderStoreOgSvg(
  searchParams: URLSearchParams,
  avatarDataUri: string | null,
): string {
  const username = truncateStoreShareCardText((searchParams.get("username") ?? "").trim(), 24);
  const rawName = (searchParams.get("name") ?? "").trim() || username || "ROVEXO Store";
  const name = truncateStoreShareCardText(rawName, 22);
  const verified = searchParams.get("verified") === "1";
  const reviews = Math.max(0, Number(searchParams.get("reviews") ?? 0) || 0);
  const rating = searchParams.get("rating");
  const followers = Math.max(0, Number(searchParams.get("followers") ?? 0) || 0);
  const listings = Math.max(0, Number(searchParams.get("listings") ?? 0) || 0);
  const description = resolveStoreShareCardDescription(searchParams.get("description"));
  const status = formatStoreShareStatusLabel({
    rating: rating && reviews > 0 ? Number(rating) : null,
    reviewCount: reviews,
  });
  const handle = username ? `@${username}` : "";
  const hostUrl = username
    ? truncateStoreShareCardText(formatStoreSharePublicHost(username), 36)
    : "rovexo.co.uk";
  const initial = escapeXml((name.trim()[0] || "R").toUpperCase());
  const brand = brandMarkDataUri();
  const avatarMarkup = avatarDataUri
    ? `<defs><clipPath id="store-avatar"><circle cx="156" cy="236" r="72"/></clipPath></defs>
  <circle cx="156" cy="236" r="78" fill="#f3e8ff"/>
  <circle cx="156" cy="236" r="74" fill="#ffffff"/>
  <image href="${escapeXml(avatarDataUri)}" x="84" y="164" width="144" height="144" preserveAspectRatio="xMidYMid slice" clip-path="url(#store-avatar)"/>`
    : `<circle cx="156" cy="236" r="78" fill="#f3e8ff"/>
  <text x="156" y="254" text-anchor="middle" fill="#7c3aed" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="700">${initial}</text>`;
  const verifiedBadge = verified
    ? `<circle cx="210" cy="292" r="16" fill="#9333ea"/>
  <path d="M203 292 l5 5 10-11" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    : "";
  const brandVisual = brand
    ? `<image href="${escapeXml(brand)}" x="930" y="168" width="196" height="196" preserveAspectRatio="xMidYMid meet"/>`
    : `<text x="1028" y="290" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700">RX</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="#ffffff"/>
  <rect x="0" y="0" width="${OG_WIDTH}" height="10" fill="#9333ea"/>
  <circle cx="1088" cy="318" r="248" fill="#f3e8ff"/>
  <circle cx="1088" cy="318" r="188" fill="#9333ea"/>
  ${brandVisual}
  <text x="64" y="72" fill="#9333ea" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">ROVEXO</text>
  ${avatarMarkup}
  ${verifiedBadge}
  <text x="268" y="214" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700">${escapeXml(name)}</text>
  <text x="268" y="258" fill="#6b7280" font-family="Arial, Helvetica, sans-serif" font-size="26">${escapeXml(handle)}</text>
  <text x="268" y="300" fill="#4b5563" font-family="Arial, Helvetica, sans-serif" font-size="22">${escapeXml(status)}</text>
  <text x="64" y="390" fill="#111111" font-family="Arial, Helvetica, sans-serif" font-size="24">${followers} Followers · ${listings} Listings</text>
  <text x="64" y="452" fill="#9333ea" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">${escapeXml(STORE_SHARE_COPY.promoLine)}</text>
  <text x="64" y="496" fill="#6b7280" font-family="Arial, Helvetica, sans-serif" font-size="22">${escapeXml(description)}</text>
  <rect x="64" y="528" width="420" height="56" rx="28" fill="#9333ea"/>
  <text x="274" y="564" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">${escapeXml(hostUrl)}</text>
  <text x="980" y="560" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">VIEW STORE</text>
</svg>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = (searchParams.get("kind") ?? "").trim();
  const username = (searchParams.get("username") ?? "").trim();
  const avatarParam = (searchParams.get("avatar") ?? "").trim();

  const svg =
    kind === "store"
      ? renderStoreOgSvg(searchParams, await embedPublicAvatar(avatarParam || null))
      : renderDefaultOgSvg(searchParams);

  const cacheControl =
    kind === "store"
      ? "public, max-age=3600, stale-while-revalidate=86400"
      : "public, max-age=86400, stale-while-revalidate=604800";

  try {
    const png = await svgToPng(svg);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": cacheControl,
        "X-Content-Type-Options": "nosniff",
        ...(kind === "store" && username ? { "X-ROVEXO-OG-Store": username.slice(0, 64) } : {}),
      },
    });
  } catch {
    return new NextResponse("Store share image temporarily unavailable.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
