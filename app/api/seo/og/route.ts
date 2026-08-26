import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { safeFetch } from "@/lib/security/ssrf-guard-v1";
import {
  STORE_HERO_FEATURED_SLOT_COUNT,
  STORE_HERO_SHARE_CARD_SIZE,
  parseStoreHeroShareCardFromSearchParams,
  publicStoreHeroImageParam,
  renderStoreHeroShareCardSvg,
} from "@/lib/store-sharing/store-hero-share-card-v1";

const OG_WIDTH = STORE_HERO_SHARE_CARD_SIZE.width;
const OG_HEIGHT = STORE_HERO_SHARE_CARD_SIZE.height;
const MAX_IMAGE_BYTES = 1_200_000;

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

async function embedPublicImage(imageUrl: string | null): Promise<string | null> {
  const url = publicStoreHeroImageParam(imageUrl);
  if (!url) return null;
  try {
    const response = await safeFetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
      headers: { Accept: "image/*" },
    });
    if (!response.ok) return null;
    const contentType = (response.headers.get("content-type") ?? "").split(";")[0]?.trim() ?? "";
    if (!contentType.startsWith("image/")) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) return null;
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = (searchParams.get("kind") ?? "").trim();
  const username = (searchParams.get("username") ?? "").trim();

  let svg = renderDefaultOgSvg(searchParams);
  if (kind === "store") {
    const model = parseStoreHeroShareCardFromSearchParams(searchParams);
    const listingUrls = Array.from({ length: STORE_HERO_FEATURED_SLOT_COUNT }, (_, index) => {
      return model.featuredListings[index]?.imageUrl ?? null;
    });
    const [avatarDataUri, coverDataUri, ...listingImageDataUris] = await Promise.all([
      embedPublicImage(model.avatarUrl),
      embedPublicImage(model.coverImageUrl),
      ...listingUrls.map((url) => embedPublicImage(url)),
    ]);
    svg = renderStoreHeroShareCardSvg(model, {
      brandMarkDataUri: brandMarkDataUri(),
      avatarDataUri,
      coverDataUri,
      listingImageDataUris,
    });
  }

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
