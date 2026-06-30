import "server-only";

import { createHash } from "crypto";
import {
  MIGRATION_IMAGE_DOWNLOAD_RETRIES,
  MIGRATION_IMAGE_MAX_BYTES,
} from "@/lib/seller/migration/images/config";

export class ImageDownloadError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable = false) {
    super(message);
    this.name = "ImageDownloadError";
    this.retryable = retryable;
  }
}

export async function downloadImageBuffer(url: string): Promise<Buffer> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MIGRATION_IMAGE_DOWNLOAD_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(20_000),
        headers: { Accept: "image/*" },
      });

      if (!response.ok) {
        throw new ImageDownloadError(
          `Image download failed with status ${response.status}.`,
          response.status === 429 || response.status >= 500,
        );
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) {
        throw new ImageDownloadError("Downloaded resource is not an image.", false);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length === 0) {
        throw new ImageDownloadError("Downloaded image is empty.", false);
      }
      if (buffer.length > MIGRATION_IMAGE_MAX_BYTES) {
        throw new ImageDownloadError("Image exceeds maximum allowed size.", false);
      }

      return buffer;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Image download failed.");
      if (error instanceof ImageDownloadError && !error.retryable) break;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  throw lastError ?? new ImageDownloadError("Image download failed.", false);
}

export function hashImageBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function isValidImageUrl(url: string): boolean {
  const trimmed = url.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}
