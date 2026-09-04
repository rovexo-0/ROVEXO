import { isStoredAvifUrl } from "@/lib/media/avif-image-pipeline-v1";

/** Fallback when a listing has no uploaded product image. */
export const PRODUCT_IMAGE_FALLBACK = "/placeholder-product.svg";

/** Canonical Production Storage host — never fetch this from localhost. */
export const PRODUCTION_SUPABASE_STORAGE_HOST = "pklotmwxtnnepaitedic.supabase.co";

/**
 * Same-origin browser prefix for local Kong Storage.
 * Phone browsers treat localhost / 127.0.0.1 as the phone itself, so HTML must
 * never emit loopback Storage URLs when the PWA is opened via LAN.
 * Next rewrites this prefix to http://127.0.0.1:54321 on the development PC.
 */
export const LOCAL_STORAGE_BROWSER_PREFIX = "/rovexo-local-storage";

const LOCAL_SUPABASE_STORAGE_PORT = "54321";

/**
 * Card / feed image sources — prefer thumbnail for bandwidth, keep full URL
 * for a one-shot client fallback when the thumb object is missing/invalid.
 */
export type CardImageSources = {
  imageUrl: string;
  imageFullUrl: string;
};

export type ResolveCardImageOptions = {
  storagePath?: string | null;
  /** When the Storage object is known missing, never emit a raster URL. */
  storageObjectMissing?: boolean;
  productStatus?: string | null;
  /**
   * Origin of the browser that will fetch the image (e.g. http://localhost:3000
   * vs http://192.168.1.150:3000). Tests pass this explicitly. Runtime
   * development still rewrites loopback Storage even when omitted so SSR LAN
   * HTML cannot emit 127.0.0.1 / localhost Storage URLs.
   */
  viewerOrigin?: string | null;
};

const SUPPORTED_RASTER = /\.(jpe?g|png|webp|avif)(?:\?|$)/i;
const LEGACY_JPEG_THUMB = /-thumb\.jpe?g(?:\?|$)/i;
const LEGACY_RASTER_THUMB = /-thumb\.(jpe?g|png|webp)(?:\?|$)/i;

function sanitizeImageUrl(value: string | null | undefined): string {
  const trimmed = value?.trim() || "";
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower === "null" || lower === "undefined") return "";
  return trimmed;
}

function stripQuery(url: string): string {
  const query = url.indexOf("?");
  return query >= 0 ? url.slice(0, query) : url;
}

function parseHttpUrl(value: string): URL | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed;
  } catch {
    return null;
  }
}

function looksLikeAbsoluteUrl(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
}

function readConfiguredSupabaseOrigin(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || "";
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

/** Relative SVG used by E2E / fail-closed listing placeholders — not next/image. */
export function isRelativeSvgListingImage(url: string | null | undefined): boolean {
  const trimmed = sanitizeImageUrl(url);
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return false;
  return /\.svg(?:\?|$)/i.test(trimmed);
}

function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}

function shouldRewriteLoopbackStorageForBrowser(): boolean {
  if (process.env.VITEST === "true") return false;
  if (process.env.NODE_ENV === "test") return false;
  if (process.env.NODE_ENV === "production") return false;
  return true;
}

/** True when the URL is local Kong Storage on loopback (phone-unreachable over LAN). */
export function isLoopbackSupabaseStorageUrl(url: string | null | undefined): boolean {
  const parsed = parseHttpUrl(sanitizeImageUrl(url));
  if (!parsed) return false;
  if (parsed.protocol !== "http:") return false;
  if (!isLoopbackHostname(parsed.hostname)) return false;
  if (parsed.port !== LOCAL_SUPABASE_STORAGE_PORT) return false;
  return parsed.pathname.includes("/storage/v1/object/");
}

function toSameOriginLocalStorageProxyUrl(url: string): string {
  const parsed = parseHttpUrl(url);
  if (!parsed) return url;
  // Drop ?v= cache-busters: Next 16 `next/image` throws on local paths with a
  // query string unless images.localPatterns.search is set, which would also
  // lock every other local asset. Public Storage objects are uniquely named.
  return `${LOCAL_STORAGE_BROWSER_PREFIX}${parsed.pathname}`;
}

/**
 * Localhost PWA keeps loopback Storage. LAN PWA uses the same-origin proxy so
 * the phone never fetches the development PC via localhost / 127.0.0.1.
 * Production HTTPS Storage URLs are never rewritten.
 */
