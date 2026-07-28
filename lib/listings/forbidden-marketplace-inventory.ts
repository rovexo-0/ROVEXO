/**
 * Forbidden marketplace inventory — certification / demo / seed / fixture / test / RUN.
 *
 * Real user listings must never match. Prefer specific RUN4 / cert / demo markers
 * over broad words like "run" or "test" alone (e.g. "Running Shoes", "Test Drive").
 */

export type ForbiddenMarketplaceInventoryInput = {
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  sku?: string | null;
};

/** Slug prefixes that are never marketplace inventory (Absolute Law + RUN cleanup). */
export const FORBIDDEN_MARKETPLACE_SLUG_PREFIXES = [
  "demo-",
  "canonical-demo",
  "fake-",
  "mock-",
  "placeholder-",
  "test-listing",
  "demo-feed-",
  "run4-",
  "run-test-",
  "fixture-",
  "seed-",
  "cert-listing-",
  "certification-",
  "development-",
  "dev-listing-",
] as const;

/**
 * Returns true when the listing is certification / demo / seed / fixture / RUN inventory
 * and must be excluded from every marketplace surface (and public product pages).
 */
export function isForbiddenMarketplaceInventory(
  input: ForbiddenMarketplaceInventoryInput,
): boolean {
  const slug = (input.slug ?? "").trim().toLowerCase();
  const title = (input.title ?? "").trim();
  const titleLower = title.toLowerCase();
  const description = (input.description ?? "").trim().toLowerCase();
  const sku = (input.sku ?? "").trim().toLowerCase();
  const haystack = `${titleLower}\n${description}`;

  if (!slug && !title && !description && !sku) {
    return false;
  }

  for (const prefix of FORBIDDEN_MARKETPLACE_SLUG_PREFIXES) {
    if (slug.startsWith(prefix)) {
      return true;
    }
  }

  // RUN4 / RUN#N certification slugs (e.g. run4-cert-listing-…, run3-probe2-…)
  if (/^run\d+[-_]/.test(slug)) {
    return true;
  }
  if (/\brun4\b/.test(slug)) {
    return true;
  }
  if (/cert(?:ification)?[-_]listing/.test(slug)) {
    return true;
  }
  if (/\bprobe\d*\b/.test(slug) && /\brun/.test(slug)) {
    return true;
  }
  if (/(^|[-_])(fixture|seed|certification)([-_]|$)/.test(slug)) {
    return true;
  }

  // Titles created by RUN / certification scripts
  if (/^run\d+\b/i.test(title)) {
    return true;
  }
  if (/^run\s*#?\s*\d+\b/i.test(title)) {
    return true;
  }
  if (/^run\s+test\b/i.test(title)) {
    return true;
  }
  if (/\brun4\s+(cert|offer|probe|test)\b/i.test(title)) {
    return true;
  }
  if (/\bcertification\s+listing\b/i.test(titleLower)) {
    return true;
  }
  if (/^Demo .+ #\d+$/i.test(title)) {
    return true;
  }

  // Cert script body copy
  if (/virtual demo only/.test(description)) {
    return true;
  }
  if (/marketplace certification listing/.test(description)) {
    return true;
  }
  if (/run\s*#?\s*\d+/.test(description) && /certification/.test(description)) {
    return true;
  }

  // SKU from RUN cert publishes
  if (/^run\d+[-_]/.test(sku) || sku.startsWith("run4-")) {
    return true;
  }

  // Explicit inventory marker phrases (not generic product words)
  if (/\b(fixture|seed)\s+listing\b/.test(haystack)) {
    return true;
  }
  if (/\bdevelopment\s+listing\b/.test(haystack)) {
    return true;
  }
  if (/^test\s+listing\b/.test(titleLower)) {
    return true;
  }

  return false;
}

export function isForbiddenMarketplaceSlug(slug: string): boolean {
  return isForbiddenMarketplaceInventory({ slug });
}
