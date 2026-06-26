import "server-only";

import {
  MIGRATION_IMAGE_MAX_BYTES,
  MIGRATION_IMAGE_MIME_TYPES,
  MIGRATION_IMAGE_SIZES,
} from "@/lib/seller/migration/images/config";

export type ValidatedImageBuffer = {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  bytes: number;
};

export type ImageValidationIssue = {
  field: string;
  message: string;
};

async function loadSharp() {
  const sharp = (await import("sharp")).default;
  return sharp;
}

export async function validateAndInspectImage(buffer: Buffer): Promise<ValidatedImageBuffer> {
  if (buffer.length > MIGRATION_IMAGE_MAX_BYTES) {
    throw new Error("Image exceeds maximum allowed size.");
  }

  const sharp = await loadSharp();
  const image = sharp(buffer, { animated: false });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Corrupted or unreadable image.");
  }

  const format = metadata.format ?? "jpeg";
  const mimeType =
    format === "png"
      ? "image/png"
      : format === "webp"
        ? "image/webp"
        : format === "gif"
          ? "image/gif"
          : "image/jpeg";

  if (!MIGRATION_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported image format: ${mimeType}.`);
  }

  return {
    buffer,
    mimeType,
    width: metadata.width,
    height: metadata.height,
    bytes: buffer.length,
  };
}

export async function optimizeImageVariants(
  source: ValidatedImageBuffer,
): Promise<{
  original: Buffer;
  thumbnail: Buffer;
  medium: Buffer;
  large: Buffer;
  mimeType: string;
}> {
  const sharp = await loadSharp();
  const pipeline = sharp(source.buffer, { animated: false }).rotate();

  const original = await pipeline
    .clone()
    .webp({ quality: 88 })
    .toBuffer();

  const thumbnail = await pipeline
    .clone()
    .resize({ width: MIGRATION_IMAGE_SIZES.thumbnail, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const medium = await pipeline
    .clone()
    .resize({ width: MIGRATION_IMAGE_SIZES.medium, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const large = await pipeline
    .clone()
    .resize({ width: MIGRATION_IMAGE_SIZES.large, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  return {
    original,
    thumbnail,
    medium,
    large,
    mimeType: "image/webp",
  };
}

export function validateImageUrl(url: string): ImageValidationIssue | null {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http")) {
    return { field: "images", message: "Invalid image URL." };
  }
  return null;
}