export function rewriteLoopbackStorageUrlForViewer(
  url: string,
  viewerOrigin: string | null | undefined,
): string {
  if (!isLoopbackSupabaseStorageUrl(url)) return url;
  const origin = viewerOrigin?.trim() || "";
  if (!origin) return url;
  let host = "";
  try {
    host = new URL(origin).hostname;
  } catch {
    return url;
  }
  if (isLoopbackHostname(host)) return url;
  return toSameOriginLocalStorageProxyUrl(url);
}

/** Browser-facing delivery only — database Storage paths stay unchanged. */
export function toBrowserReachableStorageUrl(
  url: string,
  viewerOrigin?: string | null,
): string {
  const trimmed = sanitizeImageUrl(url);
  if (!trimmed || trimmed === PRODUCT_IMAGE_FALLBACK) return trimmed;
  if (!isLoopbackSupabaseStorageUrl(trimmed)) return trimmed;
  if (viewerOrigin != null && viewerOrigin !== "") {
    return rewriteLoopbackStorageUrlForViewer(trimmed, viewerOrigin);
  }
  if (shouldRewriteLoopbackStorageForBrowser()) {
    return toSameOriginLocalStorageProxyUrl(trimmed);
  }
  return trimmed;
}

function isProductsStorageObjectUrl(url: string): boolean {
  const parsed = parseHttpUrl(url);
  if (!parsed) return false;
  return parsed.pathname.includes("/storage/v1/object/") && parsed.pathname.includes("/products/");
}

function isProductsStorageRasterUrl(url: string): boolean {
  if (!isProductsStorageObjectUrl(url)) return false;
  return SUPPORTED_RASTER.test(stripQuery(url));
}

function isProductsStorageJpegOrPngUrl(url: string): boolean {
  if (!isProductsStorageObjectUrl(url)) return false;
  return /\.(jpe?g|png)(?:\?|$)/i.test(stripQuery(url));
}

/**
 * True when this URL must never be passed to next/image or fetched from localhost.
 * Production Storage URLs are unreachable while the app is pointed at local Supabase.
 */
export function isUnreachableListingStorageUrl(url: string | null | undefined): boolean {
  const trimmed = sanitizeImageUrl(url);
  if (!trimmed) return false;
  const parsed = parseHttpUrl(trimmed);
  if (!parsed) return false;
  if (!parsed.pathname.includes("/storage/v1/object/")) return false;

  const host = parsed.hostname.toLowerCase();
  if (host !== PRODUCTION_SUPABASE_STORAGE_HOST) return false;

  // Localhost / tests / next dev must never upstream a Production Storage object.
  if (process.env.NODE_ENV !== "production") return true;

  const configured = readConfiguredSupabaseOrigin();
  if (!configured) return true;
  try {
    return new URL(configured).hostname.toLowerCase() !== PRODUCTION_SUPABASE_STORAGE_HOST;
  } catch {
    return true;
  }
}

export function inferListingStorageObjectMissing(input: {
  url?: string | null;
  thumbnailUrl?: string | null;
  storagePath?: string | null;
  storageObjectMissing?: boolean;
  productStatus?: string | null;
}): boolean {
  if (input.storageObjectMissing === true) return true;

  const url = sanitizeImageUrl(input.url);
  const thumb = sanitizeImageUrl(input.thumbnailUrl);
  if (isRelativeSvgListingImage(url) || isRelativeSvgListingImage(thumb)) return false;
  if (isUnreachableListingStorageUrl(url) || isUnreachableListingStorageUrl(thumb)) return true;

  const status = input.productStatus?.trim().toLowerCase() ?? "";
  const raster = url || thumb;
  /* Deleted listings: products-bucket JPEG/PNG fail closed even when
   * storage_path was never selected. Valid stored AVIF still wins. */
  if (
    status === "deleted" &&
    (isProductsStorageJpegOrPngUrl(url) ||
      isProductsStorageJpegOrPngUrl(thumb) ||
      isProductsStorageJpegOrPngUrl(raster)) &&
    !isStoredAvifUrl(url) &&
    !isStoredAvifUrl(thumb)
  ) {
    return true;
  }

  return false;
}

function stemFromFullPath(pathname: string): string {
  return pathname.replace(/\.[^.]+$/, "").replace(/-a(400|800|1600)$/i, "");
}

function stemFromThumbPath(pathname: string): string {
  return pathname
    .replace(/\.[^.]+$/, "")
    .replace(/-thumb$/i, "")
    .replace(/-a(400|800|1600)$/i, "");
}

/** Stored JPEG/PNG/WebP `-thumb.` URLs used by pre-AVIF listings. */
export function isLegacyJpegThumbUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return false;
  return LEGACY_JPEG_THUMB.test(stripQuery(trimmed));
}

