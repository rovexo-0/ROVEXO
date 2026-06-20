import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2000,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
};

export async function compressListingImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported.");
  }

  if (file.size <= 500_000 && file.type === "image/jpeg") {
    return file;
  }

  return imageCompression(file, COMPRESSION_OPTIONS);
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateClientImage(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error("Use JPEG, PNG, or WebP images.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Each image must be under 10MB.");
  }
}
