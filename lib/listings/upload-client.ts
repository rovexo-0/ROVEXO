import { compressListingImage, validateClientImage } from "@/lib/storage/client-images";

export type UploadedImageResult = {
  url: string;
  thumbnailUrl: string;
  storagePath: string;
  thumbnailStoragePath?: string;
  sessionId: string;
};

export async function uploadListingImage(input: {
  file: File;
  productId?: string;
  sessionId?: string;
  onProgress?: (progress: number) => void;
  maxRetries?: number;
}): Promise<UploadedImageResult> {
  validateClientImage(input.file);
  const compressed = await compressListingImage(input.file);
  const sessionId = input.sessionId ?? crypto.randomUUID();
  const maxRetries = input.maxRetries ?? 3;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      input.onProgress?.(Math.round((attempt / maxRetries) * 30));

      const formData = new FormData();
      formData.append("file", compressed, compressed.name || "listing.jpg");
      if (input.productId) formData.append("productId", input.productId);
      formData.append("sessionId", sessionId);

      const response = await fetch("/api/listings/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Upload failed.");
      }

      input.onProgress?.(100);
      return (await response.json()) as UploadedImageResult;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Upload failed.");
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  throw lastError ?? new Error("Upload failed.");
}

export async function deleteListingImage(input: {
  storagePath: string;
  thumbnailStoragePath?: string;
}): Promise<void> {
  await fetch("/api/listings/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
