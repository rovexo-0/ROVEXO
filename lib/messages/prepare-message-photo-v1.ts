"use client";

import { normalizeImageFile } from "@/lib/storage/normalize-image-file";

const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.85;
const SKIP_COMPRESS_UNDER_BYTES = 900_000;

/**
 * Messages photo prepare — normalize HEIC once, compress once, never double-encode JPEG under budget.
 */
export async function prepareMessagePhotoFile(file: File): Promise<File> {
  const normalized = await normalizeImageFile(file);

  if (
    normalized.type === "image/jpeg" &&
    normalized.size <= SKIP_COMPRESS_UNDER_BYTES &&
    !/\.heic$/i.test(file.name) &&
    !/\.heif$/i.test(file.name)
  ) {
    return normalized;
  }

  if (typeof createImageBitmap !== "function") {
    return normalized;
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(normalized, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    if (scale >= 1 && normalized.type === "image/jpeg" && normalized.size <= SKIP_COMPRESS_UNDER_BYTES) {
      return normalized;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return normalized;
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });
    if (!blob) return normalized;

    const baseName = normalized.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return normalized;
  } finally {
    bitmap?.close?.();
  }
}
