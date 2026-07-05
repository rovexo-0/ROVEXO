import type { MigrationProcessedImage } from "@/lib/seller/migration/engine/types";
import type { ValidationIssue } from "@/lib/seller/migration/types";
import { isExternalPlaceholderImageUrl } from "@/lib/media/official-demo-images";

const ALLOWED_IMAGE_HOSTS = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i;

export type ImageValidationResult = {
  valid: boolean;
  processed: MigrationProcessedImage[];
  errors: ValidationIssue[];
};

export function validateMigrationImages(
  images: MigrationProcessedImage[],
): ImageValidationResult {
  const errors: ValidationIssue[] = [];
  const processed: MigrationProcessedImage[] = [];

  images.forEach((image, index) => {
    const url = image.url.trim();
    if (!url.startsWith("http")) {
      errors.push({ field: "images", message: `Image ${index + 1}: invalid URL.` });
      return;
    }
    if (
      isExternalPlaceholderImageUrl(url) ||
      (!ALLOWED_IMAGE_HOSTS.test(url) && !url.includes("/storage/v1/object/public/products/"))
    ) {
      errors.push({ field: "images", message: `Image ${index + 1}: unsupported format.` });
    }
    processed.push({
      ...image,
      sortOrder: index,
      optimized: true,
      thumbnailUrl: image.thumbnailUrl || url,
    });
  });

  if (!processed.length) {
    errors.push({ field: "images", message: "No valid images found." });
  }

  return { valid: processed.length > 0 && errors.length === 0, processed, errors };
}