/**
 * Keep a stored thumbnail for cards when it is a safe sibling of the original.
 * Never invent AVIF from JPEG. Never collapse a valid `-thumb.jpg` to the original JPEG.
 */
export function isSafeCardThumbnailUrl(thumbnailUrl: string, fullUrl: string): boolean {
  if (!thumbnailUrl) return false;
  if (thumbnailUrl === fullUrl) return true;
  if (!SUPPORTED_RASTER.test(stripQuery(thumbnailUrl))) return false;

  const thumbParsed = parseHttpUrl(thumbnailUrl);
  const fullParsed = parseHttpUrl(fullUrl);

  if (!thumbParsed) {
    if (looksLikeAbsoluteUrl(thumbnailUrl)) return false;
    if (fullParsed) return false;
    const thumbPath = stripQuery(thumbnailUrl);
    const fullPath = stripQuery(fullUrl);
    if (isStoredAvifUrl(thumbnailUrl)) {
      return stemFromThumbPath(thumbPath) === stemFromFullPath(fullPath);
    }
    if (LEGACY_RASTER_THUMB.test(thumbPath)) {
      return stemFromThumbPath(thumbPath) === stemFromFullPath(fullPath);
    }
    return true;
  }

  if (!fullParsed) {
    return SUPPORTED_RASTER.test(thumbParsed.pathname);
  }

  if (thumbParsed.origin !== fullParsed.origin) return false;

  if (isStoredAvifUrl(thumbnailUrl)) {
    return stemFromThumbPath(thumbParsed.pathname) === stemFromFullPath(fullParsed.pathname);
  }

  if (LEGACY_RASTER_THUMB.test(thumbParsed.pathname)) {
    return stemFromThumbPath(thumbParsed.pathname) === stemFromFullPath(fullParsed.pathname);
  }

  return true;
}

const FALLBACK_SOURCES: CardImageSources = {
  imageUrl: PRODUCT_IMAGE_FALLBACK,
  imageFullUrl: PRODUCT_IMAGE_FALLBACK,
};

export function resolveCardImageSources(
  thumbnailUrl: string | null | undefined,
  fullUrl: string | null | undefined,
  options?: ResolveCardImageOptions,
): CardImageSources {
  const full = sanitizeImageUrl(fullUrl);
  const thumb = sanitizeImageUrl(thumbnailUrl);
  const svgSrc = isRelativeSvgListingImage(full)
    ? full
    : isRelativeSvgListingImage(thumb)
      ? thumb
      : "";

  const storageObjectMissing = inferListingStorageObjectMissing({
    url: full,
    thumbnailUrl: thumb,
    storagePath: options?.storagePath,
    storageObjectMissing: options?.storageObjectMissing,
    productStatus: options?.productStatus,
  });

  if (storageObjectMissing) {
    if (svgSrc) return { imageUrl: svgSrc, imageFullUrl: svgSrc };
    return FALLBACK_SOURCES;
  }

  if (!full && !thumb) {
    return FALLBACK_SOURCES;
  }

  if (svgSrc && !isProductsStorageRasterUrl(full) && !isProductsStorageRasterUrl(thumb)) {
    return { imageUrl: svgSrc, imageFullUrl: svgSrc };
  }

  const imageFullUrl = full || thumb;
  if (isUnreachableListingStorageUrl(imageFullUrl) || isUnreachableListingStorageUrl(thumb)) {
    return FALLBACK_SOURCES;
  }

  let sources: CardImageSources;
  if (!thumb) {
    sources = { imageUrl: imageFullUrl, imageFullUrl };
  } else if (isSafeCardThumbnailUrl(thumb, imageFullUrl)) {
    sources = { imageUrl: thumb, imageFullUrl };
  } else {
    sources = { imageUrl: imageFullUrl, imageFullUrl };
  }

  return {
    imageUrl: toBrowserReachableStorageUrl(sources.imageUrl, options?.viewerOrigin),
    imageFullUrl: toBrowserReachableStorageUrl(sources.imageFullUrl, options?.viewerOrigin),
  };
}

/** Listing-row helper so every repository uses the same fail-closed SSOT. */
export function resolveListingCardImageSources(input: {
  thumbnailUrl?: string | null;
  url?: string | null;
  storagePath?: string | null;
  storageObjectMissing?: boolean;
  productStatus?: string | null;
}): CardImageSources {
  return resolveCardImageSources(input.thumbnailUrl, input.url, {
    storagePath: input.storagePath,
    storageObjectMissing: input.storageObjectMissing,
    productStatus: input.productStatus,
  });
}
