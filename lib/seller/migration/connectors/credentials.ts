import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types/database";
import type { ConnectorConnectionStatus, ConnectorConnectInput } from "@/lib/seller/migration/connectors/types";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

const ALGORITHM = "aes-256-gcm";
const KEY_SALT = "rovexo-connector-credentials";

export type StoredConnectorCredentials = {
  storeUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  fileName?: string;
};

export type ConnectorRecord = {
  sellerId: string;
  platform: MigrationPlatformId;
  connectionStatus: ConnectorConnectionStatus;
  settings: Record<string, unknown>;
  lastSyncAt: string | null;
  lastError: string | null;
};

function deriveKey(): Buffer {
  const secret =
    process.env.CONNECTOR_CREDENTIALS_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "rovexo-dev-connector-key";
  return scryptSync(secret, KEY_SALT, 32);
}

export function encryptCredentials(payload: StoredConnectorCredentials): string {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptCredentials(blob: string | null): StoredConnectorCredentials | null {
  if (!blob) return null;
  try {
    const key = deriveKey();
    const buffer = Buffer.from(blob, "base64");
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8")) as StoredConnectorCredentials;
  } catch {
    return null;
  }
}

export async function getConnectorRecord(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<ConnectorRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_migration_connectors")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("platform", platform)
    .maybeSingle();

  if (error || !data) return null;

  return {
    sellerId: data.seller_id,
    platform: data.platform as MigrationPlatformId,
    connectionStatus: data.connection_status as ConnectorConnectionStatus,
    settings: (data.settings as Record<string, unknown>) ?? {},
    lastSyncAt: data.last_sync_at,
    lastError: data.last_error,
  };
}

export async function saveConnectorConnection(
  input: ConnectorConnectInput,
  credentials: StoredConnectorCredentials,
  status: ConnectorConnectionStatus,
  errorMessage?: string | null,
): Promise<ConnectorRecord> {
  const admin = createAdminClient();
  const encrypted = encryptCredentials(credentials);
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("store_migration_connectors")
    .upsert(
      {
        seller_id: input.sellerId,
        platform: input.platform,
        connection_status: status,
        credentials_encrypted: encrypted,
        settings: input.settings ?? {},
        last_sync_at: status === "connected" ? now : null,
        last_error: errorMessage ?? null,
        updated_at: now,
      },
      { onConflict: "seller_id,platform" },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Unable to save connector credentials.");
  }

  return {
    sellerId: data.seller_id,
    platform: data.platform as MigrationPlatformId,
    connectionStatus: data.connection_status as ConnectorConnectionStatus,
    settings: (data.settings as Record<string, unknown>) ?? {},
    lastSyncAt: data.last_sync_at,
    lastError: data.last_error,
  };
}

export async function disconnectConnector(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("store_migration_connectors")
    .update({
      connection_status: "disconnected",
      credentials_encrypted: null,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("seller_id", sellerId)
    .eq("platform", platform);
}

export async function loadConnectorCredentials(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<StoredConnectorCredentials | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("store_migration_connectors")
    .select("credentials_encrypted, connection_status")
    .eq("seller_id", sellerId)
    .eq("platform", platform)
    .maybeSingle();

  if (!data || data.connection_status !== "connected") return null;
  return decryptCredentials(data.credentials_encrypted);
}

export async function touchConnectorSync(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("store_migration_connectors")
    .update({
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("seller_id", sellerId)
    .eq("platform", platform);
}

export async function updateConnectorSettings(
  sellerId: string,
  platform: MigrationPlatformId,
  settings: Record<string, unknown>,
): Promise<ConnectorRecord> {
  const admin = createAdminClient();
  const existing = await getConnectorRecord(sellerId, platform);
  const merged = { ...(existing?.settings ?? {}), ...settings };
  const now = new Date().toISOString();

  if (existing) {
    const { data, error } = await admin
      .from("store_migration_connectors")
      .update({ settings: merged as Json, updated_at: now })
      .eq("seller_id", sellerId)
      .eq("platform", platform)
      .select("*")
      .single();

    if (error || !data) throw new Error("Unable to save connector settings.");
    return {
      sellerId: data.seller_id,
      platform: data.platform as MigrationPlatformId,
      connectionStatus: data.connection_status as ConnectorConnectionStatus,
      settings: (data.settings as Record<string, unknown>) ?? {},
      lastSyncAt: data.last_sync_at,
      lastError: data.last_error,
    };
  }

  const { data, error } = await admin
    .from("store_migration_connectors")
    .insert({
      seller_id: sellerId,
      platform,
      connection_status: "connected",
      settings: merged as Json,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error("Unable to save connector settings.");

  return {
    sellerId: data.seller_id,
    platform: data.platform as MigrationPlatformId,
    connectionStatus: data.connection_status as ConnectorConnectionStatus,
    settings: (data.settings as Record<string, unknown>) ?? {},
    lastSyncAt: data.last_sync_at,
    lastError: data.last_error,
  };
}
