import { SITEMAP_CHUNK_SIZE } from "@/lib/seo/engine/config";
import { sitemapIndexUrls } from "@/lib/seo/audit";

export type SitemapValidationResult = {
  valid: boolean;
  segmentCount: number;
  issues: string[];
};

const REQUIRED_SEGMENTS = [
  "static",
  "categories",
  "locations",
  "products",
  "sellers",
  "business",
  "brands",
  "discover",
  "collections",
  "trends",
  "blog",
  "images",
];

/**
 * Sitemap Engine — validates segmented sitemaps, supports automatic splitting
 * at enterprise scale (10M listings / 100M URLs).
 */
export function validateSitemapConfiguration(): SitemapValidationResult {
  const issues: string[] = [];
  const segments = sitemapIndexUrls();
  const segmentCount = segments.length;

  if (segmentCount < REQUIRED_SEGMENTS.length) {
    issues.push(`Expected ${REQUIRED_SEGMENTS.length} sitemap segments, found ${segmentCount}`);
  }

  for (const required of REQUIRED_SEGMENTS) {
    const found = segments.some((url) => url.includes(`/sitemap/${required}`));
    if (!found) {
      issues.push(`Missing sitemap segment: ${required}`);
    }
  }

  for (const url of segments) {
    if (!url.startsWith("http") && !url.startsWith("/")) {
      issues.push(`Invalid sitemap URL format: ${url}`);
    }
  }

  return {
    valid: issues.length === 0,
    segmentCount,
    issues,
  };
}

/** Split URL list into chunks for sitemap files (max 50k URLs per file). */
export function splitSitemapUrls(urls: string[], chunkSize = SITEMAP_CHUNK_SIZE): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < urls.length; i += chunkSize) {
    chunks.push(urls.slice(i, i + chunkSize));
  }
  return chunks;
}

/** Generate sitemap chunk filename for a segment. */
export function sitemapChunkFilename(segment: string, chunkIndex: number): string {
  return chunkIndex === 0 ? `/sitemap/${segment}.xml` : `/sitemap/${segment}-${chunkIndex}.xml`;
}
