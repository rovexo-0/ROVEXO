import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types/database";

export type StoredMigrationImagePaths = {
  original: string;
  large: string;
  medium: string;
  thumbnail: string;
};

export type MigrationImageAssetRecord = {
  id: string;
  sellerId: string;
  contentHash: string;
  sourceUrl: string | null;
  bucket: string;
  paths: StoredMigrationImagePaths;
  width: number | null;
  height: number | null;
  bytes: number | null;
};

export async function findMigrationImageByHash(
  sellerId: string,
  contentHash: string,
): Promise<MigrationImageAssetRecord | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("store_migration_image_assets")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (!data) return null;

  return mapRow(data);
}

export async function saveMigrationImageAsset(input: {
  sellerId: string;
  contentHash: string;
  sourceUrl?: string;
  bucket: string;
  paths: StoredMigrationImagePaths;
  width?: number;
  height?: number;
  bytes?: number;
}): Promise<MigrationImageAssetRecord> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("store_migration_image_assets")
    .upsert(
      {
        seller_id: input.sellerId,
        content_hash: input.contentHash,
        source_url: input.sourceUrl ?? null,
        bucket: input.bucket,
        paths: input.paths as Json,
        width: input.width ?? null,
        height: input.height ?? null,
        bytes: input.bytes ?? null,
        status: "stored",
      },
      { onConflict: "seller_id,content_hash" },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Unable to save migration image asset.");
  }

  return mapRow(data);
}

function mapRow(row: {
  id: string;
  seller_id: string;
  content_hash: string;
  source_url: string | null;
  bucket: string;
  paths: unknown;
  width: number | null;
  height: number | null;
  bytes: number | null;
}): MigrationImageAssetRecord {
  const paths = row.paths as StoredMigrationImagePaths;
  return {
    id: row.id,
    sellerId: row.seller_id,
    contentHash: row.content_hash,
    sourceUrl: row.source_url,
    bucket: row.bucket,
    paths,
    width: row.width,
    height: row.height,
    bytes: row.bytes,
  };
}
