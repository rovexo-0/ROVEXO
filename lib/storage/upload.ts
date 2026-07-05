import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

/**
 * Guarantee the avatars bucket exists and is correctly configured. Idempotent
 * and service-role scoped so a fresh environment (or one where the storage
 * migration was never applied) still works instead of failing with an opaque
 * "Bucket not found".
 */
async function ensureAvatarsBucket(
  admin: ReturnType<typeof createAdminClient>,
): Promise<void> {
  const { data: existing } = await admin.storage.getBucket("avatars");
  if (existing) return;

  const { error } = await admin.storage.createBucket("avatars", {
    public: true,
    fileSizeLimit: MAX_BYTES.avatars,
    allowedMimeTypes: ALLOWED_MIME.avatars,
  });

  // Ignore "already exists" races; surface anything else.
  if (error && !/exist/i.test(error.message)) {
    throw error;
  }
}

/**
 * Upload a user's avatar using the service-role client. The caller is already
 * authenticated and the object path is scoped to the user's own id, so this is
 * a privileged server-side write that does not depend on storage RLS policies
 * being present — removing the most common cause of avatar upload failures.
 *
 * A cache-busting version token is appended so every surface (header, account,
 * listings) picks up the new image immediately even though the storage path is
 * stable across uploads.
 */
export async function uploadAvatar(userId: string, file: File) {
  validateUploadFile("avatars", file);

  const extension = (file.type.split("/")[1] ?? "webp").toLowerCase();
  const path = `${userId}/avatar.${extension}`;
  const contentType = file.type || "image/webp";

  const admin = createAdminClient();
  await ensureAvatarsBucket(admin);

  // Convert to a Buffer for a reliable Node-side upload (avoids empty-body
  // edge cases when passing a web File straight to supabase-js).
  const body = Buffer.from(await file.arrayBuffer());

  const { data, error } = await admin.storage.from("avatars").upload(path, body, {
    upsert: true,
    contentType,
    cacheControl: "3600",
  });

  if (error) throw error;

  const version = Date.now();
  return {
    path: data.path,
    publicUrl: `${getPublicStorageUrl("avatars", data.path)}?v=${version}`,
  };
}

/** Remove every known avatar object for a user via the service-role client. */
export async function deleteAvatar(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.storage
    .from("avatars")
    .remove([
      `${userId}/avatar.webp`,
      `${userId}/avatar.jpg`,
      `${userId}/avatar.jpeg`,
      `${userId}/avatar.png`,
    ]);
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
