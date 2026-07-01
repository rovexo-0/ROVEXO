import imageCompression from "browser-image-compression";
import { normalizeImageFile } from "@/lib/storage/normalize-image-file";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2000,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
};

const THUMBNAIL_OPTIONS = {
  maxSizeMB: 0.2,
  maxWidthOrHeight: 400,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
};

async function compressWithFallback(file: File, options: typeof COMPRESSION_OPTIONS): Promise<File> {
  try {
    return await imageCompression(file, options);
  } catch {
    return imageCompression(file, { ...options, useWebWorker: false });
  }
}

export async function compressListingImage(file: File): Promise<File> {
  const normalized = await normalizeImageFile(file);

  if (normalized.size <= 500_000 && normalized.type === "image/jpeg") {
    return normalized;
  }

  return compressWithFallback(normalized, COMPRESSION_OPTIONS);
}

export async function createListingThumbnail(file: File): Promise<File> {
  const normalized = await normalizeImageFile(file);
  return compressWithFallback(normalized, THUMBNAIL_OPTIONS);
}

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateClientImage(file: File): void {
  const type = file.type.toLowerCase();
  const hasImageType = type.startsWith("image/");
  const hasKnownExtension = /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(file.name);

  if (!hasImageType && !hasKnownExtension) {
    throw new Error("Only image files are supported.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Each image must be under 10MB.");
  }
}
