import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";

/** Official ROVEXO demo listing image paths (served from /public). */
export const OFFICIAL_DEMO_PRODUCT_IMAGES = [
  "/icons/categories/vehicles.svg",
  "/icons/categories/phones.svg",
  "/icons/categories/electronics.svg",
  "/icons/categories/gaming.svg",
  "/icons/categories/mens-fashion.svg",
  "/icons/categories/home-garden.svg",
  "/icons/categories/jewellery.svg",
  "/icons/categories/computers.svg",
  "/icons/categories/property.svg",
  "/icons/categories/sports.svg",
  "/icons/categories/pets.svg",
  "/icons/categories/autoparts.svg",
  "/icons/categories/beauty.svg",
  "/icons/categories/womens-fashion.svg",
  "/icons/categories/shoes.svg",
  "/icons/categories/kids-fashion.svg",
  "/icons/categories/tools.svg",
  "/icons/categories/diy.svg",
  "/icons/categories/health.svg",
  "/icons/categories/services.svg",
] as const;

export const EXTERNAL_PLACEHOLDER_IMAGE_HOSTS = [
  "picsum.photos",
  "placehold.co",
  "placeholder.com",
  "dummyimage.com",
  "loremflickr.com",
  "via.placeholder.com",
  "fakeimg.pl",
  "placekitten.com",
  "images.unsplash.com",
  "source.unsplash.com",
] as const;

export function isExternalPlaceholderImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  const normalized = url.trim().toLowerCase();
  if (normalized === PRODUCT_IMAGE_FALLBACK.toLowerCase()) return false;
  if (normalized.startsWith("/")) return false;

  try {
    const hostname = new URL(normalized).hostname.replace(/^www\./, "");
    return EXTERNAL_PLACEHOLDER_IMAGE_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

export function resolveOfficialDemoProductImage(seed: string): string {
  if (!seed.trim()) return PRODUCT_IMAGE_FALLBACK;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const index = hash % OFFICIAL_DEMO_PRODUCT_IMAGES.length;
  return OFFICIAL_DEMO_PRODUCT_IMAGES[index] ?? PRODUCT_IMAGE_FALLBACK;
}

export function resolveOfficialDemoBannerImage(seed: string): string {
  return resolveOfficialDemoProductImage(`banner-${seed}`);
}

export function sanitizeListingImageUrl(url: string | null | undefined, seed: string): string {
  if (!url?.trim() || isExternalPlaceholderImageUrl(url)) {
    return resolveOfficialDemoProductImage(seed);
  }
  return url.trim();
}
