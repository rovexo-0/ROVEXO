import type { MigrationNormalizedListing } from "@/lib/seller/migration/engine/types";
import type { ValidationIssue, ValidationStatus } from "@/lib/seller/migration/types";

export type ValidationResult = {
  status: ValidationStatus;
  errors: ValidationIssue[];
  suggestedCategorySlug: string | null;
};

const VALID_CONDITIONS = new Set([
  "new",
  "like_new",
  "used",
  "good",
  "fair",
  "refurbished",
  "for_parts",
]);

export function validateMigrationListing(
  listing: MigrationNormalizedListing,
): ValidationResult {
  const errors: ValidationIssue[] = [];

  if (!listing.title || listing.title.trim().length < 3) {
    errors.push({ field: "title", message: "Title must be at least 3 characters." });
  }
  if (!listing.description || listing.description.trim().length < 10) {
    errors.push({ field: "description", message: "Description must be at least 10 characters." });
  }
  if (!listing.categorySlug) {
    errors.push({ field: "category", message: "Category mapping required." });
  }
  if (!listing.price || listing.price <= 0) {
    errors.push({ field: "price", message: "Price must be greater than zero." });
  }
  if (!listing.condition || !VALID_CONDITIONS.has(listing.condition.toLowerCase())) {
    errors.push({ field: "condition", message: "Valid condition is required." });
  }
  if (!listing.processedImages?.length && !listing.imageUrls?.length) {
    errors.push({ field: "images", message: "At least one image is required." });
  }
  if (listing.quantity != null && listing.quantity < 0) {
    errors.push({ field: "quantity", message: "Quantity cannot be negative." });
  }

  const hasCategoryWarning = listing.warnings.some((w) => w.toLowerCase().includes("category"));
  const suggestedCategorySlug = listing.categorySlug ?? null;

  if (errors.length > 0) {
    return { status: "invalid", errors, suggestedCategorySlug };
  }

  const warnings = listing.warnings.length > 0 || hasCategoryWarning;
  return {
    status: warnings ? "warning" : "valid",
    errors: listing.warnings.map((message) => ({ field: "general", message })),
    suggestedCategorySlug,
  };
}
