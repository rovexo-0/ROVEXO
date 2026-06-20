import { createClient } from "@/lib/supabase/server";
import { getSupabaseUrl } from "@/lib/supabase/env";

export type StorageBucket = "avatars" | "products" | "messages" | "documents";

const ALLOWED_MIME: Record<StorageBucket, string[]> = {
  avatars: ["image/jpeg", "image/png", "image/webp"],
  products: ["image/jpeg", "image/png", "image/webp"],
  messages: ["image/jpeg", "image/png", "image/webp"],
  documents: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
};

const MAX_BYTES: Record<StorageBucket, number> = {
  avatars: 5 * 1024 * 1024,
  products: 10 * 1024 * 1024,
  messages: 5 * 1024 * 1024,
  documents: 10 * 1024 * 1024,
};

export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageValidationError";
  }
}

export function validateUploadFile(bucket: StorageBucket, file: File): void {
  if (!ALLOWED_MIME[bucket].includes(file.type)) {
    throw new StorageValidationError(`Unsupported file type for ${bucket}.`);
  }

  if (file.size > MAX_BYTES[bucket]) {
    throw new StorageValidationError(`File exceeds maximum size for ${bucket}.`);
  }
}

export function getPublicStorageUrl(bucket: StorageBucket, path: string): string {
  return `${getSupabaseUrl()}/storage/v1/object/public/${bucket}/${path}`;
}

export async function uploadStorageObject(input: {
  bucket: StorageBucket;
  path: string;
  file: File | Blob;
  upsert?: boolean;
  contentType?: string;
}) {
  validateUploadFile(input.bucket, input.file as File);
  const supabase = await createClient();

  const { data, error } = await supabase.storage.from(input.bucket).upload(input.path, input.file, {
    upsert: input.upsert ?? false,
    contentType: input.contentType ?? (input.file as File).type,
  });

  if (error) {
    throw error;
  }

  return {
    path: data.path,
    publicUrl: getPublicStorageUrl(input.bucket, data.path),
  };
}

export async function deleteStorageObject(bucket: StorageBucket, path: string) {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw error;
  }
}

export async function replaceStorageObject(input: {
  bucket: StorageBucket;
  path: string;
  file: File | Blob;
  contentType?: string;
}) {
  await deleteStorageObject(input.bucket, input.path).catch(() => undefined);
  return uploadStorageObject({ ...input, upsert: true });
}

export async function uploadAvatar(userId: string, file: File) {
  const extension = file.type.split("/")[1] ?? "jpg";
  const path = `${userId}/avatar.${extension}`;
  return uploadStorageObject({ bucket: "avatars", path, file, upsert: true });
}

export async function uploadProductImage(input: {
  sellerId: string;
  productId: string;
  file: File;
  filename?: string;
}) {
  const safeName = input.filename ?? `${Date.now()}.${input.file.type.split("/")[1] ?? "jpg"}`;
  const path = `${input.sellerId}/${input.productId}/${safeName}`;
  return uploadStorageObject({ bucket: "products", path, file: input.file });
}
